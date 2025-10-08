import "dotenv/config";
import express from "express";
import fetch from "node-fetch"; // okay even on Node 18+, keeps code consistent
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 4000;
const S2 = process.env.SEMANTIC_SCHOLAR_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

app.use(cors());
app.use(express.json());

// build headers safely: only include x-api-key if present
const S2_HEADERS = {
  "Content-Type": "application/json",
  ...(S2 ? { "x-api-key": S2 } : {}),
};

/** 1) Bulk search: top-cited list (lightweight fields) */
// Note: The S2 bulk search API has a hard limit of 1000 papers and does not support a `limit` param.
async function bulkSearch(query) {
  const baseUrl =
    `https://api.semanticscholar.org/graph/v1/paper/search/bulk` +
    `?query=${encodeURIComponent(query)}` +
    `&sort=citationCount:desc` +
    `&fields=paperId,title,year,citationCount`;

  let allPapers = [];
  let nextToken = null;
  let page = 1;
  const maxPages = 1;

  do {
    if (page > 1) await delay(3000); // Wait 3s between paginated requests
    const url = nextToken ? `${baseUrl}&token=${nextToken}` : baseUrl;
    console.log(`[${query}] Fetching page ${page}/${maxPages}...`);
    const r = await fetch(url, { headers: S2_HEADERS });
    if (!r.ok)
      throw new Error(`Bulk search failed on page ${page}: ${r.status}`);

    const data = await r.json();
    if (data.data) {
      allPapers = allPapers.concat(data.data);
    }

    nextToken = data.token;
    page++;
  } while (nextToken && page <= maxPages);

  return allPapers;
}

function makeYearBins(rows) {
  const years = rows
    .map((p) => p.year)
    .filter((y) => Number.isInteger(y))
    .sort((a, b) => a - b);
  if (years.length < 2) return [];

  // These quantiles create 6 bins skewed towards more recent papers
  const cuts = [0.3, 0.5, 0.7, 0.85, 0.95].map(
    (q) => years[Math.floor(q * (years.length - 1))]
  );

  const uniqueCuts = [...new Set(cuts)];

  const bins = [];
  let start = years[0];
  for (const c of uniqueCuts) {
    if (c < start) continue;
    bins.push([start, c]);
    start = c + 1;
  }

  const lastYear = years[years.length - 1];
  if (start <= lastYear) {
    bins.push([start, lastYear]);
  }

  return bins;
}

function assignBins(rows, bins) {
  return bins.map(([start, end]) => ({
    range: [start, end],
    papers: rows.filter((p) => p.year >= start && p.year <= end),
  }));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 4) Hydrate with /paper/batch (full details for chosen ids) */
async function hydratePapers(ids) {
  if (ids.length === 0) return [];
  const CHUNK = 500; // S2 limit per batch
  const out = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    await delay(3000); // Wait 3s BEFORE every request to S2 batch
    const chunk = ids.slice(i, i + CHUNK);
    const u =
      `https://api.semanticscholar.org/graph/v1/paper/batch?fields=` +
      encodeURIComponent(
        "paperId,title,year,venue,abstract,citationCount,authors,url"
      );
    const r = await fetch(u, {
      method: "POST",
      headers: S2_HEADERS,
      body: JSON.stringify({ ids: chunk }),
    });
    if (!r.ok) throw new Error(`Batch hydrate failed: ${r.status}`);
    const arr = await r.json();
    for (const p of arr) {
      out.push({
        id: p.paperId,
        title: p.title,
        year: p.year ?? null,
        venue: p.venue ?? null,
        abstract: p.abstract || "",
        citationCount: p.citationCount || 0,
        authors: (p.authors || []).map((a) => a.name),
        url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
      });
    }
  }
  return out;
}

/** 5) Simple hybrid score: citations (log) + recency */
function scorePaper(p, minYear, maxYear) {
  const cites = Math.max(0, p.citationCount || 0);
  const impact = Math.log10(cites + 1); // damped
  const denom = Math.max(1, (maxYear || 0) - (minYear || 0));
  const recency = p.year ? (p.year - (minYear || p.year)) / denom : 0;
  return 0.7 * impact + 0.3 * recency;
}

/** 6) Gemini re-rank 20–30 to 7–10 with short reasons (optional) */
async function selectWithGemini(topic, candidates, paperCount = 9) {
  if (!GEMINI_KEY) {
    // No key: take top by citations as a fallback
    return [...candidates]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, paperCount)
      .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-09-2025",
    });

    // keep payload compact
    const compact = candidates.slice(0, 30).map((p) => ({
      id: p.id,
      title: p.title,
      year: p.year,
      venue: p.venue,
      citations: p.citationCount,
      abstract: (p.abstract || "").slice(0, 900),
    }));

    const prompt = `
You are selecting key milestone papers to form a coherent timeline for the topic: "${topic}".
Choose exactly ${paperCount} papers that best trace the field's evolution. Prefer paradigm shifts and influential works.
Avoid near-duplicates. Use ONLY provided info.
Do not mention the year of the paper in the 'why_important' summary, as it is already displayed separately.

Return STRICT JSON with this exact shape:
{\"selected\":[{\"id\":\"<id>\",\"why_important\":\"<A few sentences explaining why this work was revolutionary and its impact>\",\"timeline_title\":\"<A Title For The Timeline, e.g. 'The Attention Mechanism is Introduced'>\"}]}

CANDIDATES:
${JSON.stringify(compact)}
  `.trim();

    const resp = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    let ids = new Set();
    let reasons = {};
    const txt = resp.response.text();
    console.log("Gemini response:", txt);

    // Robustly find and parse the JSON object from the response
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in the LLM response.");
    }
    const parsed = JSON.parse(jsonMatch[0]);

    for (const s of parsed.selected || []) {
      ids.add(s.id);
      reasons[s.id] = {
        why: s.why_important || "",
        key: s.timeline_title || "",
      };
    }

    const chosen = candidates.filter((p) => ids.has(p.id));
    if (chosen.length === 0) {
      // Fallback if LLM returns empty or invalid selection
      return [...candidates]
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, paperCount)
        .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
    }
    return chosen.map((p) => ({
      ...p,
      why_important: reasons[p.id]?.why || "",
      timeline_title: reasons[p.id]?.key || "",
    }));
  } catch (e) {
    console.error("Gemini parsing failed:", e);
    // fallback if parsing fails
    return [...candidates]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, paperCount)
      .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
  }
}

async function generatePresentDaySummary(topic) {
  if (!GEMINI_KEY) {
    return {
      title: "Present Day",
      summary:
        "Current research focuses on improving efficiency, safety, and multimodal capabilities in large language models.",
      url: "",
    };
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-09-2025",
      tools: [{ googleSearch: {} }],
    });

    const prompt = `
For the topic "${topic}", I need to create a "Present Day" summary for a timeline. Please provide the following in a strict JSON format:
1.  A "title" that summarizes the current era of research (e.g., "Focus on Multimodality, Efficiency, and Reasoning").
2.  A "summary" of one to three sentences describing the current, ongoing research trends.
3.  Use Google Search to find a single, highly-relevant, and recent (survey or breakthrough) paper that exemplifies these trends and provide its "url".

Return ONLY the JSON object with the keys "title", "summary", and "url".
    `.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
      },
    });

    const text = result.response.text();
    // Find the JSON block in the response and parse it
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    // Fallback for cases where the model doesn't return a clean JSON block
    return JSON.parse(text);
  } catch (e) {
    console.error("Present day summary generation failed:", e);
    return {
      // Fallback
      title: "Present Day",
      summary:
        "Current research focuses on improving efficiency, safety, and multimodal capabilities in large language models.",
      url: "",
    };
  }
}

// ----------------- ROUTES -----------------

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/query", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "missing q" });

    console.log(`[${q}] 1/6: Starting bulk search...`);
    let allCandidates = [];
    if (q.toLowerCase() === "large language models") {
      console.log(`[${q}] Performing specialized multi-query search.`);
      const searchQueries = [q, "transformer model"];
      for (const query of searchQueries) {
        const results = await bulkSearch(query);
        allCandidates.push(...results);
        await delay(1200); // Wait 1.2s between distinct bulk searches
      }
    } else {
      allCandidates = await bulkSearch(q);
    }

    // Deduplicate candidates
    const uniqueCandidates = Array.from(
      new Map(allCandidates.map((p) => [p.paperId, p])).values()
    );

    console.log(
      `[${q}] 2/6: Bulk search done! Found ${uniqueCandidates.length} unique candidates.`
    );

    const bins = makeYearBins(uniqueCandidates);
    const binned = assignBins(uniqueCandidates, bins);
    console.log(`[${q}] Bins created:`);
    binned.forEach((bin) => {
      console.log(
        `  - Range: ${bin.range[0]}-${bin.range[1]}, Papers: ${bin.papers.length}`
      );
    });

    const perBin = 5; // Take top 5 from each bin to ensure historical spread
    let shortlistLight = [];
    for (const bin of binned) {
      const top = bin.papers
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, perBin);
      shortlistLight.push(...top);
    }

    console.log(
      `[${q}] 3/6: Hydrating ${shortlistLight.length} papers from bins...`
    );
    const ids = shortlistLight.map((p) => p.paperId);
    const hydrated = await hydratePapers(ids);

    // No need for scoring now, just send the hydrated papers to the LLM
    const scored = hydrated;

    console.log(`[${q}] 4/6: Asking LLM to select historical papers...`);
    const selected = (await selectWithGemini(q, scored)) || [];

    selected.sort((a, b) => (a.year || 0) - (b.year || 0));

    console.log(`[${q}] 5/6: Generating present day summary...`);
    const presentDayData = await generatePresentDaySummary(q);
    const presentDayPaper = {
      id: "present-day",
      title: `Present Day: ${presentDayData.title}`,
      year: new Date().getFullYear(),
      url: presentDayData.url,
      summary: presentDayData.summary,
    };

    const finalPapers = selected.map((p) => ({
      id: p.id,
      title: p.title,
      year: p.year,
      url: p.url,
      summary: p.why_important || p.abstract,
    }));

    finalPapers.push(presentDayPaper);

    console.log(
      `[${q}] 6/6: Done! Sending ${finalPapers.length} papers to frontend.`
    );
    res.json({
      query: q,
      bins,
      count: uniqueCandidates.length,
      papers: finalPapers,
    });
  } catch (e) {
    console.error("API Error:", e);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

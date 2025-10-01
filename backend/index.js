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
  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search/bulk` +
    `?query=${encodeURIComponent(query)}` +
    `&sort=citationCount:desc` +
    `&fields=paperId,title,year,citationCount`;
  const r = await fetch(url, { headers: S2_HEADERS });
  if (!r.ok) throw new Error(`Bulk search failed: ${r.status}`);
  const data = await r.json(); // parse JSON text → JS object
  return data.data || []; // safe default if missing
}

/** 2) Make recency-weighted bins by year using quantiles (40/65/80/92) */
function makeYearBins(rows) {
  const years = rows
    .map((p) => p.year)
    .filter((y) => Number.isInteger(y))
    .sort((a, b) => a - b);
  if (years.length === 0) return [];
  const cuts = [0.4, 0.65, 0.8, 0.92].map(
    (q) => years[Math.floor(q * (years.length - 1))]
  );
  const bins = [];
  let start = years[0];
  for (const c of cuts) {
    bins.push([start, c]);
    start = c + 1;
  }
  bins.push([start, years[years.length - 1]]);
  return bins;
}

/** 3) Group papers into bins */
function assignBins(rows, bins) {
  return bins.map(([start, end]) => ({
    range: [start, end],
    papers: rows.filter((p) => p.year >= start && p.year <= end),
  }));
}

/** 4) Hydrate with /paper/batch (full details for chosen ids) */
async function hydratePapers(ids) {
  if (ids.length === 0) return [];
  const CHUNK = 500; // S2 limit per batch
  const out = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
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
async function selectWithGemini(topic, candidates) {
  if (!GEMINI_KEY) {
    // No key: take top 10 by citations as a fallback
    return [...candidates]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
  }
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
Choose 7–10 papers that best trace the field's evolution. Prefer paradigm shifts and influential works.
Avoid near-duplicates. Use ONLY provided info.

Return STRICT JSON with this exact shape:
{"selected":[{"id":"<id>","why_important":"<explanation, <=25 words>","timeline_title":"<A Title For The Timeline, e.g. 'The Attention Mechanism is Introduced'>"}]}

CANDIDATES:
${JSON.stringify(compact)}
  `.trim();

  const resp = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });

  let ids = new Set();
  let reasons = {};
  try {
    const txt = resp.response.text(); // already JSON via responseMimeType
    const parsed = JSON.parse(txt);
    for (const s of parsed.selected || []) {
      ids.add(s.id);
      reasons[s.id] = {
        why: s.why_important || "",
        key: s.timeline_title || "",
      };
    }
  } catch (e) {
    console.error("Gemini parsing failed:", e);
    // fallback if parsing fails
    return [...candidates]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
  }

  const chosen = candidates.filter((p) => ids.has(p.id));
  if (chosen.length === 0) {
    return [...candidates]
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 10)
      .map((p) => ({ ...p, why_important: "", timeline_title: "" }));
  }
  return chosen.map((p) => ({
    ...p,
    why_important: reasons[p.id]?.why || "",
    timeline_title: reasons[p.id]?.key || "",
  }));
}

// ----------------- ROUTES -----------------

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/query", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "missing q" });

    // 1) bulk fetch (top-cited, light fields)
    const candidates = await bulkSearch(q);

    // 2) make recency-weighted bins from those years
    const bins = makeYearBins(candidates);

    // 3) group into bins & pick top by citations from each bin
    const binned = assignBins(candidates, bins);
    const perBin = 15; // tweak
    let shortlistLight = [];
    for (const bin of binned) {
      const top = bin.papers
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, perBin);
      shortlistLight.push(...top);
    }

    // 4) hydrate details for the shortlist
    const ids = shortlistLight.map((p) => p.paperId);
    const hydrated = await hydratePapers(ids);

    // 5) hybrid score → keep ~30
    const years = hydrated
      .map((p) => p.year)
      .filter((y) => Number.isInteger(y));
    const minYear = years.length ? Math.min(...years) : 2000;
    const maxYear = years.length ? Math.max(...years) : minYear;
    const scored = hydrated
      .map((p) => ({ ...p, _score: scorePaper(p, minYear, maxYear) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 30);

    // 6) Gemini re-rank to 7–10 with short reasons (fallback = top 10 by cites)
    const selected = await selectWithGemini(q, scored);

    // 7) chronological for the timeline
    selected.sort((a, b) => (a.year || 0) - (b.year || 0));

    res.json({ query: q, bins, count: candidates.length, papers: selected });
  } catch (e) {
    // Production-ready error handling: log the full error for debugging, but send a generic message to the client.
    console.error("API Error:", e);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

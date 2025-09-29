import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;
const S2 = process.env.SEMANTIC_SCHOLAR_KEY || "";

app.use(cors()); // allow your Vite frontend to call this API
app.use(express.json()); // parse JSON request bodies (for future)

// Helper functions

async function fetchCandidates(query, limit=40){
    
}

// ROUTES
app.get("/api/health", (_req, req) => res.json({ ok: true }));

app.get("/api/query", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "missing q" });

    // 1) Fetch ~30 candidates from Semantic Scholar
    const candidates = await fetchCandidates(q, 30);

    // 2) Ask LLM to pick ~7–10 (falls back to citation ranking if no API key)
    const selected = await selectWithLLM(q, candidates);

    // 3) Sort chronologically for the timeline UI
    selected.sort((a, b) => (a.year || 0) - (b.year || 0));

    res.json({ query: q, papers: selected });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

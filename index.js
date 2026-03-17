import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = process.env.S2_API_KEY;

app.post("/mcp", async (req, res) => {
  try {
    const query = req.body.query || "machine learning";

    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          "x-api-key": API_KEY
        }
      }
    );

    const data = await response.json();

    res.json({
      papers: data.data.map(p => ({
        title: p.title,
        year: p.year,
        authors: p.authors?.map(a => a.name),
        url: p.url
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
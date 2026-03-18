import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = process.env.S2_API_KEY;

// MCP endpoint (IMPORTANT: must be "/")
app.post("/", async (req, res) => {
  const { method, params, id } = req.body;

  try {
    // 1. List available tools
    if (method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "search_papers",
              description: "Search academic papers using Semantic Scholar",
              input_schema: {
                type: "object",
                properties: {
                  query: { type: "string" }
                },
                required: ["query"]
              }
            }
          ]
        }
      });
    }

    // 2. Call tool
    if (method === "tools/call") {
      const { name, arguments: args } = params;

      if (name === "search_papers") {
        const response = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(args.query)}&limit=5`,
          {
            headers: {
              "x-api-key": API_KEY
            }
          }
        );

        const data = await response.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  data.data.map(p => ({
                    title: p.title,
                    year: p.year,
                    authors: p.authors?.map(a => a.name),
                    url: p.url
                  })),
                  null,
                  2
                )
              }
            ]
          }
        });
      }
    }

    // fallback
    res.json({
      jsonrpc: "2.0",
      id,
      error: { message: "Unknown method" }
    });

  } catch (err) {
    res.json({
      jsonrpc: "2.0",
      id,
      error: { message: err.message }
    });
  }
});

app.get("/", (req, res) => {
  res.send("MCP server running");
});

app.listen(3000, () => {
  console.log("MCP server running on port 3000");
});

app.post("/", async (req, res) => {
  console.log("Incoming MCP request:", req.body);
});

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

const response = await fetch(url, {
  headers: { "x-api-key": API_KEY },
  signal: controller.signal
});

clearTimeout(timeout);
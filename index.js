import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = process.env.S2_API_KEY;

// MCP endpoint (must be "/")
app.post("/", async (req, res) => {
  const { method, params, id } = req.body;

  try {
    // 1. List available tools (must be FAST)
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

    // 2. Execute tool
    if (method === "tools/call") {
      const { name, arguments: args } = params;

      if (name === "search_papers") {
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(args.query)}&limit=5`;

        const response = await fetch(url, {
          headers: {
            "x-api-key": API_KEY
          }
        });

        const data = await response.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text:
                  data.data?.map(p =>
                    `📄 ${p.title} (${p.year})\n👨‍🔬 ${p.authors?.map(a => a.name).join(", ")}\n🔗 ${p.url}`
                  ).join("\n\n") || "No results found."
              }
            ]
          }
        });
      }
    }

    // fallback
    return res.json({
      jsonrpc: "2.0",
      id,
      error: { message: "Unknown method" }
    });

  } catch (err) {
    return res.json({
      jsonrpc: "2.0",
      id,
      error: { message: err.message }
    });
  }
});

// Root route (for testing + uptime ping)
app.get("/", (req, res) => {
  res.send("MCP Semantic Scholar server is running 🚀");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
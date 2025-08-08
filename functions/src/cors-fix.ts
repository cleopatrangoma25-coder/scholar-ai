import { onRequest } from "firebase-functions/v2/https";

export const corsFix = onRequest({
  memory: "128MiB",
  timeoutSeconds: 30,
  cors: true
}, async (req, res) => {
  // Set CORS headers for all responses
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "*");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Simple test response
  if (req.path === "/test") {
    res.json({
      status: "success",
      message: "CORS test successful",
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path
    });
    return;
  }

  // Handle RAG queries (simplified)
  if (req.path === "/api/rag/query" && req.method === "POST") {
    try {
      const { query } = req.body;
      
      res.json({
        answer: `This is a test response for query: "${query}". The CORS issue should be resolved now.`,
        sources: [],
        query: query,
        timestamp: new Date().toISOString(),
        engine: "cors-fix-test"
      });
      return;
    } catch (error) {
      res.status(500).json({ 
        error: "Test error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
      return;
    }
  }

  // Default response
  res.json({
    status: "success",
    message: "CORS Fix API is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      test: "/test",
      rag: "/api/rag/query"
    }
  });
}); 
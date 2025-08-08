import { onRequest } from "firebase-functions/v2/https";

export const api = onRequest({
  memory: '1GiB',
  timeoutSeconds: 60,
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Enhanced CORS configuration
  const allowedOrigins = [
    'https://scholar-ai-1-stage.web.app',
    'https://scholar-ai-1-stage.firebaseapp.com',
    'https://scholar-ai-1-prod.web.app',
    'https://scholar-ai-1-prod.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  const isAllowedOrigin = allowedOrigins.includes(origin || '');
  
  // Set CORS headers
  if (isAllowedOrigin) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "*");
  }
  
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    // Basic health check endpoint
    if (req.path === "/health") {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: "production"
      });
      return;
    }

    // Handle RAG queries
    if (req.path === "/api/rag/query" && req.method === "POST") {
              const { query, scope = "private", userId: _userId = "default-user" } = req.body;
      
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      // Simple response to verify CORS is working
      res.json({
        answer: `You asked: "${query}". This is a test response to verify the CORS issue is resolved. The API is working correctly now!`,
        sources: [
          {
            paperId: "test-001",
            title: "Test Document",
            authors: ["Test Author"],
            pageNumber: 1,
            content: "This is a test response to verify the API connectivity and CORS configuration.",
            score: 1.0,
          }
        ],
        query: query,
        scope: scope,
        timestamp: new Date().toISOString(),
        engine: "api-function-cors-fixed",
        corsStatus: "working"
      });
      return;
    }

    // Default response
    res.status(200).json({
      message: "Scholar AI API is running",
      timestamp: new Date().toISOString(),
      environment: "production",
      endpoints: {
        health: "/health",
        rag: "/api/rag/query"
      }
    });
  } catch (error) {
    console.error("Function error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

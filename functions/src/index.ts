import { onRequest } from "firebase-functions/v2/https";
import { apiWithDocuments } from "./api-with-documents";
import { api } from "./api";
import { ModernRAGEngine } from "./rag-engine";

// Export the main API functions
export { apiWithDocuments, api };

// Simple test endpoint
export const test = onRequest({
  memory: '1GiB',
  timeoutSeconds: 60,
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.json({
    message: "Test endpoint working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// Real RAG endpoint using ModernRAGEngine
export const rag = onRequest({
  memory: '1GiB',
  timeoutSeconds: 60,
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers explicitly
  res.set("Access-Control-Allow-Origin", "https://scholar-ai-1-prod.web.app");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept");
  res.set("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Handle any POST request to this function
  if (req.method === "POST") {
    console.log(`RAG function called: ${req.method} ${req.path}`);
    try {
      const { query, scope = "private", userId = "default-user" } = req.body;
      
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      // Use the real RAG engine
      const ragEngine = new ModernRAGEngine();
      const result = await ragEngine.queryRAG({
        query,
        scope,
        userId
      });

      res.json(result);
    } catch (error) {
      console.error("RAG query error:", error);
      res.status(500).json({ 
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}); 
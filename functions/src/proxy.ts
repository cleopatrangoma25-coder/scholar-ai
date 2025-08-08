import { onRequest } from "firebase-functions/v2/https";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/aiplatform";

// Initialize Google Cloud clients
const storage = new Storage();
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT || "scholar-ai-1-prod",
  location: "us-central1",
});

const BUCKET_NAME = "scholar-ai-documents";
const MODEL_NAME = "gemini-1.5-flash-001";

export const proxy = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60,
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

  // Handle health check
  if (req.path === "/health" || req.path === "/") {
    res.json({
      message: "Proxy API is running",
      timestamp: new Date().toISOString(),
      status: "operational",
      endpoints: {
        health: "/health",
        rag: "/api/rag/query"
      }
    });
    return;
  }

  // Handle RAG queries
  if (req.path === "/api/rag/query" && req.method === "POST") {
    try {
      const { query, scope = "public", userId = "default-user" } = req.body;
      
      if (!query) {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      console.log(`Processing RAG query: "${query}" (scope: ${scope})`);

      // Get documents from the bucket
      const bucket = storage.bucket(BUCKET_NAME);
      const [files] = await bucket.getFiles();
      
      console.log(`Found ${files.length} files in bucket`);

      // Filter files based on scope
      let relevantFiles = files;
      if (scope === "private") {
        relevantFiles = files.filter(file => file.name.includes(userId));
      } else if (scope === "public") {
        relevantFiles = files.filter(file => !file.name.includes(userId));
      }

      if (relevantFiles.length === 0) {
        res.json({
          answer: "No documents found for the specified scope. Please upload some documents first.",
          sources: [],
          query: query,
          scope: scope,
          timestamp: new Date().toISOString(),
          engine: "proxy-rag"
        });
        return;
      }

      // Read and process documents
      let allContent = "";
      const sources: any[] = [];

      for (const file of relevantFiles.slice(0, 5)) { // Limit to 5 files for performance
        try {
          const [content] = await file.download();
          const textContent = content.toString('utf-8');
          allContent += `\n\nDocument: ${file.name}\n${textContent}`;
          
          sources.push({
            title: file.name,
            authors: ["Document Author"],
            pageNumber: 1,
            content: textContent.substring(0, 200) + "...",
            score: 0.9,
          });
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }

      // Generate response using Vertex AI
      const model = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
      });

      const prompt = `
You are a helpful research assistant. Answer the following question based on the provided documents:

Question: ${query}

Documents:
${allContent}

Please provide a comprehensive answer based on the documents. If the documents don't contain relevant information, say so clearly.

Answer:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      res.json({
        answer: answer,
        sources: sources,
        query: query,
        scope: scope,
        timestamp: new Date().toISOString(),
        engine: "proxy-rag"
      });

    } catch (error) {
      console.error("Error processing RAG query:", error);
      res.status(500).json({ 
        error: "Failed to process RAG query",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
    return;
  }

  res.status(404).json({ error: "Endpoint not found" });
}); 
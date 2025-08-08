"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rag = exports.test = exports.api = exports.apiWithDocuments = void 0;
const https_1 = require("firebase-functions/v2/https");
const api_with_documents_1 = require("./api-with-documents");
Object.defineProperty(exports, "apiWithDocuments", { enumerable: true, get: function () { return api_with_documents_1.apiWithDocuments; } });
const api_1 = require("./api");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_1.api; } });
const rag_engine_1 = require("./rag-engine");
// Simple test endpoint
exports.test = (0, https_1.onRequest)({
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
exports.rag = (0, https_1.onRequest)({
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
            const ragEngine = new rag_engine_1.ModernRAGEngine();
            const result = await ragEngine.queryRAG({
                query,
                scope,
                userId
            });
            res.json(result);
        }
        catch (error) {
            console.error("RAG query error:", error);
            res.status(500).json({
                error: "Failed to process query",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
    else {
        res.status(405).json({ error: "Method not allowed" });
    }
});
//# sourceMappingURL=index.js.map
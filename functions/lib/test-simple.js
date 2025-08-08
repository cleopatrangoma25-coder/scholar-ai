"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSimple = void 0;
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("@google-cloud/storage");
const storage = new storage_1.Storage();
const documentsBucket = "scholar-ai-documents";
exports.testSimple = (0, https_1.onRequest)({
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // Handle preflight
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    // Handle health check
    if (req.path === "/health" || req.path === "/") {
        res.json({
            status: "success",
            message: "Scholar AI API with Documents is running",
            time: new Date().toISOString(),
            bucket: documentsBucket,
            endpoints: {
                health: "/health",
                rag: "/api/rag/query",
                conversation: "/api/rag/conversation-history"
            }
        });
        return;
    }
    // Handle RAG queries with real document search
    if (req.path === "/api/rag/query" && req.method === "POST") {
        try {
            const { query, scope = "private", userId = "default-user" } = req.body;
            if (!query) {
                res.status(400).json({ error: "Query is required" });
                return;
            }
            console.log(`Processing RAG query: "${query}" (scope: ${scope})`);
            console.log(`Searching in bucket: ${documentsBucket}`);
            // Get documents from the bucket
            const [files] = await storage.bucket(documentsBucket).getFiles();
            if (files.length === 0) {
                res.json({
                    answer: `No documents found in the ${documentsBucket} bucket. Please upload some documents first. You can upload text files (.txt), markdown files (.md), or other document formats.`,
                    sources: [],
                    query: query,
                    scope: scope,
                    timestamp: new Date().toISOString(),
                    engine: "documents-bucket",
                    bucket: documentsBucket,
                    documentsFound: 0
                });
                return;
            }
            console.log(`Found ${files.length} documents in bucket`);
            // Search for relevant content in actual documents
            const relevantChunks = await searchDocumentsInBucket(files, query);
            // Generate answer based on found documents
            const answer = generateAnswerFromDocuments(query, relevantChunks, scope, files.length);
            res.json({
                answer,
                sources: relevantChunks,
                query: query,
                scope: scope,
                timestamp: new Date().toISOString(),
                engine: "documents-bucket",
                bucket: documentsBucket,
                documentsFound: files.length,
                relevantChunksFound: relevantChunks.length
            });
            return;
        }
        catch (error) {
            console.error("Error processing RAG query:", error);
            res.status(500).json({
                error: "Failed to process RAG query",
                details: error instanceof Error ? error.message : "Unknown error",
                bucket: documentsBucket
            });
            return;
        }
    }
    // Handle conversation history
    if (req.path === "/api/rag/conversation-history" && req.method === "GET") {
        res.json([
            {
                id: "conversation-001",
                userId: "default-user",
                query: "What documents are available?",
                scope: "private",
                answer: `I can search through documents in the ${documentsBucket} bucket to answer your questions. The system will find relevant content from your uploaded documents and provide accurate, sourced responses.`,
                sources: [],
                timestamp: new Date().toISOString(),
                engine: "documents-bucket",
                bucket: documentsBucket
            }
        ]);
        return;
    }
    // Default response for other paths
    res.json({
        status: "success",
        message: "Scholar AI API with real document search is running",
        time: new Date().toISOString(),
        bucket: documentsBucket,
        note: "This function searches through actual documents in the scholar-ai-documents bucket. Use POST /api/rag/query to search documents."
    });
});
async function searchDocumentsInBucket(files, query) {
    const relevantChunks = [];
    const queryLower = query.toLowerCase();
    for (const file of files) {
        try {
            console.log(`Processing file: ${file.name}`);
            // Skip non-text files for now
            if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.json')) {
                console.log(`Skipping non-text file: ${file.name}`);
                continue;
            }
            // Download and read file content
            const [content] = await file.download();
            const textContent = content.toString('utf-8');
            // Simple keyword matching
            if (textContent.toLowerCase().includes(queryLower)) {
                // Extract title from filename
                const title = file.name.replace(/\.(txt|md|json)$/, '').replace(/_/g, ' ');
                // Simple content chunking
                const chunks = chunkText(textContent, 500);
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    if (chunk.toLowerCase().includes(queryLower)) {
                        relevantChunks.push({
                            paperId: file.name,
                            title: title,
                            authors: ["Document Author"], // Would be extracted from metadata
                            pageNumber: i + 1,
                            content: chunk,
                            score: calculateRelevanceScore(chunk, query),
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            continue;
        }
    }
    // Sort by relevance score and return top results
    return relevantChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}
function chunkText(text, maxChunkSize) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        }
        else {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
        }
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}
function calculateRelevanceScore(chunk, query) {
    const chunkLower = chunk.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    let score = 0;
    for (const word of queryWords) {
        if (chunkLower.includes(word)) {
            score += 1;
        }
    }
    return Math.min(score / queryWords.length, 1.0);
}
function generateAnswerFromDocuments(query, sources, scope, totalDocuments) {
    if (sources.length === 0) {
        return `I searched through ${totalDocuments} documents in the scholar-ai-documents bucket, but I couldn't find any content specifically related to "${query}". 

This could mean:
1. The documents don't contain information about this topic
2. The documents might use different terminology
3. You might need to upload more relevant documents

Try rephrasing your question or upload documents that contain information about "${query}".`;
    }
    // Build answer from found sources
    const sourceTexts = sources.map(source => `From "${source.title}" (Page ${source.pageNumber}):\n${source.content}`).join('\n\n');
    return `Based on my search through ${totalDocuments} documents in the scholar-ai-documents bucket, here's what I found regarding "${query}":

${sourceTexts}

This information was extracted directly from your documents in the scholar-ai-documents bucket. The search was performed with scope: ${scope}, covering ${scope === 'private' ? 'your private documents' : scope === 'public' ? 'the public corpus' : 'all available documents'}.

I found ${sources.length} relevant content chunks that match your query. Each source is cited above with its document title and page number.`;
}

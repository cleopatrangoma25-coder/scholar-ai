"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiWithDocuments = void 0;
const https_1 = require("firebase-functions/v2/https");
const storage_1 = require("@google-cloud/storage");
const aiplatform_1 = require("@google-cloud/aiplatform");
const storage = new storage_1.Storage();
const predictionClient = new aiplatform_1.PredictionServiceClient();
const documentsBucket = "scholar-ai-documents";
const projectId = "scholar-ai-1-prod";
const location = "us-central1";
exports.apiWithDocuments = (0, https_1.onRequest)(async (req, res) => {
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
            message: "Scholar AI API with Documents is running",
            timestamp: new Date().toISOString(),
            status: "operational",
            bucket: documentsBucket,
            endpoints: {
                health: "/health",
                rag: "/api/rag/query",
                conversation: "/api/rag/conversation-history"
            }
        });
        return;
    }
    // Handle RAG queries using the documents bucket
    if (req.path === "/api/rag/query" && req.method === "POST") {
        try {
            const { query, scope = "private", userId: _userId = "default-user" } = req.body;
            if (!query) {
                res.status(400).json({ error: "Query is required" });
                return;
            }
            console.log(`Processing RAG query: "${query}" (scope: ${scope})`);
            console.log(`Using documents bucket: ${documentsBucket}`);
            // Get documents from the bucket
            const [files] = await storage.bucket(documentsBucket).getFiles();
            if (files.length === 0) {
                res.json({
                    answer: "No documents found in the scholar-ai-documents bucket. Please upload some documents first.",
                    sources: [],
                    query: query,
                    scope: scope,
                    timestamp: new Date().toISOString(),
                    engine: "documents-bucket",
                    bucket: documentsBucket
                });
                return;
            }
            console.log(`Found ${files.length} documents in bucket`);
            // Search for relevant content
            const relevantChunks = await searchDocumentsInBucket(files, query);
            // Generate answer using Gemini
            const answer = await generateAnswerWithContext(query, relevantChunks, scope);
            res.json({
                answer,
                sources: relevantChunks,
                query: query,
                scope: scope,
                timestamp: new Date().toISOString(),
                engine: "documents-bucket",
                bucket: documentsBucket
            });
            return;
        }
        catch (error) {
            console.error("Error processing RAG query:", error);
            res.status(500).json({
                error: "Failed to process RAG query",
                details: error instanceof Error ? error.message : "Unknown error"
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
                answer: "I can search through documents in the scholar-ai-documents bucket to answer your questions.",
                sources: [],
                timestamp: new Date().toISOString(),
                engine: "documents-bucket",
                bucket: documentsBucket
            }
        ]);
        return;
    }
    res.status(404).json({ error: "Endpoint not found" });
});
async function searchDocumentsInBucket(files, query) {
    const relevantChunks = [];
    const queryLower = query.toLowerCase();
    for (const file of files) {
        try {
            // Skip non-text files for now
            if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
                continue;
            }
            // Download and read file content
            const [content] = await file.download();
            const textContent = content.toString('utf-8');
            // Simple keyword matching
            if (textContent.toLowerCase().includes(queryLower)) {
                // Extract title from filename
                const title = file.name.replace(/\.(txt|md)$/, '').replace(/_/g, ' ');
                // Simple content chunking
                const chunks = chunkText(textContent, 500);
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    if (chunk.toLowerCase().includes(queryLower)) {
                        relevantChunks.push({
                            paperId: file.name,
                            title: title,
                            authors: ["Document Author"],
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
async function generateAnswerWithContext(query, sources, scope) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    try {
        const model = "gemini-1.5-flash-001";
        const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;
        // Build context from retrieved sources
        const context = sources.map(source => `Source: ${source.title} (Page ${source.pageNumber})\nAuthors: ${source.authors.join(', ')}\nContent: ${source.content}`).join('\n\n');
        const prompt = `You are a research assistant helping with academic queries. Use the following retrieved information from the scholar-ai-documents bucket to answer the user's question.

Retrieved Information:
${context}

User Question: ${query}

Scope: ${scope}

Please provide a comprehensive, well-structured response to the user's question based on the retrieved information from the documents bucket.
If the retrieved information is relevant, cite the sources appropriately.
If the retrieved information is not sufficient, acknowledge this and provide a general response.
Be helpful, accurate, and academic in your tone.

Answer:`;
        const request = {
            endpoint,
            instances: [
                {
                    structValue: {
                        fields: {
                            content: {
                                structValue: {
                                    fields: {
                                        parts: {
                                            listValue: {
                                                values: [
                                                    {
                                                        structValue: {
                                                            fields: {
                                                                text: {
                                                                    stringValue: prompt
                                                                }
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ],
            parameters: {
                structValue: {
                    fields: {
                        temperature: { numberValue: 0.3 },
                        maxOutputTokens: { numberValue: 1024 },
                        topP: { numberValue: 0.8 },
                        topK: { numberValue: 40 },
                    }
                }
            },
        };
        const [response] = await predictionClient.predict(request);
        const prediction = (_a = response.predictions) === null || _a === void 0 ? void 0 : _a[0];
        if (!prediction || !((_o = (_m = (_l = (_k = (_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = prediction.structValue) === null || _b === void 0 ? void 0 : _b.fields) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.structValue) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f.parts) === null || _g === void 0 ? void 0 : _g.listValue) === null || _h === void 0 ? void 0 : _h.values) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.structValue) === null || _l === void 0 ? void 0 : _l.fields) === null || _m === void 0 ? void 0 : _m.text) === null || _o === void 0 ? void 0 : _o.stringValue)) {
            throw new Error("Failed to generate answer");
        }
        const answer = prediction.structValue.fields.content.structValue.fields.parts.listValue.values[0].structValue.fields.text.stringValue;
        return answer;
    }
    catch (error) {
        console.error("Error generating answer with context:", error);
        return `I'm having trouble generating an answer right now, but I found some relevant documents in the scholar-ai-documents bucket. Please try again in a moment.`;
    }
}
//# sourceMappingURL=api-with-documents.js.map
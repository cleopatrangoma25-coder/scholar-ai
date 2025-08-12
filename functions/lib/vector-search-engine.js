"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorSearchEngine = exports.VectorSearchEngine = void 0;
// import * as functions from 'firebase-functions';
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
class VectorSearchEngine {
    constructor() {
        // private readonly embeddingModel = 'text-embedding-ada-002';
        this.embeddingDimensions = 1536;
        this.similarityThreshold = 0.7;
    }
    /**
     * Generate embeddings for text chunks
     */
    async generateEmbeddings(chunks, documentId) {
        console.log(`Generating embeddings for ${chunks.length} chunks from document ${documentId}`);
        const results = [];
        // Process chunks in batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchResults = await this.processBatch(batch, documentId);
            results.push(...batchResults);
            // Add delay between batches to respect rate limits
            if (i + batchSize < chunks.length) {
                await this.delay(1000);
            }
        }
        console.log(`Generated ${results.length} embeddings successfully`);
        return results;
    }
    /**
     * Process a batch of chunks for embedding generation
     */
    async processBatch(chunks, documentId) {
        const results = [];
        for (const chunk of chunks) {
            try {
                const embedding = await this.generateSingleEmbedding(chunk.text);
                results.push({
                    text: chunk.text,
                    embedding,
                    chunkId: chunk.id,
                    documentId
                });
                // Store embedding in Firestore
                await this.storeEmbedding(chunk.id, documentId, embedding, chunk.text);
            }
            catch (error) {
                console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
                // Continue with other chunks even if one fails
            }
        }
        return results;
    }
    /**
     * Generate embedding for a single text chunk
     */
    async generateSingleEmbedding(text) {
        // For now, we'll use a mock embedding generator
        // In production, this would call OpenAI's embedding API
        return this.generateMockEmbedding(text);
    }
    /**
     * Generate mock embeddings for development/testing
     * In production, replace with OpenAI API call
     */
    generateMockEmbedding(text) {
        // Simple hash-based embedding for demonstration
        const hash = this.simpleHash(text);
        const embedding = new Array(this.embeddingDimensions).fill(0);
        // Generate pseudo-random embedding based on text hash
        for (let i = 0; i < this.embeddingDimensions; i++) {
            embedding[i] = Math.sin(hash + i) * 0.5;
        }
        return embedding;
    }
    /**
     * Simple hash function for mock embeddings
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    /**
     * Store embedding in Firestore
     */
    async storeEmbedding(chunkId, documentId, embedding, text) {
        const embeddingData = {
            chunkId,
            documentId,
            embedding,
            text,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('embeddings').doc(chunkId).set(embeddingData);
    }
    /**
     * Search for similar content using vector similarity
     */
    async searchSimilar(query) {
        console.log(`Searching for: "${query.query}"`);
        // Generate embedding for the query
        const queryEmbedding = await this.generateSingleEmbedding(query.query);
        // Get all embeddings from Firestore
        const embeddings = await this.getAllEmbeddings(query.filters);
        // Calculate similarities
        const similarities = embeddings.map(embedding => (Object.assign(Object.assign({}, embedding), { score: this.calculateCosineSimilarity(queryEmbedding, embedding.embedding) })));
        // Filter by threshold and sort by score
        const threshold = query.threshold || this.similarityThreshold;
        const limit = query.limit || 10;
        const results = similarities
            .filter(item => item.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        // Get metadata for results
        const searchResults = await this.enrichResults(results);
        console.log(`Found ${searchResults.length} relevant results`);
        return searchResults;
    }
    /**
     * Get all embeddings from Firestore with optional filters
     */
    async getAllEmbeddings(filters) {
        let query = db.collection('embeddings');
        if (filters === null || filters === void 0 ? void 0 : filters.documentIds) {
            query = query.where('documentId', 'in', filters.documentIds);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    calculateCosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same dimensions');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) {
            return 0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    /**
     * Enrich search results with document metadata
     */
    async enrichResults(results) {
        const enrichedResults = [];
        for (const result of results) {
            try {
                // Get document metadata
                const docSnapshot = await db.collection('documents').doc(result.documentId).get();
                const docData = docSnapshot.data();
                enrichedResults.push({
                    chunkId: result.chunkId,
                    documentId: result.documentId,
                    text: result.text,
                    score: result.score,
                    metadata: {
                        title: (docData === null || docData === void 0 ? void 0 : docData.title) || 'Unknown Title',
                        author: (docData === null || docData === void 0 ? void 0 : docData.author) || 'Unknown Author',
                        page: this.estimatePageFromChunk(result.text, (docData === null || docData === void 0 ? void 0 : docData.text) || '')
                    }
                });
            }
            catch (error) {
                console.error(`Error enriching result for chunk ${result.chunkId}:`, error);
                // Add result without metadata if enrichment fails
                enrichedResults.push({
                    chunkId: result.chunkId,
                    documentId: result.documentId,
                    text: result.text,
                    score: result.score,
                    metadata: {
                        title: 'Unknown Title',
                        author: 'Unknown Author',
                        page: 1
                    }
                });
            }
        }
        return enrichedResults;
    }
    /**
     * Estimate page number from chunk text
     */
    estimatePageFromChunk(chunkText, fullText) {
        if (!fullText)
            return 1;
        const chunkIndex = fullText.indexOf(chunkText);
        if (chunkIndex === -1)
            return 1;
        // Rough estimate: 2500 characters per page
        return Math.ceil(chunkIndex / 2500) + 1;
    }
    /**
     * Hybrid search combining vector and keyword search
     */
    async hybridSearch(query) {
        console.log(`Performing hybrid search for: "${query.query}"`);
        // Get vector search results
        const vectorResults = await this.searchSimilar(query);
        // Get keyword search results
        const keywordResults = await this.keywordSearch(query);
        // Combine and rank results
        const combinedResults = this.combineSearchResults(vectorResults, keywordResults);
        // Remove duplicates and sort by combined score
        const uniqueResults = this.removeDuplicates(combinedResults);
        const limit = query.limit || 10;
        return uniqueResults.slice(0, limit);
    }
    /**
     * Keyword-based search
     */
    async keywordSearch(query) {
        const keywords = query.query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
        let searchQuery = db.collection('embeddings');
        // Simple keyword matching in text content
        const results = [];
        const snapshot = await searchQuery.get();
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const text = data.text.toLowerCase();
            let score = 0;
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    score += 1;
                }
            }
            if (score > 0) {
                results.push(Object.assign(Object.assign({}, data), { score: score / keywords.length // Normalize score
                 }));
            }
        }
        return this.enrichResults(results);
    }
    /**
     * Combine vector and keyword search results
     */
    combineSearchResults(vectorResults, keywordResults) {
        const combined = new Map();
        // Add vector results with weight 0.7
        for (const result of vectorResults) {
            combined.set(result.chunkId, Object.assign(Object.assign({}, result), { score: result.score * 0.7 }));
        }
        // Add keyword results with weight 0.3
        for (const result of keywordResults) {
            const existing = combined.get(result.chunkId);
            if (existing) {
                existing.score += result.score * 0.3;
            }
            else {
                combined.set(result.chunkId, Object.assign(Object.assign({}, result), { score: result.score * 0.3 }));
            }
        }
        return Array.from(combined.values());
    }
    /**
     * Remove duplicate results
     */
    removeDuplicates(results) {
        const seen = new Set();
        return results.filter(result => {
            if (seen.has(result.chunkId)) {
                return false;
            }
            seen.add(result.chunkId);
            return true;
        });
    }
    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get search statistics
     */
    async getSearchStats() {
        const embeddingsSnapshot = await db.collection('embeddings').get();
        const documentsSnapshot = await db.collection('documents').get();
        return {
            totalEmbeddings: embeddingsSnapshot.size,
            totalDocuments: documentsSnapshot.size,
            averageEmbeddingsPerDocument: embeddingsSnapshot.size / Math.max(documentsSnapshot.size, 1),
            lastUpdated: new Date().toISOString()
        };
    }
}
exports.VectorSearchEngine = VectorSearchEngine;
// Export the search engine instance
exports.vectorSearchEngine = new VectorSearchEngine();
//# sourceMappingURL=vector-search-engine.js.map
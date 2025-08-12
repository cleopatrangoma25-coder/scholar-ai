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
exports.testVectorSearch = exports.advancedSearch = exports.getSearchSuggestions = exports.getSearchStats = exports.generateEmbeddings = exports.searchDocuments = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vector_search_engine_1 = require("./vector-search-engine");
// import { documentProcessor } from './advanced-document-processor';
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Enhanced search endpoint with vector search capabilities
 */
exports.searchDocuments = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        console.log('Starting enhanced document search...');
        // Get search parameters
        const { query, searchType = 'hybrid', limit = 10, threshold, filters } = req.body;
        if (!query || query.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
            return;
        }
        const startTime = Date.now();
        // Prepare search query
        const searchQuery = {
            query: query.trim(),
            limit: parseInt(limit),
            threshold: threshold ? parseFloat(threshold) : undefined,
            filters
        };
        let results = [];
        // Perform search based on type
        switch (searchType) {
            case 'vector':
                results = await vector_search_engine_1.vectorSearchEngine.searchSimilar(searchQuery);
                break;
            case 'keyword':
                // Use hybrid search but only return keyword results
                const hybridResults = await vector_search_engine_1.vectorSearchEngine.hybridSearch(searchQuery);
                results = hybridResults.filter(r => r.score <= 0.5); // Filter for keyword-like results
                break;
            case 'hybrid':
            default:
                results = await vector_search_engine_1.vectorSearchEngine.hybridSearch(searchQuery);
                break;
        }
        const searchTime = Date.now() - startTime;
        const response = {
            success: true,
            results,
            totalResults: results.length,
            searchTime,
            query: searchQuery.query,
            searchType
        };
        console.log(`Search completed in ${searchTime}ms`);
        console.log(`Found ${results.length} results for query: "${query}"`);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error performing search:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Generate embeddings for a document
 */
exports.generateEmbeddings = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        console.log('Starting embedding generation...');
        const { documentId } = req.body;
        if (!documentId) {
            res.status(400).json({
                success: false,
                error: 'Document ID is required'
            });
            return;
        }
        const startTime = Date.now();
        // Get document from Firestore
        const docSnapshot = await db.collection('documents').doc(documentId).get();
        if (!docSnapshot.exists) {
            res.status(404).json({
                success: false,
                error: 'Document not found'
            });
            return;
        }
        const docData = docSnapshot.data();
        const chunks = (docData === null || docData === void 0 ? void 0 : docData.chunks) || [];
        if (chunks.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Document has no chunks to process'
            });
            return;
        }
        // Generate embeddings for chunks
        const embeddings = await vector_search_engine_1.vectorSearchEngine.generateEmbeddings(chunks, documentId);
        const processingTime = Date.now() - startTime;
        // Update document status
        await db.collection('documents').doc(documentId).update({
            embeddingsGenerated: embeddings.length,
            embeddingStatus: 'completed',
            embeddingCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const response = {
            success: true,
            documentId,
            embeddingsGenerated: embeddings.length,
            processingTime
        };
        console.log(`Generated ${embeddings.length} embeddings for document ${documentId}`);
        console.log(`Processing time: ${processingTime}ms`);
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error generating embeddings:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Get search statistics
 */
exports.getSearchStats = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const stats = await vector_search_engine_1.vectorSearchEngine.getSearchStats();
        res.status(200).json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('Error getting search stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Search suggestions endpoint
 */
exports.getSearchSuggestions = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { query, limit = 5 } = req.query;
        if (!query) {
            res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
            return;
        }
        // Get popular search terms from documents
        const documentsSnapshot = await db.collection('documents')
            .limit(50)
            .get();
        const suggestions = [];
        const queryLower = query.toLowerCase();
        // Extract keywords from document titles and content
        for (const doc of documentsSnapshot.docs) {
            const data = doc.data();
            // Check title
            if (data.title && data.title.toLowerCase().includes(queryLower)) {
                suggestions.push(data.title);
            }
            // Check keywords
            if (data.keywords) {
                for (const keyword of data.keywords) {
                    if (keyword.toLowerCase().includes(queryLower)) {
                        suggestions.push(keyword);
                    }
                }
            }
        }
        // Remove duplicates and limit results
        const uniqueSuggestions = [...new Set(suggestions)].slice(0, parseInt(limit));
        res.status(200).json({
            success: true,
            suggestions: uniqueSuggestions,
            query: query
        });
    }
    catch (error) {
        console.error('Error getting search suggestions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Advanced search with filters
 */
exports.advancedSearch = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { query, filters = {}, sortBy = 'relevance', limit = 20, offset = 0 } = req.body;
        if (!query) {
            res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
            return;
        }
        const startTime = Date.now();
        // Build search query with filters
        const searchQuery = {
            query,
            limit: parseInt(limit) + parseInt(offset),
            filters
        };
        // Perform search
        const results = await vector_search_engine_1.vectorSearchEngine.hybridSearch(searchQuery);
        // Apply sorting
        let sortedResults = results;
        switch (sortBy) {
            case 'date':
                sortedResults = results.sort((a, b) => {
                    // Sort by document creation date (would need to be added to metadata)
                    return 0; // Placeholder
                });
                break;
            case 'author':
                sortedResults = results.sort((a, b) => a.metadata.author.localeCompare(b.metadata.author));
                break;
            case 'title':
                sortedResults = results.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title));
                break;
            case 'relevance':
            default:
                // Already sorted by relevance score
                break;
        }
        // Apply pagination
        const paginatedResults = sortedResults.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        const searchTime = Date.now() - startTime;
        res.status(200).json({
            success: true,
            results: paginatedResults,
            totalResults: results.length,
            searchTime,
            query,
            filters,
            sortBy,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: results.length
            }
        });
    }
    catch (error) {
        console.error('Error performing advanced search:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Test vector search functionality
 */
exports.testVectorSearch = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { query = 'machine learning', searchType = 'hybrid' } = req.body;
        const startTime = Date.now();
        const searchQuery = {
            query,
            limit: 5
        };
        let results = [];
        switch (searchType) {
            case 'vector':
                results = await vector_search_engine_1.vectorSearchEngine.searchSimilar(searchQuery);
                break;
            case 'hybrid':
            default:
                results = await vector_search_engine_1.vectorSearchEngine.hybridSearch(searchQuery);
                break;
        }
        const searchTime = Date.now() - startTime;
        res.status(200).json({
            success: true,
            testResults: {
                query,
                searchType,
                resultsFound: results.length,
                searchTime,
                sampleResults: results.slice(0, 3)
            }
        });
    }
    catch (error) {
        console.error('Error in vector search test:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=enhanced-search-endpoints.js.map
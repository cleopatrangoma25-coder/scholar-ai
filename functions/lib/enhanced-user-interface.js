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
exports.getVisualizedResults = exports.getAnalytics = exports.getUserDashboard = exports.getQuerySuggestions = exports.advancedSearch = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const performance_cache_manager_1 = require("./performance-cache-manager");
const vector_search_engine_1 = require("./vector-search-engine");
// Advanced Query Interface with Natural Language Processing
exports.advancedSearch = functions.https.onRequest(async (req, res) => {
    try {
        const startTime = Date.now();
        // Set CORS headers
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        const { query, filters, options, userContext } = req.body;
        if (!query) {
            res.status(400).json({ error: 'Query is required' });
            return;
        }
        // Preprocess and enhance query
        const enhancedQuery = await enhanceQuery(query, userContext);
        // Check cache first
        const cacheKey = performance_cache_manager_1.performanceCacheManager.generateCacheKey('advanced_search', {
            query: enhancedQuery,
            filters,
            options
        });
        const cachedResults = await performance_cache_manager_1.performanceCacheManager.getCachedResponse(cacheKey);
        if (cachedResults) {
            res.json({
                success: true,
                results: cachedResults,
                fromCache: true,
                responseTime: Date.now() - startTime
            });
            return;
        }
        // Perform advanced search
        const searchResults = await performAdvancedSearch(enhancedQuery, filters, options);
        // Generate suggestions
        const suggestions = await generateQuerySuggestions(query, searchResults);
        // Store analytics
        await storeAnalytics({
            timestamp: new Date().toISOString(),
            userId: userContext === null || userContext === void 0 ? void 0 : userContext.userId,
            sessionId: (userContext === null || userContext === void 0 ? void 0 : userContext.sessionId) || 'anonymous',
            event: 'search',
            data: { query, filters, options, resultsCount: searchResults.length },
            performance: {
                responseTime: Date.now() - startTime,
                cacheHit: false,
                errorOccurred: false
            }
        });
        // Cache results
        await performance_cache_manager_1.performanceCacheManager.setCachedResponse(cacheKey, {
            results: searchResults,
            suggestions
        }, 1800000); // 30 minutes
        res.json({
            success: true,
            results: searchResults,
            suggestions,
            fromCache: false,
            responseTime: Date.now() - startTime
        });
    }
    catch (error) {
        console.error('Error in advanced search:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Query Suggestions and Autocomplete
exports.getQuerySuggestions = functions.https.onRequest(async (req, res) => {
    try {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        const { query, userId, sessionId } = req.body;
        if (!query) {
            res.status(400).json({ error: 'Query is required' });
            return;
        }
        const suggestions = await generateQuerySuggestions(query, [], userId, sessionId);
        res.json({
            success: true,
            suggestions
        });
    }
    catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// User Dashboard
exports.getUserDashboard = functions.https.onRequest(async (req, res) => {
    try {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const dashboard = await buildUserDashboard(userId);
        res.json({
            success: true,
            dashboard
        });
    }
    catch (error) {
        console.error('Error building dashboard:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Analytics and Monitoring
exports.getAnalytics = functions.https.onRequest(async (req, res) => {
    try {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        const { timeRange, userId, eventType } = req.body;
        const analytics = await getAnalyticsData(timeRange, userId, eventType);
        res.json({
            success: true,
            analytics
        });
    }
    catch (error) {
        console.error('Error retrieving analytics:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Result Visualization with Interactive Features
exports.getVisualizedResults = functions.https.onRequest(async (req, res) => {
    try {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        const { query, filters, options, visualizationType } = req.body;
        const searchResults = await performAdvancedSearch(query, filters, options);
        const visualization = await createVisualization(searchResults, visualizationType);
        res.json({
            success: true,
            results: searchResults,
            visualization
        });
    }
    catch (error) {
        console.error('Error creating visualization:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Helper functions
async function enhanceQuery(query, userContext) {
    var _a;
    // Natural language processing enhancements
    let enhancedQuery = query;
    // Expand abbreviations
    const abbreviations = {
        'ml': 'machine learning',
        'ai': 'artificial intelligence',
        'nlp': 'natural language processing',
        'dl': 'deep learning',
        'cv': 'computer vision'
    };
    for (const [abbr, full] of Object.entries(abbreviations)) {
        enhancedQuery = enhancedQuery.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
    }
    // Add context from user history
    if ((_a = userContext === null || userContext === void 0 ? void 0 : userContext.previousQueries) === null || _a === void 0 ? void 0 : _a.length) {
        const contextWords = userContext.previousQueries
            .slice(-3) // Last 3 queries
            .join(' ')
            .split(' ')
            .filter((word) => word.length > 3)
            .slice(0, 5); // Top 5 words
        if (contextWords.length > 0) {
            enhancedQuery += ' ' + contextWords.join(' ');
        }
    }
    return enhancedQuery;
}
async function performAdvancedSearch(query, filters, options) {
    // Use the vector search engine with enhanced options
    const searchQuery = {
        query: query,
        filters: filters || {},
        maxResults: (options === null || options === void 0 ? void 0 : options.maxResults) || 20,
        similarityThreshold: (options === null || options === void 0 ? void 0 : options.similarityThreshold) || 0.7
    };
    const results = await vector_search_engine_1.vectorSearchEngine.hybridSearch(searchQuery);
    // Enhance results with additional metadata
    const enhancedResults = await Promise.all(results.map(async (result) => {
        const document = await getDocumentMetadata(result.documentId);
        const highlights = generateHighlights(result.text, query);
        const chunks = await getDocumentChunks(result.documentId);
        return Object.assign(Object.assign({}, result), { title: (document === null || document === void 0 ? void 0 : document.title) || 'Unknown Title', author: (document === null || document === void 0 ? void 0 : document.author) || 'Unknown Author', date: (document === null || document === void 0 ? void 0 : document.date) || new Date().toISOString(), metadata: (document === null || document === void 0 ? void 0 : document.metadata) || {}, highlights, chunks: (options === null || options === void 0 ? void 0 : options.includeChunks) ? chunks : [], relatedDocuments: await findRelatedDocuments(result.documentId) });
    }));
    // Sort results
    if (options === null || options === void 0 ? void 0 : options.sortBy) {
        enhancedResults.sort((a, b) => {
            const order = options.sortOrder === 'desc' ? -1 : 1;
            switch (options.sortBy) {
                case 'date':
                    return order * (new Date(a.date).getTime() - new Date(b.date).getTime());
                case 'author':
                    return order * a.author.localeCompare(b.author);
                case 'title':
                    return order * a.title.localeCompare(b.title);
                default:
                    return order * (b.score - a.score);
            }
        });
    }
    return enhancedResults;
}
async function generateQuerySuggestions(query, searchResults = [], userId, sessionId) {
    const suggestions = [];
    // Autocomplete suggestions
    const autocompleteSuggestions = await generateAutocompleteSuggestions(query);
    suggestions.push(...autocompleteSuggestions);
    // Related query suggestions based on search results
    if (searchResults.length > 0) {
        const relatedSuggestions = generateRelatedSuggestions(query, searchResults);
        suggestions.push(...relatedSuggestions);
    }
    // Popular queries
    const popularSuggestions = await getPopularQueries(userId);
    suggestions.push(...popularSuggestions);
    // Trending queries
    const trendingSuggestions = await getTrendingQueries();
    suggestions.push(...trendingSuggestions);
    return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10); // Top 10 suggestions
}
async function generateAutocompleteSuggestions(query) {
    // Mock implementation - in production, this would use a proper autocomplete index
    const commonTerms = [
        'machine learning', 'artificial intelligence', 'deep learning',
        'natural language processing', 'computer vision', 'neural networks',
        'data science', 'statistics', 'algorithms', 'optimization'
    ];
    return commonTerms
        .filter(term => term.toLowerCase().includes(query.toLowerCase()))
        .map(term => ({
        suggestion: term,
        confidence: 0.8,
        type: 'autocomplete'
    }));
}
function generateRelatedSuggestions(query, results) {
    // Extract keywords from search results
    const keywords = new Set();
    results.forEach(result => {
        var _a;
        if ((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.keywords) {
            result.metadata.keywords.forEach((kw) => keywords.add(kw));
        }
    });
    return Array.from(keywords)
        .slice(0, 5)
        .map(keyword => ({
        suggestion: `${query} ${keyword}`,
        confidence: 0.6,
        type: 'related'
    }));
}
async function getPopularQueries(userId) {
    // Mock implementation - in production, this would query analytics
    const popularQueries = [
        'machine learning algorithms',
        'deep learning applications',
        'natural language processing techniques',
        'computer vision models',
        'data science methods'
    ];
    return popularQueries.map(query => ({
        suggestion: query,
        confidence: 0.7,
        type: 'popular'
    }));
}
async function getTrendingQueries() {
    // Mock implementation - in production, this would analyze recent search patterns
    const trendingQueries = [
        'transformer models',
        'large language models',
        'computer vision transformers',
        'multimodal AI',
        'federated learning'
    ];
    return trendingQueries.map(query => ({
        suggestion: query,
        confidence: 0.5,
        type: 'trending'
    }));
}
async function buildUserDashboard(userId) {
    // const db = admin.firestore();
    // Get user statistics
    const userStats = await getUserStats(userId);
    // Get analytics data
    const analytics = await getUserAnalytics(userId);
    // Get user preferences
    const preferences = await getUserPreferences(userId);
    return {
        userId,
        stats: userStats,
        analytics,
        preferences
    };
}
async function getUserStats(userId) {
    // Mock implementation - in production, this would query the database
    return {
        totalDocuments: 25,
        totalSearches: 150,
        averageSearchTime: 1.2,
        favoriteDocuments: ['doc1', 'doc2', 'doc3'],
        recentSearches: [
            'machine learning algorithms',
            'deep learning applications',
            'natural language processing'
        ]
    };
}
async function getUserAnalytics(userId) {
    // Mock implementation - in production, this would query analytics collection
    return {
        searchHistory: [
            {
                query: 'machine learning algorithms',
                timestamp: new Date().toISOString(),
                resultsCount: 15,
                clickThroughRate: 0.8
            }
        ],
        documentUsage: [
            {
                documentId: 'doc1',
                accessCount: 10,
                lastAccessed: new Date().toISOString()
            }
        ],
        performanceMetrics: {
            averageResponseTime: 1.2,
            cacheHitRate: 0.85,
            errorRate: 0.02
        }
    };
}
async function getUserPreferences(userId) {
    // Mock implementation - in production, this would query user preferences
    return {
        defaultFilters: {
            documentTypes: ['pdf', 'docx'],
            language: 'en'
        },
        uiSettings: {
            theme: 'light',
            resultsPerPage: 20
        },
        notificationSettings: {
            emailNotifications: true,
            searchAlerts: false
        }
    };
}
async function getAnalyticsData(timeRange, userId, eventType) {
    // Mock implementation - in production, this would query analytics collection
    return {
        timeRange,
        totalEvents: 1000,
        eventsByType: {
            search: 600,
            document_view: 300,
            document_upload: 50,
            query_suggestion: 30,
            error: 20
        },
        performanceMetrics: {
            averageResponseTime: 1.2,
            cacheHitRate: 0.85,
            errorRate: 0.02
        },
        topQueries: [
            'machine learning',
            'deep learning',
            'artificial intelligence'
        ],
        userActivity: {
            activeUsers: 50,
            newUsers: 10,
            returningUsers: 40
        }
    };
}
async function storeAnalytics(data) {
    const db = admin.firestore();
    try {
        await db.collection('analytics').add(Object.assign(Object.assign({}, data), { timestamp: admin.firestore.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        console.error('Error storing analytics:', error);
    }
}
async function createVisualization(results, type) {
    // Mock implementation - in production, this would create actual visualizations
    switch (type) {
        case 'wordCloud':
            return createWordCloud(results);
        case 'timeline':
            return createTimeline(results);
        case 'network':
            return createNetworkGraph(results);
        default:
            return createDefaultVisualization(results);
    }
}
function createWordCloud(results) {
    const words = {};
    results.forEach(result => {
        const text = result.text.toLowerCase();
        const wordList = text.split(/\s+/).filter((word) => word.length > 3);
        wordList.forEach((word) => {
            words[word] = (words[word] || 0) + 1;
        });
    });
    return {
        type: 'wordCloud',
        data: Object.entries(words)
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
    };
}
function createTimeline(results) {
    return {
        type: 'timeline',
        data: results
            .map(result => ({
            date: result.date,
            title: result.title,
            author: result.author,
            score: result.score
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
}
function createNetworkGraph(results) {
    const nodes = results.map(result => ({
        id: result.documentId,
        label: result.title,
        group: result.author
    }));
    const edges = [];
    for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
            const similarity = calculateSimilarity(results[i], results[j]);
            if (similarity > 0.5) {
                edges.push({
                    from: results[i].documentId,
                    to: results[j].documentId,
                    value: similarity
                });
            }
        }
    }
    return {
        type: 'network',
        data: { nodes, edges }
    };
}
function createDefaultVisualization(results) {
    return {
        type: 'summary',
        data: {
            totalResults: results.length,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
            topAuthors: getTopAuthors(results),
            dateRange: getDateRange(results)
        }
    };
}
// Helper functions for document operations
async function getDocumentMetadata(documentId) {
    const db = admin.firestore();
    try {
        const doc = await db.collection('documents').doc(documentId).get();
        return doc.exists ? doc.data() : null;
    }
    catch (error) {
        console.error('Error getting document metadata:', error);
        return null;
    }
}
async function getDocumentChunks(documentId) {
    const db = admin.firestore();
    try {
        const chunks = await db.collection('documents').doc(documentId).collection('chunks').get();
        return chunks.docs.map((doc) => doc.data());
    }
    catch (error) {
        console.error('Error getting document chunks:', error);
        return [];
    }
}
async function findRelatedDocuments(documentId) {
    // Mock implementation - in production, this would use similarity search
    return ['doc2', 'doc3', 'doc4'];
}
function generateHighlights(content, query) {
    const highlights = [];
    const queryWords = query.toLowerCase().split(/\s+/);
    queryWords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
            highlights.push({
                text: match[0],
                position: match.index,
                relevance: 0.8
            });
        }
    });
    return highlights.slice(0, 10); // Limit to 10 highlights
}
function calculateSimilarity(doc1, doc2) {
    // Simple similarity calculation based on shared keywords
    const keywords1 = new Set(doc1.metadata.keywords || []);
    const keywords2 = new Set(doc2.metadata.keywords || []);
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    return intersection.size / union.size;
}
function getTopAuthors(results) {
    const authorCounts = {};
    results.forEach(result => {
        authorCounts[result.author] = (authorCounts[result.author] || 0) + 1;
    });
    return Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([author]) => author);
}
function getDateRange(results) {
    var _a, _b;
    const dates = results.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
    return {
        start: ((_a = dates[0]) === null || _a === void 0 ? void 0 : _a.toISOString()) || new Date().toISOString(),
        end: ((_b = dates[dates.length - 1]) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString()
    };
}
//# sourceMappingURL=enhanced-user-interface.js.map
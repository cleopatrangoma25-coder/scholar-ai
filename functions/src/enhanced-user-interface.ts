import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { performanceCacheManager } from './performance-cache-manager';
import { vectorSearchEngine } from './vector-search-engine';
// import { documentProcessor } from './advanced-document-processor';

// Enhanced interfaces for Week 4
interface AdvancedQuery {
  query: string;
  filters?: {
    documentIds?: string[];
    authors?: string[];
    dateRange?: { start: string; end: string };
    keywords?: string[];
    documentTypes?: string[];
    language?: string;
  };
  options?: {
    maxResults?: number;
    similarityThreshold?: number;
    includeMetadata?: boolean;
    includeChunks?: boolean;
    sortBy?: 'relevance' | 'date' | 'author' | 'title';
    sortOrder?: 'asc' | 'desc';
  };
  userContext?: {
    userId?: string;
    sessionId?: string;
    previousQueries?: string[];
    preferences?: any;
  };
}

interface QuerySuggestion {
  suggestion: string;
  confidence: number;
  type: 'autocomplete' | 'related' | 'popular' | 'trending';
  metadata?: any;
}

interface SearchResult {
  documentId: string;
  title: string;
  author: string;
  date: string;
  text: string;
  score: number;
  metadata: {
    keywords: string[];
    pageCount: number;
    fileSize: number;
    mimeType: string;
    language: string;
  };
  highlights: {
    text: string;
    position: number;
    relevance: number;
  }[];
  chunks: {
    id: string;
    text: string;
    page: number;
    position: number;
    metadata: any;
  }[];
  relatedDocuments?: string[];
}

interface UserDashboard {
  userId: string;
  stats: {
    totalDocuments: number;
    totalSearches: number;
    averageSearchTime: number;
    favoriteDocuments: string[];
    recentSearches: string[];
  };
  analytics: {
    searchHistory: {
      query: string;
      timestamp: string;
      resultsCount: number;
      clickThroughRate?: number;
    }[];
    documentUsage: {
      documentId: string;
      accessCount: number;
      lastAccessed: string;
    }[];
    performanceMetrics: {
      averageResponseTime: number;
      cacheHitRate: number;
      errorRate: number;
    };
  };
  preferences: {
    defaultFilters: any;
    uiSettings: any;
    notificationSettings: any;
  };
}

interface AnalyticsData {
  timestamp: string;
  userId?: string;
  sessionId: string;
  event: 'search' | 'document_view' | 'document_upload' | 'query_suggestion' | 'error';
  data: any;
  performance: {
    responseTime: number;
    cacheHit: boolean;
    errorOccurred: boolean;
  };
}

// Advanced Query Interface with Natural Language Processing
export const advancedSearch = functions.https.onRequest(async (req, res) => {
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

    const { query, filters, options, userContext }: AdvancedQuery = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    // Preprocess and enhance query
    const enhancedQuery = await enhanceQuery(query, userContext);
    
    // Check cache first
    const cacheKey = performanceCacheManager.generateCacheKey('advanced_search', {
      query: enhancedQuery,
      filters,
      options
    });
    
    const cachedResults = await performanceCacheManager.getCachedResponse(cacheKey);
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
      userId: userContext?.userId,
      sessionId: userContext?.sessionId || 'anonymous',
      event: 'search',
      data: { query, filters, options, resultsCount: searchResults.length },
      performance: {
        responseTime: Date.now() - startTime,
        cacheHit: false,
        errorOccurred: false
      }
    });

    // Cache results
    await performanceCacheManager.setCachedResponse(cacheKey, {
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

  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Query Suggestions and Autocomplete
export const getQuerySuggestions = functions.https.onRequest(async (req, res) => {
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

  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// User Dashboard
export const getUserDashboard = functions.https.onRequest(async (req, res) => {
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

  } catch (error) {
    console.error('Error building dashboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Analytics and Monitoring
export const getAnalytics = functions.https.onRequest(async (req, res) => {
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

  } catch (error) {
    console.error('Error retrieving analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Result Visualization with Interactive Features
export const getVisualizedResults = functions.https.onRequest(async (req, res) => {
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

  } catch (error) {
    console.error('Error creating visualization:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Helper functions
async function enhanceQuery(query: string, userContext?: any): Promise<string> {
  // Natural language processing enhancements
  let enhancedQuery = query;
  
  // Expand abbreviations
  const abbreviations: { [key: string]: string } = {
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
  if (userContext?.previousQueries?.length) {
    const contextWords = userContext.previousQueries
      .slice(-3) // Last 3 queries
      .join(' ')
      .split(' ')
      .filter((word: string) => word.length > 3)
      .slice(0, 5); // Top 5 words
    
    if (contextWords.length > 0) {
      enhancedQuery += ' ' + contextWords.join(' ');
    }
  }
  
  return enhancedQuery;
}

async function performAdvancedSearch(
  query: string, 
  filters?: any, 
  options?: any
): Promise<SearchResult[]> {
  // Use the vector search engine with enhanced options
  const searchQuery = {
    query: query,
    filters: filters || {},
    maxResults: options?.maxResults || 20,
    similarityThreshold: options?.similarityThreshold || 0.7
  };
  
  const results = await vectorSearchEngine.hybridSearch(searchQuery);
  
  // Enhance results with additional metadata
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      const document = await getDocumentMetadata(result.documentId);
      const highlights = generateHighlights(result.text, query);
      const chunks = await getDocumentChunks(result.documentId);
      
      return {
        ...result,
        title: document?.title || 'Unknown Title',
        author: document?.author || 'Unknown Author',
        date: document?.date || new Date().toISOString(),
        metadata: document?.metadata || {},
        highlights,
        chunks: options?.includeChunks ? chunks : [],
        relatedDocuments: await findRelatedDocuments(result.documentId)
      };
    })
  );
  
  // Sort results
  if (options?.sortBy) {
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
  
  return enhancedResults as SearchResult[];
}

async function generateQuerySuggestions(
  query: string, 
  searchResults: any[] = [], 
  userId?: string, 
  sessionId?: string
): Promise<QuerySuggestion[]> {
  const suggestions: QuerySuggestion[] = [];
  
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

async function generateAutocompleteSuggestions(query: string): Promise<QuerySuggestion[]> {
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
      type: 'autocomplete' as const
    }));
}

function generateRelatedSuggestions(query: string, results: any[]): QuerySuggestion[] {
  // Extract keywords from search results
  const keywords = new Set<string>();
  results.forEach(result => {
    if (result.metadata?.keywords) {
      result.metadata.keywords.forEach((kw: string) => keywords.add(kw));
    }
  });
  
  return Array.from(keywords)
    .slice(0, 5)
    .map(keyword => ({
      suggestion: `${query} ${keyword}`,
      confidence: 0.6,
      type: 'related' as const
    }));
}

async function getPopularQueries(userId?: string): Promise<QuerySuggestion[]> {
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
    type: 'popular' as const
  }));
}

async function getTrendingQueries(): Promise<QuerySuggestion[]> {
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
    type: 'trending' as const
  }));
}

async function buildUserDashboard(userId: string): Promise<UserDashboard> {
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

async function getUserStats(userId: string): Promise<any> {
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

async function getUserAnalytics(userId: string): Promise<any> {
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

async function getUserPreferences(userId: string): Promise<any> {
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

async function getAnalyticsData(timeRange: string, userId?: string, eventType?: string): Promise<any> {
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

async function storeAnalytics(data: AnalyticsData): Promise<void> {
  const db = admin.firestore();
  
  try {
    await db.collection('analytics').add({
      ...data,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error storing analytics:', error);
  }
}

async function createVisualization(results: SearchResult[], type: string): Promise<any> {
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

function createWordCloud(results: SearchResult[]): any {
  const words: { [key: string]: number } = {};
  
  results.forEach(result => {
    const text = result.text.toLowerCase();
    const wordList = text.split(/\s+/).filter((word: string) => word.length > 3);
    
    wordList.forEach((word: string) => {
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

function createTimeline(results: SearchResult[]): any {
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

function createNetworkGraph(results: SearchResult[]): any {
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

function createDefaultVisualization(results: SearchResult[]): any {
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
async function getDocumentMetadata(documentId: string): Promise<any> {
  const db = admin.firestore();
  try {
    const doc = await db.collection('documents').doc(documentId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error getting document metadata:', error);
    return null;
  }
}

async function getDocumentChunks(documentId: string): Promise<any[]> {
  const db = admin.firestore();
  try {
    const chunks = await db.collection('documents').doc(documentId).collection('chunks').get();
    return chunks.docs.map((doc: any) => doc.data());
  } catch (error) {
    console.error('Error getting document chunks:', error);
    return [];
  }
}

async function findRelatedDocuments(documentId: string): Promise<string[]> {
  // Mock implementation - in production, this would use similarity search
  return ['doc2', 'doc3', 'doc4'];
}

function generateHighlights(content: string, query: string): any[] {
  const highlights: any[] = [];
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

function calculateSimilarity(doc1: SearchResult, doc2: SearchResult): number {
  // Simple similarity calculation based on shared keywords
  const keywords1 = new Set(doc1.metadata.keywords || []);
  const keywords2 = new Set(doc2.metadata.keywords || []);
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
}

function getTopAuthors(results: SearchResult[]): string[] {
  const authorCounts: { [key: string]: number } = {};
  
  results.forEach(result => {
    authorCounts[result.author] = (authorCounts[result.author] || 0) + 1;
  });
  
  return Object.entries(authorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([author]) => author);
}

function getDateRange(results: SearchResult[]): { start: string; end: string } {
  const dates = results.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
  
  return {
    start: dates[0]?.toISOString() || new Date().toISOString(),
    end: dates[dates.length - 1]?.toISOString() || new Date().toISOString()
  };
}

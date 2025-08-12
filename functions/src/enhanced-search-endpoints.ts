import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { vectorSearchEngine, SearchQuery, SearchResult } from './vector-search-engine';
// import { documentProcessor } from './advanced-document-processor';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  query: string;
  searchType: 'vector' | 'keyword' | 'hybrid';
}

export interface EmbeddingResponse {
  success: boolean;
  documentId: string;
  embeddingsGenerated: number;
  processingTime: number;
}

/**
 * Enhanced search endpoint with vector search capabilities
 */
export const searchDocuments = functions.https.onRequest(async (req: any, res: any) => {
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
      const searchQuery: SearchQuery = {
        query: query.trim(),
        limit: parseInt(limit),
        threshold: threshold ? parseFloat(threshold) : undefined,
        filters
      };

      let results: SearchResult[] = [];

      // Perform search based on type
      switch (searchType) {
        case 'vector':
          results = await vectorSearchEngine.searchSimilar(searchQuery);
          break;

        case 'keyword':
          // Use hybrid search but only return keyword results
          const hybridResults = await vectorSearchEngine.hybridSearch(searchQuery);
          results = hybridResults.filter(r => r.score <= 0.5); // Filter for keyword-like results
          break;

        case 'hybrid':
        default:
          results = await vectorSearchEngine.hybridSearch(searchQuery);
          break;
      }

      const searchTime = Date.now() - startTime;

      const response: SearchResponse = {
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

    } catch (error) {
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
export const generateEmbeddings = functions.https.onRequest(async (req: any, res: any) => {
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
      const chunks = docData?.chunks || [];

      if (chunks.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Document has no chunks to process'
        });
        return;
      }

      // Generate embeddings for chunks
      const embeddings = await vectorSearchEngine.generateEmbeddings(chunks, documentId);

      const processingTime = Date.now() - startTime;

      // Update document status
      await db.collection('documents').doc(documentId).update({
        embeddingsGenerated: embeddings.length,
        embeddingStatus: 'completed',
        embeddingCompletedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const response: EmbeddingResponse = {
        success: true,
        documentId,
        embeddingsGenerated: embeddings.length,
        processingTime
      };

      console.log(`Generated ${embeddings.length} embeddings for document ${documentId}`);
      console.log(`Processing time: ${processingTime}ms`);

      res.status(200).json(response);

    } catch (error) {
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
export const getSearchStats = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const stats = await vectorSearchEngine.getSearchStats();

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
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
export const getSearchSuggestions = functions.https.onRequest(async (req: any, res: any) => {
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

    const suggestions: string[] = [];
    const queryLower = (query as string).toLowerCase();

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
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, parseInt(limit as string));

    res.status(200).json({
      success: true,
      suggestions: uniqueSuggestions,
      query: query
    });

  } catch (error) {
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
export const advancedSearch = functions.https.onRequest(async (req: any, res: any) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const {
        query,
        filters = {},
        sortBy = 'relevance',
        limit = 20,
        offset = 0
      } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const startTime = Date.now();

      // Build search query with filters
      const searchQuery: SearchQuery = {
        query,
        limit: parseInt(limit) + parseInt(offset),
        filters
      };

      // Perform search
      const results = await vectorSearchEngine.hybridSearch(searchQuery);

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
          sortedResults = results.sort((a, b) => 
            a.metadata.author.localeCompare(b.metadata.author)
          );
          break;
        case 'title':
          sortedResults = results.sort((a, b) => 
            a.metadata.title.localeCompare(b.metadata.title)
          );
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

    } catch (error) {
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
export const testVectorSearch = functions.https.onRequest(async (req, res) => {
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

    const searchQuery: SearchQuery = {
      query,
      limit: 5
    };

    let results: SearchResult[] = [];
    switch (searchType) {
      case 'vector':
        results = await vectorSearchEngine.searchSimilar(searchQuery);
        break;
      case 'hybrid':
      default:
        results = await vectorSearchEngine.hybridSearch(searchQuery);
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

  } catch (error) {
    console.error('Error in vector search test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

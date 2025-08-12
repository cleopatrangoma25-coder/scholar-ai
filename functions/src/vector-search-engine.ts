// import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { TextChunk } from './advanced-document-processor';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  chunkId: string;
  documentId: string;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  text: string;
  score: number;
  metadata: {
    title: string;
    author: string;
    page: number;
  };
}

export interface SearchQuery {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: {
    documentIds?: string[];
    authors?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export class VectorSearchEngine {
  // private readonly embeddingModel = 'text-embedding-ada-002';
  private readonly embeddingDimensions = 1536;
  private readonly similarityThreshold = 0.7;

  /**
   * Generate embeddings for text chunks
   */
  async generateEmbeddings(chunks: TextChunk[], documentId: string): Promise<EmbeddingResult[]> {
    console.log(`Generating embeddings for ${chunks.length} chunks from document ${documentId}`);

    const results: EmbeddingResult[] = [];

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
  private async processBatch(chunks: TextChunk[], documentId: string): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

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

      } catch (error) {
        console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    return results;
  }

  /**
   * Generate embedding for a single text chunk
   */
  private async generateSingleEmbedding(text: string): Promise<number[]> {
    // For now, we'll use a mock embedding generator
    // In production, this would call OpenAI's embedding API
    return this.generateMockEmbedding(text);
  }

  /**
   * Generate mock embeddings for development/testing
   * In production, replace with OpenAI API call
   */
  private generateMockEmbedding(text: string): number[] {
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
  private simpleHash(str: string): number {
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
  private async storeEmbedding(
    chunkId: string,
    documentId: string,
    embedding: number[],
    text: string
  ): Promise<void> {
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
  async searchSimilar(query: SearchQuery): Promise<SearchResult[]> {
    console.log(`Searching for: "${query.query}"`);

    // Generate embedding for the query
    const queryEmbedding = await this.generateSingleEmbedding(query.query);
    
    // Get all embeddings from Firestore
    const embeddings = await this.getAllEmbeddings(query.filters);
    
    // Calculate similarities
    const similarities = embeddings.map(embedding => ({
      ...embedding,
      score: this.calculateCosineSimilarity(queryEmbedding, embedding.embedding)
    }));

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
  private async getAllEmbeddings(filters?: SearchQuery['filters']): Promise<any[]> {
    let query = db.collection('embeddings');

    if (filters?.documentIds) {
      query = query.where('documentId', 'in', filters.documentIds) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
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
  private async enrichResults(results: any[]): Promise<SearchResult[]> {
    const enrichedResults: SearchResult[] = [];

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
            title: docData?.title || 'Unknown Title',
            author: docData?.author || 'Unknown Author',
            page: this.estimatePageFromChunk(result.text, docData?.text || '')
          }
        });

      } catch (error) {
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
  private estimatePageFromChunk(chunkText: string, fullText: string): number {
    if (!fullText) return 1;
    
    const chunkIndex = fullText.indexOf(chunkText);
    if (chunkIndex === -1) return 1;
    
    // Rough estimate: 2500 characters per page
    return Math.ceil(chunkIndex / 2500) + 1;
  }

  /**
   * Hybrid search combining vector and keyword search
   */
  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
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
  private async keywordSearch(query: SearchQuery): Promise<SearchResult[]> {
    const keywords = query.query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    let searchQuery = db.collection('embeddings');
    
    // Simple keyword matching in text content
    const results: any[] = [];
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
        results.push({
          ...data,
          score: score / keywords.length // Normalize score
        });
      }
    }
    
    return this.enrichResults(results);
  }

  /**
   * Combine vector and keyword search results
   */
  private combineSearchResults(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[]
  ): SearchResult[] {
    const combined = new Map<string, SearchResult>();
    
    // Add vector results with weight 0.7
    for (const result of vectorResults) {
      combined.set(result.chunkId, {
        ...result,
        score: result.score * 0.7
      });
    }
    
    // Add keyword results with weight 0.3
    for (const result of keywordResults) {
      const existing = combined.get(result.chunkId);
      if (existing) {
        existing.score += result.score * 0.3;
      } else {
        combined.set(result.chunkId, {
          ...result,
          score: result.score * 0.3
        });
      }
    }
    
    return Array.from(combined.values());
  }

  /**
   * Remove duplicate results
   */
  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get search statistics
   */
  async getSearchStats(): Promise<any> {
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

// Export the search engine instance
export const vectorSearchEngine = new VectorSearchEngine();

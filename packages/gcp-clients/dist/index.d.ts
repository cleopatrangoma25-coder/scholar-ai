import { RagQueryInput, RagResponse } from '@scholar-ai/shared';

declare class VertexAIClient {
    private client;
    private projectId;
    private location;
    private endpoint;
    constructor(projectId: string, location?: string);
    /**
     * Query the RAG engine with a natural language question
     */
    queryRAG(input: RagQueryInput): Promise<RagResponse>;
    /**
     * Generate text embeddings using Vertex AI
     */
    private generateEmbedding;
    /**
     * Search Vertex AI Vector Search for relevant documents
     */
    private searchVectorStore;
    /**
     * Prepare context from search results
     */
    private prepareContext;
    /**
     * Generate answer using Gemini model
     */
    private generateAnswer;
    /**
     * Format search results as sources
     */
    private formatSources;
    /**
     * Ingest document chunks into Vertex AI Search
     */
    ingestDocument(dataStoreId: string, chunks: Array<{
        content: string;
        metadata: Record<string, any>;
    }>): Promise<void>;
    /**
     * Upload documents to Vertex AI Search
     * This is a placeholder for the actual Vertex AI Search API integration
     */
    private uploadToVectorSearch;
    /**
     * Get data stores to query based on scope
     */
    private getDataStoresForScope;
}

declare class WorkflowsClient {
    private client;
    private projectId;
    private location;
    constructor(projectId: string, location?: string);
    /**
     * Trigger a document processing workflow
     */
    triggerDocumentProcessing(workflowId: string, input: {
        paperId: string;
        storagePath: string;
        userId: string;
    }): Promise<string>;
    /**
     * Get the status of a workflow execution
     */
    getExecutionStatus(executionName: string): Promise<{
        state: string;
        result?: any;
        error?: any;
    }>;
}

export { VertexAIClient, WorkflowsClient };

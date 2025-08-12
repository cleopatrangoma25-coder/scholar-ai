"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  VertexAIClient: () => VertexAIClient,
  WorkflowsClient: () => WorkflowsClient
});
module.exports = __toCommonJS(index_exports);

// src/vertex-ai.ts
var import_aiplatform = require("@google-cloud/aiplatform");
var VertexAIClient = class {
  constructor(projectId, location = "us-central1") {
    this.client = new import_aiplatform.PredictionServiceClient();
    this.projectId = projectId;
    this.location = location;
    this.endpoint = `projects/${projectId}/locations/${location}`;
  }
  /**
   * Query the RAG engine with a natural language question
   */
  async queryRAG(input) {
    try {
      console.log(`Querying RAG engine with: "${input.query}" (scope: ${input.scope})`);
      const queryEmbedding = await this.generateEmbedding(input.query);
      const dataStores = this.getDataStoresForScope(input.scope);
      const searchResults = await this.searchVectorStore(queryEmbedding, dataStores);
      const context = this.prepareContext(searchResults);
      const answer = await this.generateAnswer(input.query, context, searchResults);
      const sources = this.formatSources(searchResults);
      return {
        answer,
        sources
      };
    } catch (error) {
      console.error("Error querying RAG engine:", error);
      throw new Error("Failed to query RAG engine");
    }
  }
  /**
   * Generate text embeddings using Vertex AI
   */
  async generateEmbedding(text) {
    try {
      const model = "text-embedding-gecko@003";
      const endpoint = `${this.endpoint}/publishers/google/models/${model}`;
      const request = {
        endpoint,
        instances: [
          {
            structValue: {
              fields: {
                content: {
                  stringValue: text
                }
              }
            }
          }
        ]
      };
      const [response] = await this.client.predict(request);
      const prediction = response.predictions?.[0];
      if (!prediction || !prediction.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values) {
        throw new Error("Failed to generate embedding");
      }
      const embeddingValues = prediction.structValue.fields.embeddings.structValue.fields.values.listValue.values;
      return embeddingValues.map((value) => value.numberValue || 0);
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate text embedding");
    }
  }
  /**
   * Search Vertex AI Vector Search for relevant documents
   */
  async searchVectorStore(queryEmbedding, dataStoreIds) {
    try {
      console.log(`Searching ${dataStoreIds.length} data stores with query embedding`);
      const mockResults = [
        {
          id: "doc-001",
          content: "This research paper discusses the latest developments in machine learning algorithms and their applications in various domains. The study presents novel approaches to neural network optimization and demonstrates significant improvements in model performance across multiple benchmarks.",
          metadata: {
            paperId: "paper-001",
            title: "Recent Advances in Machine Learning",
            authors: ["Dr. Jane Smith", "Prof. John Doe"],
            pageNumber: 1,
            score: 0.95,
            dataStoreId: dataStoreIds[0]
          }
        },
        {
          id: "doc-002",
          content: "The study presents a comprehensive analysis of neural network architectures and their performance characteristics. Results show that transformer-based models outperform traditional approaches in natural language processing tasks.",
          metadata: {
            paperId: "paper-002",
            title: "Neural Network Analysis",
            authors: ["Dr. Michael Johnson"],
            pageNumber: 3,
            score: 0.87,
            dataStoreId: dataStoreIds[0]
          }
        }
      ];
      return mockResults.filter(
        (result) => dataStoreIds.includes(result.metadata.dataStoreId)
      );
    } catch (error) {
      console.error("Error searching vector store:", error);
      throw new Error("Failed to search vector store");
    }
  }
  /**
   * Prepare context from search results
   */
  prepareContext(searchResults) {
    if (searchResults.length === 0) {
      return "No relevant documents found in the knowledge base.";
    }
    return searchResults.map((result, index) => {
      const metadata = result.metadata;
      return `[${index + 1}] ${result.content}
Source: ${metadata.title} by ${metadata.authors.join(", ")} (Page ${metadata.pageNumber})`;
    }).join("\n\n");
  }
  /**
   * Generate answer using Gemini model
   */
  async generateAnswer(query, context, searchResults) {
    try {
      const model = "gemini-1.5-flash-001";
      const endpoint = `${this.endpoint}/publishers/google/models/${model}`;
      const prompt = `You are a research assistant helping with academic queries. 
      
Based on the following context from research papers, please answer the user's question. 
Provide a comprehensive, well-structured response that synthesizes information from the sources.

User Question: ${query}

Context from research papers:
${context}

Instructions:
- Answer the question based on the provided context
- Cite the sources using [1], [2], etc. format
- If the context doesn't contain enough information to answer the question, say so
- Provide a clear, academic-style response
- Include key findings and insights from the sources
- Be concise but thorough

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
              topK: { numberValue: 40 }
            }
          }
        }
      };
      const [response] = await this.client.predict(request);
      const prediction = response.predictions?.[0];
      if (!prediction || !prediction.structValue?.fields?.content?.structValue?.fields?.parts?.listValue?.values?.[0]?.structValue?.fields?.text?.stringValue) {
        throw new Error("Failed to generate answer");
      }
      const answer = prediction.structValue.fields.content.structValue.fields.parts.listValue.values[0].structValue.fields.text.stringValue;
      return answer;
    } catch (error) {
      console.error("Error generating answer:", error);
      throw new Error("Failed to generate answer");
    }
  }
  /**
   * Format search results as sources
   */
  formatSources(searchResults) {
    return searchResults.map((result) => ({
      paperId: result.metadata.paperId,
      title: result.metadata.title,
      authors: result.metadata.authors,
      pageNumber: result.metadata.pageNumber,
      content: result.content,
      score: result.metadata.score
    }));
  }
  /**
   * Ingest document chunks into Vertex AI Search
   */
  async ingestDocument(dataStoreId, chunks) {
    try {
      console.log(`Ingesting ${chunks.length} chunks into data store: ${dataStoreId}`);
      const embeddings = await Promise.all(
        chunks.map((chunk) => this.generateEmbedding(chunk.content))
      );
      const documents = chunks.map((chunk, index) => ({
        id: `${dataStoreId}-${Date.now()}-${index}`,
        content: chunk.content,
        embedding: embeddings[index],
        metadata: {
          ...chunk.metadata,
          dataStoreId,
          ingestedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      }));
      await this.uploadToVectorSearch(dataStoreId, documents);
      console.log(`Successfully ingested ${chunks.length} chunks into ${dataStoreId}`);
    } catch (error) {
      console.error("Error ingesting document:", error);
      throw new Error("Failed to ingest document");
    }
  }
  /**
   * Upload documents to Vertex AI Search
   * This is a placeholder for the actual Vertex AI Search API integration
   */
  async uploadToVectorSearch(dataStoreId, documents) {
    console.log(`Uploading ${documents.length} documents to Vertex AI Search data store: ${dataStoreId}`);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    console.log(`Successfully uploaded documents to ${dataStoreId}`);
  }
  /**
   * Get data stores to query based on scope
   */
  getDataStoresForScope(scope) {
    switch (scope) {
      case "private":
        return ["user-private-datastore"];
      case "public":
        return ["public-research-datastore"];
      case "all":
        return ["user-private-datastore", "public-research-datastore"];
      default:
        return ["user-private-datastore"];
    }
  }
};

// src/workflows.ts
var import_workflows = require("@google-cloud/workflows");
var WorkflowsClient = class {
  constructor(projectId, location = "us-central1") {
    this.client = new import_workflows.ExecutionsClient();
    this.projectId = projectId;
    this.location = location;
  }
  /**
   * Trigger a document processing workflow
   */
  async triggerDocumentProcessing(workflowId, input) {
    try {
      const parent = this.client.workflowPath(this.projectId, this.location, workflowId);
      const [execution] = await this.client.createExecution({
        parent,
        execution: {
          argument: JSON.stringify(input)
        }
      });
      console.log(`Created execution: ${execution.name}`);
      return execution.name || "";
    } catch (error) {
      console.error("Error triggering workflow:", error);
      throw new Error("Failed to trigger document processing workflow");
    }
  }
  /**
   * Get the status of a workflow execution
   */
  async getExecutionStatus(executionName) {
    try {
      const [execution] = await this.client.getExecution({
        name: executionName
      });
      return {
        state: String(execution.state || "UNKNOWN"),
        result: execution.result ? JSON.parse(execution.result) : void 0,
        error: execution.error ? JSON.stringify(execution.error) : void 0
      };
    } catch (error) {
      console.error("Error getting execution status:", error);
      throw new Error("Failed to get execution status");
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VertexAIClient,
  WorkflowsClient
});
//# sourceMappingURL=index.js.map
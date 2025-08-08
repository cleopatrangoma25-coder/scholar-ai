"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragRouter = void 0;
const context_1 = require("../context");
const shared_1 = require("@scholar-ai/shared");
const gcp_clients_1 = require("@scholar-ai/gcp-clients");
// Initialize Vertex AI client
const vertexAIClient = new gcp_clients_1.VertexAIClient(process.env.GOOGLE_CLOUD_PROJECT || "your-project-id", process.env.GOOGLE_CLOUD_LOCATION || "us-central1");
exports.ragRouter = (0, context_1.router)({
    /**
     * Query the RAG engine with a natural language question
     */
    query: context_1.protectedProcedure
        .input(shared_1.ragQuerySchema)
        .mutation(async ({ input, ctx }) => {
        try {
            const { query, scope } = input;
            const userId = ctx.user.uid;
            console.log(`RAG query from user ${userId}: "${query}" with scope: ${scope}`);
            // Call the RAG engine
            const response = await vertexAIClient.queryRAG({
                query,
                scope,
            });
            return response;
        }
        catch (error) {
            console.error("Error querying RAG engine:", error);
            throw new Error("Failed to query RAG engine");
        }
    }),
});

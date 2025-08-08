"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragRouter = void 0;
const context_1 = require("../context");
const shared_1 = require("@scholar-ai/shared");
const gcp_clients_1 = require("@scholar-ai/gcp-clients");
const firestore_1 = require("firebase-admin/firestore");
exports.ragRouter = (0, context_1.router)({
    /**
     * Query the RAG system with a natural language question
     */
    query: context_1.protectedProcedure
        .input(shared_1.ragQuerySchema)
        .mutation(async ({ input, ctx }) => {
        try {
            const { query, scope } = input;
            const userId = ctx.user.uid;
            console.log("RAG Query:", { query, scope, userId });
            // Initialize Vertex AI client
            const vertexAI = new gcp_clients_1.VertexAIClient(process.env.GOOGLE_CLOUD_PROJECT || "scholar-ai-1-prod", "us-central1");
            // Query the RAG engine
            const response = await vertexAI.queryRAG({
                query,
                scope,
            });
            // Store conversation history in Firestore
            const db = (0, firestore_1.getFirestore)();
            const conversationRef = db.collection("conversations").doc();
            await conversationRef.set({
                conversationId: conversationRef.id,
                userId,
                query,
                scope,
                answer: response.answer,
                sources: response.sources,
                timestamp: new Date(),
            });
            return {
                answer: response.answer,
                sources: response.sources,
                query,
                scope,
                maxResults: 5,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error("Error in RAG query:", error);
            throw new Error("Failed to process RAG query");
        }
    }),
    /**
     * Get conversation history for a user
     */
    getConversationHistory: context_1.protectedProcedure
        .query(async ({ ctx }) => {
        try {
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            const conversationsRef = db.collection("conversations")
                .where("userId", "==", userId)
                .orderBy("timestamp", "desc")
                .limit(20);
            const snapshot = await conversationsRef.get();
            const conversations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            }));
            return conversations;
        }
        catch (error) {
            console.error("Error getting conversation history:", error);
            throw new Error("Failed to get conversation history");
        }
    }),
});

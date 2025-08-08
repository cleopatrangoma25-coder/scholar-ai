import { router, protectedProcedure } from "../context";
import { ragQuerySchema } from "@scholar-ai/shared";
import { ModernRAGEngine } from "../rag-engine";
import { getFirestore } from "firebase-admin/firestore";

const ragEngine = new ModernRAGEngine();

export const ragRouter = router({
  /**
   * Query the RAG system with a natural language question using modern Genkit approach
   */
  query: protectedProcedure
    .input(ragQuerySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { query, scope } = input;
        const userId = ctx.user!.uid;

        console.log("Modern RAG Query:", { query, scope, userId });

        // Query the modern RAG engine
        const response = await ragEngine.queryRAG({
          query,
          scope,
          userId,
        });

        // Store conversation history in Firestore
        const db = getFirestore();
        const conversationRef = db.collection("conversations").doc();
        
        await conversationRef.set({
          conversationId: conversationRef.id,
          userId,
          query,
          scope,
          answer: response.answer,
          sources: response.sources,
          timestamp: new Date(),
          engine: "modern-genkit", // Track which engine was used
        });

        return {
          answer: response.answer,
          sources: response.sources,
          query,
          scope,
          maxResults: 5,
          timestamp: response.timestamp,
          engine: "modern-genkit",
        };
      } catch (error) {
        console.error("Error in modern RAG query:", error);
        throw new Error("Failed to process RAG query");
      }
    }),

  /**
   * Get conversation history for a user
   */
  getConversationHistory: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        
        const db = getFirestore();
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
      } catch (error) {
        console.error("Error getting conversation history:", error);
        throw new Error("Failed to get conversation history");
      }
    }),

  /**
   * Create RAG corpus for document ingestion
   */
  createCorpus: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const userId = ctx.user!.uid;
        console.log("Creating RAG corpus for user:", userId);

        const corpus = await ragEngine.createRAGCorpus("scholar-ai-private-pdfs");
        
        return {
          success: true,
          corpus,
          message: "RAG corpus created successfully",
        };
      } catch (error) {
        console.error("Error creating RAG corpus:", error);
        throw new Error("Failed to create RAG corpus");
      }
    }),

  /**
   * Ingest files into RAG corpus
   */
  ingestFiles: protectedProcedure
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user!.uid;
        const { gcsUri, corpusName = "scholar-ai-private-pdfs" } = input as any;

        console.log("Ingesting files for user:", userId, "from:", gcsUri);

        const result = await ragEngine.ingestFiles(corpusName, gcsUri);
        
        return {
          success: true,
          result,
          message: "Files ingested successfully",
        };
      } catch (error) {
        console.error("Error ingesting files:", error);
        throw new Error("Failed to ingest files");
      }
    }),
}); 
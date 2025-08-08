"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperRouter = void 0;
const context_1 = require("../context");
const shared_1 = require("@scholar-ai/shared");
const storage_1 = require("firebase-admin/storage");
const firestore_1 = require("firebase-admin/firestore");
const shared_2 = require("@scholar-ai/shared");
const zod_1 = require("zod");
exports.paperRouter = (0, context_1.router)({
    /**
     * Get a presigned URL for uploading a PDF to Firebase Storage
     */
    getUploadUrl: context_1.protectedProcedure
        .input(shared_1.getUploadUrlSchema)
        .mutation(async ({ input, ctx }) => {
        try {
            const { fileName, contentType } = input;
            const userId = ctx.user.uid;
            const paperId = (0, shared_2.generatePaperId)();
            // Create storage reference
            const storage = (0, storage_1.getStorage)();
            const bucket = storage.bucket(process.env.UPLOADS_BUCKET || "scholar-ai-1-prod-uploads");
            const file = bucket.file(`papers/${userId}/${paperId}/${fileName}`);
            // Generate presigned URL
            const [url] = await file.getSignedUrl({
                action: "write",
                expires: Date.now() + 15 * 60 * 1000, // 15 minutes
                contentType,
            });
            // Create paper document in Firestore
            const db = (0, firestore_1.getFirestore)();
            const paperRef = db.collection("papers").doc(paperId);
            await paperRef.set({
                paperId,
                ownerUid: userId,
                title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
                authors: [],
                storagePath: `papers/${userId}/${paperId}/${fileName}`,
                status: "processing",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return {
                uploadUrl: url,
                paperId,
            };
        }
        catch (error) {
            console.error("Error generating upload URL:", error);
            throw new Error("Failed to generate upload URL");
        }
    }),
    /**
     * Get a paper by ID
     */
    getById: context_1.protectedProcedure
        .input(shared_1.paperSchema.shape.paperId)
        .query(async ({ input, ctx }) => {
        try {
            const paperId = input;
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            const paperRef = db.collection("papers").doc(paperId);
            const paperDoc = await paperRef.get();
            if (!paperDoc.exists) {
                throw new Error("Paper not found");
            }
            const paperData = paperDoc.data();
            // Check if user owns this paper
            if (paperData?.ownerUid !== userId) {
                throw new Error("Unauthorized access to paper");
            }
            return {
                ...paperData,
                createdAt: paperData?.createdAt?.toDate(),
                updatedAt: paperData?.updatedAt?.toDate(),
            };
        }
        catch (error) {
            console.error("Error getting paper:", error);
            throw new Error("Failed to get paper");
        }
    }),
    /**
     * Get all papers for a user with optional filtering
     */
    getUserPapers: context_1.protectedProcedure
        .input(zod_1.z.object({
        status: zod_1.z.enum(["all", "processing", "completed", "error"]).optional(),
        search: zod_1.z.string().optional(),
        limit: zod_1.z.number().min(1).max(100).optional().default(20),
        offset: zod_1.z.number().min(0).optional().default(0),
    }))
        .query(async ({ input, ctx }) => {
        try {
            const userId = ctx.user.uid;
            const { status, search, limit, offset } = input;
            const db = (0, firestore_1.getFirestore)();
            let query = db.collection("papers").where("ownerUid", "==", userId);
            // Filter by status if specified
            if (status && status !== "all") {
                query = query.where("status", "==", status);
            }
            // Order by creation date (newest first)
            query = query.orderBy("createdAt", "desc");
            // Apply pagination
            query = query.limit(limit).offset(offset);
            const snapshot = await query.get();
            let papers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    paperId: doc.id,
                    title: data.title || "Untitled",
                    authors: data.authors || [],
                    status: data.status || "unknown",
                    extractedTextLength: data.extractedTextLength || 0,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                };
            });
            // Apply search filter if specified
            if (search) {
                const searchLower = search.toLowerCase();
                papers = papers.filter(paper => paper.title?.toLowerCase().includes(searchLower) ||
                    paper.authors?.some((author) => author.toLowerCase().includes(searchLower)));
            }
            return papers;
        }
        catch (error) {
            console.error("Error getting user papers:", error);
            throw new Error("Failed to get user papers");
        }
    }),
    /**
     * Get paper details with enhanced metadata
     */
    getPaperDetails: context_1.protectedProcedure
        .input(shared_1.paperSchema.shape.paperId)
        .query(async ({ input, ctx }) => {
        try {
            const paperId = input;
            const userId = ctx.user.uid;
            const db = (0, firestore_1.getFirestore)();
            const paperRef = db.collection("papers").doc(paperId);
            const paperDoc = await paperRef.get();
            if (!paperDoc.exists) {
                throw new Error("Paper not found");
            }
            const paperData = paperDoc.data();
            // Check if user owns this paper
            if (paperData?.ownerUid !== userId) {
                throw new Error("Unauthorized access to paper");
            }
            // Get related papers by same authors
            const relatedPapers = await getRelatedPapers(paperData.authors || [], paperId, userId);
            return {
                ...paperData,
                createdAt: paperData?.createdAt?.toDate(),
                updatedAt: paperData?.updatedAt?.toDate(),
                relatedPapers,
                metadata: {
                    wordCount: paperData?.extractedTextLength || 0,
                    chunkCount: paperData?.textChunks || 0,
                    processingTime: paperData?.processingTime || 0,
                },
            };
        }
        catch (error) {
            console.error("Error getting paper details:", error);
            throw new Error("Failed to get paper details");
        }
    }),
});
/**
 * Get related papers by authors (private helper function)
 */
async function getRelatedPapers(authors, excludePaperId, userId) {
    if (!authors.length)
        return [];
    const db = (0, firestore_1.getFirestore)();
    const relatedPapers = [];
    for (const author of authors.slice(0, 3)) { // Limit to first 3 authors
        const query = db.collection("papers")
            .where("ownerUid", "==", userId)
            .where("authors", "array-contains", author)
            .where("paperId", "!=", excludePaperId)
            .limit(5);
        const snapshot = await query.get();
        const papers = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                paperId: doc.id,
                title: data.title || "Untitled",
                authors: data.authors || [],
                status: data.status || "unknown",
                createdAt: data.createdAt?.toDate(),
            };
        });
        relatedPapers.push(...papers);
    }
    // Remove duplicates and limit results
    const uniquePapers = relatedPapers.filter((paper, index, self) => index === self.findIndex(p => p.paperId === paper.paperId));
    return uniquePapers.slice(0, 10);
}

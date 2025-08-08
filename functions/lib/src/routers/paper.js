"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paperRouter = void 0;
const context_1 = require("../context");
const shared_1 = require("@scholar-ai/shared");
const storage_1 = require("firebase-admin/storage");
const firestore_1 = require("firebase-admin/firestore");
const shared_2 = require("@scholar-ai/shared");
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
            const bucket = storage.bucket();
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
});

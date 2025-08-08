"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFileUploaded = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const gcp_clients_1 = require("@scholar-ai/gcp-clients");
const workflowsClient = new gcp_clients_1.WorkflowsClient("staging", "us-central1");
exports.onFileUploaded = (0, storage_1.onObjectFinalized)({
    bucket: process.env.FIREBASE_STORAGE_BUCKET,
    region: "us-central1",
}, async (event) => {
    try {
        const { name, bucket } = event.data;
        // Only process files in the papers directory
        if (!name.startsWith("papers/")) {
            console.log("Skipping non-paper file:", name);
            return;
        }
        // Extract paper ID from path: papers/{userId}/{paperId}/{fileName}
        const pathParts = name.split("/");
        if (pathParts.length < 4) {
            console.log("Invalid paper path:", name);
            return;
        }
        const [, userId, paperId, fileName] = pathParts;
        console.log("Processing uploaded paper:", {
            fileName,
            paperId,
            userId,
            bucket,
            path: name,
        });
        // Trigger the document processing workflow
        const execution = await workflowsClient.triggerDocumentProcessing("document-processing", {
            fileName,
            filePath: name,
            paperId,
            userId,
            bucket,
        });
        console.log("Workflow triggered:", execution);
    }
    catch (error) {
        console.error("Error processing uploaded file:", error);
        throw error;
    }
});

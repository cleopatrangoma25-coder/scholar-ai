"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUploadedPDF = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const firestore_1 = require("firebase-admin/firestore");
const storage_2 = require("firebase-admin/storage");
const gcp_clients_1 = require("@scholar-ai/gcp-clients");
// @ts-ignore
const pdf_js_extract_1 = require("pdf.js-extract");
const pdfExtract = new pdf_js_extract_1.PDFExtract();
const options = {}; // see https://mozilla.github.io/pdf.js/
/**
 * Cloud Function that triggers when a PDF is uploaded to Firebase Storage
 * This function processes the PDF and ingests it into the knowledge base
 */
exports.processUploadedPDF = (0, storage_1.onObjectFinalized)({
    bucket: "scholar-ai-1-prod.appspot.com", // Update with your bucket name
    region: "us-central1",
}, async (event) => {
    try {
        const filePath = event.data.name;
        const contentType = event.data.contentType;
        console.log(`Processing uploaded file: ${filePath}`);
        console.log(`Content type: ${contentType}`);
        // Only process PDF files
        if (contentType !== "application/pdf") {
            console.log(`Skipping non-PDF file: ${contentType}`);
            return;
        }
        // Extract paper ID from path: papers/{userId}/{paperId}/{fileName}
        const pathParts = filePath.split("/");
        if (pathParts.length < 4 || pathParts[0] !== "papers") {
            console.log(`Invalid file path structure: ${filePath}`);
            return;
        }
        const userId = pathParts[1];
        const paperId = pathParts[2];
        const fileName = pathParts[3];
        console.log(`Processing paper: ${paperId} for user: ${userId}`);
        // Update paper status to processing
        const db = (0, firestore_1.getFirestore)();
        const paperRef = db.collection("papers").doc(paperId);
        await paperRef.update({
            status: "processing",
            updatedAt: new Date(),
        });
        // Download the PDF from Storage
        const storage = (0, storage_2.getStorage)();
        const bucket = storage.bucket();
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();
        // Extract text from PDF
        const data = await pdfExtract.extractBuffer(fileBuffer, options);
        const extractedText = data.pages.map((page) => page.content).join("\n");
        console.log(`Extracted ${extractedText.length} characters from PDF`);
        // Chunk the text into smaller pieces for better retrieval
        const chunks = chunkText(extractedText, 1000, 200); // 1000 chars per chunk, 200 char overlap
        console.log(`Created ${chunks.length} text chunks`);
        // Prepare chunks for ingestion
        const ingestionChunks = chunks.map((chunk, index) => ({
            content: chunk,
            metadata: {
                paperId,
                userId,
                fileName,
                chunkIndex: index,
                totalChunks: chunks.length,
                source: "user_upload",
                timestamp: new Date().toISOString(),
            },
        }));
        // Ingest into Vertex AI Search
        const vertexAI = new gcp_clients_1.VertexAIClient(process.env.GOOGLE_CLOUD_PROJECT || "scholar-ai-1-prod", "us-central1");
        // Use user's private data store
        const dataStoreId = `user-${userId}-private`;
        await vertexAI.ingestDocument(dataStoreId, ingestionChunks);
        // Update paper status to completed
        await paperRef.update({
            status: "completed",
            textChunks: chunks.length,
            extractedTextLength: extractedText.length,
            updatedAt: new Date(),
        });
        console.log(`Successfully processed paper: ${paperId}`);
    }
    catch (error) {
        console.error("Error processing uploaded PDF:", error);
        // Update paper status to error if we have the paper ID
        try {
            const pathParts = event.data.name.split("/");
            if (pathParts.length >= 3) {
                const paperId = pathParts[2];
                const db = (0, firestore_1.getFirestore)();
                const paperRef = db.collection("papers").doc(paperId);
                await paperRef.update({
                    status: "error",
                    errorMessage: error instanceof Error ? error.message : "Unknown error",
                    updatedAt: new Date(),
                });
            }
        }
        catch (updateError) {
            console.error("Error updating paper status:", updateError);
        }
    }
});
/**
 * Split text into overlapping chunks for better retrieval
 */
function chunkText(text, chunkSize, overlap) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        // Try to break at sentence boundaries
        const lastPeriod = chunk.lastIndexOf(".");
        const lastNewline = chunk.lastIndexOf("\n");
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > chunkSize * 0.7) { // If we found a good break point
            chunks.push(chunk.slice(0, breakPoint + 1).trim());
            start = start + breakPoint + 1 - overlap;
        }
        else {
            chunks.push(chunk.trim());
            start = end - overlap;
        }
    }
    return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}

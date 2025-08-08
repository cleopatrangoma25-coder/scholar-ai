import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { VertexAIClient } from "@scholar-ai/gcp-clients";
import { config } from "../config";
// @ts-ignore
import { PDFExtract } from "pdf.js-extract";

const pdfExtract = new PDFExtract();
const options = {}; // see https://mozilla.github.io/pdf.js/

/**
 * Cloud Function that triggers when a PDF is uploaded to Firebase Storage
 * This function processes the PDF and ingests it into the knowledge base
 */
export const processUploadedPDF = onObjectFinalized(
  {
    bucket: config.uploadsBucket, // Use dedicated uploads bucket
    region: config.location,
  },
  async (event) => {
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
      const db = getFirestore();
      const paperRef = db.collection("papers").doc(paperId);
      await paperRef.update({
        status: "processing",
        updatedAt: new Date(),
      });

      // Download the PDF from Storage
      const storage = getStorage();
      const bucket = storage.bucket(config.uploadsBucket);
      const file = bucket.file(filePath);
      const [fileBuffer] = await file.download();

      // Extract text from PDF
      const data = await pdfExtract.extractBuffer(fileBuffer, options);
      const extractedText = data.pages.map((page: any) => page.content).join("\n");

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
      const vertexAI = new VertexAIClient(
        config.projectId,
        config.location
      );

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

    } catch (error) {
      console.error("Error processing uploaded PDF:", error);
      
      // Update paper status to error if we have the paper ID
      try {
        const pathParts = event.data.name.split("/");
        if (pathParts.length >= 3) {
          const paperId = pathParts[2];
          const db = getFirestore();
          const paperRef = db.collection("papers").doc(paperId);
          await paperRef.update({
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          });
        }
      } catch (updateError) {
        console.error("Error updating paper status:", updateError);
      }
    }
  }
);

/**
 * Split text into overlapping chunks for better retrieval
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
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
    } else {
      chunks.push(chunk.trim());
      start = end - overlap;
    }
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
} 
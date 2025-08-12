import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { documentProcessor, DocumentContent } from './advanced-document-processor';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

export interface UploadResponse {
  success: boolean;
  documentId: string;
  metadata: any;
  processingTime: number;
  chunks: number;
  tables: number;
  figures: number;
  citations: number;
}

export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  documentId?: string;
}

/**
 * Enhanced document upload endpoint for Phase 2
 * Supports multiple file formats with advanced processing
 */
export const uploadDocument = functions.https.onRequest(async (req: any, res: any) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      console.log('Starting enhanced document upload...');

      // Validate request
      if (!req.body || !req.body.file || !req.body.fileName) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: file and fileName'
        });
        return;
      }

      const { file, fileName, mimeType, userId } = req.body;
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(file, 'base64');
      
      console.log(`Processing document: ${fileName} (${fileBuffer.length} bytes)`);

      const startTime = Date.now();

      // Process document with advanced processor
      const documentContent: DocumentContent = await documentProcessor.processDocument(
        fileBuffer,
        fileName,
        mimeType || 'application/octet-stream'
      );

      const processingTime = Date.now() - startTime;

      // Store document in Firestore
      const documentId = await storeDocumentInDatabase(documentContent, fileName, userId);

      // Store file in Cloud Storage
      await storeFileInStorage(fileBuffer, fileName, documentId);

      // Generate embeddings for chunks (will be implemented in next phase)
      // await generateEmbeddings(documentContent.chunks);

      const response: UploadResponse = {
        success: true,
        documentId,
        metadata: documentContent.metadata,
        processingTime,
        chunks: documentContent.chunks.length,
        tables: documentContent.tables.length,
        figures: documentContent.figures.length,
        citations: documentContent.citations.length
      };

      console.log(`Document processed successfully: ${documentId}`);
      console.log(`Processing time: ${processingTime}ms`);
      console.log(`Chunks: ${documentContent.chunks.length}`);
      console.log(`Tables: ${documentContent.tables.length}`);
      console.log(`Figures: ${documentContent.figures.length}`);
      console.log(`Citations: ${documentContent.citations.length}`);

      res.status(200).json(response);

    } catch (error) {
      console.error('Error processing document:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

/**
 * Store processed document in Firestore
 */
async function storeDocumentInDatabase(
  documentContent: DocumentContent,
  fileName: string,
  userId?: string
): Promise<string> {
  const documentData = {
    fileName,
    title: documentContent.metadata.title,
    author: documentContent.metadata.author,
    date: documentContent.metadata.date,
    pageCount: documentContent.metadata.pageCount,
    fileSize: documentContent.metadata.fileSize,
    mimeType: documentContent.metadata.mimeType,
    language: documentContent.metadata.language,
    keywords: documentContent.metadata.keywords,
    text: documentContent.text,
    tables: documentContent.tables,
    figures: documentContent.figures,
    citations: documentContent.citations,
    chunks: documentContent.chunks,
    userId: userId || 'anonymous',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'processed'
  };

  const docRef = await db.collection('documents').add(documentData);
  return docRef.id;
}

/**
 * Store file in Cloud Storage
 */
async function storeFileInStorage(
  fileBuffer: Buffer,
  fileName: string,
  documentId: string
): Promise<void> {
  const bucket = storage.bucket();
  const file = bucket.file(`documents/${documentId}/${fileName}`);
  
  await file.save(fileBuffer, {
    metadata: {
      contentType: 'application/octet-stream',
      metadata: {
        documentId,
        uploadedAt: new Date().toISOString()
      }
    }
  });
}

/**
 * Get document processing status
 */
export const getDocumentStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { documentId } = req.query;

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
      return;
    }

    const doc = await db.collection('documents').doc(documentId as string).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    const data = doc.data();
    const status: ProcessingStatus = {
      status: data?.status || 'processing',
      progress: data?.progress || 0,
      message: data?.message || 'Document is being processed',
      documentId: doc.id
    };

    res.status(200).json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting document status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get document metadata
 */
export const getDocumentMetadata = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { documentId } = req.query;

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: 'Document ID is required'
      });
      return;
    }

    const doc = await db.collection('documents').doc(documentId as string).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    const data = doc.data();
    
    res.status(200).json({
      success: true,
      metadata: {
        id: doc.id,
        fileName: data?.fileName,
        title: data?.title,
        author: data?.author,
        date: data?.date,
        pageCount: data?.pageCount,
        fileSize: data?.fileSize,
        mimeType: data?.mimeType,
        language: data?.language,
        keywords: data?.keywords,
        uploadedAt: data?.uploadedAt,
        processedAt: data?.processedAt,
        status: data?.status,
        chunks: data?.chunks?.length || 0,
        tables: data?.tables?.length || 0,
        figures: data?.figures?.length || 0,
        citations: data?.citations?.length || 0
      }
    });

  } catch (error) {
    console.error('Error getting document metadata:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * List user documents
 */
export const listUserDocuments = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const query = db.collection('documents')
      .where('userId', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const snapshot = await query.get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      fileName: doc.data().fileName,
      title: doc.data().title,
      author: doc.data().author,
      date: doc.data().date,
      pageCount: doc.data().pageCount,
      fileSize: doc.data().fileSize,
      status: doc.data().status,
      uploadedAt: doc.data().uploadedAt,
      processedAt: doc.data().processedAt
    }));

    res.status(200).json({
      success: true,
      documents,
      total: documents.length
    });

  } catch (error) {
    console.error('Error listing user documents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserDocuments = exports.getDocumentMetadata = exports.getDocumentStatus = exports.uploadDocument = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const advanced_document_processor_1 = require("./advanced-document-processor");
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();
/**
 * Enhanced document upload endpoint for Phase 2
 * Supports multiple file formats with advanced processing
 */
exports.uploadDocument = functions.https.onRequest(async (req, res) => {
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
        const documentContent = await advanced_document_processor_1.documentProcessor.processDocument(fileBuffer, fileName, mimeType || 'application/octet-stream');
        const processingTime = Date.now() - startTime;
        // Store document in Firestore
        const documentId = await storeDocumentInDatabase(documentContent, fileName, userId);
        // Store file in Cloud Storage
        await storeFileInStorage(fileBuffer, fileName, documentId);
        // Generate embeddings for chunks (will be implemented in next phase)
        // await generateEmbeddings(documentContent.chunks);
        const response = {
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
    }
    catch (error) {
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
async function storeDocumentInDatabase(documentContent, fileName, userId) {
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
async function storeFileInStorage(fileBuffer, fileName, documentId) {
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
exports.getDocumentStatus = functions.https.onRequest(async (req, res) => {
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
        const doc = await db.collection('documents').doc(documentId).get();
        if (!doc.exists) {
            res.status(404).json({
                success: false,
                error: 'Document not found'
            });
            return;
        }
        const data = doc.data();
        const status = {
            status: (data === null || data === void 0 ? void 0 : data.status) || 'processing',
            progress: (data === null || data === void 0 ? void 0 : data.progress) || 0,
            message: (data === null || data === void 0 ? void 0 : data.message) || 'Document is being processed',
            documentId: doc.id
        };
        res.status(200).json({
            success: true,
            status
        });
    }
    catch (error) {
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
exports.getDocumentMetadata = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
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
        const doc = await db.collection('documents').doc(documentId).get();
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
                fileName: data === null || data === void 0 ? void 0 : data.fileName,
                title: data === null || data === void 0 ? void 0 : data.title,
                author: data === null || data === void 0 ? void 0 : data.author,
                date: data === null || data === void 0 ? void 0 : data.date,
                pageCount: data === null || data === void 0 ? void 0 : data.pageCount,
                fileSize: data === null || data === void 0 ? void 0 : data.fileSize,
                mimeType: data === null || data === void 0 ? void 0 : data.mimeType,
                language: data === null || data === void 0 ? void 0 : data.language,
                keywords: data === null || data === void 0 ? void 0 : data.keywords,
                uploadedAt: data === null || data === void 0 ? void 0 : data.uploadedAt,
                processedAt: data === null || data === void 0 ? void 0 : data.processedAt,
                status: data === null || data === void 0 ? void 0 : data.status,
                chunks: ((_a = data === null || data === void 0 ? void 0 : data.chunks) === null || _a === void 0 ? void 0 : _a.length) || 0,
                tables: ((_b = data === null || data === void 0 ? void 0 : data.tables) === null || _b === void 0 ? void 0 : _b.length) || 0,
                figures: ((_c = data === null || data === void 0 ? void 0 : data.figures) === null || _c === void 0 ? void 0 : _c.length) || 0,
                citations: ((_d = data === null || data === void 0 ? void 0 : data.citations) === null || _d === void 0 ? void 0 : _d.length) || 0
            }
        });
    }
    catch (error) {
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
exports.listUserDocuments = functions.https.onRequest(async (req, res) => {
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
            .limit(parseInt(limit))
            .offset(parseInt(offset));
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
    }
    catch (error) {
        console.error('Error listing user documents:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=enhanced-document-upload.js.map
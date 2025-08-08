"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
// Configuration for Scholar AI Cloud Functions
exports.config = {
    // Project configuration
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'scholar-ai-1-prod',
    location: 'us-central1',
    // Storage buckets
    uploadsBucket: process.env.UPLOADS_BUCKET || 'scholar-ai-1-prod-uploads',
    documentsBucket: process.env.DOCUMENTS_BUCKET || 'scholar-ai-documents',
    // RAG configuration
    ragCorpusName: process.env.RAG_CORPUS_NAME || 'Scholar-AI',
    // CORS configuration
    cors: {
        origin: 'https://scholar-ai-1-prod.web.app',
        methods: ['GET', 'POST', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization'],
        maxAge: 86400
    },
    // Function configuration
    function: {
        memory: '512MiB',
        timeoutSeconds: 60,
        region: 'us-central1'
    }
};
// Validate configuration
function validateConfig() {
    const required = ['projectId', 'uploadsBucket', 'documentsBucket'];
    for (const key of required) {
        if (!exports.config[key]) {
            throw new Error(`Missing required configuration: ${key}`);
        }
    }
    console.log('Configuration validated successfully:', {
        projectId: exports.config.projectId,
        uploadsBucket: exports.config.uploadsBucket,
        documentsBucket: exports.config.documentsBucket,
        ragCorpusName: exports.config.ragCorpusName
    });
}
//# sourceMappingURL=config.js.map
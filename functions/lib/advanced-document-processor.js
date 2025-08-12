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
exports.documentProcessor = exports.AdvancedDocumentProcessor = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
// Mock PDF and DOCX processing for now
const mockPdfParse = async (buffer) => ({ text: buffer.toString() });
const mockMammoth = { extractRawText: async (buffer) => ({ value: buffer.toString() }) };
class AdvancedDocumentProcessor {
    constructor() {
        this.chunkSize = 1000;
    }
    /**
     * Process a document file and extract comprehensive content
     */
    async processDocument(fileBuffer, fileName, mimeType) {
        console.log(`Processing document: ${fileName} (${mimeType})`);
        let text = '';
        let metadata;
        // Process based on file type
        switch (mimeType) {
            case 'application/pdf':
                const pdfResult = await this.extractTextFromPDF(fileBuffer);
                text = pdfResult.text;
                metadata = pdfResult.metadata;
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                const docxResult = await this.extractTextFromDOCX(fileBuffer);
                text = docxResult.text;
                metadata = docxResult.metadata;
                break;
            case 'text/plain':
                const txtResult = await this.extractTextFromTXT(fileBuffer);
                text = txtResult.text;
                metadata = txtResult.metadata;
                break;
            case 'text/markdown':
                const mdResult = await this.extractTextFromMD(fileBuffer);
                text = mdResult.text;
                metadata = mdResult.metadata;
                break;
            default:
                throw new Error(`Unsupported file type: ${mimeType}`);
        }
        // Extract additional content
        const tables = await this.extractTables(text);
        const figures = await this.extractFigures(text);
        const citations = await this.extractCitations(text);
        const chunks = this.createTextChunks(text);
        return {
            text,
            metadata,
            tables,
            figures,
            citations,
            chunks
        };
    }
    /**
     * Extract text from PDF with advanced parsing
     */
    async extractTextFromPDF(fileBuffer) {
        try {
            const data = await mockPdfParse(fileBuffer);
            // Extract metadata
            const metadata = {
                title: this.extractTitle(data.text),
                author: this.extractAuthor(data.text),
                date: this.extractDate(data.text),
                pageCount: this.estimatePageCount(data.text),
                fileSize: fileBuffer.length,
                mimeType: 'application/pdf',
                language: this.detectLanguage(data.text),
                keywords: this.extractKeywords(data.text)
            };
            return {
                text: data.text,
                metadata
            };
        }
        catch (error) {
            console.error('Error extracting text from PDF:', error);
            throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Extract text from DOCX files
     */
    async extractTextFromDOCX(fileBuffer) {
        try {
            const result = await mockMammoth.extractRawText(fileBuffer);
            const metadata = {
                title: this.extractTitle(result.value),
                author: 'Unknown', // DOCX doesn't always have author info
                date: new Date().toISOString(),
                pageCount: this.estimatePageCount(result.value),
                fileSize: fileBuffer.length,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                language: this.detectLanguage(result.value),
                keywords: this.extractKeywords(result.value)
            };
            return {
                text: result.value,
                metadata
            };
        }
        catch (error) {
            console.error('Error extracting text from DOCX:', error);
            throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Extract text from plain text files
     */
    async extractTextFromTXT(fileBuffer) {
        const text = fileBuffer.toString('utf-8');
        const metadata = {
            title: this.extractTitle(text),
            author: 'Unknown',
            date: new Date().toISOString(),
            pageCount: this.estimatePageCount(text),
            fileSize: fileBuffer.length,
            mimeType: 'text/plain',
            language: this.detectLanguage(text),
            keywords: this.extractKeywords(text)
        };
        return { text, metadata };
    }
    /**
     * Extract text from Markdown files
     */
    async extractTextFromMD(fileBuffer) {
        const text = fileBuffer.toString('utf-8');
        const metadata = {
            title: this.extractTitle(text),
            author: 'Unknown',
            date: new Date().toISOString(),
            pageCount: this.estimatePageCount(text),
            fileSize: fileBuffer.length,
            mimeType: 'text/markdown',
            language: this.detectLanguage(text),
            keywords: this.extractKeywords(text)
        };
        return { text, metadata };
    }
    /**
     * Extract tables from text content
     */
    async extractTables(text) {
        const tables = [];
        const tableRegex = /(\|[^\n]*\|[\s\S]*?)(?=\n\n|\n[^|]|$)/g;
        let match;
        let tableId = 0;
        while ((match = tableRegex.exec(text)) !== null) {
            const tableText = match[0];
            const rows = tableText.split('\n').filter(row => row.trim().includes('|'));
            if (rows.length > 1) {
                const tableData = rows.map(row => row.split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell.length > 0));
                tables.push({
                    id: `table_${tableId++}`,
                    content: tableData,
                    page: this.findPageNumber(text, match.index),
                    position: { x: 0, y: 0 } // Will be enhanced with OCR
                });
            }
        }
        return tables;
    }
    /**
     * Extract figures and images from text content
     */
    async extractFigures(text) {
        const figures = [];
        const figureRegex = /(?:Figure|Fig\.?)\s*(\d+)[:\s]*([^\n]+)/gi;
        let match;
        let figureId = 0;
        while ((match = figureRegex.exec(text)) !== null) {
            figures.push({
                id: `figure_${figureId++}`,
                caption: match[2].trim(),
                page: this.findPageNumber(text, match.index),
                position: { x: 0, y: 0 } // Will be enhanced with OCR
            });
        }
        return figures;
    }
    /**
     * Extract citations and references from text content
     */
    async extractCitations(text) {
        const citations = [];
        const citationRegex = /\[([^\]]+)\]/g;
        let match;
        let citationId = 0;
        while ((match = citationRegex.exec(text)) !== null) {
            citations.push({
                id: `citation_${citationId++}`,
                text: match[0],
                page: this.findPageNumber(text, match.index),
                reference: match[1]
            });
        }
        return citations;
    }
    /**
     * Create text chunks for processing
     */
    createTextChunks(text) {
        const chunks = [];
        let chunkId = 0;
        let startIndex = 0;
        while (startIndex < text.length) {
            const endIndex = Math.min(startIndex + this.chunkSize, text.length);
            let chunkText = text.substring(startIndex, endIndex);
            // Try to break at sentence boundaries
            if (endIndex < text.length) {
                const lastPeriod = chunkText.lastIndexOf('.');
                const lastNewline = chunkText.lastIndexOf('\n');
                const breakPoint = Math.max(lastPeriod, lastNewline);
                if (breakPoint > startIndex + this.chunkSize * 0.7) {
                    chunkText = text.substring(startIndex, startIndex + breakPoint + 1);
                    startIndex = startIndex + breakPoint + 1;
                }
                else {
                    startIndex = endIndex;
                }
            }
            else {
                startIndex = endIndex;
            }
            chunks.push({
                id: `chunk_${chunkId++}`,
                text: chunkText.trim(),
                page: this.findPageNumber(text, startIndex),
                startIndex: startIndex - chunkText.length,
                endIndex: startIndex
            });
        }
        return chunks;
    }
    /**
     * Extract title from document text
     */
    extractTitle(text) {
        // Look for common title patterns
        const titlePatterns = [
            /^([A-Z][^.!?]*?)(?=\n|$)/m, // First line starting with capital
            /Title[:\s]+([^\n]+)/i, // Explicit title
            /^([A-Z][A-Z\s]+)$/m // All caps line
        ];
        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match && match[1].length > 5 && match[1].length < 200) {
                return match[1].trim();
            }
        }
        return 'Untitled Document';
    }
    /**
     * Extract author from document text
     */
    extractAuthor(text) {
        const authorPatterns = [
            /Author[:\s]+([^\n]+)/i,
            /By[:\s]+([^\n]+)/i,
            /^([A-Z][a-z]+ [A-Z][a-z]+)(?=\n|$)/m
        ];
        for (const pattern of authorPatterns) {
            const match = text.match(pattern);
            if (match && match[1].length > 2 && match[1].length < 100) {
                return match[1].trim();
            }
        }
        return 'Unknown Author';
    }
    /**
     * Extract date from document text
     */
    extractDate(text) {
        const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{4})/,
            /(\d{4}-\d{2}-\d{2})/,
            /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/
        ];
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return new Date().toISOString();
    }
    /**
     * Detect language of the text
     */
    detectLanguage(text) {
        // Simple language detection based on common words
        const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        const sampleText = text.toLowerCase().substring(0, 1000);
        const englishCount = englishWords.filter(word => sampleText.includes(word)).length;
        if (englishCount > 3) {
            return 'en';
        }
        return 'unknown';
    }
    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
        const wordCount = new Map();
        words.forEach(word => {
            wordCount.set(word, (wordCount.get(word) || 0) + 1);
        });
        return Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }
    /**
     * Estimate page count based on text length
     */
    estimatePageCount(text) {
        // Rough estimate: 2500 characters per page
        return Math.ceil(text.length / 2500);
    }
    /**
     * Find page number for a given text position
     */
    findPageNumber(text, position) {
        // Rough estimate based on position
        return Math.ceil(position / 2500) + 1;
    }
}
exports.AdvancedDocumentProcessor = AdvancedDocumentProcessor;
// Export the processor instance
exports.documentProcessor = new AdvancedDocumentProcessor();
//# sourceMappingURL=advanced-document-processor.js.map
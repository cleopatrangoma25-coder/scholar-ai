import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Mock PDF and DOCX processing for now
const mockPdfParse = async (buffer: Buffer) => ({ text: buffer.toString() });
const mockMammoth = { extractRawText: async (buffer: Buffer) => ({ value: buffer.toString() }) };

export interface DocumentContent {
  text: string;
  metadata: DocumentMetadata;
  tables: TableData[];
  figures: FigureData[];
  citations: CitationData[];
  chunks: TextChunk[];
}

export interface DocumentMetadata {
  title: string;
  author: string;
  date: string;
  pageCount: number;
  fileSize: number;
  mimeType: string;
  language: string;
  keywords: string[];
}

export interface TableData {
  id: string;
  content: string[][];
  page: number;
  position: { x: number; y: number };
}

export interface FigureData {
  id: string;
  caption: string;
  page: number;
  position: { x: number; y: number };
}

export interface CitationData {
  id: string;
  text: string;
  page: number;
  reference: string;
}

export interface TextChunk {
  id: string;
  text: string;
  page: number;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
}

export class AdvancedDocumentProcessor {
  private readonly chunkSize = 1000;

  /**
   * Process a document file and extract comprehensive content
   */
  async processDocument(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<DocumentContent> {
    console.log(`Processing document: ${fileName} (${mimeType})`);

    let text = '';
    let metadata: DocumentMetadata;

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
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<{ text: string; metadata: DocumentMetadata }> {
    try {
      const data = await mockPdfParse(fileBuffer);
      
      // Extract metadata
      const metadata: DocumentMetadata = {
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
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractTextFromDOCX(fileBuffer: Buffer): Promise<{ text: string; metadata: DocumentMetadata }> {
    try {
      const result = await mockMammoth.extractRawText(fileBuffer);
      
      const metadata: DocumentMetadata = {
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
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractTextFromTXT(fileBuffer: Buffer): Promise<{ text: string; metadata: DocumentMetadata }> {
    const text = fileBuffer.toString('utf-8');
    
    const metadata: DocumentMetadata = {
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
  private async extractTextFromMD(fileBuffer: Buffer): Promise<{ text: string; metadata: DocumentMetadata }> {
    const text = fileBuffer.toString('utf-8');
    
    const metadata: DocumentMetadata = {
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
  private async extractTables(text: string): Promise<TableData[]> {
    const tables: TableData[] = [];
    const tableRegex = /(\|[^\n]*\|[\s\S]*?)(?=\n\n|\n[^|]|$)/g;
    let match;
    let tableId = 0;

    while ((match = tableRegex.exec(text)) !== null) {
      const tableText = match[0];
      const rows = tableText.split('\n').filter(row => row.trim().includes('|'));
      
      if (rows.length > 1) {
        const tableData = rows.map(row => 
          row.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell.length > 0)
        );

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
  private async extractFigures(text: string): Promise<FigureData[]> {
    const figures: FigureData[] = [];
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
  private async extractCitations(text: string): Promise<CitationData[]> {
    const citations: CitationData[] = [];
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
  private createTextChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
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
        } else {
          startIndex = endIndex;
        }
      } else {
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
  private extractTitle(text: string): string {
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
  private extractAuthor(text: string): string {
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
  private extractDate(text: string): string {
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
  private detectLanguage(text: string): string {
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
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount = new Map<string, number>();
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
  private estimatePageCount(text: string): number {
    // Rough estimate: 2500 characters per page
    return Math.ceil(text.length / 2500);
  }

  /**
   * Find page number for a given text position
   */
  private findPageNumber(text: string, position: number): number {
    // Rough estimate based on position
    return Math.ceil(position / 2500) + 1;
  }
}

// Export the processor instance
export const documentProcessor = new AdvancedDocumentProcessor();

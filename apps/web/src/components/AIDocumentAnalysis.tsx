import React, { useState } from 'react';

interface AIDocumentAnalysisProps {
  documentText?: string;
  documentTitle?: string;
}

interface StoredDocument {
  id: string;
  title: string;
  filename: string;
  status: string;
  uploadDate: string;
  size: number;
  type: string;
  tags: string[];
  summary: string;
  chunks: Array<{
    id: string;
    text: string;
    metadata: {
      page: number;
      section: string;
    };
  }>;
}



interface SummaryResult {
  summary: string;
  summaryType: string;
  processingTime: number;
  features: string[];
  aiGenerated: boolean;
}

interface CategorizationResult {
  categories: Array<{
    name: string;
    confidence: number;
    subcategories: string[];
  }>;
  confidence: number;
  processingTime: number;
  aiGenerated: boolean;
}

const AIDocumentAnalysis: React.FC<AIDocumentAnalysisProps> = ({ 
  documentText: initialDocumentText = '', 
  documentTitle: initialDocumentTitle = '' 
}) => {
  const [documentText, setDocumentText] = useState(initialDocumentText);
  const [documentTitle, setDocumentTitle] = useState(initialDocumentTitle);
  const [summaryType, setSummaryType] = useState<'comprehensive' | 'executive' | 'technical'>('comprehensive');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [categorizationResult, setCategorizationResult] = useState<CategorizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<StoredDocument | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'manual' | 'stored'>('manual');

  // Fetch documents from storage bucket
  const fetchStoredDocuments = async () => {
    setIsLoadingDocuments(true);
    setError(null);

    try {
      const response = await fetch('https://getdocumentsforanalysis-s5ngwgzmiq-uc.a.run.app', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const result = await response.json();
      setStoredDocuments(result.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Load documents when component mounts
  React.useEffect(() => {
    fetchStoredDocuments();
  }, []);

  // Handle document selection
  const handleDocumentSelect = (document: StoredDocument) => {
    setSelectedDocument(document);
    setDocumentTitle(document.title);
    // Combine all chunks into document text
    const fullText = document.chunks.map(chunk => chunk.text).join(' ');
    setDocumentText(fullText);
    setAnalysisMode('stored');
  };

  const generateSummary = async () => {
    if (!documentText.trim()) {
      setError('Please provide document text to generate a summary');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
      const response = await fetch('https://generatedocumentsummary-s5ngwgzmiq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: documentText,
          summaryType: summaryType,
          documentId: 'demo-document'
        })
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setSummaryResult(result);
    } catch (error) {
      console.error('Summary generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const categorizeDocument = async () => {
    if (!documentText.trim() && !documentTitle.trim()) {
      setError('Please provide document text or title for categorization');
      return;
    }

    setIsCategorizing(true);
    setError(null);

    try {
      const response = await fetch('https://categorizedocumentai-s5ngwgzmiq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: documentText,
          title: documentTitle,
          documentId: 'demo-document'
        })
      });

      if (!response.ok) {
        throw new Error(`Categorization failed: ${response.statusText}`);
      }

      const result = await response.json();
      setCategorizationResult(result);
    } catch (error) {
      console.error('Categorization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to categorize document');
    } finally {
      setIsCategorizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Document Analysis</h2>
      
      {/* Analysis Mode Selection */}
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setAnalysisMode('manual')}
            className={`px-4 py-2 rounded-md font-medium ${
              analysisMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📝 Manual Input
          </button>
          <button
            onClick={() => setAnalysisMode('stored')}
            className={`px-4 py-2 rounded-md font-medium ${
              analysisMode === 'stored'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📚 Stored Documents
          </button>
        </div>
      </div>

      {/* Stored Documents Section */}
      {analysisMode === 'stored' && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Select Document from Storage</h3>
          
          {isLoadingDocuments ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading documents...</p>
            </div>
          ) : storedDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentSelect(doc)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedDocument?.id === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 mb-2">{doc.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{doc.filename}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.type}</span>
                    <span>{doc.uploadDate}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {doc.chunks.length} chunks • {doc.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No documents found in storage.</p>
          )}
        </div>
      )}
      
      {/* Summary Generation Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">AI Document Summarization</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summary Type
          </label>
          <select
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="comprehensive">Comprehensive Summary</option>
            <option value="executive">Executive Summary</option>
            <option value="technical">Technical Summary</option>
          </select>
        </div>

        <button
          onClick={generateSummary}
          disabled={isGeneratingSummary || !documentText.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
        </button>

        {summaryResult && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              {summaryResult.summaryType.charAt(0).toUpperCase() + summaryResult.summaryType.slice(1)} Summary
            </h4>
            <p className="text-blue-700 mb-3">{summaryResult.summary}</p>
            <div className="text-sm text-blue-600">
              <p>Processing time: {summaryResult.processingTime}s</p>
              <p>AI Generated: {summaryResult.aiGenerated ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-3">
              <h5 className="font-medium text-blue-800 mb-2">Features:</h5>
              <ul className="list-disc list-inside text-sm text-blue-700">
                {summaryResult.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Document Categorization Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Smart Document Categorization</h3>
        
        <button
          onClick={categorizeDocument}
          disabled={isCategorizing || (!documentText.trim() && !documentTitle.trim())}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCategorizing ? 'Categorizing...' : 'Categorize Document'}
        </button>

        {categorizationResult && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Document Categories</h4>
            <div className="space-y-3">
              {categorizationResult.categories.map((category, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-3">
                  <h5 className="font-medium text-green-800">{category.name}</h5>
                  <p className="text-sm text-green-600">Confidence: {(category.confidence * 100).toFixed(1)}%</p>
                  <div className="mt-1">
                    <span className="text-xs text-green-600">Subcategories: </span>
                    <span className="text-xs text-green-700">{category.subcategories.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-green-600">
              <p>Overall Confidence: {(categorizationResult.confidence * 100).toFixed(1)}%</p>
              <p>Processing time: {categorizationResult.processingTime}s</p>
              <p>AI Generated: {categorizationResult.aiGenerated ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Document Input Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">
          {analysisMode === 'stored' && selectedDocument 
            ? `Selected Document: ${selectedDocument.title}`
            : 'Document Input'
          }
        </h4>
        
        {analysisMode === 'stored' && selectedDocument && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>File:</strong> {selectedDocument.filename} • 
              <strong>Type:</strong> {selectedDocument.type} • 
              <strong>Upload Date:</strong> {selectedDocument.uploadDate}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Tags:</strong> {selectedDocument.tags.join(', ')}
            </p>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Text
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Enter document text for analysis..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDocumentAnalysis;

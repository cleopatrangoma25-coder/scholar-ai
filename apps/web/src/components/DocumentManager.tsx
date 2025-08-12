import React, { useState } from 'react';

interface Document {
  id: string;
  title: string;
  filename: string;
  type: string;
  size: number;
  uploadDate: string;
  lastModified: string;
  status: 'processed' | 'processing' | 'error';
  pageCount: number;
  tags: string[];
  summary: string;
}

const DocumentManager: React.FC = () => {
  // const { user } = useAuth(); // Will be used for user-specific features
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Machine Learning in Healthcare',
      filename: 'ml_healthcare.pdf',
      type: 'PDF',
      size: 2048576,
      uploadDate: '2024-01-15',
      lastModified: '2024-01-15',
      status: 'processed',
      pageCount: 24,
      tags: ['machine learning', 'healthcare', 'AI'],
      summary: 'Research paper exploring ML applications in medical diagnostics and patient care.'
    },
    {
      id: '2',
      title: 'Natural Language Processing Advances',
      filename: 'nlp_advances.pdf',
      type: 'PDF',
      size: 1536000,
      uploadDate: '2024-02-20',
      lastModified: '2024-02-20',
      status: 'processed',
      pageCount: 18,
      tags: ['NLP', 'language processing', 'AI'],
      summary: 'Recent developments in natural language understanding and generation.'
    },
    {
      id: '3',
      title: 'Vector Search Optimization',
      filename: 'vector_search.pdf',
      type: 'PDF',
      size: 3072000,
      uploadDate: '2024-03-10',
      lastModified: '2024-03-10',
      status: 'processing',
      pageCount: 32,
      tags: ['vector search', 'optimization', 'algorithms'],
      summary: 'Techniques for optimizing vector search in large document collections.'
    }
  ]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return '✅';
      case 'processing': return '⚙️';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const deleteSelectedDocuments = () => {
    setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
    setSelectedDocuments([]);
  };

  const downloadDocument = (doc: Document) => {
    // Simulate download
    console.log(`Downloading ${doc.filename}`);
  };

  const viewDocument = (doc: Document) => {
    // Simulate document viewer
    console.log(`Opening ${doc.filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Manager</h2>
          <p className="text-gray-600">Manage your uploaded research papers and documents</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            📤 Upload New
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ☰
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          
          {selectedDocuments.length > 0 && (
            <button
              onClick={deleteSelectedDocuments}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              🗑️ Delete ({selectedDocuments.length})
            </button>
          )}
        </div>
      </div>

      {/* Document Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>

      {/* Documents Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                selectedDocuments.includes(doc.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => toggleDocumentSelection(doc.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">📄</div>
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleDocumentSelection(doc.id);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {doc.title}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <span>📁 {doc.filename}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📏 {doc.pageCount} pages</span>
                  <span>💾 {formatFileSize(doc.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅 {doc.uploadDate}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {getStatusIcon(doc.status)} {doc.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {doc.summary}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {doc.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    +{doc.tags.length - 3} more
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewDocument(doc);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  👁️ View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(doc);
                  }}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents List View */}
      {viewMode === 'list' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments(filteredDocuments.map(doc => doc.id));
                      } else {
                        setSelectedDocuments([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedDocuments.includes(doc.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleDocumentSelection(doc.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleDocumentSelection(doc.id);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">📄</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {doc.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.filename}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)} {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(doc.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewDocument(doc);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDocument(doc);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        ⬇️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search terms or filters.'
              : 'Upload your first research document to get started.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;

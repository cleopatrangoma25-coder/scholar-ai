import React, { useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  text: string;
  score: number;
  source: string;
  date: string;
  highlights: string[];
}

const AdvancedSearch: React.FC = () => {
  // const { user } = useAuth(); // Will be used for user-specific features
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'hybrid'>('semantic');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    documentType: 'all',
    minScore: 0.5
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Mock search results for demonstration
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Machine Learning in Healthcare',
      text: 'This research paper explores the application of machine learning algorithms in healthcare diagnostics...',
      score: 0.95,
      source: 'research_paper.pdf',
      date: '2024-01-15',
      highlights: ['machine learning', 'healthcare', 'diagnostics']
    },
    {
      id: '2',
      title: 'Natural Language Processing Advances',
      text: 'Recent developments in natural language processing have shown significant improvements in understanding context...',
      score: 0.87,
      source: 'nlp_study.pdf',
      date: '2024-02-20',
      highlights: ['natural language processing', 'context', 'understanding']
    },
    {
      id: '3',
      title: 'Vector Search Optimization',
      text: 'Optimization techniques for vector search algorithms in large-scale document collections...',
      score: 0.82,
      source: 'vector_search.pdf',
      date: '2024-03-10',
      highlights: ['vector search', 'optimization', 'large-scale']
    }
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    
    try {
      // Call your real RAG engine backend
      const response = await fetch(`https://enhancedsearch-s5ngwgzmiq-uc.a.run.app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          searchType: searchType,
          filters: filters,
          userId: 'demo-user' // Will be replaced with real user ID
        })
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const searchResults = await response.json();
      setResults(searchResults.results || []);
      
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback to mock results for now
      const filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.text.toLowerCase().includes(query.toLowerCase()) ||
        result.highlights.some(highlight => 
          highlight.toLowerCase().includes(query.toLowerCase())
        )
      );
      
      setResults(filteredResults);
      
      // Show error message
      alert(`Search error: ${error instanceof Error ? error.message : 'Unknown error'}. Using demo results.`);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Relevance';
    if (score >= 0.6) return 'Medium Relevance';
    return 'Low Relevance';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Document Search</h2>
        <p className="text-gray-600">
          Find relevant research papers using semantic search and AI-powered analysis
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-4xl mx-auto">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your research question or search terms..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Search Options */}
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Search Type:</span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semantic">Semantic Search</option>
              <option value="keyword">Keyword Search</option>
              <option value="hybrid">Hybrid Search</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showFilters ? 'Hide' : 'Show'} Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="max-w-4xl mx-auto bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="last_year">Last Year</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_month">Last Month</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Relevance Score
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{filters.minScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Search Results ({results.length})
            </h3>
            <span className="text-sm text-gray-500">
              Showing results for "{query}"
            </span>
          </div>
          
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">
                  {result.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                    {getScoreLabel(result.score)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Score: {result.score.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3">{result.text}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>📄 {result.source}</span>
                  <span>📅 {result.date}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span>Highlights:</span>
                  {result.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {results.length === 0 && query && !searching && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find more relevant documents.
          </p>
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="max-w-4xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <strong>Semantic Search:</strong> Ask questions in natural language
              <br />
              <em>Example: "How does machine learning improve healthcare diagnostics?"</em>
            </div>
            <div>
              <strong>Keyword Search:</strong> Use specific terms and phrases
              <br />
              <em>Example: "neural networks, deep learning, AI"</em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;

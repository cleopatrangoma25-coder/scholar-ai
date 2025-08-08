import React, { useState } from 'react';

interface QueryInterfaceProps {
  onQueryComplete?: (result: any) => void;
}

export function QueryInterface({ onQueryComplete }: QueryInterfaceProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'private' | 'public' | 'all'>('private');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    try {
      setIsQuerying(true);
      setQueryError(null);
      
      const apiUrl = 'https://rag-s5ngwgzmiq-uc.a.run.app/api/rag/query';
      console.log('🔧 Making request to:', apiUrl);
      
      const requestBody = {
        query: query.trim(),
        scope,
        userId: 'default-user'
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });

      console.log('➡️ Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      onQueryComplete?.(data);
      setQueryResult(data);
      setQueryError(null);
      setQuery('');

    } catch (error) {
      console.error('❌ Query error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setQueryError('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error instanceof Error) {
        setQueryError(`Failed to get response: ${error.message}`);
      } else {
        setQueryError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ask Questions About Your Papers
        </h3>
        
        {queryError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              ❌ <strong>Error:</strong> {queryError}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-2">
              Search Scope
            </label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'private' | 'public' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="private">Private Papers Only</option>
              <option value="public">Public Corpus Only</option>
              <option value="all">All Papers</option>
            </select>
          </div>

          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              Your Question
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your research papers..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isQuerying}
            />
          </div>

          <button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isQuerying ? 'Searching...' : 'Ask Question'}
          </button>
        </form>

        {queryResult && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Answer</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-wrap">
                {queryResult.answer}
              </p>
              
              {queryResult.sources && queryResult.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Sources</h5>
                  <ul className="space-y-1">
                    {queryResult.sources.map((source: any, index: number) => (
                      <li key={index} className="text-sm text-gray-600">
                        {source.title} - {source.authors.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
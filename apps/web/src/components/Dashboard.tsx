import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { FileUpload } from '@/components/upload/FileUpload';
import { QueryInterface } from '@/components/query/QueryInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Show loading spinner while authentication is loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // Mock data for now - will be replaced with tRPC queries after deployment
  const mockPapers = [
    { paperId: '1', title: 'Sample Research Paper 1', authors: ['John Doe', 'Jane Smith'], status: 'completed', createdAt: new Date().toISOString(), extractedTextLength: 5000 },
    { paperId: '2', title: 'Sample Research Paper 2', authors: ['Alice Johnson'], status: 'processing', createdAt: new Date().toISOString(), extractedTextLength: 3000 },
  ];
  const mockAuthors = [
    { name: 'John Doe', paperCount: 2, papers: ['Sample Research Paper 1', 'Sample Research Paper 3'] },
    { name: 'Jane Smith', paperCount: 1, papers: ['Sample Research Paper 1'] },
    { name: 'Alice Johnson', paperCount: 1, papers: ['Sample Research Paper 2'] },
  ];
  const mockTopics = [
    { topic: 'Machine Learning', frequency: 5, paperCount: 3, papers: ['Paper 1', 'Paper 2', 'Paper 3'] },
    { topic: 'Data Science', frequency: 3, paperCount: 2, papers: ['Paper 1', 'Paper 4'] },
    { topic: 'Artificial Intelligence', frequency: 2, paperCount: 1, papers: ['Paper 2'] },
  ];
  const mockConversations = [
    { id: '1', query: 'What are the main findings?', scope: 'all papers', timestamp: new Date().toISOString(), answer: 'The main findings include...', sources: [{ title: 'Sample Paper', authors: ['John Doe'] }] },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUploadSuccess = (paperId: string) => {
    console.log('Upload successful:', paperId);
    // TODO: Refetch papers after upload when tRPC is working
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const handleQueryComplete = (result: any) => {
    console.log('Query completed:', result);
    // TODO: Refetch conversation history when tRPC is working
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'papers', name: 'Papers', icon: '📄' },
    { id: 'authors', name: 'Authors', icon: '👥' },
    { id: 'topics', name: 'Topics', icon: '🔍' },
    { id: 'chat', name: 'AI Chat', icon: '🤖' },
    { id: 'history', name: 'History', icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Scholar AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm">📄</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Papers</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {mockPapers.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm">👥</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Authors</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {mockAuthors.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm">🔍</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Trending Topics</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {mockTopics.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm">💬</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Conversations</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {mockConversations.length}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('papers')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl mr-3">📄</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Manage Papers</div>
                      <div className="text-sm text-gray-500">View and organize your research papers</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl mr-3">🤖</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Ask AI</div>
                      <div className="text-sm text-gray-500">Query your research with AI assistance</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('topics')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl mr-3">🔍</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Explore Topics</div>
                      <div className="text-sm text-gray-500">Discover trending research topics</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Paper</h3>
                <FileUpload 
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </div>
            </div>
          )}

          {/* Papers Tab */}
          {activeTab === 'papers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Research Papers</h2>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Upload New Paper
                </button>
              </div>

              {mockPapers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockPapers.map((paper: any) => (
                    <div key={paper.paperId} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{paper.title}</h3>
                      <div className="text-sm text-gray-500 mb-3">
                        {paper.authors?.join(', ') || 'Unknown authors'}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded ${
                          paper.status === 'completed' 
                            ? 'text-green-600 bg-green-100' 
                            : paper.status === 'processing'
                            ? 'text-yellow-600 bg-yellow-100'
                            : 'text-red-600 bg-red-100'
                        }`}>
                          {paper.status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(paper.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {paper.extractedTextLength && (
                        <div className="mt-3 text-sm text-gray-600">
                          {paper.extractedTextLength.toLocaleString()} words
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No papers uploaded yet.</div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Upload Your First Paper
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Authors Tab */}
          {activeTab === 'authors' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Authors</h2>
              
              {mockAuthors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockAuthors.map((author: any) => (
                    <div key={author.name} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{author.name}</h3>
                      <div className="text-sm text-gray-600 mb-3">
                        {author.paperCount} paper{author.paperCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        Papers: {author.papers.slice(0, 3).join(', ')}
                        {author.papers.length > 3 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No authors found.</div>
                </div>
              )}
            </div>
          )}

          {/* Topics Tab */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Trending Topics</h2>
              
              {mockTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockTopics.map((topic: any) => (
                    <div key={topic.topic} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{topic.topic}</h3>
                      <div className="text-sm text-gray-600 mb-3">
                        Frequency: {topic.frequency} • Papers: {topic.paperCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        Related papers: {topic.papers.slice(0, 3).join(', ')}
                        {topic.papers.length > 3 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No trending topics found.</div>
                </div>
              )}
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Research Assistant</h2>
              <QueryInterface onQueryComplete={handleQueryComplete} />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Conversation History</h2>
              
              {mockConversations.length > 0 ? (
                <div className="space-y-4">
                  {mockConversations.map((conversation: any) => (
                    <div key={conversation.id} className="bg-white shadow rounded-lg p-6">
                      <div className="mb-3">
                        <h4 className="text-md font-medium text-gray-900">Query: {conversation.query}</h4>
                        <p className="text-sm text-gray-500">
                          Scope: {conversation.scope} • {new Date(conversation.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {conversation.answer}
                        </p>
                        
                        {conversation.sources && conversation.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Sources</h5>
                            <ul className="space-y-1">
                              {conversation.sources.map((source: any, sourceIndex: number) => (
                                <li key={sourceIndex} className="text-sm text-gray-600">
                                  {source.title} - {source.authors.join(', ')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">No conversation history yet.</div>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Start a Conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
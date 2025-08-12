import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DocumentUpload from './DocumentUpload';
import AdvancedSearch from './AdvancedSearch';
import DocumentManager from './DocumentManager';
import AIDocumentAnalysis from './AIDocumentAnalysis';
import AIAssistant from './AIAssistant';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'papers', name: 'Research Papers', icon: '📚' },
    { id: 'search', name: 'Search', icon: '🔍' },
    { id: 'upload', name: 'Upload', icon: '📤' },
    { id: 'ai', name: 'AI Analysis', icon: '🤖' },
    { id: 'assistant', name: 'AI Assistant', icon: '💬' },
    { id: 'analytics', name: 'Analytics', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Scholar AI</h1>
              <span className="ml-2 text-sm text-gray-500">Research Assistant</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.email || 'User'}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Scholar AI</h2>
              <p className="text-gray-600 mb-4">
                Your intelligent research assistant powered by advanced AI and vector search technology.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Research Papers</h3>
                  <p className="text-blue-700 text-sm">Upload and analyze research documents</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900">Smart Search</h3>
                  <p className="text-green-700 text-sm">Find relevant information quickly</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900">Analytics</h3>
                  <p className="text-purple-700 text-sm">Track your research progress</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'papers' && (
            <div className="bg-white rounded-lg shadow p-6">
              <DocumentManager />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white rounded-lg shadow p-6">
              <AdvancedSearch />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow p-6">
              <DocumentUpload />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white rounded-lg shadow p-6">
              <AIDocumentAnalysis />
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="bg-white rounded-lg shadow p-6 h-96">
              <AIAssistant />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
              <p className="text-gray-600">Your research analytics and insights will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scholar AI</h1>
          <p className="text-gray-600">Research Assistant</p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

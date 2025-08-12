import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  filename: string;
  score: number;
  summary: string;
  contentChunks: any; // Changed to any to handle both string and array
  relevance: string;
  matchDetails: string[];
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI research assistant. I can help you search through your Scholar-AI corpus. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '🔍 Searching your corpus...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Try multiple functions to find one that works
      let response;
      
      // Try searchDocumentsAI first (our new intelligent search function)
      try {
        console.log('🔍 Attempting to call searchDocumentsAI function...');
        response = await fetch('https://us-central1-scholar-ai-1-prod.cloudfunctions.net/searchDocumentsAI', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: inputValue,
            searchType: 'ai'
          })
        });
        console.log('✅ searchDocumentsAI response status:', response.status);
      } catch (error) {
        console.error('❌ searchDocumentsAI failed:', error);
        // If searchDocumentsAI fails, try getDocuments
        try {
          console.log('🔍 Attempting to call getDocuments function...');
          response = await fetch('https://us-central1-scholar-ai-1-prod.cloudfunctions.net/getDocuments', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log('✅ getDocuments response status:', response.status);
        } catch (secondError) {
          console.error('❌ getDocuments failed:', secondError);
          // If both fail, try healthCheck
          try {
            console.log('🔍 Attempting to call healthCheck function...');
            response = await fetch('https://us-central1-scholar-ai-1-prod.cloudfunctions.net/healthCheck', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            console.log('✅ healthCheck response status:', response.status);
          } catch (thirdError) {
            console.error('❌ healthCheck failed:', thirdError);
            throw new Error('All functions are currently unavailable. Please check your connection or try again later.');
          }
        }
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));

      if (result.success) {
        let responseContent = '';
        
        // Use the new AI response if available (Gemini 2.5 Flash style)
        if (result.aiResponse && result.aiResponse.content) {
          responseContent = result.aiResponse.content;
        } else if (result.results && result.results.length > 0) {
          // Fallback to traditional formatting if AI response not available
          const results = result.results as SearchResult[];
          responseContent = `I found ${results.length} relevant documents in your corpus:\n\n`;
          
          results.forEach((doc, index) => {
            responseContent += `**${index + 1}. ${doc.title}**\n`;
            responseContent += `📄 ${doc.filename} | 🎯 Relevance: ${doc.relevance}\n`;
            responseContent += `📝 ${doc.summary}\n`;
            
            if (doc.contentChunks) {
              responseContent += `\n**Key Content Chunks:**\n`;
              
              // Handle both array and string cases
              if (Array.isArray(doc.contentChunks)) {
                // If it's an array, take first 3 chunks
                doc.contentChunks.slice(0, 3).forEach((chunk: any) => {
                  const chunkText = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
                  responseContent += `• ${chunkText.substring(0, 150)}${chunkText.length > 150 ? '...' : ''}\n`;
                });
              } else if (typeof doc.contentChunks === 'string') {
                // If it's a string, treat it as a single chunk
                responseContent += `• ${doc.contentChunks.substring(0, 150)}${doc.contentChunks.length > 150 ? '...' : ''}\n`;
              } else {
                // Fallback for other types
                responseContent += `• ${String(doc.contentChunks).substring(0, 150)}...\n`;
              }
            }
            responseContent += '\n---\n\n';
          });
        } else {
          // No results found
          responseContent = 'I couldn\'t find any documents matching your query. Try different keywords or check if you have documents uploaded to your corpus.';
        }

        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error while searching: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or check your connection.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={index}>{line.slice(2, -2)}</strong>;
        }
        if (line.startsWith('• ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>;
        }
        if (line === '---') {
          return <hr key={index} className="my-2 border-gray-300" />;
        }
        return <span key={index}>{line}</span>;
      });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">🤖 AI Research Assistant</h2>
        <p className="text-blue-100 text-sm">Ask me anything about your research corpus</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>{message.content}</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {formatMessage(message.content)}
                </div>
              )}
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your research documents..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
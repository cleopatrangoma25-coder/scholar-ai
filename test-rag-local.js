const { ModernRAGEngine } = require('./functions/lib/rag-engine');

async function testRAG() {
  console.log('🧪 Testing RAG Engine Locally...\n');
  
  const ragEngine = new ModernRAGEngine();
  
  // Test queries
  const testQueries = [
    "What is machine learning?",
    "How do neural networks work?",
    "Explain deep learning algorithms",
    "What are the latest developments in AI?"
  ];
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    console.log('⏳ Processing...');
    
    try {
      const response = await ragEngine.queryRAG({
        query,
        scope: 'private',
        userId: 'test-user'
      });
      
      console.log('✅ Response:');
      console.log(`Answer: ${response.answer.substring(0, 200)}...`);
      console.log(`Sources: ${response.sources.length} found`);
      response.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.title} (Score: ${source.score})`);
      });
      console.log(`Timestamp: ${response.timestamp}`);
      console.log('---\n');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('---\n');
    }
  }
  
  console.log('🎉 RAG testing completed!');
}

// Run the test
testRAG().catch(console.error); 
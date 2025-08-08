const { ModernRAGEngine } = require('./functions/lib/rag-engine');

async function setupRAGCorpus() {
  console.log('🔧 Setting up RAG Corpus Integration...\n');
  
  const ragEngine = new ModernRAGEngine();
  
  // Get your actual corpus name from environment or prompt
  const corpusName = process.env.RAG_CORPUS_NAME || 'scholar-ai-private-pdfs';
  
  console.log(`📋 Current Configuration:`);
  console.log(`   Project ID: ${ragEngine.projectId || 'scholar-ai-1-prod'}`);
  console.log(`   Location: us-central1`);
  console.log(`   Corpus Name: ${corpusName}`);
  console.log(`   Endpoint: projects/${ragEngine.projectId || 'scholar-ai-1-prod'}/locations/us-central1`);
  console.log('');
  
  console.log('🧪 Testing RAG Corpus Integration...');
  
  // Test queries to verify integration
  const testQueries = [
    "What is machine learning?",
    "How do neural networks work?",
    "Explain deep learning algorithms"
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing Query: "${query}"`);
    
    try {
      const response = await ragEngine.queryRAG({
        query,
        scope: 'private',
        userId: 'test-user'
      });
      
      console.log(`✅ Response received:`);
      console.log(`   Answer: ${response.answer.substring(0, 150)}...`);
      console.log(`   Sources: ${response.sources.length} found`);
      console.log(`   Engine: ${response.engine || 'modern-rag'}`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Set the RAG_CORPUS_NAME environment variable to your actual corpus name');
  console.log('2. Deploy the functions once Google Cloud service is restored');
  console.log('3. Test the API endpoints with your actual RAG corpus');
  console.log('');
  console.log('💡 To set environment variables for Firebase Functions:');
  console.log('   firebase functions:config:set rag.corpus_name="YOUR_CORPUS_NAME"');
  console.log('');
  console.log('🎉 RAG Corpus setup completed!');
}

// Run the setup
setupRAGCorpus().catch(console.error); 
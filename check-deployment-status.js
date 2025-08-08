const https = require('https');

const API_BASE_URL = 'https://us-central1-scholar-ai-1-prod.cloudfunctions.net/api';

async function checkDeploymentStatus() {
  console.log('🔍 Checking Deployment Status...\n');

  // Check if functions are responding
  console.log('1️⃣ Checking Function Health...');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(`${API_BASE_URL}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (error) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
      req.end();
    });

    if (response.status === 200) {
      console.log('✅ Functions are responding!');
      console.log(`   Status: ${response.data.status || 'operational'}`);
      console.log(`   Message: ${response.data.message || 'API is running'}`);
      console.log('\n🎉 Your Scholar AI is fully operational!');
      console.log('   Frontend: https://scholar-ai-1-prod.web.app');
      console.log('   API: https://us-central1-scholar-ai-1-prod.cloudfunctions.net/api');
      return true;
    } else {
      console.log(`⚠️  Functions responding but with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Functions not responding: ${error.message}`);
    console.log('\n⏳ Google Cloud Runtime Config service may still be experiencing issues.');
    console.log('   Please wait a few minutes and try again.');
    return false;
  }
}

async function monitorDeployment() {
  console.log('📊 Deployment Status Monitor');
  console.log('============================\n');

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts}...`);
    
    const isWorking = await checkDeploymentStatus();
    
    if (isWorking) {
      console.log('\n🎯 Deployment is successful! You can now:');
      console.log('1. Visit your app: https://scholar-ai-1-prod.web.app');
      console.log('2. Test RAG queries with your corpus');
      console.log('3. Use the API endpoints');
      break;
    }
    
    if (attempts < maxAttempts) {
      console.log('\n⏳ Waiting 30 seconds before next attempt...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  if (attempts >= maxAttempts) {
    console.log('\n⚠️  Functions are still not responding after multiple attempts.');
    console.log('   This may indicate ongoing Google Cloud service issues.');
    console.log('   Please try again later or contact support.');
  }
}

// Run the monitoring
monitorDeployment().catch(console.error); 
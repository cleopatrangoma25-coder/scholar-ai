const { Storage } = require('@google-cloud/storage');

async function checkBucket() {
  const storage = new Storage();
  const bucketName = 'scholar-ai-documents';
  
  try {
    console.log(`Checking bucket: ${bucketName}`);
    
    // Check if bucket exists
    const [exists] = await storage.bucket(bucketName).exists();
    console.log(`Bucket exists: ${exists}`);
    
    if (exists) {
      // List files in bucket
      const [files] = await storage.bucket(bucketName).getFiles();
      console.log(`\nFound ${files.length} files in bucket:`);
      
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
      });
      
      if (files.length === 0) {
        console.log('\n⚠️  Bucket is empty! This is why the RAG system is using fallback responses.');
        console.log('To fix this, upload some documents to the bucket.');
      }
    } else {
      console.log('\n❌ Bucket does not exist! This is why the RAG system is using fallback responses.');
      console.log('You need to create the bucket first.');
    }
    
  } catch (error) {
    console.error('Error checking bucket:', error.message);
    console.log('\nThis might be a permissions issue. Check that:');
    console.log('1. The service account has access to the bucket');
    console.log('2. The bucket name is correct');
    console.log('3. The project ID is correct');
  }
}

checkBucket(); 
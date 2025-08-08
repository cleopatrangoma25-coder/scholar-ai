// Simple test to check bucket access
console.log('Testing bucket access for scholar-ai-documents...');

// Check if we can access the bucket
const bucketName = 'scholar-ai-documents';
const projectId = 'scholar-ai-1-prod';

console.log(`Bucket: ${bucketName}`);
console.log(`Project: ${projectId}`);
console.log(`Service Account: 717822405917-compute@developer.gserviceaccount.com`);

console.log('\nTo fix this, you need to grant these specific permissions:');
console.log('1. Go to Google Cloud Console IAM: https://console.cloud.google.com/iam-admin/iam?project=scholar-ai-1-prod');
console.log('2. Find the service account: 717822405917-compute@developer.gserviceaccount.com');
console.log('3. Add these roles:');
console.log('   - Storage Object Viewer (roles/storage.objectViewer)');
console.log('   - Storage Object Admin (roles/storage.objectAdmin)');
console.log('   - Storage Admin (roles/storage.admin) - for bucket access');
console.log('\nOR grant bucket-specific permissions:');
console.log('1. Go to Storage Browser: https://console.cloud.google.com/storage/browser');
console.log('2. Find the bucket: scholar-ai-documents');
console.log('3. Click on Permissions tab');
console.log('4. Add the service account with Storage Object Viewer role');

console.log('\nAlternative: Check if bucket is in a different project');
console.log('The bucket might be in a different project than scholar-ai-1-prod'); 
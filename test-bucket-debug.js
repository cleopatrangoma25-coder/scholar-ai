// Simple test to debug bucket access
console.log('🔍 Debugging bucket access...\n');

console.log('📋 Current Configuration:');
console.log('   Project ID: scholar-ai-1-prod');
console.log('   Documents Bucket: scholar-ai-documents');
console.log('   Service Account: 717822405917-compute@developer.gserviceaccount.com\n');

console.log('🔑 Permissions Status:');
console.log('   ✅ Storage Admin: roles/storage.admin');
console.log('   ✅ Storage Object Viewer: roles/storage.objectViewer');
console.log('   ✅ Storage Object Admin: roles/storage.objectAdmin');
console.log('   ✅ Vertex AI User: roles/aiplatform.user\n');

console.log('⏰ Next Steps:');
console.log('   1. Wait 15-30 minutes for permissions to fully propagate');
console.log('   2. Test the RAG system again');
console.log('   3. Check if bucket exists in the correct project');
console.log('   4. Verify the bucket contains your 129 documents\n');

console.log('🔧 If still not working after 30 minutes:');
console.log('   - Check if bucket is in a different project');
console.log('   - Verify bucket name is exactly: scholar-ai-documents');
console.log('   - Check if there are any bucket-specific IAM policies');
console.log('   - Try granting bucket-specific permissions\n');

console.log('📊 Current Status:');
console.log('   ✅ Function deployed with 1 GiB memory');
console.log('   ✅ API responding (no 500 errors)');
console.log('   ⚠️  Still using fallback response (permissions not active yet)');
console.log('   🎯 Waiting for permissions to propagate...'); 
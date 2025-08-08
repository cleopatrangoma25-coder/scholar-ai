# Deploy Scholar AI Cloud Functions with Environment Variables
# This script sets up the environment variables and deploys the functions

Write-Host "🚀 Deploying Scholar AI Cloud Functions..." -ForegroundColor Green

# Set environment variables for the functions
Write-Host "📝 Setting environment variables..." -ForegroundColor Yellow

# Set Firebase Functions configuration
firebase functions:config:set storage.uploads_bucket="scholar-ai-1-prod-uploads" --project scholar-ai-1-prod
firebase functions:config:set storage.documents_bucket="scholar-ai-1-prod-documents" --project scholar-ai-1-prod
firebase functions:config:set rag.corpus_name="scholar-ai-private-pdfs" --project scholar-ai-1-prod

# Build the functions
Write-Host "🔨 Building functions..." -ForegroundColor Yellow
cd functions
npm run build
cd ..

# Deploy only the functions
Write-Host "🚀 Deploying functions..." -ForegroundColor Yellow
firebase deploy --only functions --project scholar-ai-1-prod

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "🌐 API URL: https://us-central1-scholar-ai-1-prod.cloudfunctions.net/api" -ForegroundColor Cyan
Write-Host "🔍 Check logs: https://console.firebase.google.com/project/scholar-ai-1-prod/functions/logs" -ForegroundColor Cyan 
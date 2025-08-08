# Fix permissions for Scholar AI Cloud Functions
# This script grants the necessary permissions to the Cloud Function service account

$PROJECT_ID = "scholar-ai-1-prod"
$SERVICE_ACCOUNT = "717822405917-compute@developer.gserviceaccount.com"
$BUCKET_NAME = "scholar-ai-documents"

Write-Host "🔧 Fixing permissions for Scholar AI Cloud Functions..." -ForegroundColor Green
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Service Account: $SERVICE_ACCOUNT" -ForegroundColor Yellow
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Yellow

Write-Host "`n📦 Granting Storage permissions..." -ForegroundColor Cyan
# Grant Storage Object Viewer and Storage Object Admin permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT" `
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT" `
    --role="roles/storage.objectAdmin"

Write-Host "`n🤖 Granting Vertex AI permissions..." -ForegroundColor Cyan
# Grant Vertex AI User permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT" `
    --role="roles/aiplatform.user"

Write-Host "`n✅ Permissions updated successfully!" -ForegroundColor Green
Write-Host "The Cloud Function should now be able to:" -ForegroundColor Yellow
Write-Host "  - Access documents in the $BUCKET_NAME bucket" -ForegroundColor White
Write-Host "  - Use Vertex AI for generating answers" -ForegroundColor White
Write-Host "`n🔄 Please wait a few minutes for permissions to propagate, then test the RAG system again." -ForegroundColor Cyan 
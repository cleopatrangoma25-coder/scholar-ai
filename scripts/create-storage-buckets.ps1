# Scholar AI - Storage Buckets Creation Script (PowerShell)
# This script creates two Google Cloud Storage buckets for Scholar AI

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1",
    
    [Parameter(Mandatory=$false)]
    [string]$BucketPrefix = "scholar-ai"
)

Write-Host "🚀 Creating Storage Buckets for Scholar AI..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Google Cloud CLI (gcloud) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authStatus) {
    Write-Host "❌ You are not authenticated with gcloud." -ForegroundColor Red
    Write-Host "Please run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# Set the project
Write-Host "📋 Setting project to: $ProjectId" -ForegroundColor Cyan
gcloud config set project $ProjectId

# Enable Cloud Storage API if not already enabled
Write-Host "🔧 Ensuring Cloud Storage API is enabled..." -ForegroundColor Cyan
gcloud services enable storage.googleapis.com

# Generate unique bucket names
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$documentsBucket = "$BucketPrefix-documents-$timestamp"
$uploadsBucket = "$BucketPrefix-uploads-$timestamp"

Write-Host "📦 Creating storage buckets..." -ForegroundColor Cyan

# Create documents bucket (for processed documents and embeddings)
Write-Host "  - Creating documents bucket: $documentsBucket" -ForegroundColor Yellow
gcloud storage buckets create gs://$documentsBucket `
    --location=$Region `
    --uniform-bucket-level-access `
    --public-access-prevention

# Create uploads bucket (for user file uploads)
Write-Host "  - Creating uploads bucket: $uploadsBucket" -ForegroundColor Yellow
gcloud storage buckets create gs://$uploadsBucket `
    --location=$Region `
    --uniform-bucket-level-access `
    --public-access-prevention

Write-Host "✅ Storage buckets created successfully!" -ForegroundColor Green

# Set up lifecycle policies for the uploads bucket (auto-delete old files)
Write-Host "🔄 Setting up lifecycle policies..." -ForegroundColor Cyan

# Create lifecycle policy file for uploads bucket
$lifecyclePolicy = @"
{
  "rule": [
    {
      "action": {
        "type": "Delete"
      },
      "condition": {
        "age": 30,
        "matchesPrefix": ["temp/", "uploads/"]
      }
    }
  ]
}
"@

$lifecyclePolicy | Out-File -FilePath "uploads-lifecycle.json" -Encoding UTF8

# Apply lifecycle policy to uploads bucket
Write-Host "  - Applying lifecycle policy to uploads bucket..." -ForegroundColor Yellow
gcloud storage buckets update gs://$uploadsBucket --lifecycle-file="uploads-lifecycle.json"

# Clean up temporary file
Remove-Item "uploads-lifecycle.json" -ErrorAction SilentlyContinue

# Set up CORS for the uploads bucket (if needed for web uploads)
Write-Host "🌐 Setting up CORS for uploads bucket..." -ForegroundColor Cyan

$corsPolicy = @"
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
"@

$corsPolicy | Out-File -FilePath "cors-policy.json" -Encoding UTF8

# Apply CORS policy to uploads bucket
Write-Host "  - Applying CORS policy to uploads bucket..." -ForegroundColor Yellow
gcloud storage buckets update gs://$uploadsBucket --cors-file="cors-policy.json"

# Clean up temporary file
Remove-Item "cors-policy.json" -ErrorAction SilentlyContinue

# Create folder structure in buckets
Write-Host "📁 Creating folder structure..." -ForegroundColor Cyan

# Documents bucket structure
Write-Host "  - Setting up documents bucket structure..." -ForegroundColor Yellow
gcloud storage cp /dev/null gs://$documentsBucket/processed-documents/
gcloud storage cp /dev/null gs://$documentsBucket/embeddings/
gcloud storage cp /dev/null gs://$documentsBucket/metadata/

# Uploads bucket structure
Write-Host "  - Setting up uploads bucket structure..." -ForegroundColor Yellow
gcloud storage cp /dev/null gs://$uploadsBucket/papers/
gcloud storage cp /dev/null gs://$uploadsBucket/temp/
gcloud storage cp /dev/null gs://$uploadsBucket/user-uploads/

Write-Host "✅ Folder structure created!" -ForegroundColor Green

# Set up IAM permissions for the service account
Write-Host "🔐 Setting up IAM permissions..." -ForegroundColor Cyan

$serviceAccount = "scholar-ai-sa@$ProjectId.iam.gserviceaccount.com"

# Grant storage admin role to service account for both buckets
Write-Host "  - Granting storage admin role to service account..." -ForegroundColor Yellow
gcloud storage buckets add-iam-policy-binding gs://$documentsBucket `
    --member="serviceAccount:$serviceAccount" `
    --role="roles/storage.admin"

gcloud storage buckets add-iam-policy-binding gs://$uploadsBucket `
    --member="serviceAccount:$serviceAccount" `
    --role="roles/storage.admin"

Write-Host "✅ IAM permissions configured!" -ForegroundColor Green

# Output the bucket information
Write-Host ""
Write-Host "🎉 Storage buckets setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Bucket Information:" -ForegroundColor Cyan
Write-Host "Documents Bucket: gs://$documentsBucket" -ForegroundColor White
Write-Host "Uploads Bucket: gs://$uploadsBucket" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "📁 Folder Structure:" -ForegroundColor Cyan
Write-Host "Documents Bucket:" -ForegroundColor White
Write-Host "  - processed-documents/ (for processed PDFs and text files)" -ForegroundColor Gray
Write-Host "  - embeddings/ (for vector embeddings)" -ForegroundColor Gray
Write-Host "  - metadata/ (for document metadata)" -ForegroundColor Gray
Write-Host ""
Write-Host "Uploads Bucket:" -ForegroundColor White
Write-Host "  - papers/ (for user paper uploads)" -ForegroundColor Gray
Write-Host "  - temp/ (for temporary processing files)" -ForegroundColor Gray
Write-Host "  - user-uploads/ (for other user files)" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your environment variables with the bucket names:" -ForegroundColor White
Write-Host "   VITE_DOCUMENTS_BUCKET=$documentsBucket" -ForegroundColor Gray
Write-Host "   VITE_UPLOADS_BUCKET=$uploadsBucket" -ForegroundColor Gray
Write-Host "2. Update your Cloud Functions to use these buckets" -ForegroundColor White
Write-Host "3. Test file upload and processing workflows" -ForegroundColor White 
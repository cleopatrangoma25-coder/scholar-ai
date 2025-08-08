# Scholar AI - GCP Services Setup Script (PowerShell)
# This script helps set up the Google Cloud project and enable required APIs

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "🚀 Setting up GCP Services for Scholar AI..." -ForegroundColor Green

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

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Cyan

$apis = @(
    "aiplatform.googleapis.com",      # Vertex AI API
    "workflows.googleapis.com",       # Cloud Workflows API
    "cloudfunctions.googleapis.com",  # Cloud Functions API
    "storage.googleapis.com",         # Cloud Storage API
    "firestore.googleapis.com",       # Firestore API
    "cloudbuild.googleapis.com",      # Cloud Build API
    "iam.googleapis.com"              # IAM API
)

foreach ($api in $apis) {
    Write-Host "  - Enabling $api..." -ForegroundColor Yellow
    gcloud services enable $api
}

Write-Host "✅ All required APIs enabled!" -ForegroundColor Green

# Create service account for Scholar AI
Write-Host "👤 Creating service account for Scholar AI..." -ForegroundColor Cyan
gcloud iam service-accounts create scholar-ai-sa `
    --display-name="Scholar AI Service Account" `
    --description="Service account for Scholar AI application"

# Grant necessary roles
Write-Host "🔐 Granting necessary IAM roles..." -ForegroundColor Cyan

$roles = @(
    "roles/aiplatform.user",
    "roles/aiplatform.developer",
    "roles/storage.objectViewer",
    "roles/storage.objectCreator",
    "roles/workflows.invoker",
    "roles/datastore.user"
)

$serviceAccount = "scholar-ai-sa@$ProjectId.iam.gserviceaccount.com"

foreach ($role in $roles) {
    Write-Host "  - Granting $role..." -ForegroundColor Yellow
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$serviceAccount" `
        --role=$role
}

Write-Host "✅ Service account created and roles granted!" -ForegroundColor Green

# Create and download service account key
Write-Host "🔑 Creating service account key..." -ForegroundColor Cyan
gcloud iam service-accounts keys create gcp-service-account-key.json `
    --iam-account=$serviceAccount

Write-Host "✅ Service account key downloaded to: gcp-service-account-key.json" -ForegroundColor Green

# Set up Vertex AI Search (formerly Enterprise Search)
Write-Host "🔍 Setting up Vertex AI Search..." -ForegroundColor Cyan
Write-Host "Note: Vertex AI Search requires manual setup in the Google Cloud Console." -ForegroundColor Yellow
Write-Host "Please visit: https://console.cloud.google.com/ai/generative/search" -ForegroundColor Yellow
Write-Host "and create a data store for your project." -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 GCP Services setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add gcp-service-account-key.json to your .gitignore" -ForegroundColor White
Write-Host "2. Set up Vertex AI Search data store in the Google Cloud Console" -ForegroundColor White
Write-Host "3. Update your environment variables with the project ID: $ProjectId" -ForegroundColor White
Write-Host "4. Configure Firebase to use this GCP project" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep your service account key secure and never commit it to version control!" -ForegroundColor Red 
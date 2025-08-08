# Scholar AI - GCP Services Verification Script (PowerShell)
# This script verifies that all required GCP services are properly configured

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "🔍 Verifying GCP Services setup for Scholar AI..." -ForegroundColor Green

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "❌ Google Cloud CLI (gcloud) is not installed." -ForegroundColor Red
    exit 1
}

# Check if user is authenticated
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authStatus) {
    Write-Host "❌ You are not authenticated with gcloud." -ForegroundColor Red
    Write-Host "Please run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Authenticated as: $authStatus" -ForegroundColor Green

# Check current project
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $ProjectId) {
    Write-Host "⚠️  Current project ($currentProject) doesn't match expected ($ProjectId)" -ForegroundColor Yellow
    Write-Host "Setting project to: $ProjectId" -ForegroundColor Cyan
    gcloud config set project $ProjectId
} else {
    Write-Host "✅ Project is set to: $ProjectId" -ForegroundColor Green
}

# Check required APIs
Write-Host "`n🔧 Checking required APIs..." -ForegroundColor Cyan

$requiredApis = @(
    "aiplatform.googleapis.com",      # Vertex AI API
    "workflows.googleapis.com",       # Cloud Workflows API
    "cloudfunctions.googleapis.com",  # Cloud Functions API
    "storage.googleapis.com",         # Cloud Storage API
    "firestore.googleapis.com",       # Firestore API
    "cloudbuild.googleapis.com",      # Cloud Build API
    "iam.googleapis.com"              # IAM API
)

$enabledApis = gcloud services list --enabled --format="value(name)" 2>$null

foreach ($api in $requiredApis) {
    if ($enabledApis -contains $api) {
        Write-Host "  ✅ $api" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $api" -ForegroundColor Red
    }
}

# Check service account
Write-Host "`n👤 Checking service account..." -ForegroundColor Cyan

$serviceAccount = "scholar-ai-sa@$ProjectId.iam.gserviceaccount.com"
$serviceAccounts = gcloud iam service-accounts list --format="value(email)" 2>$null

if ($serviceAccounts -contains $serviceAccount) {
    Write-Host "  ✅ Service account exists: $serviceAccount" -ForegroundColor Green
} else {
    Write-Host "  ❌ Service account not found: $serviceAccount" -ForegroundColor Red
}

# Check service account roles
Write-Host "`n🔐 Checking service account roles..." -ForegroundColor Cyan

$requiredRoles = @(
    "roles/aiplatform.user",
    "roles/aiplatform.developer",
    "roles/storage.objectViewer",
    "roles/storage.objectCreator",
    "roles/workflows.invoker",
    "roles/datastore.user"
)

$policy = gcloud projects get-iam-policy $ProjectId --format="json" 2>$null | ConvertFrom-Json

foreach ($role in $requiredRoles) {
    $hasRole = $false
    foreach ($binding in $policy.bindings) {
        if ($binding.role -eq $role -and $binding.members -contains "serviceAccount:$serviceAccount") {
            $hasRole = $true
            break
        }
    }
    
    if ($hasRole) {
        Write-Host "  ✅ $role" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $role" -ForegroundColor Red
    }
}

# Check service account key file
Write-Host "`n🔑 Checking service account key..." -ForegroundColor Cyan

if (Test-Path "gcp-service-account-key.json") {
    Write-Host "  ✅ Service account key file exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ Service account key file not found" -ForegroundColor Red
    Write-Host "  Run: gcloud iam service-accounts keys create gcp-service-account-key.json --iam-account=$serviceAccount" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "If you see any ❌ items above, please run the setup script again:" -ForegroundColor Yellow
Write-Host "  .\scripts\setup-gcp.ps1 -ProjectId `"$ProjectId`"" -ForegroundColor White

Write-Host "`n🎉 Verification complete!" -ForegroundColor Green 
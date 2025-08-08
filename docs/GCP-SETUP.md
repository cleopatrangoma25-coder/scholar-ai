# GCP Services Setup for Scholar AI

This document guides you through setting up Google Cloud Platform services required for Scholar AI.

## Prerequisites

1. **Google Cloud CLI (gcloud)** installed
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or install via package manager

2. **Google Cloud Account** with billing enabled
   - Visit: https://console.cloud.google.com/
   - Enable billing for your project

3. **Authentication** with gcloud
   ```bash
   gcloud auth login
   ```

## Quick Setup (Automated)

### For Windows (PowerShell):
```powershell
# Navigate to the project root
cd scholar-ai

# Run the setup script (replace with your project ID)
.\scripts\setup-gcp.ps1 -ProjectId "your-project-id"
```

### For Linux/macOS (Bash):
```bash
# Navigate to the project root
cd scholar-ai

# Make script executable
chmod +x scripts/setup-gcp.sh

# Run the setup script
./scripts/setup-gcp.sh
```

## Manual Setup

If you prefer to set up manually or the automated script fails:

### 1. Create/Select Google Cloud Project

```bash
# List existing projects
gcloud projects list

# Create new project (optional)
gcloud projects create your-project-id --name="Scholar AI"

# Set the project
gcloud config set project your-project-id
```

### 2. Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable aiplatform.googleapis.com      # Vertex AI
gcloud services enable workflows.googleapis.com       # Cloud Workflows
gcloud services enable cloudfunctions.googleapis.com  # Cloud Functions
gcloud services enable storage.googleapis.com         # Cloud Storage
gcloud services enable firestore.googleapis.com       # Firestore
gcloud services enable cloudbuild.googleapis.com      # Cloud Build
gcloud services enable iam.googleapis.com             # IAM
```

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create scholar-ai-sa \
    --display-name="Scholar AI Service Account" \
    --description="Service account for Scholar AI application"

# Grant necessary roles
PROJECT_ID="your-project-id"
SERVICE_ACCOUNT="scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Vertex AI roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.developer"

# Storage roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectCreator"

# Workflows role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/workflows.invoker"

# Firestore role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/datastore.user"
```

### 4. Download Service Account Key

```bash
# Create and download service account key
gcloud iam service-accounts keys create gcp-service-account-key.json \
    --iam-account=scholar-ai-sa@your-project-id.iam.gserviceaccount.com
```

## Manual Vertex AI Search Setup

Vertex AI Search requires manual setup in the Google Cloud Console:

1. **Visit Vertex AI Search Console**
   - Go to: https://console.cloud.google.com/ai/generative/search

2. **Create Data Store**
   - Click "Create Data Store"
   - Choose "Unstructured Data" for PDF documents
   - Select your project and region
   - Name it "scholar-ai-datastore" (or your preferred name)

3. **Configure Data Store**
   - Set up the data store for document ingestion
   - Note the data store ID for environment variables

## Environment Variables

After setup, update your environment files with the GCP project ID:

```env
# Add to your .env.stage or .env.local
VITE_GCP_PROJECT_ID=your-project-id
VITE_VERTEX_AI_LOCATION=us-central1
VITE_VERTEX_AI_DATA_STORE_ID=your-datastore-id
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit service account keys** to version control
2. **The key file is already in .gitignore** - keep it that way
3. **Use environment variables** for sensitive configuration
4. **Rotate keys regularly** in production environments
5. **Follow principle of least privilege** - only grant necessary permissions

## Verification

To verify your setup:

```bash
# Check if APIs are enabled
gcloud services list --enabled --filter="name:aiplatform.googleapis.com OR name:workflows.googleapis.com"

# Check service account permissions
gcloud projects get-iam-policy your-project-id \
    --flatten="bindings[].members" \
    --filter="bindings.members:scholar-ai-sa@your-project-id.iam.gserviceaccount.com"
```

## Troubleshooting

### Common Issues:

1. **"API not enabled" errors**
   - Run the enable commands again
   - Check billing is enabled for the project

2. **"Permission denied" errors**
   - Verify you have Owner or Editor role on the project
   - Check service account roles were granted correctly

3. **"Service account not found"**
   - Verify the service account was created
   - Check the project ID is correct

### Getting Help:

- **Google Cloud Documentation**: https://cloud.google.com/docs
- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
- **Cloud Workflows Documentation**: https://cloud.google.com/workflows/docs 
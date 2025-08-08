#!/bin/bash

# Scholar AI - GCP Services Setup Script
# This script helps set up the Google Cloud project and enable required APIs

set -e

echo "🚀 Setting up GCP Services for Scholar AI..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI (gcloud) is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ You are not authenticated with gcloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get project ID from user
read -p "Enter your Google Cloud Project ID: " PROJECT_ID

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."

# Vertex AI API
echo "  - Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

# Cloud Workflows API
echo "  - Enabling Cloud Workflows API..."
gcloud services enable workflows.googleapis.com

# Cloud Functions API (for Firebase Functions)
echo "  - Enabling Cloud Functions API..."
gcloud services enable cloudfunctions.googleapis.com

# Cloud Storage API
echo "  - Enabling Cloud Storage API..."
gcloud services enable storage.googleapis.com

# Firestore API
echo "  - Enabling Firestore API..."
gcloud services enable firestore.googleapis.com

# Cloud Build API (for deployments)
echo "  - Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com

# IAM API
echo "  - Enabling IAM API..."
gcloud services enable iam.googleapis.com

echo "✅ All required APIs enabled!"

# Create service account for Scholar AI
echo "👤 Creating service account for Scholar AI..."
gcloud iam service-accounts create scholar-ai-sa \
    --display-name="Scholar AI Service Account" \
    --description="Service account for Scholar AI application"

# Grant necessary roles
echo "🔐 Granting necessary IAM roles..."

# Vertex AI roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.developer"

# Cloud Storage roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectCreator"

# Cloud Workflows roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/workflows.invoker"

# Firestore roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

echo "✅ Service account created and roles granted!"

# Create and download service account key
echo "🔑 Creating service account key..."
gcloud iam service-accounts keys create gcp-service-account-key.json \
    --iam-account=scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com

echo "✅ Service account key downloaded to: gcp-service-account-key.json"

# Set up Vertex AI Search (formerly Enterprise Search)
echo "🔍 Setting up Vertex AI Search..."
echo "Note: Vertex AI Search requires manual setup in the Google Cloud Console."
echo "Please visit: https://console.cloud.google.com/ai/generative/search"
echo "and create a data store for your project."

echo ""
echo "🎉 GCP Services setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add gcp-service-account-key.json to your .gitignore"
echo "2. Set up Vertex AI Search data store in the Google Cloud Console"
echo "3. Update your environment variables with the project ID: $PROJECT_ID"
echo "4. Configure Firebase to use this GCP project"
echo ""
echo "⚠️  IMPORTANT: Keep your service account key secure and never commit it to version control!" 
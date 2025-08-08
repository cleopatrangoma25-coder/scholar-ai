#!/bin/bash

# Scholar AI - Storage Buckets Creation Script (Bash)
# This script creates two Google Cloud Storage buckets for Scholar AI

set -e

# Default values
REGION="us-central1"
BUCKET_PREFIX="scholar-ai"

# Function to show usage
show_usage() {
    echo "Usage: $0 -p PROJECT_ID [-r REGION] [-b BUCKET_PREFIX]"
    echo ""
    echo "Options:"
    echo "  -p PROJECT_ID     Google Cloud Project ID (required)"
    echo "  -r REGION         GCP region (default: us-central1)"
    echo "  -b BUCKET_PREFIX  Bucket name prefix (default: scholar-ai)"
    echo "  -h               Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -p my-project-id -r us-west1 -b my-scholar-ai"
}

# Parse command line arguments
while getopts "p:r:b:h" opt; do
    case $opt in
        p) PROJECT_ID="$OPTARG" ;;
        r) REGION="$OPTARG" ;;
        b) BUCKET_PREFIX="$OPTARG" ;;
        h) show_usage; exit 0 ;;
        *) show_usage; exit 1 ;;
    esac
done

# Check if PROJECT_ID is provided
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: PROJECT_ID is required"
    show_usage
    exit 1
fi

echo "🚀 Creating Storage Buckets for Scholar AI..."

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

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable Cloud Storage API if not already enabled
echo "🔧 Ensuring Cloud Storage API is enabled..."
gcloud services enable storage.googleapis.com

# Generate unique bucket names
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DOCUMENTS_BUCKET="$BUCKET_PREFIX-documents-$TIMESTAMP"
UPLOADS_BUCKET="$BUCKET_PREFIX-uploads-$TIMESTAMP"

echo "📦 Creating storage buckets..."

# Create documents bucket (for processed documents and embeddings)
echo "  - Creating documents bucket: $DOCUMENTS_BUCKET"
gcloud storage buckets create gs://$DOCUMENTS_BUCKET \
    --location=$REGION \
    --uniform-bucket-level-access \
    --public-access-prevention

# Create uploads bucket (for user file uploads)
echo "  - Creating uploads bucket: $UPLOADS_BUCKET"
gcloud storage buckets create gs://$UPLOADS_BUCKET \
    --location=$REGION \
    --uniform-bucket-level-access \
    --public-access-prevention

echo "✅ Storage buckets created successfully!"

# Set up lifecycle policies for the uploads bucket (auto-delete old files)
echo "🔄 Setting up lifecycle policies..."

# Create lifecycle policy file for uploads bucket
cat > uploads-lifecycle.json << EOF
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
EOF

# Apply lifecycle policy to uploads bucket
echo "  - Applying lifecycle policy to uploads bucket..."
gcloud storage buckets update gs://$UPLOADS_BUCKET --lifecycle-file="uploads-lifecycle.json"

# Clean up temporary file
rm -f uploads-lifecycle.json

# Set up CORS for the uploads bucket (if needed for web uploads)
echo "🌐 Setting up CORS for uploads bucket..."

cat > cors-policy.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS policy to uploads bucket
echo "  - Applying CORS policy to uploads bucket..."
gcloud storage buckets update gs://$UPLOADS_BUCKET --cors-file="cors-policy.json"

# Clean up temporary file
rm -f cors-policy.json

# Create folder structure in buckets
echo "📁 Creating folder structure..."

# Documents bucket structure
echo "  - Setting up documents bucket structure..."
gcloud storage cp /dev/null gs://$DOCUMENTS_BUCKET/processed-documents/
gcloud storage cp /dev/null gs://$DOCUMENTS_BUCKET/embeddings/
gcloud storage cp /dev/null gs://$DOCUMENTS_BUCKET/metadata/

# Uploads bucket structure
echo "  - Setting up uploads bucket structure..."
gcloud storage cp /dev/null gs://$UPLOADS_BUCKET/papers/
gcloud storage cp /dev/null gs://$UPLOADS_BUCKET/temp/
gcloud storage cp /dev/null gs://$UPLOADS_BUCKET/user-uploads/

echo "✅ Folder structure created!"

# Set up IAM permissions for the service account
echo "🔐 Setting up IAM permissions..."

SERVICE_ACCOUNT="scholar-ai-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Grant storage admin role to service account for both buckets
echo "  - Granting storage admin role to service account..."
gcloud storage buckets add-iam-policy-binding gs://$DOCUMENTS_BUCKET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"

gcloud storage buckets add-iam-policy-binding gs://$UPLOADS_BUCKET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"

echo "✅ IAM permissions configured!"

# Output the bucket information
echo ""
echo "🎉 Storage buckets setup complete!"
echo ""
echo "📋 Bucket Information:"
echo "Documents Bucket: gs://$DOCUMENTS_BUCKET"
echo "Uploads Bucket: gs://$UPLOADS_BUCKET"
echo "Region: $REGION"
echo ""
echo "📁 Folder Structure:"
echo "Documents Bucket:"
echo "  - processed-documents/ (for processed PDFs and text files)"
echo "  - embeddings/ (for vector embeddings)"
echo "  - metadata/ (for document metadata)"
echo ""
echo "Uploads Bucket:"
echo "  - papers/ (for user paper uploads)"
echo "  - temp/ (for temporary processing files)"
echo "  - user-uploads/ (for other user files)"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your environment variables with the bucket names:"
echo "   VITE_DOCUMENTS_BUCKET=$DOCUMENTS_BUCKET"
echo "   VITE_UPLOADS_BUCKET=$UPLOADS_BUCKET"
echo "2. Update your Cloud Functions to use these buckets"
echo "3. Test file upload and processing workflows" 
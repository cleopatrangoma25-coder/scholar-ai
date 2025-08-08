# Storage Buckets Setup for Scholar AI

This document guides you through creating two dedicated Google Cloud Storage buckets for Scholar AI.

## Overview

Scholar AI uses two separate storage buckets for different purposes:

1. **Documents Bucket**: Stores processed documents, embeddings, and metadata
2. **Uploads Bucket**: Stores user file uploads and temporary processing files

## Prerequisites

1. **Google Cloud CLI (gcloud)** installed and authenticated
2. **Google Cloud Project** with billing enabled
3. **Service Account** created (see [GCP-SETUP.md](./GCP-SETUP.md))

## Quick Setup

### For Windows (PowerShell):

```powershell
# Navigate to the project root
cd scholar-ai

# Run the setup script (replace with your project ID)
.\scripts\create-storage-buckets.ps1 -ProjectId "your-project-id"

# Optional: Specify region and bucket prefix
.\scripts\create-storage-buckets.ps1 -ProjectId "your-project-id" -Region "us-west1" -BucketPrefix "my-scholar-ai"
```

### For Linux/macOS (Bash):

```bash
# Navigate to the project root
cd scholar-ai

# Make script executable (Linux/macOS only)
chmod +x scripts/create-storage-buckets.sh

# Run the setup script
./scripts/create-storage-buckets.sh -p "your-project-id"

# Optional: Specify region and bucket prefix
./scripts/create-storage-buckets.sh -p "your-project-id" -r "us-west1" -b "my-scholar-ai"
```

## Manual Setup

If you prefer to create the buckets manually:

### 1. Create Documents Bucket

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create documents bucket
gcloud storage buckets create gs://scholar-ai-documents-$(date +%Y%m%d-%H%M%S) \
    --location=us-central1 \
    --uniform-bucket-level-access \
    --public-access-prevention

# Create folder structure
gcloud storage cp /dev/null gs://YOUR_DOCUMENTS_BUCKET/processed-documents/
gcloud storage cp /dev/null gs://YOUR_DOCUMENTS_BUCKET/embeddings/
gcloud storage cp /dev/null gs://YOUR_DOCUMENTS_BUCKET/metadata/
```

### 2. Create Uploads Bucket

```bash
# Create uploads bucket
gcloud storage buckets create gs://scholar-ai-uploads-$(date +%Y%m%d-%H%M%S) \
    --location=us-central1 \
    --uniform-bucket-level-access \
    --public-access-prevention

# Create folder structure
gcloud storage cp /dev/null gs://YOUR_UPLOADS_BUCKET/papers/
gcloud storage cp /dev/null gs://YOUR_UPLOADS_BUCKET/temp/
gcloud storage cp /dev/null gs://YOUR_UPLOADS_BUCKET/user-uploads/
```

### 3. Set Up Lifecycle Policies

Create a lifecycle policy for the uploads bucket to automatically delete old temporary files:

```bash
# Create lifecycle policy file
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

# Apply lifecycle policy
gcloud storage buckets update gs://YOUR_UPLOADS_BUCKET --lifecycle-file="uploads-lifecycle.json"
```

### 4. Set Up CORS (for web uploads)

```bash
# Create CORS policy file
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

# Apply CORS policy
gcloud storage buckets update gs://YOUR_UPLOADS_BUCKET --cors-file="cors-policy.json"
```

### 5. Configure IAM Permissions

```bash
# Grant storage admin role to service account
SERVICE_ACCOUNT="scholar-ai-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"

gcloud storage buckets add-iam-policy-binding gs://YOUR_DOCUMENTS_BUCKET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"

gcloud storage buckets add-iam-policy-binding gs://YOUR_UPLOADS_BUCKET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.admin"
```

## Bucket Structure

### Documents Bucket (`gs://scholar-ai-documents-*`)

```
processed-documents/     # Processed PDFs and text files
├── user-id-1/
│   ├── paper-id-1/
│   │   ├── extracted-text.txt
│   │   └── processed-chunks.json
│   └── paper-id-2/
└── user-id-2/

embeddings/             # Vector embeddings for RAG
├── user-id-1/
│   ├── paper-id-1/
│   │   └── embeddings.json
│   └── paper-id-2/
└── user-id-2/

metadata/               # Document metadata
├── user-id-1/
│   ├── paper-id-1/
│   │   └── metadata.json
│   └── paper-id-2/
└── user-id-2/
```

### Uploads Bucket (`gs://scholar-ai-uploads-*`)

```
papers/                 # User paper uploads
├── user-id-1/
│   ├── paper-id-1/
│   │   └── original-paper.pdf
│   └── paper-id-2/
└── user-id-2/

temp/                   # Temporary processing files (auto-deleted after 30 days)
├── processing-1/
├── processing-2/
└── ...

user-uploads/           # Other user files
├── user-id-1/
│   ├── profile-pictures/
│   └── documents/
└── user-id-2/
```

## Environment Variables

After creating the buckets, update your environment files:

### Development (`apps/web/env.development`)

```env
# Add these to your existing environment variables
VITE_DOCUMENTS_BUCKET=your-documents-bucket-name
VITE_UPLOADS_BUCKET=your-uploads-bucket-name
```

### Staging (`apps/web/env.staging`)

```env
# Add these to your existing environment variables
VITE_DOCUMENTS_BUCKET=scholar-ai-documents-20241201-143022
VITE_UPLOADS_BUCKET=scholar-ai-uploads-20241201-143022
```

### Production (`apps/web/env.production`)

```env
# Add these to your existing environment variables
VITE_DOCUMENTS_BUCKET=scholar-ai-documents-20241201-143022
VITE_UPLOADS_BUCKET=scholar-ai-uploads-20241201-143022
```

## Cloud Functions Configuration

Update your Cloud Functions to use the new buckets:

### Storage Trigger Function

```typescript
// functions/src/triggers/storage.ts
export const onFileUploaded = onObjectFinalized({
    bucket: process.env.UPLOADS_BUCKET, // Use uploads bucket instead of Firebase bucket
    region: "us-central1",
}, async (event) => {
    // Your processing logic
});
```

### Paper Upload Function

```typescript
// functions/src/routers/paper.ts
const uploadToBucket = async (file: Buffer, path: string) => {
    const bucket = storage.bucket(process.env.UPLOADS_BUCKET);
    const fileRef = bucket.file(path);
    await fileRef.save(file);
    return fileRef.publicUrl();
};
```

## Security Considerations

1. **Public Access Prevention**: Both buckets are created with public access prevention enabled
2. **Uniform Bucket-Level Access**: Enables IAM policies for better security
3. **Lifecycle Policies**: Automatically delete temporary files after 30 days
4. **Service Account Permissions**: Only the Scholar AI service account has access
5. **CORS Configuration**: Configured for web uploads but can be restricted to specific domains

## Cost Optimization

1. **Lifecycle Policies**: Automatically delete temporary files to reduce storage costs
2. **Storage Classes**: Consider using different storage classes for different data types:
   - Standard for frequently accessed files
   - Nearline for infrequently accessed files (embeddings, metadata)
   - Coldline for archival data

## Troubleshooting

### Common Issues:

1. **"Bucket name already exists"**
   - The script generates unique names with timestamps
   - If you get this error, the bucket name might be globally unique

2. **"Permission denied"**
   - Ensure you have Owner or Editor role on the project
   - Verify the service account was created correctly

3. **"API not enabled"**
   - The script automatically enables the Cloud Storage API
   - If it fails, manually enable: `gcloud services enable storage.googleapis.com`

### Getting Help:

- **Google Cloud Storage Documentation**: https://cloud.google.com/storage/docs
- **Bucket Naming Guidelines**: https://cloud.google.com/storage/docs/naming-buckets
- **IAM Permissions**: https://cloud.google.com/storage/docs/access-control/iam 
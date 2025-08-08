# Cloud Functions Environment Variables Setup

This document explains how to configure environment variables for your Cloud Functions to use the dedicated storage buckets.

## Environment Variables for Storage Buckets

Your Cloud Functions need to know which storage buckets to use for different operations.

### Required Environment Variables

```bash
# Storage buckets for RAG engine
UPLOADS_BUCKET=scholar-ai-1-prod-uploads
DOCUMENTS_BUCKET=scholar-ai-1-prod-documents

# For staging environment
UPLOADS_BUCKET=scholar-ai-1-stage-uploads
DOCUMENTS_BUCKET=scholar-ai-1-stage-documents
```

## Setting Environment Variables

### Option 1: Using Firebase CLI

```bash
# For production
firebase use production
firebase functions:config:set storage.uploads_bucket="scholar-ai-1-prod-uploads"
firebase functions:config:set storage.documents_bucket="scholar-ai-1-prod-documents"

# For staging
firebase use staging
firebase functions:config:set storage.uploads_bucket="scholar-ai-1-stage-uploads"
firebase functions:config:set storage.documents_bucket="scholar-ai-1-stage-documents"
```

### Option 2: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Functions**
3. Select your function (e.g., `processUploadedPDF`)
4. Click **"EDIT"**
5. Go to **"Variables & Secrets"** tab
6. Add the following environment variables:
   - `UPLOADS_BUCKET`: `scholar-ai-1-prod-uploads`
   - `DOCUMENTS_BUCKET`: `scholar-ai-1-prod-documents`

### Option 3: Using gcloud CLI

```bash
# Set environment variables for Cloud Functions
gcloud functions deploy processUploadedPDF \
  --set-env-vars UPLOADS_BUCKET=scholar-ai-1-prod-uploads,DOCUMENTS_BUCKET=scholar-ai-1-prod-documents \
  --region=us-central1
```

## Environment-Specific Configuration

### Production Environment
```bash
UPLOADS_BUCKET=scholar-ai-1-prod-uploads
DOCUMENTS_BUCKET=scholar-ai-1-prod-documents
```

### Staging Environment
```bash
UPLOADS_BUCKET=scholar-ai-1-stage-uploads
DOCUMENTS_BUCKET=scholar-ai-1-stage-documents
```

### Development Environment
```bash
UPLOADS_BUCKET=scholar-ai-1-stage-uploads
DOCUMENTS_BUCKET=scholar-ai-1-stage-documents
```

## Verification

After setting the environment variables, you can verify they're working:

1. **Check Cloud Functions logs** for any bucket-related errors
2. **Test file upload** and verify files go to the correct bucket
3. **Check bucket contents** in Google Cloud Console

## Troubleshooting

### Common Issues:

1. **"Bucket not found" errors**
   - Verify bucket names are correct
   - Check that buckets exist in the correct project
   - Ensure Cloud Functions have access to the buckets

2. **"Permission denied" errors**
   - Verify IAM permissions for the Cloud Functions service account
   - Check that the service account has `storage.objectViewer` and `storage.objectCreator` roles

3. **Environment variables not loading**
   - Restart the Cloud Function after setting environment variables
   - Check that variable names match exactly (case-sensitive)

## Next Steps

After setting up the environment variables:

1. **Deploy your Cloud Functions** with the new configuration
2. **Test file uploads** to ensure they go to the correct buckets
3. **Verify RAG processing** works with the new bucket structure
4. **Monitor logs** for any issues with bucket access 
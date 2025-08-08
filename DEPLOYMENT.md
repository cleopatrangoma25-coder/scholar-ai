# Deployment Guide

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**: Login to Firebase
   ```bash
   firebase login
   ```

3. **Staging Project**: Create a Firebase project for staging
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project named `scholar-ai-staging`
   - Enable Authentication, Firestore, Storage, and Functions

## Environment Setup

### 1. Update Environment Variables

Edit `apps/web/env.staging` with your actual Firebase project values:

```bash
# Replace these with your actual Firebase project values
VITE_FIREBASE_API_KEY=your-actual-staging-api-key
VITE_FIREBASE_AUTH_DOMAIN=scholar-ai-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scholar-ai-staging
VITE_FIREBASE_STORAGE_BUCKET=scholar-ai-staging.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
VITE_FIREBASE_APP_ID=your-actual-app-id
```

### 2. Set Firebase Functions Environment Variables

```bash
firebase use staging
firebase functions:config:set google.cloud.project="scholar-ai-staging"
firebase functions:config:set google.cloud.location="us-central1"
```

## Deployment Commands

### Deploy Everything (Functions + Hosting)
```bash
pnpm deploy:staging
```

### Deploy Only Functions
```bash
pnpm deploy:staging:functions
```

### Deploy Only Hosting
```bash
pnpm deploy:staging:hosting
```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Build the app for staging**:
   ```bash
   cd apps/web
   pnpm build:staging
   ```

2. **Switch to staging project**:
   ```bash
   firebase use staging
   ```

3. **Deploy functions**:
   ```bash
   firebase deploy --only functions
   ```

4. **Deploy hosting**:
   ```bash
   firebase deploy --only hosting
   ```

## Post-Deployment

After deployment, your app will be available at:
- **Hosting**: https://scholar-ai-staging.web.app
- **Functions**: https://us-central1-scholar-ai-staging.cloudfunctions.net

## Troubleshooting

### Common Issues

1. **Build Errors**: Make sure all dependencies are installed
   ```bash
   pnpm install
   ```

2. **Firebase Project Not Found**: Verify your project ID in `.firebaserc`

3. **Environment Variables**: Ensure all required environment variables are set

4. **Functions Deployment Fails**: Check that you have the necessary permissions for the Firebase project

### Rollback

To rollback to a previous deployment:
```bash
firebase hosting:clone scholar-ai-staging:live scholar-ai-staging:live --version=VERSION_ID
```

## Production Deployment

For production deployment, follow the same steps but:
1. Create a production Firebase project
2. Update `.firebaserc` with production project ID
3. Create `.env.production` with production values
4. Use `pnpm deploy:production` (add this script as needed) 
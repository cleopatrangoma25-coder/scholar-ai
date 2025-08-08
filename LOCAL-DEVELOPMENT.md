# Local Development Guide

## 🏠 Running Scholar AI Locally

Your Scholar AI application can be run locally in several ways, depending on your needs and setup.

## 🚀 Quick Start (Recommended)

### Option 1: Full Local Development with Mock Server

This is the **easiest way** to test the complete application locally:

```bash
cd apps/web
pnpm dev:full
```

This will start:
- **Frontend**: React app on `http://localhost:3000`
- **Mock Server**: Backend API simulation on `http://localhost:3001`

**Features Available:**
- ✅ Complete UI with all tabs and features
- ✅ File upload simulation
- ✅ RAG query interface with mock responses
- ✅ Paper management
- ✅ Author and topic browsing
- ✅ Conversation history

### Option 2: Frontend Only

```bash
cd apps/web
pnpm dev
```

This starts only the React frontend on `http://localhost:3000`

### Option 3: Mock Server Only

```bash
cd apps/web
pnpm dev:mock
```

This starts only the mock server on `http://localhost:3001`

## 🧪 Testing the Real RAG Implementation

### Local RAG Test (Requires GCP Setup)

To test the actual Vertex AI integration locally:

```bash
# From project root
node test-rag-local.js
```

**Prerequisites:**
1. Google Cloud SDK installed
2. Authenticated with `gcloud auth login`
3. Project set with `gcloud config set project scholar-ai-1-prod`

### Verification Test (No Setup Required)

To verify the implementation structure:

```bash
# From project root
node verify-rag-implementation.js
```

This confirms that:
- ✅ VertexAIClient is properly exported
- ✅ All RAG methods are available
- ✅ Implementation structure is correct
- ✅ TypeScript support is working

## 🔧 Local Development Workflow

### 1. **Start Development Environment**

```bash
# Terminal 1: Start the full application
cd apps/web
pnpm dev:full
```

### 2. **Access the Application**

Open your browser to: `http://localhost:3000`

### 3. **Test Features**

**Authentication:**
- The app uses Firebase Auth
- You can sign in with any email/password (simulated)

**File Upload:**
- Upload PDF files (simulated processing)
- View upload status and progress

**RAG Queries:**
- Ask questions in the AI Chat tab
- View responses with mock citations
- Test different scopes (private, public, all)

**Paper Management:**
- Browse uploaded papers
- View paper details and metadata
- Search and filter papers

**Authors & Topics:**
- Browse author profiles
- Explore trending topics
- View related papers

### 4. **Development Features**

**Hot Reload:**
- Changes to React components auto-reload
- TypeScript compilation on save

**Mock Data:**
- Realistic mock responses
- Simulated processing times
- Proper error handling

## 📁 Project Structure for Local Development

```
scholar-ai/
├── apps/web/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/             # Firebase config
│   │   └── main.tsx         # App entry point
│   ├── mock-server.js       # Mock backend API
│   └── package.json
├── functions/               # Cloud Functions (backend)
│   └── src/routers/        # tRPC routers
├── packages/
│   ├── gcp-clients/        # Vertex AI integration
│   └── shared/             # Shared schemas
└── test-rag-local.js       # Local RAG testing
```

## 🔍 What's Working Locally

### ✅ **Fully Functional:**
- Complete React UI with all features
- File upload interface
- RAG query interface
- Paper browsing and management
- Author and topic exploration
- Conversation history
- Authentication flow

### ✅ **Mock Backend:**
- Realistic API responses
- Simulated processing times
- Proper error handling
- Data persistence (in-memory)

### ✅ **Real Implementation:**
- Vertex AI client integration
- RAG pipeline structure
- TypeScript support
- Error handling

## 🚀 Next Steps for Full Local Testing

### 1. **Set up GCP Credentials**

For testing the real Vertex AI integration:

```bash
# Install Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project scholar-ai-1-prod

# Test real RAG
node test-rag-local.js
```

### 2. **Service Account Setup**

For production-like testing:

```bash
# Create service account in GCP Console
# Download JSON key file

# Set environment variables
set GOOGLE_CLOUD_PROJECT=scholar-ai-1-prod
set GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json

# Test with real APIs
node test-rag-local.js
```

## 🐛 Troubleshooting

### Common Issues:

**1. Port Already in Use**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**2. Node Modules Issues**
```bash
# Clean and reinstall
rm -rf node_modules
pnpm install
```

**3. Build Errors**
```bash
# Rebuild packages
cd packages/gcp-clients && pnpm build
cd ../../functions && pnpm build
```

**4. TypeScript Errors**
```bash
# Check types
pnpm type-check
```

## 🎯 Development Tips

### 1. **Mock Data Customization**
Edit `apps/web/mock-server.js` to customize mock responses.

### 2. **Component Development**
Use the mock server to develop UI components without backend dependencies.

### 3. **API Testing**
Test tRPC procedures locally before deploying to Cloud Functions.

### 4. **Real RAG Testing**
Use the test scripts to verify Vertex AI integration works correctly.

## 🏆 Success!

Your Scholar AI application is now running locally with:

- ✅ **Complete UI**: All features working
- ✅ **Mock Backend**: Realistic API simulation
- ✅ **Real RAG**: Ready for GCP integration
- ✅ **Hot Reload**: Fast development cycle
- ✅ **Type Safety**: Full TypeScript support

You can now develop, test, and iterate on the application locally before deploying to production! 
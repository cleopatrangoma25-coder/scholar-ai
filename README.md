# Scholar AI - Research Assistant

An AI-powered research assistant that allows users to conversationally query their private library and a global public corpus of academic papers, receiving synthesized answers with auto-generated citations.

## 🏗️ Phase 1: Project Setup & Foundational Backend (COMPLETED)

### What's Been Set Up

✅ **Monorepo Structure**: PNPM workspace with Turborepo
- `apps/web` - React frontend with Vite
- `packages/shared` - Zod schemas and common types
- `packages/gcp-clients` - Typed GCP service clients
- `functions` - Firebase Functions with tRPC
- `workflows` - Cloud Workflows definitions (placeholder)

✅ **Firebase Configuration**
- Firebase Functions setup with Node.js 18
- Authentication middleware for tRPC
- Firestore and Storage integration
- Local emulator configuration

✅ **API Layer (tRPC)**
- Type-safe API with Zod validation
- Protected routes with Firebase Auth
- Paper upload and retrieval endpoints
- RAG query endpoint (placeholder implementation)

✅ **Frontend Foundation**
- React app with Vite and TypeScript
- Tailwind CSS with design system
- Firebase Authentication integration
- tRPC client setup with TanStack Query
- Protected routing with React Router

✅ **Shared Packages**
- Zod schemas for all API types
- Utility functions for error handling
- GCP client abstractions for Vertex AI and Workflows

### Project Structure

```
scholar-ai/
├── apps/
│   └── web/                 # React frontend
├── packages/
│   ├── shared/             # Zod schemas & utilities
│   └── gcp-clients/        # GCP service clients
├── functions/              # Firebase Functions (tRPC)
├── workflows/              # Cloud Workflows (placeholder)
├── docs/                   # Documentation
└── firebase.json          # Firebase configuration
```

### Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**
   ```bash
   # Copy example environment file
   cp apps/web/env.example apps/web/.env.local
   
   # Edit with your Firebase project details
   nano apps/web/.env.local
   ```

3. **Start Development**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individual services
   pnpm --filter @scholar-ai/web dev
   pnpm --filter functions dev
   ```

4. **Firebase Setup**
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize your project (update .firebaserc with your project ID)
   firebase use your-project-id
   
   # Start emulators
   firebase emulators:start
   ```

### Next Steps (Phase 2)

The following items are ready for Phase 2 development:

- [ ] **PDF Upload Component**: Frontend file upload with drag-and-drop
- [ ] **Cloud Workflow**: Document processing pipeline (PDF → chunks → Vertex AI)
- [ ] **RAG Implementation**: Real Vertex AI integration (currently mocked)
- [ ] **Public Corpus Ingestion**: Automated arXiv data ingestion
- [ ] **Query Interface**: Chat/search UI for asking questions

### Development Notes

- **Authentication**: Firebase Auth with email/password (can be extended to Google, GitHub, etc.)
- **API**: Type-safe tRPC with automatic client generation
- **Database**: Firestore for metadata, Vertex AI Search for document chunks
- **Storage**: Firebase Storage for PDF files
- **Styling**: Tailwind CSS with shadcn/ui design tokens

### Environment Variables Needed

**Web App** (`apps/web/.env.local`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_URL`

**Functions** (set in Firebase Console):
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`

---

**Status**: Phase 1 Complete ✅  
**Next**: Ready for Phase 2 - Core Feature Development
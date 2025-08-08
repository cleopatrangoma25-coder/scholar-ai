Phase 1: Project Setup & Core Infrastructure (Weeks 1-2)
Initialize Monorepo:

[x] Create pnpm-workspace.yaml.

[x] Set up apps/web (React + Vite) and functions/ (Google Cloud Functions).

[x] Configure Turborepo.

Google Cloud Project Setup:

[x] Create a new Google Cloud project (e.g., scholar-ai-prod).

[x] Enable required Google Cloud services (Authentication via Identity Platform, Firestore, Cloud Storage).

[x] Enable Cloud Functions API and Vertex AI API.

[x] Configure gcloud CLI and project aliases.

[x] Link project to billing account (scholar-ai-1-prod).

[x] Create dedicated storage buckets for document processing and user uploads.
[x] Deploy frontend application to production (hosting successful).
[x] Fix Cloud Functions dependencies and build issues.
[x] Update Cloud Functions with CORS configuration and tRPC integration.

Shared tRPC & Zod Setup:

[x] Create a packages/shared workspace for the tRPC router and Zod schemas.

[x] Connect the apps/web frontend to the tRPC backend.

Authentication Module:

[x] Implement Firebase Auth for user registration and login.

[x] Create a basic user profile management system (using a users collection in Firestore).

UI Kit Integration:

[x] Set up Tailwind CSS in apps/web.

[x] Integrate basic UI components (Button, Input, Card, etc.).

Environment Variables:

[x] Configure environment variables for staging and production environments.

Phase 2: Core Scholar AI Functionality & RAG Engine (Weeks 3-6)
Knowledge Base Ingestion Pipeline:

[x] Develop a script/Cloud Function to parse and chunk user-uploaded PDF research papers (unstructured data).

[x] Use Vertex AI's text-embedding models to generate vector embeddings for each document chunk.

[x] Populate a Vertex AI Vector Search index with these embeddings and their corresponding text content and metadata (e.g., paper title, authors).

RAG Engine Implementation (Google Cloud Function):

[x] Create a Google Cloud Function to serve as the core RAG Engine.

[x] Implement logic to take a researcher's query.

[x] Call Vertex AI's embedding model to get the query's embedding.

[x] Query the Vertex AI Vector Search index to retrieve the top-k relevant document chunks.

[x] Construct a detailed prompt for the LLM using the researcher's query and the retrieved context.

[x] Call the Vertex AI Gemini API with the augmented prompt to generate a synthesized answer with citations.

[x] Return the LLM's generated response.

AI Assistant Integration (scholar.askAI):

[x] Implement the tRPC procedure for scholar.askAI that invokes the RAG Engine Cloud Function.

[x] Develop the frontend UI for asking research questions and displaying the AI's synthesized responses.

[x] Store conversation history in Firestore for user reference.

Paper & Author Information Display:

[x] Populate initial paper metadata in Firestore (can be part of the ingestion pipeline).

[x] Create a frontend page to browse or search for papers and view details (authors, abstract, journal).

[x] Implement tRPC procedures like papers.getPaperDetails and authors.getAuthorProfile.

Research Paper Management:

[x] Implement PDF upload and processing pipeline for user-uploaded research papers.

[x] Implement a tRPC procedure for research.getTrendingTopics.

[x] Display a "What's New" or "Trending" section on the user dashboard.

Simple Topic/Keyword Lookup:

[x] Populate a collection of key research topics and definitions in Firestore.

[x] Implement tRPC procedures for topics.getTopicDetails.

[x] Create a simple search/lookup feature on the frontend for quick definitions.

Phase 3: Testing & Refinement (Weeks 7-8)
Unit/Component Testing:

[ ] Write Vitest tests for core utility functions and tRPC procedures.

[ ] Write Testing Library tests for key React components (e.g., chat interface, paper display card).

Storybook Setup:

[ ] Configure Storybook for the apps/web workspace.

[ ] Create stories for shadcn/ui components and custom composite components.

[ ] Implement Storybook interaction tests to verify component behavior.

End-to-End Testing:

[ ] Set up Playwright for E2E testing.

[ ] Write basic E2E tests for critical user flows (e.g., login, ask a research question, view a paper).

Linting & Formatting:

[ ] Ensure ESLint and Prettier are configured and integrated into the CI/CD pipeline.

[ ] Run a full pass to address all linting and formatting issues before release.
# Scholar AI Git Branches

## Current Branches

### 🌿 main
- **Purpose**: Production-ready code
- **Status**: Current stable version
- **Contains**: All working features including RAG engine, frontend, and backend

### 🌿 phase-1  
- **Purpose**: Phase 1 development and features
- **Status**: Created from main branch
- **Contains**: Current state of the project
- **Use**: For Phase 1 specific development work

### 🌿 phase-2
- **Purpose**: Phase 2 development and features  
- **Status**: Created from main branch
- **Contains**: Current state of the project
- **Use**: For Phase 2 specific development work

## Branch Management

### Switching Between Branches
```bash
# Switch to Phase 1
git checkout phase-1

# Switch to Phase 2  
git checkout phase-2

# Switch back to main
git checkout main
```

### Creating New Features
```bash
# Create feature branch from Phase 1
git checkout phase-1
git checkout -b feature/phase-1-feature-name

# Create feature branch from Phase 2
git checkout phase-2
git checkout -b feature/phase-2-feature-name
```

### Merging Changes
```bash
# Merge Phase 1 changes to main
git checkout main
git merge phase-1

# Merge Phase 2 changes to main
git checkout main
git merge phase-2
```

## Phase Definitions

### Phase 1
- Basic RAG functionality ✅
- Frontend interface ✅
- Document upload ✅
- Query interface ✅
- Authentication ✅

### Phase 2  
- Advanced RAG features
- Better PDF processing
- Vector search implementation
- Performance optimizations
- Additional AI models

## Current Status
- ✅ All branches created successfully
- ✅ Phase 1 branch is currently active
- ✅ Ready for development work

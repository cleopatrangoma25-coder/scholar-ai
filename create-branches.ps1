# Create Phase 1 and Phase 2 branches
Write-Host "Creating Phase 1 and Phase 2 branches..."

# Create Phase 1 branch
git branch phase-1
Write-Host "✅ Created phase-1 branch"

# Create Phase 2 branch  
git branch phase-2
Write-Host "✅ Created phase-2 branch"

# List all branches
Write-Host "`nAll branches:"
git branch -a

Write-Host "`n✅ Branches created successfully!"
Write-Host "To switch to a branch, use: git checkout phase-1 or git checkout phase-2"

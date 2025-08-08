# Create Phase 1 and Phase 2 branches properly
Write-Host "Creating Phase 1 and Phase 2 branches properly..." -ForegroundColor Green

Write-Host "`nCurrent branch:" -ForegroundColor Yellow
git branch

Write-Host "`nCreating phase-1 branch..." -ForegroundColor Yellow
git branch phase-1

Write-Host "`nCreating phase-2 branch..." -ForegroundColor Yellow
git branch phase-2

Write-Host "`nAll branches now:" -ForegroundColor Yellow
git branch -a

Write-Host "`nSwitching to phase-1..." -ForegroundColor Yellow
git checkout phase-1

Write-Host "`nCurrent branch after switch:" -ForegroundColor Yellow
git branch

Write-Host "`n✅ Branches created and switched to phase-1!" -ForegroundColor Green
Write-Host "You should now see the phase-1 branch in your git interface." -ForegroundColor Cyan

Read-Host "Press Enter to continue"

@echo off
echo Creating Phase 1 and Phase 2 branches...

git branch phase-1
echo ✅ Created phase-1 branch

git branch phase-2
echo ✅ Created phase-2 branch

echo.
echo All branches:
git branch -a

echo.
echo ✅ Branches created successfully!
echo To switch to a branch, use: git checkout phase-1 or git checkout phase-2
pause

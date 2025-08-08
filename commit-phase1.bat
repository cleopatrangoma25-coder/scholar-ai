@echo off
echo Committing Phase 1 changes to phase-1 branch...

git add .
echo ✅ Added all changes

git commit -F commit-message.txt
echo ✅ Committed Phase 1 changes

echo.
echo Current status:
git status

echo.
echo ✅ Phase 1 commit completed!
pause

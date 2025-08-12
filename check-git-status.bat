@echo off
echo ========================================
echo GIT STATUS CHECK
echo ========================================

echo.
echo Current branch:
git branch

echo.
echo Current commit:
git log --oneline -1

echo.
echo Files in current commit:
git show --name-only HEAD

echo.
echo Working directory status:
git status

echo.
echo Remote branches:
git branch -r

echo.
echo ========================================
echo If you don't see files in your git interface:
echo 1. Try refreshing your git GUI
echo 2. Make sure you're looking at the phase-1 branch
echo 3. Check if you need to push to remote
echo ========================================
pause

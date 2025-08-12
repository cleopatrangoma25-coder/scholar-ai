@echo off
echo ========================================
echo PUSHING BRANCHES TO REMOTE
echo ========================================

echo.
echo Pushing phase-1 branch to remote...
git push origin phase-1

echo.
echo Pushing phase-2 branch to remote...
git push origin phase-2

echo.
echo Pushing main branch to remote...
git push origin main

echo.
echo All branches pushed to remote!
echo You should now see the files in your git interface.
echo.
echo ========================================
echo TROUBLESHOOTING:
echo ========================================
echo 1. Run: git remote -v (to check remote URL)
echo 2. Run: git branch -a (to see all branches)
echo 3. Refresh your git GUI/interface
echo 4. Make sure you're looking at the correct branch
echo ========================================
pause

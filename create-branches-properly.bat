@echo off
echo Creating Phase 1 and Phase 2 branches properly...

echo.
echo Current branch:
git branch

echo.
echo Creating phase-1 branch...
git branch phase-1

echo.
echo Creating phase-2 branch...
git branch phase-2

echo.
echo All branches now:
git branch -a

echo.
echo Switching to phase-1...
git checkout phase-1

echo.
echo Current branch after switch:
git branch

echo.
echo ✅ Branches created and switched to phase-1!
echo You should now see the phase-1 branch in your git interface.
pause

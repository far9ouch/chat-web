@echo off
echo ===================================
echo    Updating GitHub Repository
echo ===================================

:: Add all changes
echo Adding changes...
git add .

:: Get commit message
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg="Updated chat application"
)

:: Commit changes
echo.
echo Committing changes...
git commit -m "%commit_msg%"

:: Push to GitHub
echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ===================================
echo    Update Complete!
echo ===================================
pause 
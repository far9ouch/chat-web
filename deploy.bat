@echo off
echo Deploying to GitHub...

:: Initialize Git if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    git remote add origin https://github.com/far9ouch/chat-web.git
)

:: Configure credential manager (only needed once)
git config --global credential.helper manager

:: Add all files
git add .

:: Commit changes
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    git commit -m "Update chat application"
) else (
    git commit -m "%commit_msg%"
)

:: Push to GitHub
git push -u origin main

echo.
echo Deployment complete!
pause 
@echo off
echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Making initial commit...
git commit -m "Initial commit: Complete ecommerce template with admin dashboard"

echo Setting main branch...
git branch -M main

echo.
echo Now create a new repository on GitHub and run:
echo git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
echo git push -u origin main
echo.
pause
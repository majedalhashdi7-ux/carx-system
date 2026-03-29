#!/bin/bash

# CAR X System - Quick Deployment Script
# This script automates the deployment process

echo "🚀 CAR X System - Quick Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the carx-system directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Step 2: Build the project
echo "🔨 Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Step 3: Check git status
echo "📋 Checking git status..."
git status

# Step 4: Add and commit changes
echo "💾 Committing changes..."
git add .
git commit -m "🚀 Final deployment commit - CAR X System ready"

# Step 5: Try to push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 CAR X System is ready for Vercel deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to vercel.com"
    echo "2. Create new project from GitHub repository: carx-system"
    echo "3. Set environment variables (see .env.example)"
    echo "4. Deploy and connect domain: daood.okigo.net"
    echo ""
    echo "🌐 Your site will be available at:"
    echo "   - Vercel URL: https://carx-system.vercel.app"
    echo "   - Custom Domain: https://daood.okigo.net"
else
    echo "⚠️  Push to GitHub failed. Please:"
    echo "1. Create GitHub repository: carx-system"
    echo "2. Set remote URL: git remote set-url origin https://github.com/majedalhashdi7-ux/carx-system.git"
    echo "3. Push manually: git push -u origin main"
fi

echo ""
echo "🎯 CAR X System deployment process completed!"
#!/bin/bash

# CAR X System Setup Script
# This script sets up the CAR X system for development and production

echo "🚀 Setting up CAR X System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual database credentials"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 CAR X System is ready!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env.local with your database credentials"
    echo "2. Run 'npm run dev' to start development server"
    echo "3. Visit http://localhost:3001 to see your site"
    echo ""
    echo "🌐 For production deployment:"
    echo "1. Create GitHub repository: carx-system"
    echo "2. Push code to GitHub"
    echo "3. Deploy to Vercel"
    echo "4. Connect domain: daood.okigo.net"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
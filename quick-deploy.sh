#!/bin/bash

echo "🚀 Deploying Test Metrics Action to serbangeorge-m GitHub profile"
echo "================================================================="

# Check if we're in the right directory
if [ ! -f "action.yml" ]; then
    echo "❌ Error: action.yml not found. Please run this from the project root."
    exit 1
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Test Metrics GitHub Action"
    echo "✅ Git repository initialized"
fi

# Add remote
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/serbangeorge-m/test-metrics-action.git
echo "✅ Remote added: https://github.com/serbangeorge-m/test-metrics-action.git"

# Build the action
echo "🔨 Building the action..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Commit and push
echo "📝 Committing and pushing..."
git add .
git commit -m "Build action for deployment v1.0.0"
git branch -M main
git push -u origin main

# Create release
echo "🏷️  Creating release v1.0.0..."
git tag v1.0.0
git push origin v1.0.0

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Your action is now available at:"
echo "https://github.com/serbangeorge-m/test-metrics-action"
echo ""
echo "Users can use it with:"
echo "uses: serbangeorge-m/test-metrics-action@v1"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/serbangeorge-m/test-metrics-action"
echo "2. Click 'Actions' tab"
echo "3. Click 'Publish this Action to the GitHub Marketplace'"
echo "4. Fill out the marketplace listing form"
echo "5. Submit for review"
echo ""
echo "🎯 Based on your profile, this action will be great for:"
echo "   - Your TypeScript/Node.js projects"
echo "   - Podman Desktop testing workflows"
echo "   - Container and Kubernetes testing"
echo "   - E2E testing with Playwright"

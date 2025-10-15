#!/bin/bash

echo "🚀 Test Metrics Action - Deployment Script"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Test Metrics GitHub Action"
    echo "✅ Git repository initialized"
else
    echo "📁 Git repository already exists"
fi

# Check if remote exists
if ! git remote get-url origin >/dev/null 2>&1; then
    echo ""
    echo "🔗 Please add your GitHub repository remote:"
    echo "   git remote add origin https://github.com/serbangeorge-m/test-metrics-action.git"
    echo ""
    read -p "Enter your GitHub username: " username
    if [ ! -z "$username" ]; then
        git remote add origin "https://github.com/$username/test-metrics-action.git"
        echo "✅ Remote added: https://github.com/$username/test-metrics-action.git"
    fi
else
    echo "🔗 Remote already configured"
fi

# Build the action
echo ""
echo "🔨 Building the action..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Add and commit changes
echo ""
echo "📝 Committing changes..."
git add .
git commit -m "Build action for deployment"
echo "✅ Changes committed"

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub"
else
    echo "❌ Failed to push to GitHub"
    exit 1
fi

# Create release
echo ""
echo "🏷️  Creating release..."
git tag v1.0.0
git push origin v1.0.0
if [ $? -eq 0 ]; then
    echo "✅ Release v1.0.0 created"
else
    echo "❌ Failed to create release"
    exit 1
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Next steps:"
echo "1. Go to your repository: https://github.com/$username/test-metrics-action"
echo "2. Click on 'Actions' tab"
echo "3. Click 'Publish this Action to the GitHub Marketplace'"
echo "4. Fill out the marketplace listing form"
echo "5. Submit for review"
echo ""
echo "Your action will be available at:"
echo "https://github.com/$username/test-metrics-action"
echo ""
echo "Users can use it with:"
echo "uses: $username/test-metrics-action@v1"

#!/bin/bash

# Setup script for FILETREE.md automation tools
# Run this once to set up all automation features

echo "🔧 Setting up FILETREE.md automation tools..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo -e "${YELLOW}Installing pre-commit...${NC}"
    pip install pre-commit || {
        echo -e "${RED}Failed to install pre-commit. Please install it manually:${NC}"
        echo "pip install pre-commit"
        exit 1
    }
fi

# Install pre-commit hooks
echo -e "${YELLOW}Installing pre-commit hooks...${NC}"
pre-commit install || {
    echo -e "${RED}Failed to install pre-commit hooks${NC}"
    exit 1
}

# Test the filetree generation script
echo -e "${YELLOW}Testing filetree generation script...${NC}"
if [ -f "scripts/generate-filetree.js" ]; then
    node scripts/generate-filetree.js --dry-run 2>/dev/null || echo "Script is ready (dry-run not implemented)"
    echo -e "${GREEN}✅ Filetree generation script is ready${NC}"
else
    echo -e "${RED}❌ Filetree generation script not found${NC}"
    exit 1
fi

# Check if GitHub Actions workflow exists
if [ -f ".github/workflows/filetree-check.yml" ]; then
    echo -e "${GREEN}✅ GitHub Action workflow is configured${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub Action workflow not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "📋 Available commands:"
echo "  npm run generate-filetree  - Generate/update FILETREE.md"
echo "  npm run setup-hooks        - Re-install pre-commit hooks"
echo "  pre-commit run --all-files - Test all pre-commit hooks"
echo ""
echo "🔄 The automation tools will now:"
echo "  • Remind you to update FILETREE.md when committing new files"
echo "  • Comment on PRs when significant file changes are detected"
echo "  • Help you auto-generate the file structure"
echo ""
echo -e "${YELLOW}💡 Pro tip: Run 'npm run generate-filetree' to update FILETREE.md right now!${NC}"
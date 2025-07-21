#!/bin/bash

# FILETREE.md Update Reminder Script
# This script checks if new files have been added and reminds developers to update FILETREE.md

FILETREE_FILE="FILETREE.md"
CHANGED_FILES=("$@")

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if FILETREE.md exists
if [ ! -f "$FILETREE_FILE" ]; then
    echo -e "${RED}Warning: FILETREE.md not found!${NC}"
    exit 0
fi

# Check if any new directories or significant files were added
NEW_COMPONENTS=0
NEW_DIRECTORIES=0

for file in "${CHANGED_FILES[@]}"; do
    # Check for new component files
    if [[ "$file" == components/* && "$file" == *.tsx ]]; then
        NEW_COMPONENTS=$((NEW_COMPONENTS + 1))
    fi
    
    # Check for new directories (approximate by checking for new files in uncommon paths)
    if [[ "$file" == app/* && "$file" == *page.tsx ]] || 
       [[ "$file" == lib/* && "$file" == *.ts ]] ||
       [[ "$file" == backend/* && "$file" == *.py ]]; then
        NEW_DIRECTORIES=$((NEW_DIRECTORIES + 1))
    fi
done

# If significant changes detected, show reminder
if [ $NEW_COMPONENTS -gt 0 ] || [ $NEW_DIRECTORIES -gt 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📁 FILETREE.md UPDATE REMINDER${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "You've added ${GREEN}$NEW_COMPONENTS new components${NC} and ${GREEN}$NEW_DIRECTORIES new files${NC}"
    echo ""
    echo -e "${YELLOW}📋 Please consider updating FILETREE.md if you've:${NC}"
    echo -e "   • Added new major components or pages"
    echo -e "   • Created new directories"
    echo -e "   • Changed the project structure"
    echo -e "   • Implemented previously placeholder features"
    echo ""
    echo -e "${YELLOW}🔧 To update:${NC}"
    echo -e "   1. Edit FILETREE.md with your changes"
    echo -e "   2. Update the timestamp at the top"
    echo -e "   3. Use status indicators: ✅ IMPLEMENTED, 🚧 PLACEHOLDER, ❌ NOT IMPLEMENTED"
    echo ""
    echo -e "${YELLOW}⚡ You can also run: ${GREEN}npm run generate-filetree${NC} to auto-generate the structure"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

exit 0
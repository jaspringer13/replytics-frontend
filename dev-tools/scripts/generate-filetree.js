#!/usr/bin/env node

/**
 * FILETREE.md Auto-generation Script
 * Generates a basic file structure that developers can annotate with status indicators
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'FILETREE.md');
const BACKUP_FILE = path.join(ROOT_DIR, 'FILETREE.md.backup');

// Directories to include in the file tree
const INCLUDE_DIRS = [
  'app',
  'components', 
  'lib',
  'backend',
  'supabase',
  'scripts',
  'hooks',
  'contexts',
  'utils',
  'styles',
  'public'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.sql', '.md', '.json',
  '.css', '.scss', '.env.example'
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build',
  '.env',
  '.env.local',
  'package-lock.json',
  'yarn.lock',
  '.DS_Store',
  'Thumbs.db'
];

// Status indicators mapping (can be customized)
const STATUS_INDICATORS = {
  '✅': 'IMPLEMENTED',
  '🚧': 'PLACEHOLDER', 
  '❌': 'NOT IMPLEMENTED'
};

/**
 * Check if a file/directory should be ignored
 */
function shouldIgnore(name, fullPath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('/')) {
      return fullPath.includes(pattern);
    }
    return name === pattern || name.startsWith(pattern);
  });
}

/**
 * Check if a file should be included based on extension
 */
function shouldIncludeFile(filename) {
  if (filename.startsWith('.') && filename !== '.env.example') {
    return false;
  }
  
  const ext = path.extname(filename);
  return ext === '' || INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Generate tree structure recursively
 */
function generateTree(dirPath, prefix = '', level = 0) {
  const items = [];
  
  // Limit depth to avoid overly deep trees
  if (level > 4) return items;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(ROOT_DIR, fullPath);
      
      if (shouldIgnore(entry.name, relativePath)) {
        return;
      }
      
      const connector = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      
      if (entry.isDirectory()) {
        // Only include directories that are in our include list or are subdirectories
        const shouldIncludeDir = level === 0 ? 
          INCLUDE_DIRS.includes(entry.name) : 
          true;
          
        if (shouldIncludeDir) {
          items.push(`${prefix}${connector}${entry.name}/`);
          items.push(...generateTree(fullPath, nextPrefix, level + 1));
        }
      } else {
        if (shouldIncludeFile(entry.name)) {
          // Add comment based on file type
          let comment = '';
          const ext = path.extname(entry.name);
          
          if (ext === '.tsx' && relativePath.includes('page.tsx')) {
            comment = ' # Page component';
          } else if (ext === '.tsx' && relativePath.includes('layout.tsx')) {
            comment = ' # Layout component';
          } else if (ext === '.tsx') {
            comment = ' # React component';
          } else if (ext === '.ts') {
            comment = ' # TypeScript module';
          } else if (ext === '.py') {
            comment = ' # Python module';
          } else if (ext === '.sql') {
            comment = ' # Database migration';
          } else if (entry.name === 'package.json') {
            comment = ' # Project dependencies';
          } else if (entry.name.includes('config')) {
            comment = ' # Configuration';
          }
          
          items.push(`${prefix}${connector}${entry.name}${comment}`);
        }
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
  }
  
  return items;
}

/**
 * Generate the complete FILETREE.md content
 */
function generateFileTreeContent() {
  const timestamp = new Date().toISOString().replace('T', ' at ').slice(0, -5) + ' UTC';
  
  const header = `# Replytics Website File Structure

**Last Updated:** ${timestamp}

## Maintenance & Automation

This file tree documentation requires regular updates as the project evolves. To maintain accuracy:

### Automation Options
1. **Pre-commit Hook**: Automatically reminds developers to update FILETREE.md when new files are added
2. **GitHub Action**: Detects file structure changes and creates PR reminders for documentation updates  
3. **Auto-generation Script**: Generates the basic file structure, allowing developers to add status annotations

### Update Process
- Update this file when adding/removing major components
- Use the status indicators: ✅ IMPLEMENTED, 🚧 PLACEHOLDER, ❌ NOT IMPLEMENTED
- Keep the timestamp current when making changes
- Run \`npm run generate-filetree\` to regenerate the basic structure

### Status Indicators
- ✅ **IMPLEMENTED**: Feature is complete and working
- 🚧 **PLACEHOLDER**: Basic structure exists, needs implementation  
- ❌ **NOT IMPLEMENTED**: Planned feature, not started yet

---

\`\`\`text`;

  const tree = generateTree(ROOT_DIR);
  const projectName = path.basename(ROOT_DIR);
  
  const footer = `\`\`\`

## Notes

- This file tree was auto-generated on ${timestamp}
- Add status indicators (✅🚧❌) next to components as you work on them
- Keep implementation status updated for better project tracking
- Focus on major components and architectural elements

## Quick Status Update Commands

\`\`\`bash
# Regenerate the file tree structure
npm run generate-filetree

# Install pre-commit hooks
npm run setup-hooks

# Check what needs documentation updates
git diff --name-only HEAD~1 | grep -E "\\.(tsx?|py|sql)$"
\`\`\``;

  return `${header}
${projectName}/
${tree.join('\n')}
${footer}`;
}

/**
 * Backup existing FILETREE.md if it exists
 */
function backupExistingFile() {
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
      console.log('✅ Backed up existing FILETREE.md to FILETREE.md.backup');
      return true;
    } catch (error) {
      console.warn('⚠️  Could not backup existing file:', error.message);
      return false;
    }
  }
  return false;
}

/**
 * Main execution
 */
function main() {
  console.log('🌳 Generating FILETREE.md...\n');
  
  // Backup existing file
  const hadBackup = backupExistingFile();
  
  try {
    // Generate new content
    const content = generateFileTreeContent();
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
    
    console.log('✅ FILETREE.md generated successfully!');
    console.log(`📍 Location: ${OUTPUT_FILE}`);
    
    if (hadBackup) {
      console.log(`💾 Backup saved: ${BACKUP_FILE}`);
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated file tree');
    console.log('2. Add status indicators (✅🚧❌) to components');
    console.log('3. Add architectural notes and comments');
    console.log('4. Commit the updated FILETREE.md');
    
    console.log('\n💡 Tip: Use the backup file to preserve any custom annotations!');
    
  } catch (error) {
    console.error('❌ Error generating FILETREE.md:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateFileTreeContent, generateTree };
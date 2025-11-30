#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UntranslatedString {
  file: string;
  line: number;
  text: string;
}

class UntranslatedStringChecker {
  private untranslatedStrings: UntranslatedString[] = [];
  private baseDir: string;
  private excludePatterns = [
    /^[0-9]+$/, // Numbers
    /^[A-Z0-9_]+$/, // Constants
    /^\//, // URLs/paths
    /^https?:\/\//, // URLs
    /^\w+\.\w+/, // Object properties
    /^[a-z]+(-[a-z]+)*$/, // CSS classes
    /^#[0-9A-Fa-f]{6}$/, // Hex colors
  ];

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async check(): Promise<void> {
    console.log('🔍 Checking for untranslated strings in TSX files...\n');
    
    // Find all TSX files in the locale directory
    const tsxFiles = await glob('**/*.tsx', {
      cwd: this.baseDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.next/**', '**/translations/**'],
    });

    for (const file of tsxFiles) {
      await this.checkFile(file);
    }

    this.printResults();
  }

  private async checkFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativeFile = path.relative(this.baseDir, filePath);

    // Skip if file imports translations
    if (content.includes('useTranslations') || 
        content.includes('getPageDictionary') ||
        content.includes('dict.') ||
        content.includes('{t(')) {
      // File is using translations, skip detailed check
      return;
    }

    lines.forEach((line, index) => {
      // Check for hardcoded strings in JSX
      const jsxTextMatches = line.matchAll(/>([^<>{]+)</g);
      for (const match of jsxTextMatches) {
        const text = match[1].trim();
        if (this.isUntranslated(text)) {
          this.untranslatedStrings.push({
            file: relativeFile,
            line: index + 1,
            text: text,
          });
        }
      }

      // Check for hardcoded strings in props
      const propMatches = line.matchAll(/(?:title|label|placeholder|description|info|text|message|error|helper)=["']([^"']+)["']/g);
      for (const match of propMatches) {
        const text = match[1].trim();
        if (this.isUntranslated(text)) {
          this.untranslatedStrings.push({
            file: relativeFile,
            line: index + 1,
            text: text,
          });
        }
      }

      // Check for hardcoded strings in variables
      const varMatches = line.matchAll(/(?:const|let|var)\s+\w+\s*=\s*["']([^"']+)["']/g);
      for (const match of varMatches) {
        const text = match[1].trim();
        if (this.isUntranslated(text) && text.includes(' ')) {
          this.untranslatedStrings.push({
            file: relativeFile,
            line: index + 1,
            text: text,
          });
        }
      }
    });
  }

  private isUntranslated(text: string): boolean {
    // Skip empty strings
    if (!text || text.length < 2) return false;
    
    // Skip if matches exclude patterns
    for (const pattern of this.excludePatterns) {
      if (pattern.test(text)) return false;
    }
    
    // Skip single words that might be component names or IDs
    if (!text.includes(' ') && text.length < 20) return false;
    
    // Consider as untranslated if contains actual words
    return /[a-zA-Z]{2,}/.test(text);
  }

  private printResults(): void {
    if (this.untranslatedStrings.length === 0) {
      console.log('✅ No obvious untranslated strings found!\n');
      console.log('Note: Some files may need manual review for context-specific strings.\n');
      return;
    }

    console.log(`Found ${this.untranslatedStrings.length} potentially untranslated strings:\n`);
    
    // Group by file
    const byFile = this.untranslatedStrings.reduce((acc, item) => {
      if (!acc[item.file]) acc[item.file] = [];
      acc[item.file].push(item);
      return acc;
    }, {} as Record<string, UntranslatedString[]>);

    for (const [file, strings] of Object.entries(byFile)) {
      console.log(`📁 ${file}`);
      strings.forEach(item => {
        console.log(`   Line ${item.line}: "${item.text}"`);
      });
      console.log('');
    }

    console.log('Summary:');
    console.log(`  Files with untranslated strings: ${Object.keys(byFile).length}`);
    console.log(`  Total untranslated strings: ${this.untranslatedStrings.length}`);
    console.log('\nConsider adding these strings to translation files or marking them as intentionally untranslated.');
  }
}

// Run the checker
const checker = new UntranslatedStringChecker(path.join(__dirname, '../app/[locale]'));
checker.check().catch(console.error);
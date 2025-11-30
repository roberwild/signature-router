#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

class TranslationValidator {
  private results: ValidationResult[] = [];
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async validate(): Promise<void> {
    console.log('🔍 Validating translation files...\n');
    
    // Find all translation directories
    const translationDirs = await glob('**/translations', {
      cwd: this.baseDir,
      absolute: true,
    });

    for (const dir of translationDirs) {
      await this.validateTranslationDirectory(dir);
    }

    this.printResults();
  }

  private async validateTranslationDirectory(dir: string): Promise<void> {
    const esFile = path.join(dir, 'es.json');
    const enFile = path.join(dir, 'en.json');
    
    // Skip if directory has subdirectories (it's a parent directory)
    const contents = fs.readdirSync(dir);
    const hasSubdirs = contents.some(item => 
      fs.statSync(path.join(dir, item)).isDirectory()
    );
    if (hasSubdirs && !fs.existsSync(esFile) && !fs.existsSync(enFile)) {
      return; // Skip parent directories
    }
    
    const result: ValidationResult = {
      file: path.relative(this.baseDir, dir),
      errors: [],
      warnings: [],
    };

    // Check if both language files exist
    if (!fs.existsSync(esFile)) {
      result.errors.push('Missing Spanish translation file (es.json)');
    }
    if (!fs.existsSync(enFile)) {
      result.errors.push('Missing English translation file (en.json)');
    }

    // If both files exist, compare their structure
    if (fs.existsSync(esFile) && fs.existsSync(enFile)) {
      try {
        const esContent = JSON.parse(fs.readFileSync(esFile, 'utf-8'));
        const enContent = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
        
        // Validate JSON structure
        this.validateJsonStructure(esContent, enContent, result);
        
        // Check for missing keys
        this.compareKeys(esContent, enContent, 'es', 'en', result);
        this.compareKeys(enContent, esContent, 'en', 'es', result);
        
        // Check for empty translations
        this.checkEmptyValues(esContent, 'es', result);
        this.checkEmptyValues(enContent, 'en', result);
        
      } catch (error) {
        result.errors.push(`JSON parsing error: ${error}`);
      }
    }

    if (result.errors.length > 0 || result.warnings.length > 0) {
      this.results.push(result);
    }
  }

  private validateJsonStructure(obj1: unknown, obj2: unknown, result: ValidationResult): void {
    // Check if both have the same top-level structure
    const keys1 = Object.keys(obj1 as Record<string, unknown>).sort();
    const keys2 = Object.keys(obj2 as Record<string, unknown>).sort();
    
    if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
      result.warnings.push('Translation files have different top-level structure');
    }
  }

  private compareKeys(obj1: unknown, obj2: unknown, lang1: string, lang2: string, result: ValidationResult, path: string = ''): void {
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return;
    }

    const typedObj1 = obj1 as Record<string, unknown>;
    const typedObj2 = obj2 as Record<string, unknown>;

    for (const key in typedObj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in typedObj2)) {
        result.errors.push(`Missing key in ${lang2}: ${currentPath}`);
      } else if (typeof typedObj1[key] === 'object' && typedObj1[key] !== null) {
        if (typeof typedObj2[key] !== 'object' || typedObj2[key] === null) {
          result.errors.push(`Type mismatch at ${currentPath}: object in ${lang1}, ${typeof typedObj2[key]} in ${lang2}`);
        } else {
          this.compareKeys(typedObj1[key], typedObj2[key], lang1, lang2, result, currentPath);
        }
      }
    }
  }

  private checkEmptyValues(obj: unknown, lang: string, result: ValidationResult, path: string = ''): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    const typedObj = obj as Record<string, unknown>;

    for (const key in typedObj) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof typedObj[key] === 'string') {
        const value = typedObj[key] as string;
        if (value.trim() === '') {
          result.warnings.push(`Empty translation in ${lang}: ${currentPath}`);
        }
        // Check for untranslated placeholders
        if (value.includes('TODO') || value.includes('TRANSLATE')) {
          result.warnings.push(`Untranslated placeholder in ${lang}: ${currentPath}`);
        }
      } else if (typeof typedObj[key] === 'object' && typedObj[key] !== null) {
        this.checkEmptyValues(typedObj[key], lang, result, currentPath);
      }
    }
  }

  private printResults(): void {
    if (this.results.length === 0) {
      console.log('✅ All translation files are valid!\n');
      return;
    }

    console.log(`Found issues in ${this.results.length} translation directories:\n`);
    
    for (const result of this.results) {
      console.log(`📁 ${result.file}`);
      
      if (result.errors.length > 0) {
        console.log('  ❌ Errors:');
        result.errors.forEach(error => console.log(`     - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`     - ${warning}`));
      }
      
      console.log('');
    }

    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);
    
    console.log('Summary:');
    console.log(`  Total Errors: ${totalErrors}`);
    console.log(`  Total Warnings: ${totalWarnings}`);
    
    if (totalErrors > 0) {
      process.exit(1);
    }
  }
}

// Run the validator
const validator = new TranslationValidator(path.join(__dirname, '../app/[locale]'));
validator.validate().catch(console.error);
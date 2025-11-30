#!/usr/bin/env tsx
import {  defaultLocale, isValidLocale } from '../lib/i18n';

class LocaleSwitchingTester {
  async test(): Promise<void> {
    console.log('🔍 Testing locale switching functionality...\n');
    
    const tests = [
      this.testLocaleValidation(),
      this.testDefaultLocale(),
      this.testLocaleDetection(),
      this.testPathGeneration(),
    ];

    const results = await Promise.all(tests);
    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
  }

  private testLocaleValidation(): boolean {
    console.log('Testing locale validation...');
    
    const validTests = [
      { input: 'es', expected: true },
      { input: 'en', expected: true },
      { input: 'fr', expected: false },
      { input: 'de', expected: false },
      { input: '', expected: false },
      { input: null, expected: false },
    ];

    let passed = true;
    for (const test of validTests) {
      const result = isValidLocale(test.input as string);
      if (result !== test.expected) {
        console.log(`  ❌ Failed: isValidLocale('${test.input}') = ${result}, expected ${test.expected}`);
        passed = false;
      } else {
        console.log(`  ✅ Passed: isValidLocale('${test.input}') = ${result}`);
      }
    }

    return passed;
  }

  private testDefaultLocale(): boolean {
    console.log('\nTesting default locale...');
    
    if (defaultLocale === 'es') {
      console.log(`  ✅ Default locale is correctly set to 'es'`);
      return true;
    } else {
      console.log(`  ❌ Default locale is '${defaultLocale}', expected 'es'`);
      return false;
    }
  }

  private testLocaleDetection(): boolean {
    console.log('\nTesting locale detection from paths...');
    
    const pathTests = [
      { path: '/es/organizations/test', expectedLocale: 'es' },
      { path: '/en/organizations/test', expectedLocale: 'en' },
      { path: '/organizations/test', expectedLocale: null },
      { path: '/fr/organizations/test', expectedLocale: null },
    ];

    let passed = true;
    for (const test of pathTests) {
      const segments = test.path.split('/').filter(s => s);
      const detectedLocale = segments[0] && isValidLocale(segments[0]) ? segments[0] : null;
      
      if (detectedLocale !== test.expectedLocale) {
        console.log(`  ❌ Failed: Path '${test.path}' detected as '${detectedLocale}', expected '${test.expectedLocale}'`);
        passed = false;
      } else {
        console.log(`  ✅ Passed: Path '${test.path}' correctly detected as '${detectedLocale}'`);
      }
    }

    return passed;
  }

  private testPathGeneration(): boolean {
    console.log('\nTesting path generation for locale switching...');
    
    const pathTests = [
      { 
        currentPath: '/es/organizations/test/assessments',
        newLocale: 'en',
        expected: '/en/organizations/test/assessments'
      },
      { 
        currentPath: '/en/organizations/test/incidents',
        newLocale: 'es',
        expected: '/es/organizations/test/incidents'
      },
    ];

    let passed = true;
    for (const test of pathTests) {
      const newPath = test.currentPath.replace(/^\/[^/]+/, `/${test.newLocale}`);
      
      if (newPath !== test.expected) {
        console.log(`  ❌ Failed: Switching '${test.currentPath}' to '${test.newLocale}' = '${newPath}', expected '${test.expected}'`);
        passed = false;
      } else {
        console.log(`  ✅ Passed: Switching '${test.currentPath}' to '${test.newLocale}' = '${newPath}'`);
      }
    }

    return passed;
  }
}

// Run the tester
const tester = new LocaleSwitchingTester();
tester.test().catch(console.error);
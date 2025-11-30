#!/usr/bin/env tsx
import { performance } from 'perf_hooks';
import path from 'path';
import { locales } from '../lib/i18n';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PerformanceMetric {
  operation: string;
  duration: number;
  size?: number;
}

class I18nPerformanceTester {
  private metrics: PerformanceMetric[] = [];

  async test(): Promise<void> {
    console.log('📊 Measuring i18n performance...\n');
    
    await this.measureTranslationFileLoading();
    await this.measureCachePerformance();
    await this.measureBundleSize();
    
    this.printResults();
  }

  private async measureTranslationFileLoading(): Promise<void> {
    console.log('Testing translation file loading times...');
    
    const testPaths = [
      'shared/translations/common',
      'shared/translations/navigation',
      'shared/translations/forms',
    ];

    for (const testPath of testPaths) {
      for (const locale of locales) {
        const start = performance.now();
        
        try {
          const filePath = path.join(
            __dirname,
            `../app/[locale]/${testPath}/${locale}.json`
          );
          const content = fs.readFileSync(filePath, 'utf-8');
          const _json = JSON.parse(content);
          
          const end = performance.now();
          const duration = end - start;
          
          this.metrics.push({
            operation: `Load ${testPath}/${locale}.json`,
            duration: Number(duration.toFixed(2)),
            size: Buffer.byteLength(content, 'utf-8'),
          });
          
          console.log(`  ✅ ${testPath}/${locale}.json: ${duration.toFixed(2)}ms (${Buffer.byteLength(content, 'utf-8')} bytes)`);
        } catch (_error) {
          console.log(`  ❌ Failed to load ${testPath}/${locale}.json`);
        }
      }
    }
  }

  private async measureCachePerformance(): Promise<void> {
    console.log('\nTesting cache performance...');
    
    const cache = new Map<string, unknown>();
    const testData = { test: 'data', nested: { value: 'test' } };
    const iterations = 10000;

    // Test cache write performance
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      cache.set(`key_${i}`, testData);
    }
    const writeEnd = performance.now();
    const writeDuration = writeEnd - writeStart;
    
    this.metrics.push({
      operation: `Cache write (${iterations} items)`,
      duration: Number(writeDuration.toFixed(2)),
    });
    
    console.log(`  ✅ Cache write (${iterations} items): ${writeDuration.toFixed(2)}ms`);

    // Test cache read performance
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      cache.get(`key_${i}`);
    }
    const readEnd = performance.now();
    const readDuration = readEnd - readStart;
    
    this.metrics.push({
      operation: `Cache read (${iterations} items)`,
      duration: Number(readDuration.toFixed(2)),
    });
    
    console.log(`  ✅ Cache read (${iterations} items): ${readDuration.toFixed(2)}ms`);
  }

  private async measureBundleSize(): Promise<void> {
    console.log('\nCalculating translation bundle sizes...');
    
    const translationDirs = [
      'app/[locale]/shared/translations',
      'app/[locale]/organizations/[slug]/(organization)/assessments/translations',
      'app/[locale]/organizations/[slug]/(organization)/incidents/translations',
      'app/[locale]/organizations/[slug]/(organization)/cis-18/translations',
      'app/[locale]/organizations/[slug]/(organization)/services/translations',
      'app/[locale]/organizations/[slug]/(organization)/home/translations',
    ];

    let totalSize = 0;
    const sizeByLocale: Record<string, number> = { es: 0, en: 0 };

    for (const dir of translationDirs) {
      const fullPath = path.join(__dirname, '..', dir);
      
      if (fs.existsSync(fullPath)) {
        for (const locale of locales) {
          const filePath = path.join(fullPath, `${locale}.json`);
          
          if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath).size;
            totalSize += size;
            sizeByLocale[locale] += size;
          }
        }
      }
    }

    this.metrics.push({
      operation: 'Total translation bundle size',
      duration: 0,
      size: totalSize,
    });

    console.log(`  📦 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`  📦 Spanish translations: ${(sizeByLocale.es / 1024).toFixed(2)} KB`);
    console.log(`  📦 English translations: ${(sizeByLocale.en / 1024).toFixed(2)} KB`);
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(50));
    console.log('Performance Summary:\n');

    // Calculate averages
    const loadingMetrics = this.metrics.filter(m => m.operation.includes('Load'));
    const avgLoadTime = loadingMetrics.reduce((sum, m) => sum + m.duration, 0) / loadingMetrics.length;
    
    console.log(`Average file load time: ${avgLoadTime.toFixed(2)}ms`);
    
    const totalBundleSize = this.metrics.find(m => m.operation === 'Total translation bundle size')?.size || 0;
    console.log(`Total bundle size: ${(totalBundleSize / 1024).toFixed(2)} KB`);
    
    // Performance recommendations
    console.log('\nRecommendations:');
    
    if (avgLoadTime > 10) {
      console.log('  ⚠️  Consider implementing lazy loading for non-critical translations');
    } else {
      console.log('  ✅ File loading performance is good');
    }
    
    if (totalBundleSize > 100 * 1024) {
      console.log('  ⚠️  Translation bundle is large, consider code splitting');
    } else {
      console.log('  ✅ Bundle size is acceptable');
    }
    
    const cacheWrite = this.metrics.find(m => m.operation.includes('Cache write'))?.duration || 0;
    if (cacheWrite > 100) {
      console.log('  ⚠️  Cache write performance could be improved');
    } else {
      console.log('  ✅ Cache performance is optimal');
    }
  }
}

// Run the tester
const tester = new I18nPerformanceTester();
tester.test().catch(console.error);
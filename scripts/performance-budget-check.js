#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates Lighthouse CI results against performance budgets
 */

const fs = require('fs');
const path = require('path');

// Performance budgets
const BUDGETS = {
  // Core Web Vitals (milliseconds)
  lcp: 2500,       // Largest Contentful Paint
  fcp: 1800,       // First Contentful Paint  
  si: 3000,        // Speed Index
  cls: 0.1,        // Cumulative Layout Shift
  tbt: 300,        // Total Blocking Time

  // Performance scores (0-100)
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 90,

  // Resource sizes (bytes, gzipped)
  bundleSize: 200 * 1024,  // 200KB for product page
  imageSize: 800 * 1024,   // 800KB total images
  totalSize: 1500 * 1024   // 1.5MB total page size
};

// Mobile-specific budgets (stricter)
const MOBILE_BUDGETS = {
  ...BUDGETS,
  lcp: 2500,       // Same LCP target for mobile
  fcp: 2000,       // Slightly more lenient FCP
  si: 3500,        // Higher SI allowance
  tbt: 300,        // Same TBT target
  bundleSize: 200 * 1024,  // Same bundle size limit
  imageSize: 600 * 1024,   // Smaller images for mobile
  totalSize: 1200 * 1024   // Smaller total size
};

class PerformanceBudgetChecker {
  constructor() {
    this.reportsDir = process.env.LIGHTHOUSE_REPORTS_DIR || '.lighthouseci';
    this.violations = [];
    this.results = {
      desktop: {},
      mobile: {},
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        violations: []
      }
    };
  }

  /**
   * Format milliseconds to readable format
   */
  formatMs(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  /**
   * Format bytes to readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Check if a metric violates the budget
   */
  checkBudget(metric, value, budget, context = {}) {
    const violation = {
      metric,
      value,
      budget,
      passes: value <= budget,
      overBy: value > budget ? value - budget : 0,
      percentageOver: value > budget ? ((value - budget) / budget * 100).toFixed(1) : 0,
      ...context
    };

    this.results.summary.totalChecks++;
    
    if (violation.passes) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      this.results.summary.violations.push(violation);
      this.violations.push(violation);
    }

    return violation;
  }

  /**
   * Analyze Lighthouse report
   */
  analyzeReport(reportPath, isMobile = false) {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const budgets = isMobile ? MOBILE_BUDGETS : BUDGETS;
      const deviceType = isMobile ? 'mobile' : 'desktop';
      
      console.log(`\n📊 Analyzing ${deviceType} performance...`);
      console.log(`📄 Report: ${path.basename(reportPath)}`);
      console.log(`🌐 URL: ${report.finalUrl || report.requestedUrl}`);

      const results = {
        url: report.finalUrl || report.requestedUrl,
        scores: {},
        metrics: {},
        violations: []
      };

      // Check performance scores
      const categories = report.categories || {};
      
      if (categories.performance) {
        const score = Math.round(categories.performance.score * 100);
        const check = this.checkBudget('performance', score, budgets.performance, {
          type: 'score',
          deviceType,
          url: results.url
        });
        results.scores.performance = check;
        console.log(`  ${check.passes ? '✅' : '❌'} Performance Score: ${score}/100 (budget: ${budgets.performance})`);
      }

      if (categories.accessibility) {
        const score = Math.round(categories.accessibility.score * 100);
        const check = this.checkBudget('accessibility', score, budgets.accessibility, {
          type: 'score',
          deviceType,
          url: results.url
        });
        results.scores.accessibility = check;
        console.log(`  ${check.passes ? '✅' : '❌'} Accessibility Score: ${score}/100 (budget: ${budgets.accessibility})`);
      }

      // Check Core Web Vitals
      const audits = report.audits || {};
      
      if (audits['largest-contentful-paint']) {
        const lcp = Math.round(audits['largest-contentful-paint'].numericValue);
        const check = this.checkBudget('lcp', lcp, budgets.lcp, {
          type: 'metric',
          deviceType,
          url: results.url
        });
        results.metrics.lcp = check;
        console.log(`  ${check.passes ? '✅' : '❌'} LCP: ${this.formatMs(lcp)} (budget: ${this.formatMs(budgets.lcp)})`);
      }

      if (audits['first-contentful-paint']) {
        const fcp = Math.round(audits['first-contentful-paint'].numericValue);
        const check = this.checkBudget('fcp', fcp, budgets.fcp, {
          type: 'metric',
          deviceType,
          url: results.url
        });
        results.metrics.fcp = check;
        console.log(`  ${check.passes ? '✅' : '❌'} FCP: ${this.formatMs(fcp)} (budget: ${this.formatMs(budgets.fcp)})`);
      }

      if (audits['speed-index']) {
        const si = Math.round(audits['speed-index'].numericValue);
        const check = this.checkBudget('si', si, budgets.si, {
          type: 'metric',
          deviceType,
          url: results.url
        });
        results.metrics.si = check;
        console.log(`  ${check.passes ? '✅' : '❌'} Speed Index: ${this.formatMs(si)} (budget: ${this.formatMs(budgets.si)})`);
      }

      if (audits['cumulative-layout-shift']) {
        const cls = parseFloat(audits['cumulative-layout-shift'].numericValue.toFixed(3));
        const check = this.checkBudget('cls', cls, budgets.cls, {
          type: 'metric',
          deviceType,
          url: results.url
        });
        results.metrics.cls = check;
        console.log(`  ${check.passes ? '✅' : '❌'} CLS: ${cls} (budget: ${budgets.cls})`);
      }

      if (audits['total-blocking-time']) {
        const tbt = Math.round(audits['total-blocking-time'].numericValue);
        const check = this.checkBudget('tbt', tbt, budgets.tbt, {
          type: 'metric',
          deviceType,
          url: results.url
        });
        results.metrics.tbt = check;
        console.log(`  ${check.passes ? '✅' : '❌'} TBT: ${this.formatMs(tbt)} (budget: ${this.formatMs(budgets.tbt)})`);
      }

      // Check resource sizes
      if (audits['total-byte-weight']) {
        const totalSize = audits['total-byte-weight'].numericValue;
        const check = this.checkBudget('totalSize', totalSize, budgets.totalSize, {
          type: 'size',
          deviceType,
          url: results.url
        });
        results.metrics.totalSize = check;
        console.log(`  ${check.passes ? '✅' : '❌'} Total Size: ${this.formatBytes(totalSize)} (budget: ${this.formatBytes(budgets.totalSize)})`);
      }

      // Check JavaScript bundle size
      if (audits['unused-javascript']) {
        const items = audits['unused-javascript'].details?.items || [];
        const jsSize = items.reduce((sum, item) => sum + (item.totalBytes || 0), 0);
        
        if (jsSize > 0) {
          const check = this.checkBudget('bundleSize', jsSize, budgets.bundleSize, {
            type: 'size',
            deviceType,
            url: results.url
          });
          results.metrics.bundleSize = check;
          console.log(`  ${check.passes ? '✅' : '❌'} JS Bundle: ${this.formatBytes(jsSize)} (budget: ${this.formatBytes(budgets.bundleSize)})`);
        }
      }

      this.results[deviceType] = results;
      return results;

    } catch (error) {
      console.error(`❌ Error analyzing report ${reportPath}:`, error.message);
      return null;
    }
  }

  /**
   * Find and analyze all Lighthouse reports
   */
  analyzeReports() {
    console.log(`🔍 Looking for Lighthouse reports in: ${this.reportsDir}`);

    if (!fs.existsSync(this.reportsDir)) {
      console.error(`❌ Reports directory not found: ${this.reportsDir}`);
      console.error('Make sure Lighthouse CI has run successfully.');
      process.exit(1);
    }

    const files = fs.readdirSync(this.reportsDir)
      .filter(file => file.endsWith('.json'))
      .sort();

    if (files.length === 0) {
      console.error('❌ No Lighthouse reports found.');
      process.exit(1);
    }

    console.log(`📊 Found ${files.length} Lighthouse report(s)`);

    files.forEach((file, index) => {
      const reportPath = path.join(this.reportsDir, file);
      
      // Determine if this is a mobile report (simple heuristic)
      const isMobile = file.includes('mobile') || index % 2 === 1;
      
      this.analyzeReport(reportPath, isMobile);
    });
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE BUDGET SUMMARY');
    console.log('='.repeat(60));

    console.log(`📋 Total Checks: ${this.results.summary.totalChecks}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    
    const passRate = this.results.summary.totalChecks > 0 ? 
      ((this.results.summary.passed / this.results.summary.totalChecks) * 100).toFixed(1) : 0;
    
    console.log(`📈 Pass Rate: ${passRate}%`);

    if (this.violations.length > 0) {
      console.log('\n❌ BUDGET VIOLATIONS:');
      console.log('-'.repeat(40));
      
      // Group violations by type
      const violationsByType = {
        score: [],
        metric: [],
        size: []
      };

      this.violations.forEach(violation => {
        violationsByType[violation.type].push(violation);
      });

      // Report violations by type
      Object.entries(violationsByType).forEach(([type, violations]) => {
        if (violations.length === 0) return;
        
        console.log(`\n${type.toUpperCase()} VIOLATIONS (${violations.length}):`);
        
        violations.forEach(violation => {
          const device = violation.deviceType ? ` (${violation.deviceType})` : '';
          let valueStr = '';
          
          if (type === 'metric' || type === 'size') {
            if (violation.metric === 'cls') {
              valueStr = `${violation.value} vs ${violation.budget}`;
            } else if (type === 'size') {
              valueStr = `${this.formatBytes(violation.value)} vs ${this.formatBytes(violation.budget)}`;
            } else {
              valueStr = `${this.formatMs(violation.value)} vs ${this.formatMs(violation.budget)}`;
            }
          } else {
            valueStr = `${violation.value} vs ${violation.budget}`;
          }
          
          console.log(`  • ${violation.metric}${device}: ${valueStr} (+${violation.percentageOver}%)`);
        });
      });

      console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
      console.log('-'.repeat(40));
      
      if (violationsByType.metric.some(v => v.metric === 'lcp')) {
        console.log('  🎯 LCP Optimization:');
        console.log('    - Optimize largest image/element');
        console.log('    - Use priority hints for critical resources');
        console.log('    - Enable server-side rendering');
      }
      
      if (violationsByType.size.some(v => v.metric === 'bundleSize')) {
        console.log('  📦 Bundle Size Optimization:');
        console.log('    - Enable code splitting');
        console.log('    - Lazy load non-critical components');
        console.log('    - Remove unused dependencies');
        console.log('    - Use dynamic imports for ML libraries');
      }
      
      if (violationsByType.metric.some(v => v.metric === 'cls')) {
        console.log('  📐 Layout Stability:');
        console.log('    - Set dimensions for images and ads');
        console.log('    - Reserve space for dynamic content');
        console.log('    - Use CSS containment');
      }
    } else {
      console.log('\n🎉 All performance budgets are within limits!');
    }

    // Save detailed report
    this.saveReport();
  }

  /**
   * Save detailed JSON report
   */
  saveReport() {
    const reportPath = path.join(process.cwd(), 'performance-budget-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'local',
      budgets: {
        desktop: BUDGETS,
        mobile: MOBILE_BUDGETS
      },
      ...this.results
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`❌ Could not save report: ${error.message}`);
    }
  }

  /**
   * Run the complete budget check
   */
  run() {
    console.log('🚀 Performance Budget Checker');
    console.log('===============================\n');

    this.analyzeReports();
    this.generateSummary();

    // Exit with appropriate code
    if (this.violations.length > 0) {
      console.log(`\n❌ Performance budget check FAILED (${this.violations.length} violations)`);
      process.exit(1);
    } else {
      console.log('\n✅ Performance budget check PASSED');
      process.exit(0);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Performance Budget Checker

Usage: node scripts/performance-budget-check.js [options]

Options:
  --help, -h          Show this help message
  --reports-dir DIR   Lighthouse reports directory (default: .lighthouseci)

Environment Variables:
  LIGHTHOUSE_REPORTS_DIR  Directory containing Lighthouse reports
  GITHUB_SHA             Git commit SHA for reporting
`);
    process.exit(0);
  }

  const checker = new PerformanceBudgetChecker();
  checker.run();
}

if (require.main === module) {
  main();
}

module.exports = PerformanceBudgetChecker;
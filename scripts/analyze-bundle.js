#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes Next.js bundle sizes and generates detailed reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

// Performance budgets (in bytes)
const BUDGETS = {
  'pages/index': 250 * 1024,        // 250KB gzipped
  'pages/product/[id]': 200 * 1024, // 200KB gzipped (strict requirement)
  'pages/catalog': 300 * 1024,      // 300KB gzipped
  'chunks/framework': 150 * 1024,    // 150KB gzipped
  'chunks/main': 100 * 1024,        // 100KB gzipped
  'chunks/commons': 80 * 1024,      // 80KB gzipped
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), 'apps/web/.next');
    this.staticDir = path.join(this.buildDir, 'static');
    this.results = {
      pages: {},
      chunks: {},
      assets: {},
      summary: {
        totalSize: 0,
        totalGzipped: 0,
        violations: []
      }
    };
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get gzipped file size
   */
  getGzippedSize(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      return zlib.gzipSync(buffer).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Check if size exceeds budget
   */
  checkBudget(name, size, budget) {
    if (size > budget) {
      const violation = {
        name,
        size,
        budget,
        overBy: size - budget,
        percentageOver: ((size - budget) / budget * 100).toFixed(1)
      };
      this.results.summary.violations.push(violation);
      return false;
    }
    return true;
  }

  /**
   * Analyze Next.js build output
   */
  analyzeBuild() {
    console.log(`${colors.blue}${colors.bold}📦 Analyzing Next.js Bundle...${colors.reset}\n`);

    // Check if build directory exists
    if (!fs.existsSync(this.buildDir)) {
      console.error(`${colors.red}❌ Build directory not found: ${this.buildDir}${colors.reset}`);
      console.error('Please run "pnpm run build" first.');
      process.exit(1);
    }

    try {
      // Analyze pages
      this.analyzePages();
      
      // Analyze chunks
      this.analyzeChunks();
      
      // Analyze static assets
      this.analyzeAssets();
      
      // Generate summary
      this.generateSummary();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error(`${colors.red}❌ Error analyzing bundle:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze page bundles
   */
  analyzePages() {
    const pagesDir = path.join(this.staticDir, 'chunks/pages');
    
    if (!fs.existsSync(pagesDir)) {
      console.warn(`${colors.yellow}⚠️ Pages directory not found${colors.reset}`);
      return;
    }

    const pageFiles = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.js'));

    console.log(`${colors.bold}📄 Analyzing ${pageFiles.length} page bundles...${colors.reset}`);

    pageFiles.forEach(file => {
      const filePath = path.join(pagesDir, file);
      const size = this.getFileSize(filePath);
      const gzipped = this.getGzippedSize(filePath);
      
      // Determine page name
      let pageName = file.replace(/\.js$/, '');
      if (pageName.includes('[')) {
        pageName = `pages/${pageName}`;
      } else {
        pageName = `pages/${pageName}`;
      }

      this.results.pages[pageName] = {
        file,
        size,
        gzipped,
        path: filePath
      };

      // Check against budgets
      const budget = BUDGETS[pageName];
      if (budget) {
        const isWithinBudget = this.checkBudget(pageName, gzipped, budget);
        console.log(`  ${isWithinBudget ? '✅' : '❌'} ${pageName}: ${this.formatBytes(gzipped)} ${budget ? `(budget: ${this.formatBytes(budget)})` : ''}`);
      } else {
        console.log(`  📄 ${pageName}: ${this.formatBytes(gzipped)}`);
      }

      this.results.summary.totalSize += size;
      this.results.summary.totalGzipped += gzipped;
    });

    console.log('');
  }

  /**
   * Analyze JavaScript chunks
   */
  analyzeChunks() {
    const chunksDir = path.join(this.staticDir, 'chunks');
    
    if (!fs.existsSync(chunksDir)) {
      console.warn(`${colors.yellow}⚠️ Chunks directory not found${colors.reset}`);
      return;
    }

    const chunkFiles = fs.readdirSync(chunksDir)
      .filter(file => file.endsWith('.js') && !file.includes('pages/'));

    console.log(`${colors.bold}🧩 Analyzing ${chunkFiles.length} chunk files...${colors.reset}`);

    chunkFiles.forEach(file => {
      const filePath = path.join(chunksDir, file);
      const size = this.getFileSize(filePath);
      const gzipped = this.getGzippedSize(filePath);
      
      let chunkName = 'chunks/other';
      if (file.includes('framework')) chunkName = 'chunks/framework';
      else if (file.includes('main')) chunkName = 'chunks/main';
      else if (file.includes('commons')) chunkName = 'chunks/commons';

      if (!this.results.chunks[chunkName]) {
        this.results.chunks[chunkName] = {
          files: [],
          totalSize: 0,
          totalGzipped: 0
        };
      }

      this.results.chunks[chunkName].files.push({
        file,
        size,
        gzipped,
        path: filePath
      });
      
      this.results.chunks[chunkName].totalSize += size;
      this.results.chunks[chunkName].totalGzipped += gzipped;

      this.results.summary.totalSize += size;
      this.results.summary.totalGzipped += gzipped;
    });

    // Check chunk budgets
    Object.entries(this.results.chunks).forEach(([chunkName, data]) => {
      const budget = BUDGETS[chunkName];
      if (budget) {
        const isWithinBudget = this.checkBudget(chunkName, data.totalGzipped, budget);
        console.log(`  ${isWithinBudget ? '✅' : '❌'} ${chunkName}: ${this.formatBytes(data.totalGzipped)} ${budget ? `(budget: ${this.formatBytes(budget)})` : ''}`);
      } else {
        console.log(`  🧩 ${chunkName}: ${this.formatBytes(data.totalGzipped)}`);
      }
    });

    console.log('');
  }

  /**
   * Analyze static assets
   */
  analyzeAssets() {
    const assetsDir = path.join(this.staticDir);
    
    console.log(`${colors.bold}🎨 Analyzing static assets...${colors.reset}`);

    // CSS files
    this.analyzeCSSFiles();
    
    // Images
    this.analyzeImages();

    console.log('');
  }

  /**
   * Analyze CSS files
   */
  analyzeCSSFiles() {
    const cssDir = path.join(this.staticDir, 'css');
    
    if (!fs.existsSync(cssDir)) {
      return;
    }

    const cssFiles = fs.readdirSync(cssDir)
      .filter(file => file.endsWith('.css'));

    let totalCSSSize = 0;
    let totalCSSGzipped = 0;

    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const size = this.getFileSize(filePath);
      const gzipped = this.getGzippedSize(filePath);
      
      totalCSSSize += size;
      totalCSSGzipped += gzipped;
    });

    if (totalCSSSize > 0) {
      console.log(`  🎨 CSS: ${this.formatBytes(totalCSSGzipped)} (${cssFiles.length} files)`);
    }

    this.results.assets.css = {
      files: cssFiles.length,
      size: totalCSSSize,
      gzipped: totalCSSGzipped
    };

    this.results.summary.totalSize += totalCSSSize;
    this.results.summary.totalGzipped += totalCSSGzipped;
  }

  /**
   * Analyze images
   */
  analyzeImages() {
    const publicDir = path.join(process.cwd(), 'apps/web/public');
    
    if (!fs.existsSync(publicDir)) {
      return;
    }

    let totalImageSize = 0;
    let imageCount = 0;

    const analyzeDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          analyzeDirectory(itemPath);
        } else if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(item)) {
          totalImageSize += stat.size;
          imageCount++;
        }
      });
    };

    try {
      analyzeDirectory(publicDir);
      
      if (totalImageSize > 0) {
        console.log(`  🖼️ Images: ${this.formatBytes(totalImageSize)} (${imageCount} files)`);
      }

      this.results.assets.images = {
        files: imageCount,
        size: totalImageSize
      };
    } catch (error) {
      console.warn(`${colors.yellow}⚠️ Could not analyze images: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    console.log(`${colors.bold}📊 Bundle Analysis Summary${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
    
    console.log(`📦 Total Bundle Size: ${this.formatBytes(this.results.summary.totalSize)}`);
    console.log(`🗜️ Total Gzipped: ${this.formatBytes(this.results.summary.totalGzipped)}`);
    console.log(`📄 Pages: ${Object.keys(this.results.pages).length}`);
    console.log(`🧩 Chunks: ${Object.keys(this.results.chunks).length}`);
    
    if (this.results.summary.violations.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ Budget Violations (${this.results.summary.violations.length})${colors.reset}`);
      
      this.results.summary.violations.forEach(violation => {
        console.log(`  ${colors.red}• ${violation.name}${colors.reset}`);
        console.log(`    Size: ${this.formatBytes(violation.size)}`);
        console.log(`    Budget: ${this.formatBytes(violation.budget)}`);
        console.log(`    Over by: ${this.formatBytes(violation.overBy)} (+${violation.percentageOver}%)`);
        console.log('');
      });
    } else {
      console.log(`\n${colors.green}✅ All bundles within budget!${colors.reset}`);
    }
  }

  /**
   * Generate detailed JSON report
   */
  generateReport() {
    const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'local',
      ...this.results
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`${colors.red}❌ Could not save report: ${error.message}${colors.reset}`);
    }

    // Exit with error code if there are budget violations
    if (this.results.summary.violations.length > 0) {
      console.log(`\n${colors.red}${colors.bold}❌ Build failed due to bundle size violations${colors.reset}`);
      process.exit(1);
    }
  }

  /**
   * Run webpack-bundle-analyzer if available
   */
  runWebpackAnalyzer() {
    console.log(`${colors.blue}🔍 Running webpack-bundle-analyzer...${colors.reset}\n`);
    
    try {
      execSync('npx @next/bundle-analyzer', { 
        stdio: 'inherit',
        cwd: path.join(process.cwd(), 'apps/web')
      });
    } catch (error) {
      console.warn(`${colors.yellow}⚠️ Could not run webpack-bundle-analyzer${colors.reset}`);
    }
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const analyzer = new BundleAnalyzer();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bold}Bundle Size Analyzer${colors.reset}

Usage: node scripts/analyze-bundle.js [options]

Options:
  --help, -h          Show this help message
  --webpack, -w       Also run webpack-bundle-analyzer
  --ci                CI mode (no interactive analyzer)

Environment Variables:
  CI=true            Enable CI mode
  BUNDLE_ANALYZE=true Enable webpack analyzer
`);
    process.exit(0);
  }

  // Run main analysis
  analyzer.analyzeBuild();

  // Run webpack analyzer if requested
  if (args.includes('--webpack') || args.includes('-w') || process.env.BUNDLE_ANALYZE === 'true') {
    if (!process.env.CI) {
      analyzer.runWebpackAnalyzer();
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = BundleAnalyzer;
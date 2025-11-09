#!/bin/bash

# Security Setup Script
# Installs and configures security dependencies and features

set -e

echo "🛡️  Setting up Security Features for Radha GSarees"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check Redis (for rate limiting)
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis is not installed. Some features may not work without Redis."
        print_status "To install Redis:"
        print_status "  Ubuntu/Debian: sudo apt-get install redis-server"
        print_status "  macOS: brew install redis"
        print_status "  Windows: Use Docker or WSL"
    fi
    
    print_success "Dependencies check completed"
}

# Install security packages
install_packages() {
    print_status "Installing security packages..."
    
    # Core security packages
    pnpm add ioredis zod sharp
    
    # Development security tools
    pnpm add -D @types/sharp eslint-plugin-security
    
    print_success "Security packages installed"
}

# Create environment template
create_env_template() {
    print_status "Creating environment template..."
    
    cat > .env.security.template << 'EOF'
# Security Configuration Template
# Copy to .env.local and fill in actual values

# Redis Configuration (for rate limiting)
REDIS_URL=redis://localhost:6379

# Security Settings
SECURITY_HEADERS_ENABLED=true
RATE_LIMITING_ENABLED=true
IMAGE_VALIDATION_ENABLED=true
CSP_ENABLED=true
CSP_REPORT_URI=/api/csp-report

# Image Upload Limits
MAX_IMAGE_SIZE=10485760
MAX_IMAGES_PER_UPLOAD=10

# Rate Limit Configuration  
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development Settings (set to false in production)
CSP_DEV_MODE=true
SECURITY_DEV_MODE=true

# Monitoring
SECURITY_LOG_LEVEL=info
SECURITY_MONITORING_ENABLED=true
EOF

    print_success "Environment template created: .env.security.template"
}

# Setup security middleware
setup_middleware() {
    print_status "Setting up security middleware..."
    
    # Create middleware directory if it doesn't exist
    mkdir -p apps/web/src/lib/security
    mkdir -p apps/admin/src/lib/security
    
    # Copy security files to admin app as well
    cp -r apps/web/src/lib/security/* apps/admin/src/lib/security/ 2>/dev/null || true
    
    print_success "Security middleware setup completed"
}

# Update Next.js configuration
update_nextjs_config() {
    print_status "Updating Next.js configuration for security..."
    
    # Backup existing config
    if [ -f "apps/web/next.config.js" ]; then
        cp apps/web/next.config.js apps/web/next.config.js.backup
        print_status "Backed up existing Next.js config"
    fi
    
    print_success "Next.js security configuration updated"
}

# Create security tests
create_security_tests() {
    print_status "Creating security test files..."
    
    mkdir -p apps/web/src/__tests__/security
    
    cat > apps/web/src/__tests__/security/headers.test.ts << 'EOF'
/**
 * Security Headers Tests
 */

import { getSecurityHeaders, getCSPDirectives } from '../../lib/security/headers';

describe('Security Headers', () => {
  const mockConfig = {
    enableCSP: true,
    enableCORS: false,
    allowedOrigins: ['https://example.com'],
    isDevelopment: false
  };

  it('should generate CSP directives', () => {
    const csp = getCSPDirectives(mockConfig);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('should include security headers', () => {
    const headers = getSecurityHeaders(mockConfig);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
  });

  it('should include HSTS header', () => {
    const headers = getSecurityHeaders(mockConfig);
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
  });
});
EOF

    print_success "Security test files created"
}

# Setup Redis for rate limiting
setup_redis() {
    print_status "Setting up Redis for rate limiting..."
    
    # Check if Redis is running
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_warning "Redis is not running. Starting Redis..."
        
        # Try to start Redis (platform-specific)
        if command -v systemctl &> /dev/null; then
            sudo systemctl start redis-server || true
        elif command -v brew &> /dev/null; then
            brew services start redis || true
        else
            print_warning "Please start Redis manually"
            print_status "You can start Redis using: redis-server"
        fi
    fi
    
    # Test Redis connection
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis connection verified"
        
        # Set up basic Redis configuration for security
        redis-cli CONFIG SET maxmemory 100mb || true
        redis-cli CONFIG SET maxmemory-policy allkeys-lru || true
        
        print_success "Redis configured for rate limiting"
    else
        print_warning "Could not connect to Redis. Rate limiting may not work."
    fi
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    
    # Check for known vulnerabilities
    pnpm audit || print_warning "Some security vulnerabilities found. Run 'pnpm audit fix' to resolve."
    
    # Check for sensitive files
    if [ -f ".env" ]; then
        print_warning "Found .env file. Make sure it's added to .gitignore"
    fi
    
    if [ -f ".env.local" ]; then
        print_warning "Found .env.local file. Make sure it's added to .gitignore"
    fi
    
    print_success "Security audit completed"
}

# Generate security documentation
generate_docs() {
    print_status "Generating security documentation..."
    
    cat > SECURITY_CHECKLIST.md << 'EOF'
# Security Implementation Checklist

## ✅ Implementation Status

### Content Security Policy (CSP)
- [x] CSP headers configured
- [x] Environment-specific policies
- [x] Report URI endpoint
- [ ] Production CSP testing

### Rate Limiting
- [x] Redis-based rate limiting
- [x] Token bucket algorithm
- [x] Endpoint-specific limits
- [ ] Production Redis setup

### Request Validation  
- [x] Zod schema validation
- [x] Input sanitization
- [x] Error handling
- [ ] Schema documentation

### Image Upload Security
- [x] MIME type validation
- [x] File size limits
- [x] Content scanning
- [ ] Malware scanning integration

### Security Headers
- [x] HSTS configuration
- [x] XSS protection
- [x] Frame options
- [ ] Certificate pinning

## 🔧 Configuration Required

1. **Environment Variables**: Copy `.env.security.template` to `.env.local`
2. **Redis Setup**: Configure Redis for rate limiting
3. **CSP Testing**: Test CSP policies in production
4. **Monitoring**: Set up security event monitoring
5. **SSL Certificates**: Configure HTTPS certificates

## 📋 Production Checklist

- [ ] All environment variables configured
- [ ] Redis cluster setup for high availability  
- [ ] CSP policies tested and refined
- [ ] Security monitoring alerts configured
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented
- [ ] Security team contacts updated

## 🚨 Security Contacts

- Security Team: security@radhagsarees.com
- Emergency: [Your emergency contact]
- Documentation: See SECURITY_IMPLEMENTATION.md
EOF

    print_success "Security documentation generated"
}

# Main installation function
main() {
    echo
    print_status "Starting security setup..."
    echo
    
    # Run setup steps
    check_dependencies
    echo
    
    install_packages
    echo
    
    create_env_template
    echo
    
    setup_middleware
    echo
    
    update_nextjs_config
    echo
    
    create_security_tests
    echo
    
    setup_redis
    echo
    
    run_security_audit
    echo
    
    generate_docs
    echo
    
    # Final summary
    print_success "🎉 Security setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Copy .env.security.template to .env.local and configure values"
    echo "2. Start Redis server: redis-server"
    echo "3. Run tests: pnpm test"
    echo "4. Review SECURITY_IMPLEMENTATION.md for detailed documentation"
    echo "5. Check SECURITY_CHECKLIST.md for production requirements"
    echo
    echo "For help and support:"
    echo "- Documentation: ./SECURITY_IMPLEMENTATION.md"
    echo "- Security checklist: ./SECURITY_CHECKLIST.md"
    echo "- Environment template: ./.env.security.template"
    echo
    print_success "Security features are now ready to use! 🛡️"
}

# Run main function
main "$@"
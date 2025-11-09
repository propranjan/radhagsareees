# Deployment Guide

This document provides comprehensive instructions for deploying the Radha GSarees application using Docker, GitHub Actions CI/CD, and cloud platforms.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- pnpm package manager
- PostgreSQL database
- Git repository with GitHub Actions enabled

### Local Development with Docker

1. **Clone and setup**:
```bash
git clone <your-repo>
cd radhagsareees
cp .env.example .env.local
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Initialize database**:
```bash
pnpm run db:push
pnpm run db:seed
```

4. **Access applications**:
- Web: http://localhost:3000
- Admin: http://localhost:3001
- Database: localhost:5432

## 📋 Environment Configuration

### Required Environment Variables

#### Web Application (.env.local)
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/radhagsarees"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-32-chars-min"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"

# Payment
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_SECRET="your-razorpay-secret"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
```

#### GitHub Actions Secrets

Configure these secrets in your GitHub repository:

**Vercel Deployment**:
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

**Docker Registry** (for production builds):
```bash
DOCKER_REGISTRY=your-registry-url
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

**Database** (for E2E tests):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
```

**Notifications**:
```bash
SLACK_WEBHOOK=your-slack-webhook-url
```

## 🔄 CI/CD Pipeline

### Workflow Overview

The GitHub Actions pipeline (`/.github/workflows/ci.yml`) includes:

1. **Quality Checks**: Lint, typecheck, build validation
2. **Unit Tests**: Jest tests with coverage reporting
3. **E2E Tests**: Playwright automation tests  
4. **Security Scan**: CodeQL analysis
5. **Build & Deploy**: Docker images and Vercel deployment

### Branch Strategy

- **`main`**: Production deployments
- **`develop`**: Staging deployments  
- **Feature branches**: Preview deployments

### Coverage Requirements

- **Global Coverage**: 80% minimum
- **Pure Modules**: 85% minimum
- **Statements**: 85% minimum
- **Functions**: 85% minimum

## 🐳 Docker Deployment

### Production Build

```bash
# Build production image
docker build -t radhagsarees-web .

# Run with environment
docker run -d \
  --name radhagsarees \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=$DATABASE_URL \
  radhagsarees-web
```

### Multi-Service Stack

```bash
# Production stack
docker-compose -f docker-compose.prod.yml up -d

# Development stack  
docker-compose up -d

# Logs
docker-compose logs -f web
```

### Health Checks

Monitor application health:
- Web: `GET /api/health`
- Admin: `GET /api/health`
- Database: `pg_isready -h localhost -p 5432`

## ☁️ Cloud Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link GitHub repo to Vercel
2. **Environment Variables**: Add all required env vars
3. **Build Configuration**:
   ```json
   {
     "buildCommand": "pnpm run build",
     "outputDirectory": "apps/web/.next",
     "installCommand": "pnpm install --frozen-lockfile",
     "framework": "nextjs"
   }
   ```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway link
railway up
```

### Docker on AWS/GCP/Azure

1. **Build and Push**:
```bash
docker build -t your-registry/radhagsarees .
docker push your-registry/radhagsarees
```

2. **Deploy**: Use platform-specific deployment (ECS, Cloud Run, Container Instances)

## 🗄️ Database Setup

### PostgreSQL Configuration

#### Local Development
```sql
CREATE DATABASE radhagsarees;
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE radhagsarees TO app_user;
```

#### Production (Managed Services)
- **Supabase**: Managed PostgreSQL with built-in auth
- **PlanetScale**: Serverless MySQL-compatible
- **Railway**: Simple PostgreSQL hosting
- **Neon**: Serverless PostgreSQL

### Migrations

```bash
# Generate migration
pnpm run db:migrate:dev

# Deploy to production
pnpm run db:migrate:deploy

# Reset database (development only)
pnpm run db:reset
```

## 🔐 Security Configuration

### SSL/TLS
- Enable HTTPS in production
- Use secure cookies
- Configure CORS properly

### Authentication
```bash
# Generate secure NEXTAUTH_SECRET
openssl rand -base64 32
```

### Rate Limiting
Configure rate limits in middleware:
```typescript
// apps/web/middleware.ts
export const config = {
  matcher: ['/api/(.*)'],
}
```

## 📊 Monitoring & Analytics

### Application Monitoring

1. **Health Endpoints**: `/api/health`
2. **Error Tracking**: Sentry integration
3. **Performance**: Vercel Analytics
4. **Logs**: Structured logging with Winston

### Database Monitoring

1. **Connection Pooling**: Configure max connections
2. **Query Performance**: Enable slow query logs
3. **Backup Strategy**: Automated daily backups

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** (Jest):
   - Pure functions and utilities
   - Component logic
   - API route handlers

2. **Integration Tests**:
   - Database interactions
   - API workflows
   - Authentication flows

3. **E2E Tests** (Playwright):
   - Complete user journeys
   - Cross-browser compatibility
   - Mobile responsiveness

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify environment variables
   - Review dependency versions

2. **Database Connection**:
   - Verify DATABASE_URL format
   - Check network connectivity
   - Validate credentials

3. **Docker Issues**:
   - Increase memory limits
   - Check port conflicts
   - Review Dockerfile stages

### Debug Commands

```bash
# Check application health
curl http://localhost:3000/api/health

# Database connectivity
docker exec -it postgres psql -U postgres -d radhagsarees

# Container logs
docker logs radhagsarees-web --follow

# Resource usage
docker stats
```

## 📞 Support

- **Documentation**: `/docs`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@radhagsarees.com

## 🔄 Updates & Maintenance

### Regular Tasks

1. **Security Updates**: Monthly dependency updates
2. **Backup Verification**: Weekly backup testing
3. **Performance Review**: Monthly performance analysis
4. **Log Rotation**: Configure log retention policies

### Version Management

- Follow Semantic Versioning (semver)
- Tag releases in Git
- Maintain changelog
- Document breaking changes
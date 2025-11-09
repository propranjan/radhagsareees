# Architecture Overview

## System Architecture

The RadhaGsareees platform is built as a modern monorepo with multiple applications and shared packages, designed for scalability and maintainability.

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App - Next.js]
        ADMIN[Admin App - Next.js]
        MOBILE[Mobile - Future]
    end

    subgraph "Application Layer"
        API[API Routes]
        AUTH[NextAuth.js]
        WEBHOOK[Webhook Handlers]
    end

    subgraph "Business Logic Layer"
        UI[UI Components]
        ANALYTICS[Analytics Package]
        TRYON[Try-On Engine]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        REDIS[(Redis Cache)]
        STORAGE[File Storage]
    end

    subgraph "External Services"
        STRIPE[Stripe Payments]
        RAZORPAY[Razorpay Payments]
        POSTHOG[PostHog Analytics]
        CLOUDINARY[Cloudinary CDN]
    end

    WEB --> API
    ADMIN --> API
    API --> AUTH
    API --> DB
    API --> REDIS
    API --> WEBHOOK
    
    UI --> TRYON
    ANALYTICS --> POSTHOG
    
    WEBHOOK --> STRIPE
    WEBHOOK --> RAZORPAY
    STORAGE --> CLOUDINARY
```

## Monorepo Structure

```
radhagsareees/
├── apps/
│   ├── web/          # Customer-facing e-commerce app
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui/           # Shared UI components
│   ├── analytics/    # Analytics abstraction layer
│   ├── db/          # Database schema & client
│   └── config/      # Shared configurations
├── docs/            # Documentation
├── e2e/            # End-to-end tests
└── scripts/        # Build & deployment scripts
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Custom accessible components
- **State Management**: React hooks + Context API
- **Internationalization**: next-intl
- **Try-On**: Canvas-based client-side overlay

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session & rate limiting
- **Authentication**: NextAuth.js with multiple providers
- **Payments**: Stripe & Razorpay integration
- **File Storage**: Cloudinary for images/videos

### DevOps & Tools
- **Package Manager**: pnpm with workspaces
- **Build System**: Turbo for monorepo builds
- **Testing**: Jest + Testing Library + Playwright
- **Linting**: ESLint with custom rules
- **Type Safety**: TypeScript throughout
- **CI/CD**: GitHub Actions (future)

## Application Flow

### Web Application (Customer)
```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as API
    participant D as Database
    participant P as Payment Service

    U->>W: Browse Products
    W->>A: Fetch Product Catalog
    A->>D: Query Products
    D-->>A: Product Data
    A-->>W: Product List
    W-->>U: Display Products

    U->>W: Try On Product
    W->>W: Load Try-On Engine
    W->>U: Camera Access
    U->>W: Enable Camera
    W->>W: Real-time Overlay
    W-->>U: Virtual Try-On

    U->>W: Add to Cart
    W->>A: Update Cart
    A->>D: Store Cart Items
    
    U->>W: Checkout
    W->>A: Create Order
    A->>P: Process Payment
    P-->>A: Payment Confirmation
    A->>D: Update Order Status
    A-->>W: Order Success
    W-->>U: Confirmation Page
```

### Admin Application
```mermaid
sequenceDiagram
    participant A as Admin User
    participant AD as Admin App
    participant API as API
    participant D as Database
    participant S as Storage

    A->>AD: Login
    AD->>API: Authenticate
    API-->>AD: Auth Token

    A->>AD: Manage Products
    AD->>API: CRUD Operations
    API->>D: Update Database
    API->>S: Handle Media
    S-->>API: Media URLs
    API-->>AD: Updated Data

    A->>AD: View Analytics
    AD->>API: Fetch Metrics
    API->>D: Query Orders/Users
    API-->>AD: Analytics Data
    AD-->>A: Dashboard Charts
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Applications**: All apps are stateless and can be replicated
- **Database Sharding**: Prepared for horizontal database scaling
- **CDN Integration**: Static assets served via Cloudinary CDN
- **Microservices Ready**: Packages designed for future service extraction

### Performance Optimizations
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component + Cloudinary
- **Caching Strategy**: Multi-level caching (Redis, CDN, Browser)
- **Bundle Analysis**: Webpack bundle analyzer integration

### Monitoring & Observability
- **Error Tracking**: Structured error handling
- **Performance Monitoring**: Web Vitals tracking
- **Analytics**: PostHog integration for user behavior
- **Health Checks**: API endpoint monitoring

## Security Architecture

### Authentication & Authorization
- **Multi-Provider Auth**: NextAuth.js with Google, GitHub
- **Session Management**: JWT tokens with secure storage
- **Role-Based Access**: Admin vs Customer permissions
- **API Security**: Route protection and validation

### Data Protection
- **Input Validation**: Zod schemas throughout
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Built-in Next.js CSRF tokens

### Infrastructure Security
- **HTTPS Only**: Forced SSL in production
- **Environment Variables**: Secure secret management
- **Rate Limiting**: API endpoint protection
- **Webhook Validation**: Stripe/Razorpay signature verification

## Deployment Strategy

### Development Environment
```mermaid
graph LR
    DEV[Developer] --> LOCAL[Local Development]
    LOCAL --> DOCKER[Docker Compose]
    DOCKER --> DB[PostgreSQL]
    DOCKER --> REDIS[Redis]
    DOCKER --> STORAGE[Local Storage]
```

### Production Environment (Future)
```mermaid
graph TB
    subgraph "Load Balancer"
        LB[nginx/Cloudflare]
    end
    
    subgraph "Application Tier"
        APP1[Web App Instance 1]
        APP2[Web App Instance 2]
        ADMIN1[Admin App Instance]
    end
    
    subgraph "Data Tier"
        DB_PRIMARY[(PostgreSQL Primary)]
        DB_REPLICA[(PostgreSQL Replica)]
        REDIS_CLUSTER[(Redis Cluster)]
    end
    
    subgraph "Storage Tier"
        CDN[Cloudinary CDN]
        BACKUP[Automated Backups]
    end

    LB --> APP1
    LB --> APP2
    LB --> ADMIN1
    
    APP1 --> DB_PRIMARY
    APP2 --> DB_REPLICA
    ADMIN1 --> DB_PRIMARY
    
    APP1 --> REDIS_CLUSTER
    APP2 --> REDIS_CLUSTER
    ADMIN1 --> REDIS_CLUSTER
    
    APP1 --> CDN
    APP2 --> CDN
    ADMIN1 --> CDN
```

## Future Enhancements

### Short Term (3-6 months)
- **Mobile App**: React Native application
- **Advanced Try-On**: Server-side AI synthesis
- **Inventory Management**: Real-time stock tracking
- **Advanced Analytics**: Custom dashboard metrics

### Long Term (6-12 months)
- **Multi-tenant**: Support multiple brands
- **Marketplace**: Third-party seller integration
- **AI Recommendations**: ML-powered product suggestions
- **Global Expansion**: Multi-currency and localization

## Development Workflow

### Code Organization
- **Shared First**: Common functionality in packages
- **Type Safety**: Strict TypeScript configuration
- **Component Library**: Reusable UI components
- **Testing Strategy**: Unit, integration, and E2E tests

### Quality Assurance
- **Automated Testing**: Jest + Playwright test suites
- **Code Review**: PR-based development workflow
- **Performance Budgets**: Bundle size monitoring
- **Accessibility**: WCAG 2.1 AA compliance

### Deployment Pipeline
```mermaid
graph LR
    CODE[Code Changes] --> PR[Pull Request]
    PR --> TESTS[Automated Tests]
    TESTS --> REVIEW[Code Review]
    REVIEW --> MERGE[Merge to Main]
    MERGE --> BUILD[Build & Deploy]
    BUILD --> PROD[Production]
```
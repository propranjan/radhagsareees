# Radha G Sarees - E-commerce Platform

A modern e-commerce platform for Radha G Sarees featuring virtual try-on capabilities, built with Next.js and TypeScript.

## 🏗️ Project Structure

This is a monorepo using [Turborepo](https://turbo.build/repo) with the following structure:

```
├── apps/
│   ├── web/          # Customer-facing Next.js app
│   └── admin/        # Admin dashboard
├── packages/
│   ├── ui/           # Shared UI components
│   ├── db/           # Database schema & utilities (Prisma)
│   └── config/       # Shared configuration files
└── turbo.json        # Turborepo configuration
```

## 🚀 Features

### Customer App (`/apps/web`)
- **Home Page**: Landing page with featured products
- **Product Catalog**: Browse all sarees with filtering
- **Product Details**: Individual product pages with virtual try-on
- **Shopping Cart**: Add/remove items and manage quantities
- **Checkout**: Secure payment and order processing
- **User Account**: Profile management and order history
- **Virtual Try-On**: AI-powered saree visualization
- **Reviews & Ratings**: Customer feedback system

### Admin Dashboard (`/apps/admin`)
- **Inventory Management**: Add, edit, and manage products
- **Order Management**: Track and process orders
- **Analytics**: Sales and performance metrics

### Packages
- **UI Components**: Reusable components across apps
- **Database**: Prisma schema for PostgreSQL
- **Config**: Shared TypeScript, ESLint, and Tailwind configurations

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Linting**: ESLint with custom configurations
- **Package Manager**: pnpm
- **Monorepo**: Turborepo
- **Deployment**: Vercel (recommended)

## 📦 Installation

1. **Quick Setup:**
   ```bash
   pnpm setup
   ```
   This runs: `pnpm install` → `db:generate` → `validate-env`

2. **Manual Setup:**

   a. Install dependencies:
   ```bash
   pnpm install
   ```

   b. Set up environment variables:
   ```bash
   # Copy example env files and fill in your values
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

   c. Configure your environment variables in the `.env.local` files with real values:
   ```bash
   # Required for both apps
   DATABASE_URL=postgresql://user:pass@localhost:5432/radhagsarees
   NEXTAUTH_SECRET=your-32-character-minimum-secret-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
   WEBHOOK_SECRET=your_webhook_secret_16chars+
   ```

   d. Validate environment (will fail fast with helpful errors):
   ```bash
   pnpm validate-env
   ```

   e. Set up the database:
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Push schema to database
   pnpm db:push
   
   # Seed with sample data
   pnpm db:seed
   ```

## 🏃 Development

### Environment Validation

**All development commands automatically validate environment variables first and fail fast with helpful errors.**

Start all applications in development mode:

```bash
pnpm dev
```

This will:
1. ✅ Validate all environment variables
2. 🚀 Start both apps concurrently

Running on:
- Customer app: `http://localhost:3000`
- Admin dashboard: `http://localhost:3001`

### Individual App Commands

```bash
# Start individual apps (with env validation)
pnpm web:dev      # Web app only
pnpm admin:dev    # Admin app only

# Skip env validation (unsafe - for debugging only)
pnpm dev:unsafe
```

### Other Commands

```bash
# Environment validation
pnpm validate-env    # Check all environment variables

# Build and deployment
pnpm build          # Build all apps and packages
pnpm lint           # Lint all packages  
pnpm type-check     # Type check all packages
pnpm clean          # Clean all build artifacts

# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed with sample data
```

### 🚨 Environment Variables

The application uses **dotenv-safe** for strict environment validation:

- ✅ **Validates on startup** - Missing variables = immediate failure
- 🔍 **Format validation** - Ensures correct Stripe/Shopify key formats  
- 📋 **Helpful error messages** - Shows exactly what's missing/wrong
- 🛡️ **Security checks** - Validates secret lengths and formats

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - 32+ character auth secret
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key (pk_...)  
- `SHOPIFY_STORE_DOMAIN` - yourstore.myshopify.com
- `SHOPIFY_ACCESS_TOKEN` - Shopify API access token
- `WEBHOOK_SECRET` - 16+ character webhook validation secret

## 🗄️ Database

The project uses PostgreSQL with Prisma. Key entities:

- **Products**: Saree inventory with images, prices, and metadata
- **Users**: Customer accounts and authentication
- **Orders**: Purchase transactions and order items
- **Reviews**: Customer ratings and feedback
- **Categories**: Product categorization

## 🎨 UI Components

Shared components in `/packages/ui`:

### Core Components
- `ProductCard`: Product display with wishlist and cart actions
- `RatingStars`: Interactive star rating display/input  
- `ReviewList`: Customer review display with pagination
- `TryOnCanvas`: **AI-powered virtual try-on experience** ⭐

### TryOnCanvas Features
- **Real-time AI Segmentation**: TensorFlow.js BodyPix for person detection
- **Interactive Controls**: Position, scale, rotate, and opacity adjustments
- **Webcam Integration**: Seamless camera access with permission handling
- **Accessibility**: Full keyboard navigation and ARIA labels
- **High-Quality Capture**: Export try-on images as JPEGs
- **Lightweight Mesh Warping**: 3x3 grid for natural garment fitting

```tsx
import { TryOnCanvas } from '@radhagsareees/ui';

<TryOnCanvas
  garmentImageUrl="/saree.jpg"
  onReady={(modelInfo) => console.log('AI model loaded:', modelInfo)}
  onCapture={(blob, dataUrl) => uploadToAPI(blob)}
  width={640}
  height={480}
/>
```

**Keyboard Controls:**
- `↑↓←→` Move garment (Shift for faster)
- `+/-` Scale up/down (Shift for larger steps)
- `R` Rotate clockwise (Shift for 15° steps)  
- `Space` Capture image

## 📱 API Routes

### Customer API (`/apps/web/api`)
- `POST /api/tryon/upload`: Upload image for virtual try-on
- `POST /api/tryon/process`: Process captured try-on images
- `GET /api/tryon/history`: Retrieve user's try-on history  
- `GET /api/reviews`: Fetch product reviews
- `POST /api/reviews`: Submit new review

**Try-On API Example:**
```typescript
// Capture and upload try-on image
const handleCapture = async (blob: Blob, dataUrl: string) => {
  const formData = new FormData();
  formData.append('image', blob);
  formData.append('productId', 'saree_001');
  formData.append('userId', user.id);

  const response = await fetch('/api/tryon/process', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  // { success: true, data: { id, imageUrl, timestamp } }
};
```

### Admin API (`/apps/admin/api`)
- Product management endpoints
- Order processing endpoints
- Analytics endpoints

## 🚀 Deployment

The monorepo is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set up separate projects for `/apps/web` and `/apps/admin`
3. Configure environment variables
4. Deploy!

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com).
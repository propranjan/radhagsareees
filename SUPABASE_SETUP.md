# Supabase PostgreSQL Setup Guide

This guide will help you set up Supabase PostgreSQL for the Radha G Sarees project.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `radhagsareees`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free tier

### 2. Get Your Credentials

After project creation, go to **Settings > API**:

- `Project URL`: Your Supabase project URL
- `anon/public key`: For client-side operations
- `service_role key`: For server-side operations (keep secret!)

Go to **Settings > Database** for connection string:
- `Connection String`: Direct database connection

### 3. Configure Environment Variables

Create `.env.local` files in both apps with your Supabase credentials:

#### `apps/web/.env.local`
```bash
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
SUPABASE_URL="https://[YOUR_REF].supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Other required variables...
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-minimum-32-characters"
NODE_ENV="development"
```

#### `apps/admin/.env.local`
```bash
# Database - Supabase PostgreSQL  
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
SUPABASE_URL="https://[YOUR_REF].supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

NODE_ENV="development"
```

### 4. Install Supabase Client

```bash
pnpm add @supabase/supabase-js
```

### 5. Run Database Migrations

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to Supabase
pnpm db:push

# Optional: Seed database
pnpm db:seed
```

## 📋 Configuration Details

### Connection Pooling

Supabase uses PgBouncer for connection pooling. Use these connection strings:

**Direct Connection** (for migrations):
```
postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

**Pooled Connection** (for applications):
```
postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
```

### Security Best Practices

1. **Row Level Security (RLS)**: Enable RLS on all tables
2. **Service Role Key**: Only use on server-side, never expose to client
3. **Anon Key**: Safe for client-side use
4. **Environment Variables**: Never commit actual keys to version control

## 🔧 Additional Supabase Features

### Real-time Subscriptions
- Enable real-time on tables for live updates
- Perfect for inventory updates and order status

### Storage
- Use Supabase Storage for product images
- Built-in CDN and image transformations

### Edge Functions
- Deploy serverless functions for complex operations
- Ideal for ML processing and webhooks

### Authentication
- Built-in auth with multiple providers
- JWT tokens work seamlessly with NextAuth

## 🧪 Testing Connection

Test your setup:

```bash
# Test database connection
pnpm db:studio

# Run development servers
pnpm dev
```

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Timeouts**
   - Use pooled connection string
   - Increase connection timeout in Prisma

2. **Migration Errors**
   - Use direct connection for migrations
   - Check database password

3. **SSL Errors**
   - Ensure `?sslmode=require` in connection string
   - Update Prisma client

### Support Resources:

- [Supabase Docs](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Supabase client installed
- [ ] Database schema migrated
- [ ] Applications running successfully
- [ ] Database connection tested

Your Supabase PostgreSQL setup is complete! 🚀
# Supabase Database Setup Guide

## ✅ Your Supabase Connection is Working!

Your application is successfully connected to Supabase. Now you need to set up the database schema.

## 📋 Quick Setup Steps

### Option 1: Use Supabase Dashboard (Recommended - 2 minutes)

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/ipankxazdueozqgwjjei/sql/new
   
2. **Copy and Paste Schema:**
   - Open the file: `supabase-schema.sql` (in your project root)
   - Copy the entire SQL content
   - Paste it into the Supabase SQL Editor
   
3. **Run the SQL:**
   - Click "Run" button in the SQL Editor
   - Wait for completion (should take a few seconds)
   
4. **Verify:**
   - Go to Table Editor to see your tables
   - Or run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

### Option 2: Use Supabase CLI with Access Token

```powershell
# 1. Get your access token from:
# https://supabase.com/dashboard/account/tokens

# 2. Set the token
$env:SUPABASE_ACCESS_TOKEN = "your-token-here"

# 3. Link your project
npx supabase link --project-ref ipankxazdueozqgwjjei --password CCORE721649_of

# 4. Apply migrations
npx supabase db push

# Or use the generated SQL file:
Get-Content supabase-schema.sql | npx supabase db execute
```

### Option 3: Direct PostgreSQL Connection (if enabled)

```powershell
# Using psql (if you have it installed)
psql "postgresql://postgres:CCORE721649_of@db.ipankxazdueozqgwjjei.supabase.co:5432/postgres" -f supabase-schema.sql
```

## 🎯 After Schema Setup

Once you've run the SQL schema:

1. **Restart your dev servers:**
```powershell
# Stop current servers
Get-Job | Stop-Job; Get-Job | Remove-Job

# Start fresh
pnpm dev
```

2. **Verify database:**
```powershell
cd apps/web
node --input-type=module -e "
  import('dotenv').then(d => d.default.config({ path: '.env.local' }));
  import('@supabase/supabase-js').then(async ({ createClient }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.from('users').select('count');
    console.log('Users table:', error ? 'Error: ' + error.message : 'Accessible!');
  });
"
```

3. **Test your application:**
   - Web: http://localhost:3000
   - Admin: http://localhost:3001

## 📊 Your Database Schema Includes:

- ✅ Users & Authentication
- ✅ Products & Variants  
- ✅ Categories
- ✅ Orders & Payments
- ✅ Reviews & Ratings
- ✅ Cart & Wishlist
- ✅ Inventory Management
- ✅ Coupons & Analytics

## 🔗 Quick Links

- **SQL Editor:** https://supabase.com/dashboard/project/ipankxazdueozqgwjjei/sql
- **Table Editor:** https://supabase.com/dashboard/project/ipankxazdueozqgwjjei/editor
- **Auth:** https://supabase.com/dashboard/project/ipankxazdueozqgwjjei/auth/users
- **API Docs:** https://supabase.com/dashboard/project/ipankxazdueozqgwjjei/api

## ⚡ Pro Tip

The easiest way is Option 1 (Dashboard). Just:
1. Open the SQL Editor link above
2. Copy/paste the content from `supabase-schema.sql`
3. Click Run
4. Done! 🎉

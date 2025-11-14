#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Automates the installation and configuration of Supabase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase PostgreSQL for Radha G Sarees...\n');

// Step 1: Install dependencies
console.log('📦 Installing Supabase dependencies...');
try {
  execSync('pnpm add @supabase/supabase-js', { stdio: 'inherit' });
  console.log('✅ Supabase client installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install Supabase client:', error.message);
  process.exit(1);
}

// Step 2: Check environment files
console.log('🔧 Checking environment configuration...');

const envFiles = [
  'apps/web/.env.local',
  'apps/admin/.env.local'
];

const missingEnvFiles = envFiles.filter(file => !fs.existsSync(file));

if (missingEnvFiles.length > 0) {
  console.log('⚠️  Missing environment files:');
  missingEnvFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\n📋 Please create these files with your Supabase credentials.');
  console.log('📖 See SUPABASE_SETUP.md for detailed instructions.\n');
} else {
  console.log('✅ Environment files exist\n');
}

// Step 3: Generate Prisma client
console.log('🔨 Generating Prisma client...');
try {
  execSync('pnpm db:generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully\n');
} catch (error) {
  console.log('⚠️  Prisma client generation skipped (run manually after env setup)\n');
}

// Step 4: Display next steps
console.log('🎉 Supabase setup preparation complete!\n');
console.log('📋 Next Steps:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Get your project credentials from the Supabase dashboard');
console.log('3. Create .env.local files in apps/web and apps/admin');
console.log('4. Add your Supabase credentials to the .env.local files');
console.log('5. Run `pnpm db:push` to sync your schema');
console.log('6. Run `pnpm dev` to start development\n');
console.log('📖 See SUPABASE_SETUP.md for detailed step-by-step instructions');
console.log('🔗 Repository: https://github.com/propranjan/radhagsareees\n');

// Step 5: Create quick setup checklist
const checklistPath = 'SUPABASE_CHECKLIST.md';
const checklist = `# Supabase Setup Checklist

- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project URL and API keys
- [ ] Create \`apps/web/.env.local\` with Supabase credentials
- [ ] Create \`apps/admin/.env.local\` with Supabase credentials  
- [ ] Run \`pnpm install\` to install dependencies
- [ ] Run \`pnpm db:generate\` to generate Prisma client
- [ ] Run \`pnpm db:push\` to sync database schema
- [ ] Run \`pnpm db:seed\` to populate sample data
- [ ] Run \`pnpm dev\` to start development servers
- [ ] Test database connection at http://localhost:3000

## Environment Variables Template

\`\`\`bash
# Add to apps/web/.env.local and apps/admin/.env.local
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
\`\`\`

Replace [PASSWORD] and [REF] with your actual Supabase credentials.
`;

fs.writeFileSync(checklistPath, checklist);
console.log(`✅ Setup checklist created: ${checklistPath}`);
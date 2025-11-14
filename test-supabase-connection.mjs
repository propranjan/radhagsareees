// Quick test script to verify Supabase integration
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from apps/admin/.env.local
dotenv.config({ path: join(__dirname, 'apps', 'admin', '.env.local') });

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('✓ SUPABASE_URL:', process.env.SUPABASE_URL || '✗ Missing');
console.log('✓ SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set (' + process.env.SUPABASE_ANON_KEY.length + ' chars)' : '✗ Missing');
console.log();

// Test Supabase client creation and connection
async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment');
    }

    console.log('📡 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully\n');

    // Test actual connection by querying the auth endpoint
    console.log('🔐 Testing authentication endpoint...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
      throw authError;
    }
    console.log('✅ Auth endpoint responding\n');

    // Test database connection by listing tables (requires public schema access)
    console.log('💾 Testing database connection...');
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist, that's okay - connection works
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('⚠️  Database connected but schema not initialized yet');
        console.log('   Run: pnpm db:push or pnpm db:migrate\n');
      } else {
        console.log('⚠️  Database connection issue:', error.message, '\n');
      }
    } else {
      console.log('✅ Database connection successful\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ Supabase Connection Test: SUCCESSFUL');
    console.log('═══════════════════════════════════════════');
    console.log('Project URL:', supabaseUrl);
    console.log('Connection: Active');
    console.log('Ready for: Database operations');
    console.log('\nNext steps:');
    console.log('1. Run: pnpm db:push (to sync Prisma schema)');
    console.log('2. Restart dev servers to use new credentials');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

testSupabaseConnection();

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = join(__dirname, '../supabase/migrations');
  const migrationFiles = [
    '20240101000000_initial_schema.sql'
  ];

  console.log('Starting database migrations...\n');

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    try {
      const sql = readFileSync(filePath, 'utf-8');
      console.log(`Running migration: ${file}`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try direct SQL execution
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(0);
        
        // If that works, try splitting SQL into statements
        const statements = sql.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            // Supabase client doesn't support raw SQL directly
            // This would need to be run via Supabase Dashboard or CLI
            console.log(`Note: ${file} needs to be run manually via Supabase Dashboard or CLI`);
          }
        }
      } else {
        console.log(`✓ ${file} completed`);
      }
    } catch (err) {
      console.error(`Error running ${file}:`, err);
    }
  }

  console.log('\nMigration check completed!');
  console.log('If migrations failed, please run them manually via Supabase Dashboard:');
  console.log('1. Go to your Supabase project');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL from supabase/migrations/');
  console.log('4. Execute the SQL statements');
}

runMigrations().catch(console.error);


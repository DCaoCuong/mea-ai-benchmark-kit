import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * DATA MIGRATION SCRIPT: PostgreSQL (Supabase) → SQLite
 * =====================================================
 *
 * This script migrates data from your PostgreSQL database on Supabase
 * to a local SQLite database for your NestJS application.
 *
 * SETUP:
 * 1. Create a .env file with your Supabase credentials:
 *    POSTGRES_URL=postgresql://user:password@host:port/database
 *    SQLITE_DB_PATH=./data/db/medical_assistant.db
 *
 * 2. Install required packages:
 *    npm install postgres dotenv
 *
 * USAGE:
 *    npx tsx src/database/migration/migrate-from-supabase.ts
 */

interface PostgresComparison {
  id: string;
  timestamp: Date;
  ai_results: any;
  doctor_results: any;
  comparison: any;
  match_score: number;
  case_id: string | null;
  session_id: string | null;
  medical_record_id: string | null;
  created_at: Date;
}

interface SQLiteComparison {
  id: string;
  timestamp: number; // Unix timestamp
  ai_results: string; // JSON string
  doctor_results: string; // JSON string
  comparison: string; // JSON string
  match_score: number;
  case_id: string | null;
  session_id: string | null;
  medical_record_id: string | null;
  created_at: number; // Unix timestamp
}

async function migrateComparisonRecords() {
  console.log('🚀 Starting migration from Supabase to SQLite...\n');

  // Connect to PostgreSQL (Supabase)
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL not found in .env file');
  }

  console.log('📡 Connecting to Supabase (PostgreSQL)...');
  const pgClient = postgres(postgresUrl);
  const pgDb = drizzle(pgClient);

  // Connect to SQLite
  const sqliteDbPath =
    process.env.SQLITE_DB_PATH || './data/db/medical_assistant.db';
  console.log(`📦 Connecting to SQLite: ${sqliteDbPath}\n`);

  const sqlite = new Database(sqliteDbPath);
  const sqliteDb = drizzleSQLite(sqlite);

  try {
    // Create the comparison_records table in SQLite if it doesn't exist
    console.log('📝 Creating comparison_records table in SQLite...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS comparison_records (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        ai_results TEXT NOT NULL,
        doctor_results TEXT NOT NULL,
        comparison TEXT NOT NULL,
        match_score REAL NOT NULL,
        case_id TEXT,
        session_id TEXT,
        medical_record_id TEXT,
        created_at INTEGER NOT NULL
      );
    `);
    console.log('✅ Table created successfully\n');

    // Fetch data from PostgreSQL
    console.log('⬇️  Fetching data from Supabase...');
    const pgRecords = await pgClient<PostgresComparison[]>`
      SELECT * FROM comparison_records ORDER BY created_at ASC
    `;
    console.log(`📊 Found ${pgRecords.length} records to migrate\n`);

    if (pgRecords.length === 0) {
      console.log('ℹ️  No records to migrate. Exiting...');
      return;
    }

    // Transform and insert into SQLite
    console.log('⬆️  Migrating records to SQLite...');
    let successCount = 0;
    let errorCount = 0;

    for (const pgRecord of pgRecords) {
      try {
        const sqliteRecord: SQLiteComparison = {
          id: pgRecord.id,
          timestamp: pgRecord.timestamp.getTime(), // Convert Date to Unix timestamp
          ai_results: JSON.stringify(pgRecord.ai_results), // Convert JSONB to JSON string
          doctor_results: JSON.stringify(pgRecord.doctor_results),
          comparison: JSON.stringify(pgRecord.comparison),
          match_score: pgRecord.match_score,
          case_id: pgRecord.case_id,
          session_id: pgRecord.session_id,
          medical_record_id: pgRecord.medical_record_id,
          created_at: pgRecord.created_at.getTime(),
        };

        // Insert into SQLite
        const stmt = sqlite.prepare(`
          INSERT OR REPLACE INTO comparison_records (
            id, timestamp, ai_results, doctor_results, comparison,
            match_score, case_id, session_id, medical_record_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          sqliteRecord.id,
          sqliteRecord.timestamp,
          sqliteRecord.ai_results,
          sqliteRecord.doctor_results,
          sqliteRecord.comparison,
          sqliteRecord.match_score,
          sqliteRecord.case_id,
          sqliteRecord.session_id,
          sqliteRecord.medical_record_id,
          sqliteRecord.created_at,
        );

        successCount++;
        console.log(
          `  ✓ Migrated record ${successCount}/${pgRecords.length}: ${pgRecord.id}`,
        );
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed to migrate record ${pgRecord.id}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  ✅ Successfully migrated: ${successCount} records`);
    console.log(`  ❌ Failed: ${errorCount} records`);
    console.log(`  📊 Total: ${pgRecords.length} records`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const sqliteCount = sqlite
      .prepare('SELECT COUNT(*) as count FROM comparison_records')
      .get() as { count: number };
    console.log(`  SQLite database now contains: ${sqliteCount.count} records`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    console.log('\n🔌 Closing database connections...');
    await pgClient.end();
    sqlite.close();
    console.log('✅ Migration completed!\n');
  }
}

// Run the migration
migrateComparisonRecords().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

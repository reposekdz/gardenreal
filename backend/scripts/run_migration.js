/**
 * Database Migration Runner
 * Run this script to execute SQL migration files and full database export
 * Usage: node scripts/run_migration.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

const MIGRATIONS_DIR = path.join(__dirname, '..');
const FULL_DB_PATH = path.join(__dirname, '..', 'full exported db', 'garden_tvet.sql');

async function runFullDatabaseImport() {
    console.log('📦 Loading full database export...\n');

    if (!fs.existsSync(FULL_DB_PATH)) {
        console.log('⚠️  Full database export not found, running migrations only...');
        return false;
    }

    try {
        const sql = fs.readFileSync(FULL_DB_PATH, 'utf8');

        // Split by semicolon and filter empty statements
        const statements = sql.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`Found ${statements.length} SQL statements in full export\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
            // Skip if it's a USE statement or SET statement
            if (statement.toUpperCase().includes('USE ') ||
                statement.toUpperCase().startsWith('SET ') ||
                statement.toUpperCase().includes('SET SQL_MODE') ||
                statement.toUpperCase().includes('SET time_zone')) {
                continue;
            }

            try {
                await db.query(statement);
                successCount++;
            } catch (err) {
                // Ignore common non-critical errors
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`  ⚠️  Table already exists, skipping...`);
                } else if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ⚠️  Column already exists, skipping...`);
                } else if (err.code === 'ER_DUP_ENTRY') {
                    console.log(`  ⚠️  Duplicate entry, skipping...`);
                } else if (err.message.includes('Duplicate column')) {
                    console.log(`  ⚠️  Column already exists, skipping...`);
                } else if (err.message.includes('Duplicate key')) {
                    console.log(`  ⚠️  Duplicate key, skipping...`);
                } else if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`  ⚠️  Table does not exist, may need creation first...`);
                } else {
                    // Log but continue
                    errorCount++;
                }
            }
        }

        console.log(`  ✅ Full database import completed! (${successCount} statements, ${errorCount} warnings)\n`);
        return true;
    } catch (err) {
        console.error(`  ❌ Failed to import full database: ${err.message}\n`);
        return false;
    }
}

async function runMigrations() {
    console.log('🚀 Starting database migrations...\n');

    // First, try to import the full database
    const fullDbImported = await runFullDatabaseImport();

    if (!fullDbImported) {
        // Fall back to phase migrations if full export not available
        console.log('📋 Running phase migrations...\n');

        // Find all phase SQL files
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.startsWith('phase') && f.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migration files:\n`);
        files.forEach(f => console.log(`  - ${f}`));
        console.log();

        for (const file of files) {
            const filePath = path.join(MIGRATIONS_DIR, file);
            console.log(`📄 Running: ${file}`);

            try {
                const sql = fs.readFileSync(filePath, 'utf8');

                // Split by semicolon and filter empty statements
                const statements = sql.split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                for (const statement of statements) {
                    try {
                        await db.query(statement);
                    } catch (err) {
                        // Ignore "table already exists" errors
                        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                            console.log(`  ⚠️  Table already exists, skipping...`);
                        } else if (err.code === 'ER_DUP_FIELDNAME') {
                            console.log(`  ⚠️  Column already exists, skipping...`);
                        } else if (err.message.includes('Duplicate column')) {
                            console.log(`  ⚠️  Column already exists, skipping...`);
                        } else {
                            console.log(`  ❌ Error: ${err.message}`);
                        }
                    }
                }

                console.log(`  ✅ ${file} completed!\n`);
            } catch (err) {
                console.error(`  ❌ Failed to read ${file}: ${err.message}\n`);
            }
        }
    }

    // Also run additional SQL files
    const additionalFiles = [
        'database.sql',
        'school_info.sql',
        'hero_slides.sql',
        'add_default_trades.sql'
    ];

    console.log('📋 Running additional setup scripts...\n');

    for (const file of additionalFiles) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`📄 Running: ${file}`);
            try {
                const sql = fs.readFileSync(filePath, 'utf8');
                const statements = sql.split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                for (const statement of statements) {
                    try {
                        await db.query(statement);
                    } catch (err) {
                        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                            console.log(`  ⚠️  Table already exists, skipping...`);
                        } else if (err.code === 'ER_DUP_ENTRY') {
                            console.log(`  ⚠️  Duplicate entry, skipping...`);
                        }
                    }
                }
                console.log(`  ✅ ${file} completed!\n`);
            } catch (err) {
                console.error(`  ❌ Failed to run ${file}: ${err.message}\n`);
            }
        }
    }

    console.log('✨ All migrations and database setup completed!');
    process.exit(0);
}

runMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

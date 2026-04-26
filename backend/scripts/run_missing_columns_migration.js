/**
 * Run Missing Columns Migration
 * Usage: node scripts/run_missing_columns_migration.js
 */

const db = require('../db');

async function runMigration() {
    console.log('🔧 Running missing columns migration...\n');

    let successCount = 0;
    let errorCount = 0;

    const migrations = [
        // Payments table - Add missing columns
        {
            name: 'Add payment_method to payments',
            sql: "ALTER TABLE payments ADD COLUMN payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'card', 'other') DEFAULT 'cash'"
        },
        {
            name: 'Add transaction_reference to payments',
            sql: "ALTER TABLE payments ADD COLUMN transaction_reference VARCHAR(100)"
        },
        {
            name: 'Add notes to payments',
            sql: "ALTER TABLE payments ADD COLUMN notes TEXT"
        },
        {
            name: 'Add receipt_number to payments',
            sql: "ALTER TABLE payments ADD COLUMN receipt_number VARCHAR(50)"
        },
        {
            name: 'Add payment_status to payments',
            sql: "ALTER TABLE payments ADD COLUMN payment_status ENUM('complete', 'partial', 'overpaid') DEFAULT 'partial'"
        },
        {
            name: 'Add created_at to payments if not exists',
            sql: "ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        },

        // Discipline records table - Add missing columns
        {
            name: 'Add severity to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low'"
        },
        {
            name: 'Add incident_date to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN incident_date DATE"
        },
        {
            name: 'Add location to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN location VARCHAR(200)"
        },
        {
            name: 'Add witness_names to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN witness_names TEXT"
        },
        {
            name: 'Add evidence_files to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN evidence_files JSON"
        },
        {
            name: 'Add follow_up_required to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN follow_up_required BOOLEAN DEFAULT FALSE"
        },
        {
            name: 'Add follow_up_date to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN follow_up_date DATE"
        },
        {
            name: 'Add removal_reason to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN removal_reason TEXT"
        },
        {
            name: 'Add points_deducted to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN points_deducted INT DEFAULT 0"
        },
        {
            name: 'Add status to discipline_records',
            sql: "ALTER TABLE discipline_records ADD COLUMN status ENUM('active', 'resolved', 'appealed', 'closed') DEFAULT 'active'"
        }
    ];

    for (const migration of migrations) {
        try {
            await db.query(migration.sql);
            console.log(`✅ ${migration.name}`);
            successCount++;
        } catch (err) {
            // Ignore "Duplicate column" errors
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⚠️  ${migration.name} - already exists`);
            } else {
                console.log(`❌ ${migration.name}: ${err.message}`);
                errorCount++;
            }
        }
    }

    console.log(`\n📊 Migration complete: ${successCount} succeeded, ${errorCount} errors`);

    // Verify the columns now exist
    console.log('\n📋 Verifying payments table columns:');
    try {
        const [payments] = await db.query("SHOW COLUMNS FROM payments");
        console.log(payments.map(c => `  - ${c.Field}: ${c.Type}`).join('\n'));
    } catch (err) {
        console.log(`  Error: ${err.message}`);
    }

    console.log('\n📋 Verifying discipline_records table columns:');
    try {
        const [discipline] = await db.query("SHOW COLUMNS FROM discipline_records");
        console.log(discipline.map(c => `  - ${c.Field}: ${c.Type}`).join('\n'));
    } catch (err) {
        console.log(`  Error: ${err.message}`);
    }

    process.exit(errorCount > 0 ? 1 : 0);
}

runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

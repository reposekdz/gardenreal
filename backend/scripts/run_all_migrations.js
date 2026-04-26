/**
 * Run All Migrations
 * Usage: node scripts/run_all_migrations.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'garden_tvet',
        multipleStatements: true
    };

    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Migration files to run
        const migrations = [
            { file: 'phase17_grades.sql', name: 'Grades System' },
            { file: 'phase18_sms_templates.sql', name: 'SMS Templates' }
        ];

        for (const migration of migrations) {
            console.log(`📦 Running ${migration.name} migration...`);
            const migrationPath = path.join(__dirname, '..', migration.file);

            if (!fs.existsSync(migrationPath)) {
                console.log(`⚠️  ${migration.file} not found, skipping`);
                continue;
            }

            const sql = fs.readFileSync(migrationPath, 'utf8');
            const statements = sql.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await connection.query(statement);
                    } catch (err) {
                        if (!err.message.includes('Duplicate') && !err.message.includes('already exists')) {
                            console.log('  ⚠️  Note:', err.message.split('\n')[0]);
                        }
                    }
                }
            }

            console.log(`✅ ${migration.name} migration completed!\n`);
        }

        console.log('🎉 All migrations completed successfully!');

        // Verify tables
        const [gradesTable] = await connection.query('SHOW TABLES LIKE "student_grades"');
        const [templatesTable] = await connection.query('SHOW TABLES LIKE "sms_templates"');

        console.log('\n📊 Tables created:');
        console.log('  - student_grades:', gradesTable.length > 0 ? '✅' : '❌');
        console.log('  - sms_templates:', templatesTable.length > 0 ? '✅' : '❌');

        if (templatesTable.length > 0) {
            const [templates] = await connection.query('SELECT COUNT(*) as count FROM sms_templates');
            console.log(`  - SMS templates: ${templates[0].count} templates`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

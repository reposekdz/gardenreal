// Run grade history migration
const db = require('../db');

async function runMigration() {
    try {
        console.log('Creating grade_archives table...');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS grade_archives (
                id INT PRIMARY KEY AUTO_INCREMENT,
                original_grade_id INT NOT NULL,
                student_id INT NOT NULL,
                subject VARCHAR(100) NOT NULL,
                term VARCHAR(50) NOT NULL,
                academic_year VARCHAR(20) NOT NULL,
                grade_type VARCHAR(50) NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                max_score DECIMAL(5,2) NOT NULL,
                percentage DECIMAL(5,2),
                grade_letter VARCHAR(2),
                notes TEXT,
                deleted_by INT,
                deleted_reason TEXT,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived_from VARCHAR(50) DEFAULT 'delete'
            )
        `);

        console.log('Creating indexes...');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_grade_archives_student ON grade_archives(student_id)');
        await db.execute('CREATE INDEX IF NOT EXISTS idx_grade_archives_deleted_at ON grade_archives(deleted_at)');

        console.log('Grade history migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();

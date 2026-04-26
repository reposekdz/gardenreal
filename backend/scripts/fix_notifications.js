const db = require('../db');

async function main() {
    try {
        // Add title column if it doesn't exist
        try {
            await db.execute('ALTER TABLE parent_notifications ADD COLUMN title VARCHAR(255) AFTER parent_id');
            console.log('title column added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('title column already exists');
            else console.error('Error adding title:', e.message);
        }

        // Add sample notifications
        await db.execute(
            'INSERT INTO parent_notifications (parent_id, title, message, notification_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [5, 'Murakaza neza', 'Konti yawe yashyizweho neza!', 'system', 0]
        );

        await db.execute(
            'INSERT INTO parent_notifications (parent_id, title, message, notification_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [5, 'Kwishyura', 'Wishyura amashinga ya school.', 'payment', 0]
        );

        console.log('Sample notifications added successfully');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

main();

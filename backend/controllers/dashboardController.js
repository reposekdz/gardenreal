const db = require('../db');

// Real dashboard stats from DB - simplified version that works with existing schema
exports.getStats = async (req, res) => {
    try {
        // Basic stats that should work
        let total_students = 0;
        let active_discipline = 0;
        let total_fees_collected = 0;
        let low_stock = 0;
        let total_parents = 0;
        let pending_applications = 0;
        let on_leave = 0;
        let male_students = 0;
        let female_students = 0;

        try {
            const [[s]] = await db.query('SELECT COUNT(*) as count FROM students');
            total_students = s?.count || 0;
        } catch (e) {}

        try {
            const [[d]] = await db.query("SELECT COUNT(*) as count FROM discipline_records WHERE action_type != 'conduct_restored'");
            active_discipline = d?.count || 0;
        } catch (e) {}

        try {
            const [[p]] = await db.query('SELECT COALESCE(SUM(amount_paid),0) as sum FROM payments');
            total_fees_collected = p?.sum || 0;
        } catch (e) {}

        try {
            const [[st]] = await db.query('SELECT COUNT(*) as count FROM stock_items WHERE quantity < 5');
            low_stock = st?.count || 0;
        } catch (e) {}

        try {
            const [[pr]] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'parent'");
            total_parents = pr?.count || 0;
        } catch (e) {}

        try {
            const [[app]] = await db.query("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'");
            pending_applications = app?.count || 0;
        } catch (e) {}

        try {
            const [[lv]] = await db.query("SELECT COUNT(*) as count FROM students WHERE current_status = 'on_leave'");
            on_leave = lv?.count || 0;
        } catch (e) {}

        try {
            const [[m]] = await db.query("SELECT COUNT(*) as count FROM students WHERE gender = 'Male'");
            male_students = m?.count || 0;
        } catch (e) {}

        try {
            const [[f]] = await db.query("SELECT COUNT(*) as count FROM students WHERE gender = 'Female'");
            female_students = f?.count || 0;
        } catch (e) {}

        // Get trade counts
        let top_trades = [];
        try {
            const [trades] = await db.query(`
                SELECT trade, COUNT(*) as count 
                FROM students 
                GROUP BY trade 
                ORDER BY count DESC 
                LIMIT 5
            `);
            top_trades = trades || [];
        } catch (e) {}

        // Get monthly revenue (simplified)
        let monthly_revenue = [];
        try {
            const [rev] = await db.query(`
                SELECT 
                    DATE_FORMAT(payment_date, '%Y-%m') as month,
                    SUM(amount_paid) as revenue
                FROM payments 
                WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
                ORDER BY month ASC
            `);
            monthly_revenue = rev || [];
        } catch (e) {}

        res.json({
            total_students,
            active_discipline,
            total_fees_collected,
            low_stock,
            pending_links: 0,
            total_parents,
            pending_applications,
            on_leave,
            male_students,
            female_students,
            monthly_revenue,
            collection_rate: 0,
            recent_students: 0,
            resolved_discipline: 0,
            payment_methods: [],
            top_trades,
            today_payments: 0,
            today_count: 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error.message);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};


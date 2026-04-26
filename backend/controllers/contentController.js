const db = require('../db');

// Get all content blocks (Public)
const getContentBlocks = async (req, res) => {
    try {
        const [blocks] = await db.query('SELECT * FROM content_blocks');
        const formattedBlocks = {};
        blocks.forEach(block => {
            formattedBlocks[block.section_name] = block;
        });
        res.json(formattedBlocks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching content blocks' });
    }
};

// Get leadership team (Public)
const getLeadershipTeam = async (req, res) => {
    try {
        // Get staff members with leadership roles
        const [staff] = await db.query(`
            SELECT id, first_name, last_name, role, email, phone, photo, position, bio
            FROM users 
            WHERE role IN ('admin', 'director', 'director_of_discipline', 'dod', 'accountant', 'registrar', 'librarian', 'stock_manager', 'teacher')
            AND is_active = 1
            ORDER BY 
                CASE role 
                    WHEN 'director' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'director_of_discipline' THEN 3
                    WHEN 'dod' THEN 4
                    WHEN 'accountant' THEN 5
                    WHEN 'registrar' THEN 6
                    WHEN 'librarian' THEN 7
                    WHEN 'stock_manager' THEN 8
                    WHEN 'teacher' THEN 9
                END, first_name
        `);
        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching leadership team' });
    }
};

// Admin: Update content block
const updateContentBlock = async (req, res) => {
    const { section_name } = req.params;
    const { content_rw, content_en, content_fr } = req.body;
    let image_url = null;

    try {
        let query = 'UPDATE content_blocks SET content_rw = ?, content_en = ?, content_fr = ?';
        let params = [content_rw, content_en, content_fr];

        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
            query += ', image_url = ?';
            params.push(image_url);
        }

        query += ' WHERE section_name = ?';
        params.push(section_name);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            // Block doesn't exist, create it (fallback)
            const insertQuery = 'INSERT INTO content_blocks (section_name, content_rw, content_en, content_fr, image_url) VALUES (?, ?, ?, ?, ?)';
            await db.query(insertQuery, [section_name, content_rw, content_en, content_fr, image_url]);
        }

        res.json({ message: 'Content block updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating content block' });
    }
};

module.exports = {
    getContentBlocks,
    getLeadershipTeam,
    updateContentBlock
};

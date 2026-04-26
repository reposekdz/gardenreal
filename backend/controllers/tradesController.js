const db = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const tradeUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'trade card image');
fs.mkdirSync(tradeUploadDir, { recursive: true });

// Default levels for each trade
const DEFAULT_LEVELS = {
    'Software Development': ['Level 3', 'Level 4', 'Level 5'],
    'Automobile Technology': ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'],
    'Building and Construction': ['Level 3', 'Level 4', 'Level 5'],
    'Electrical Engineering': ['Level 3', 'Level 4', 'Level 5'],
    'Hospitality Management': ['Level 3', 'Level 4', 'Level 5'],
    'Business Management': ['Level 3', 'Level 4', 'Level 5'],
    'SOD': ['Level 3', 'Level 4', 'Level 5'],
    'School of Development': ['Level 3', 'Level 4', 'Level 5'],
    'School of Automobile': ['Level 3', 'Level 4', 'Level 5']
};

// Ensure all trades have levels in database
const ensureTradeLevels = async (trades) => {
    for (const trade of trades) {
        if (!trade.levels) {
            const defaultLevels = DEFAULT_LEVELS[trade.name] || ['Level 3', 'Level 4', 'Level 5'];
            await db.execute('UPDATE trades SET levels = ? WHERE id = ?', [JSON.stringify(defaultLevels), trade.id]);
            trade.levels = defaultLevels;
        } else if (typeof trade.levels === 'string') {
            try {
                trade.levels = JSON.parse(trade.levels);
            } catch (e) {
                trade.levels = DEFAULT_LEVELS[trade.name] || ['Level 3', 'Level 4', 'Level 5'];
            }
        }
    }
    return trades;
};

// Get all trades with their levels (including from students table)
exports.getTrades = async (req, res) => {
    try {
        let [trades] = await db.query('SELECT * FROM trades ORDER BY name ASC');

        // If no trades exist, create default trades with levels
        if (trades.length === 0) {
            await db.query(`
                INSERT INTO trades (name, code, description, icon, levels) VALUES
                ('Software Development', 'SD', 'Learn programming and software development skills', 'code', '["Level 3", "Level 4", "Level 5"]'),
                ('Automobile Technology', 'AT', 'Master automotive repair and maintenance', 'car', '["Level 3", "Level 4a", "Level 4b", "Level 5a", "Level 5b"]'),
                ('Building and Construction', 'BC', 'Civil engineering and construction skills', 'hard-hat', '["Level 3", "Level 4", "Level 5"]')
            `);
            [trades] = await db.query('SELECT * FROM trades ORDER BY name ASC');
        }

        // Ensure all trades have levels
        trades = await ensureTradeLevels(trades);

        // Get unique levels from students table for each trade (safely)
        let studentLevels = [];
        try {
            const [levels] = await db.query('SELECT DISTINCT trade, level FROM students ORDER BY trade, level');
            studentLevels = levels || [];
        } catch (e) {
            console.log('No students table or query failed:', e.message);
            studentLevels = [];
        }

        // Build trade levels map from students table
        const tradeLevelsMap = {};
        studentLevels.forEach(s => {
            if (!tradeLevelsMap[s.trade]) tradeLevelsMap[s.trade] = [];
            if (s.level && !tradeLevelsMap[s.trade].includes(s.level)) {
                tradeLevelsMap[s.trade].push(s.level);
            }
        });

        // Merge with database levels
        const tradesWithLevels = trades.map(trade => {
            const tradeName = trade.name;
            // Parse levels from database (already done in ensureTradeLevels)
            let levels = trade.levels || [];

            // Also add levels found in students table if not already present
            if (tradeLevelsMap[tradeName]) {
                tradeLevelsMap[tradeName].forEach(l => {
                    if (!levels.includes(l)) levels.push(l);
                });
            }
            // Fall back to defaults if still empty
            if (levels.length === 0 && DEFAULT_LEVELS[tradeName]) {
                levels = DEFAULT_LEVELS[tradeName];
            }

            return {
                ...trade,
                levels: levels.sort()
            };
        });

        res.json(tradesWithLevels);
    } catch (error) {
        console.error('Error fetching trades:', error);
        res.status(500).json({ message: 'Habaye ikibazo mu gushaka amashami' });
    }
};

// Get all unique levels across all trades
exports.getAllLevels = async (req, res) => {
    try {
        const [levels] = await db.query('SELECT DISTINCT level FROM students ORDER BY level');
        const defaultAllLevels = ['Level 3', 'Level 4', 'Level 4a', 'Level 4b', 'Level 5', 'Level 5a', 'Level 5b'];
        const studentLevels = (levels || []).map(l => l.level).filter(l => l);
        const allLevels = [...new Set([...defaultAllLevels, ...studentLevels])].sort();
        res.json(allLevels);
    } catch (error) {
        res.status(500).json({ message: 'Habaye ikibazo' });
    }
};

// Get trade-level combinations with student counts
exports.getTradeLevelStats = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT trade, level, COUNT(*) as count 
            FROM students 
            GROUP BY trade, level 
            ORDER BY trade, level
        `);
        res.json(stats || []);
    } catch (error) {
        res.status(500).json({ message: 'Habaye ikibazo' });
    }
};

exports.createTrade = async (req, res) => {
    try {
        const { name, description, levels } = req.body;
        let image_url = req.body.image_url || null;
        if (req.file) {
            image_url = `/uploads/trade card image/${req.file.filename}`;
        }
        if (!name) return res.status(400).json({ message: 'Emeza izina ry ishami' });

        // Use provided levels or default levels
        const tradeLevels = levels || DEFAULT_LEVELS[name] || ['Level 3', 'Level 4', 'Level 5'];

        await db.query('INSERT INTO trades (name, description, image_url, levels) VALUES (?, ?, ?, ?)',
            [name, description, image_url, JSON.stringify(tradeLevels)]);
        res.status(201).json({ message: 'Ishami rishya ryangeweho' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

exports.updateTrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        let image_url = req.body.image_url || null;
        if (req.file) {
            image_url = `/uploads/trade card image/${req.file.filename}`;
        }
        await db.query('UPDATE trades SET name = ?, description = ?, image_url = ? WHERE id = ?', [name, description, image_url, id]);
        res.json({ message: 'Ishami ryavuguruwe neza' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

exports.deleteTrade = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM trades WHERE id = ?', [id]);
        res.json({ message: 'Ishami ryasibwe' });
    } catch (error) {
        res.status(500).json({ message: 'Ikibazo cya server' });
    }
};

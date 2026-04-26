// Advanced student-learning interactions:
//   • Threaded replies on student questions (students + teachers)
//   • Upvotes + accepted-answer marking
//   • Comments on course notes (with reply threading)
//   • Note bookmarks + reactions (like / helpful / question)
//   • Per-user note reading progress

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'supersecretgardenkey2026';

// ─── Init tables (idempotent) ────────────────────────────────────────────────
async function init() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS student_question_replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            replier_role ENUM('student','teacher','admin','staff','dod','hod') NOT NULL DEFAULT 'student',
            replier_user_id INT DEFAULT NULL,
            replier_name VARCHAR(150) NOT NULL,
            replier_contact VARCHAR(120) DEFAULT NULL,
            body TEXT NOT NULL,
            is_accepted TINYINT(1) DEFAULT 0,
            upvotes INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_q (question_id),
            INDEX idx_accepted (is_accepted)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS student_question_reply_votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reply_id INT NOT NULL,
            voter_key VARCHAR(120) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_vote (reply_id, voter_key),
            INDEX idx_reply (reply_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS student_question_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            viewer_key VARCHAR(120) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_view (question_id, viewer_key),
            INDEX idx_q (question_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS note_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            note_id INT NOT NULL,
            parent_comment_id INT DEFAULT NULL,
            commenter_role ENUM('student','teacher','admin','staff') NOT NULL DEFAULT 'student',
            commenter_user_id INT DEFAULT NULL,
            commenter_name VARCHAR(150) NOT NULL,
            body TEXT NOT NULL,
            likes INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_note (note_id),
            INDEX idx_parent (parent_comment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS note_comment_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            comment_id INT NOT NULL,
            liker_key VARCHAR(120) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_like (comment_id, liker_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS note_bookmarks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            note_id INT NOT NULL,
            owner_key VARCHAR(120) NOT NULL,
            owner_name VARCHAR(150) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_bm (note_id, owner_key),
            INDEX idx_owner (owner_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS note_reactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            note_id INT NOT NULL,
            reactor_key VARCHAR(120) NOT NULL,
            reaction ENUM('like','helpful','question','love') NOT NULL DEFAULT 'like',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_reaction (note_id, reactor_key, reaction),
            INDEX idx_note (note_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS note_reading_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            note_id INT NOT NULL,
            reader_key VARCHAR(120) NOT NULL,
            reader_name VARCHAR(150) DEFAULT NULL,
            last_page INT DEFAULT 1,
            total_pages INT DEFAULT NULL,
            completed TINYINT(1) DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_progress (note_id, reader_key),
            INDEX idx_note (note_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Learning interaction tables ready');
}
init().catch(e => console.error('learning init:', e.message));

// Optional auth (won't reject if missing)
function softAuth(req, _res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (token) {
        try { req.user = jwt.verify(token, SECRET); } catch {}
    }
    next();
}

// Generate a stable visitor key from header/cookie/IP
function visitorKey(req, providedName) {
    if (req.user?.id) return `u:${req.user.id}`;
    const fromHeader = req.headers['x-visitor-id'];
    if (fromHeader && /^[A-Za-z0-9_-]{6,80}$/.test(String(fromHeader))) return `v:${fromHeader}`;
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const ua = (req.headers['user-agent'] || '').slice(0, 32);
    const name = (providedName || '').trim().toLowerCase().slice(0, 32);
    return `ip:${ip}:${name}:${ua.length}`;
}

// ═══════════════════════ STUDENT QUESTION REPLIES ════════════════════════════

// Public: list replies for a question (with current viewer's vote state)
router.get('/questions/:id/replies', softAuth, async (req, res) => {
    try {
        const qid = Number(req.params.id);
        const vk = visitorKey(req);

        const [question] = await db.execute(
            `SELECT q.*,
                    (SELECT COUNT(*) FROM student_question_replies WHERE question_id = q.id) AS reply_count
             FROM student_questions q WHERE q.id = ?`, [qid]);
        if (question.length === 0) return res.status(404).json({ message: 'Question not found' });

        const [replies] = await db.execute(`
            SELECT r.*,
                   EXISTS(SELECT 1 FROM student_question_reply_votes v
                          WHERE v.reply_id = r.id AND v.voter_key = ?) AS has_voted
            FROM student_question_replies r
            WHERE r.question_id = ?
            ORDER BY r.is_accepted DESC, r.upvotes DESC, r.created_at ASC
        `, [vk, qid]);

        // Track unique view
        try {
            await db.execute(
                'INSERT IGNORE INTO student_question_views (question_id, viewer_key) VALUES (?, ?)',
                [qid, vk]
            );
        } catch {}
        const [[viewCount]] = await db.query(
            'SELECT COUNT(*) AS c FROM student_question_views WHERE question_id = ?', [qid]
        );

        res.json({
            question: question[0],
            replies,
            view_count: viewCount.c || 0
        });
    } catch (err) {
        console.error('list replies:', err);
        res.status(500).json({ message: 'Failed to load replies' });
    }
});

// Public: post a reply
router.post('/questions/:id/replies', softAuth, async (req, res) => {
    try {
        const qid = Number(req.params.id);
        const { body, replier_name, replier_contact } = req.body || {};
        if (!body || String(body).trim().length < 2) {
            return res.status(400).json({ message: 'Andika igisubizo' });
        }

        const [qRows] = await db.execute('SELECT id FROM student_questions WHERE id = ?', [qid]);
        if (qRows.length === 0) return res.status(404).json({ message: 'Question not found' });

        let role = 'student';
        let userId = null;
        let name = (replier_name || '').trim().slice(0, 150);

        if (req.user) {
            userId = req.user.id;
            const r = req.user.role;
            if (r === 'teacher') role = 'teacher';
            else if (r === 'admin') role = 'admin';
            else if (['dod', 'hod'].includes(r)) role = r;
            else if (r === 'student') role = 'student';
            else role = 'staff';
            const fn = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim();
            name = fn || req.user.username || name || 'User';
        }
        if (!name) return res.status(400).json({ message: 'Tanga izina ryawe' });

        const [result] = await db.execute(
            `INSERT INTO student_question_replies (question_id, replier_role, replier_user_id, replier_name, replier_contact, body)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [qid, role, userId, name, replier_contact ? String(replier_contact).slice(0, 120) : null, String(body).trim().slice(0, 4000)]
        );

        // If teacher/admin replies, mark the question as answered automatically (don't override existing answer)
        if (['teacher', 'admin', 'dod', 'hod'].includes(role)) {
            try {
                await db.execute(
                    `UPDATE student_questions
                     SET status = 'answered',
                         answer = COALESCE(NULLIF(answer, ''), ?),
                         answered_by = COALESCE(answered_by, ?),
                         answered_by_name = COALESCE(answered_by_name, ?),
                         answered_at = COALESCE(answered_at, NOW())
                     WHERE id = ?`,
                    [String(body).trim().slice(0, 4000), userId, name, qid]
                );
            } catch {}
        }

        const [[row]] = await db.query('SELECT * FROM student_question_replies WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, reply: row });
    } catch (err) {
        console.error('post reply:', err);
        res.status(500).json({ message: 'Failed to post reply' });
    }
});

// Toggle upvote on a reply
router.post('/replies/:id/upvote', softAuth, async (req, res) => {
    try {
        const rid = Number(req.params.id);
        const vk = visitorKey(req);

        const [exist] = await db.execute(
            'SELECT id FROM student_question_reply_votes WHERE reply_id = ? AND voter_key = ?',
            [rid, vk]
        );
        if (exist.length > 0) {
            await db.execute('DELETE FROM student_question_reply_votes WHERE id = ?', [exist[0].id]);
            await db.execute('UPDATE student_question_replies SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = ?', [rid]);
            const [[r]] = await db.query('SELECT upvotes FROM student_question_replies WHERE id = ?', [rid]);
            return res.json({ voted: false, upvotes: r?.upvotes || 0 });
        }
        await db.execute('INSERT INTO student_question_reply_votes (reply_id, voter_key) VALUES (?, ?)', [rid, vk]);
        await db.execute('UPDATE student_question_replies SET upvotes = upvotes + 1 WHERE id = ?', [rid]);
        const [[r]] = await db.query('SELECT upvotes FROM student_question_replies WHERE id = ?', [rid]);
        res.json({ voted: true, upvotes: r?.upvotes || 0 });
    } catch (err) {
        console.error('upvote:', err);
        res.status(500).json({ message: 'Vote failed' });
    }
});

// Mark a reply as accepted (teacher/admin only, or original question owner if matching contact)
router.post('/replies/:id/accept', softAuth, async (req, res) => {
    try {
        if (!req.user || !['teacher', 'admin', 'dod', 'hod'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Teacher/admin only' });
        }
        const rid = Number(req.params.id);
        const [rRows] = await db.execute('SELECT question_id FROM student_question_replies WHERE id = ?', [rid]);
        if (rRows.length === 0) return res.status(404).json({ message: 'Reply not found' });
        const qid = rRows[0].question_id;
        await db.execute('UPDATE student_question_replies SET is_accepted = 0 WHERE question_id = ?', [qid]);
        await db.execute('UPDATE student_question_replies SET is_accepted = 1 WHERE id = ?', [rid]);
        await db.execute("UPDATE student_questions SET status = 'answered' WHERE id = ?", [qid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Failed' });
    }
});

// Delete a reply (own/teacher/admin)
router.delete('/replies/:id', softAuth, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Login required' });
        const rid = Number(req.params.id);
        const [rRows] = await db.execute('SELECT replier_user_id FROM student_question_replies WHERE id = ?', [rid]);
        if (rRows.length === 0) return res.status(404).end();
        const ownsIt = rRows[0].replier_user_id === req.user.id;
        const isStaff = ['teacher', 'admin', 'dod', 'hod'].includes(req.user.role);
        if (!ownsIt && !isStaff) return res.status(403).json({ message: 'Not allowed' });
        await db.execute('DELETE FROM student_question_replies WHERE id = ?', [rid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Public Q&A feed enriched with reply counts and recent activity
router.get('/questions/feed', softAuth, async (req, res) => {
    try {
        const { trade_code, level, q, status, sort } = req.query;
        const where = [];
        const params = [];
        if (trade_code) { where.push('q.trade_code = ?'); params.push(trade_code); }
        if (level) { where.push('q.level = ?'); params.push(level); }
        if (status && ['pending', 'answered', 'closed'].includes(status)) {
            where.push('q.status = ?'); params.push(status);
        }
        if (q) {
            where.push('(q.question LIKE ? OR q.student_name LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }
        let order = 'q.created_at DESC';
        if (sort === 'popular') order = 'reply_count DESC, view_count DESC, q.created_at DESC';
        else if (sort === 'unanswered') order = `(q.status = 'pending') DESC, q.created_at DESC`;

        const sql = `
            SELECT q.*,
                   (SELECT COUNT(*) FROM student_question_replies r WHERE r.question_id = q.id) AS reply_count,
                   (SELECT COUNT(*) FROM student_question_views v WHERE v.question_id = q.id) AS view_count,
                   (SELECT MAX(r.created_at) FROM student_question_replies r WHERE r.question_id = q.id) AS last_reply_at,
                   EXISTS(SELECT 1 FROM student_question_replies r WHERE r.question_id = q.id AND r.is_accepted = 1) AS has_accepted
            FROM student_questions q
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY ${order}
            LIMIT 200
        `;
        const [rows] = await db.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('feed:', err);
        res.status(500).json({ message: 'Feed failed' });
    }
});

// ═══════════════════════════ NOTE COMMENTS ═══════════════════════════════════

router.get('/notes/:id/comments', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const vk = visitorKey(req);
        const [rows] = await db.execute(`
            SELECT c.*,
                   EXISTS(SELECT 1 FROM note_comment_likes l WHERE l.comment_id = c.id AND l.liker_key = ?) AS has_liked
            FROM note_comments c
            WHERE c.note_id = ?
            ORDER BY c.parent_comment_id IS NULL DESC, c.created_at ASC
        `, [vk, nid]);
        res.json(rows);
    } catch (err) {
        console.error('list comments:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

router.post('/notes/:id/comments', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const { body, commenter_name, parent_comment_id } = req.body || {};
        if (!body || String(body).trim().length < 1) return res.status(400).json({ message: 'Andika ibitekerezo byawe' });

        const [nRows] = await db.execute('SELECT id FROM course_notes WHERE id = ?', [nid]);
        if (nRows.length === 0) return res.status(404).json({ message: 'Note not found' });

        let role = 'student';
        let userId = null;
        let name = (commenter_name || '').trim().slice(0, 150);
        if (req.user) {
            userId = req.user.id;
            role = ['teacher', 'admin'].includes(req.user.role) ? req.user.role : (req.user.role === 'student' ? 'student' : 'staff');
            const fn = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim();
            name = fn || req.user.username || name || 'User';
        }
        if (!name) return res.status(400).json({ message: 'Tanga izina ryawe' });

        let parentId = null;
        if (parent_comment_id) {
            const [pRows] = await db.execute('SELECT id FROM note_comments WHERE id = ? AND note_id = ?', [parent_comment_id, nid]);
            if (pRows.length > 0) parentId = parent_comment_id;
        }

        const [result] = await db.execute(
            `INSERT INTO note_comments (note_id, parent_comment_id, commenter_role, commenter_user_id, commenter_name, body)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nid, parentId, role, userId, name, String(body).trim().slice(0, 4000)]
        );
        const [[row]] = await db.query('SELECT * FROM note_comments WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, comment: row });
    } catch (err) {
        console.error('post comment:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

router.post('/comments/:id/like', softAuth, async (req, res) => {
    try {
        const cid = Number(req.params.id);
        const vk = visitorKey(req);
        const [exist] = await db.execute('SELECT id FROM note_comment_likes WHERE comment_id = ? AND liker_key = ?', [cid, vk]);
        if (exist.length > 0) {
            await db.execute('DELETE FROM note_comment_likes WHERE id = ?', [exist[0].id]);
            await db.execute('UPDATE note_comments SET likes = GREATEST(likes - 1, 0) WHERE id = ?', [cid]);
            const [[r]] = await db.query('SELECT likes FROM note_comments WHERE id = ?', [cid]);
            return res.json({ liked: false, likes: r?.likes || 0 });
        }
        await db.execute('INSERT INTO note_comment_likes (comment_id, liker_key) VALUES (?, ?)', [cid, vk]);
        await db.execute('UPDATE note_comments SET likes = likes + 1 WHERE id = ?', [cid]);
        const [[r]] = await db.query('SELECT likes FROM note_comments WHERE id = ?', [cid]);
        res.json({ liked: true, likes: r?.likes || 0 });
    } catch (err) {
        res.status(500).json({ message: 'Failed' });
    }
});

router.delete('/comments/:id', softAuth, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Login required' });
        const cid = Number(req.params.id);
        const [cRows] = await db.execute('SELECT commenter_user_id FROM note_comments WHERE id = ?', [cid]);
        if (cRows.length === 0) return res.status(404).end();
        const owns = cRows[0].commenter_user_id === req.user.id;
        const isStaff = ['teacher', 'admin', 'dod', 'hod'].includes(req.user.role);
        if (!owns && !isStaff) return res.status(403).json({ message: 'Not allowed' });
        await db.execute('DELETE FROM note_comments WHERE id = ? OR parent_comment_id = ?', [cid, cid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// ═══════════════════ BOOKMARKS / REACTIONS / PROGRESS ════════════════════════

router.get('/notes/:id/stats', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const vk = visitorKey(req);
        const [[bm]] = await db.query('SELECT COUNT(*) AS c FROM note_bookmarks WHERE note_id = ?', [nid]);
        const [[mine]] = await db.query('SELECT COUNT(*) AS c FROM note_bookmarks WHERE note_id = ? AND owner_key = ?', [nid, vk]);
        const [[cc]] = await db.query('SELECT COUNT(*) AS c FROM note_comments WHERE note_id = ?', [nid]);
        const [reacts] = await db.query(
            'SELECT reaction, COUNT(*) AS c FROM note_reactions WHERE note_id = ? GROUP BY reaction',
            [nid]
        );
        const [myReacts] = await db.query(
            'SELECT reaction FROM note_reactions WHERE note_id = ? AND reactor_key = ?',
            [nid, vk]
        );
        const [[prog]] = await db.query(
            'SELECT last_page, total_pages, completed FROM note_reading_progress WHERE note_id = ? AND reader_key = ?',
            [nid, vk]
        );
        const reactionMap = {};
        reacts.forEach(r => { reactionMap[r.reaction] = r.c; });
        res.json({
            bookmark_count: bm.c,
            is_bookmarked: mine.c > 0,
            comment_count: cc.c,
            reactions: reactionMap,
            my_reactions: myReacts.map(r => r.reaction),
            progress: prog || null
        });
    } catch (err) {
        console.error('note stats:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

router.post('/notes/:id/bookmark', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const vk = visitorKey(req, req.body?.owner_name);
        const name = req.user
            ? ([req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || req.user.username)
            : (req.body?.owner_name || null);
        const [exist] = await db.execute('SELECT id FROM note_bookmarks WHERE note_id = ? AND owner_key = ?', [nid, vk]);
        if (exist.length > 0) {
            await db.execute('DELETE FROM note_bookmarks WHERE id = ?', [exist[0].id]);
            return res.json({ bookmarked: false });
        }
        await db.execute('INSERT INTO note_bookmarks (note_id, owner_key, owner_name) VALUES (?, ?, ?)', [nid, vk, name]);
        res.json({ bookmarked: true });
    } catch (err) {
        console.error('bookmark:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

router.post('/notes/:id/react', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const reaction = req.body?.reaction;
        if (!['like', 'helpful', 'question', 'love'].includes(reaction)) {
            return res.status(400).json({ message: 'Invalid reaction' });
        }
        const vk = visitorKey(req, req.body?.user_name);
        const [exist] = await db.execute(
            'SELECT id FROM note_reactions WHERE note_id = ? AND reactor_key = ? AND reaction = ?',
            [nid, vk, reaction]
        );
        if (exist.length > 0) {
            await db.execute('DELETE FROM note_reactions WHERE id = ?', [exist[0].id]);
            return res.json({ active: false, reaction });
        }
        await db.execute(
            'INSERT INTO note_reactions (note_id, reactor_key, reaction) VALUES (?, ?, ?)',
            [nid, vk, reaction]
        );
        res.json({ active: true, reaction });
    } catch (err) {
        console.error('react:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

router.post('/notes/:id/progress', softAuth, async (req, res) => {
    try {
        const nid = Number(req.params.id);
        const { last_page, total_pages, completed, reader_name } = req.body || {};
        const vk = visitorKey(req, reader_name);
        const name = req.user
            ? ([req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || req.user.username)
            : (reader_name || null);
        await db.execute(
            `INSERT INTO note_reading_progress (note_id, reader_key, reader_name, last_page, total_pages, completed)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               last_page = VALUES(last_page),
               total_pages = COALESCE(VALUES(total_pages), total_pages),
               completed = VALUES(completed),
               reader_name = COALESCE(VALUES(reader_name), reader_name)`,
            [nid, vk, name, Number(last_page) || 1, total_pages ? Number(total_pages) : null, completed ? 1 : 0]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('progress:', err);
        res.status(500).json({ message: 'Failed' });
    }
});

// My bookmarks (visitor or logged-in)
router.get('/my-bookmarks', softAuth, async (req, res) => {
    try {
        const vk = visitorKey(req);
        const [rows] = await db.execute(`
            SELECT b.created_at AS bookmarked_at, n.id, n.title, n.trade_code, n.trade_name, n.level,
                   n.cover_image, n.uploaded_by_name, n.view_count, n.download_count
            FROM note_bookmarks b
            JOIN course_notes n ON b.note_id = n.id
            WHERE b.owner_key = ?
            ORDER BY b.created_at DESC
        `, [vk]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed' });
    }
});

module.exports = router;

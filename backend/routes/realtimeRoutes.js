const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bus = require('../utils/realtimeBus');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'supersecretgardenkey2026';

// EventSource cannot send Authorization header, so we accept ?token= query param
function authFromQuery(req, res, next) {
    const token = req.query.token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'token required' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ message: 'invalid token' });
    }
}

// SSE stream
router.get('/stream', authFromQuery, (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();

    const role = req.user.role;
    const id = req.user.id;
    const channel = role === 'parent' ? `parent:${id}` : `staff:${id}`;

    bus.subscribe(channel, res);
    if (role !== 'parent') bus.subscribe('staff:all', res);

    res.write(`event: connected\ndata: ${JSON.stringify({ channel, ts: Date.now() })}\n\n`);

    req.on('close', () => {
        bus.unsubscribe(channel, res);
        if (role !== 'parent') bus.unsubscribe('staff:all', res);
        try { res.end(); } catch {}
    });
});

// Combined notification feed for the parent header bell
router.get('/parent/notifications', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    let user;
    try { user = jwt.verify(token, SECRET); } catch { return res.status(401).json({ message: 'invalid token' }); }
    if (user.role !== 'parent') return res.status(403).json({ message: 'parents only' });

    try {
        // Aggregate live counters from multiple sources
        const [[mc]] = await db.query(
            'SELECT COALESCE(SUM(unread_by_parent),0) AS unread_msgs FROM parent_message_threads WHERE parent_id = ?',
            [user.id]
        );
        let unreadNotifs = 0;
        try {
            const [[nc]] = await db.query(
                'SELECT COUNT(*) AS c FROM parent_notifications WHERE parent_id = ? AND is_read = 0',
                [user.id]
            );
            unreadNotifs = nc.c || 0;
        } catch {}

        // Recent feed (last 30): merge messages + notifications
        let recent = [];
        try {
            const [msgRows] = await db.query(`
                SELECT 'message' AS source, m.id, m.thread_id, t.subject AS title, m.body AS message,
                       m.created_at, t.unread_by_parent AS unread
                FROM parent_messages m
                JOIN parent_message_threads t ON m.thread_id = t.id
                WHERE t.parent_id = ? AND m.sender_role = 'staff'
                ORDER BY m.created_at DESC LIMIT 20
            `, [user.id]);
            recent = recent.concat(msgRows);
        } catch {}
        try {
            const [notifRows] = await db.query(`
                SELECT 'notification' AS source, id, NULL AS thread_id, title, message,
                       created_at, CASE WHEN is_read = 0 THEN 1 ELSE 0 END AS unread,
                       notification_type
                FROM parent_notifications
                WHERE parent_id = ?
                ORDER BY created_at DESC LIMIT 20
            `, [user.id]);
            recent = recent.concat(notifRows);
        } catch {}
        recent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        recent = recent.slice(0, 25);

        res.json({
            unread_messages: mc.unread_msgs || 0,
            unread_notifications: unreadNotifs,
            total_unread: (mc.unread_msgs || 0) + unreadNotifs,
            recent
        });
    } catch (err) {
        console.error('parent notifications feed:', err.message);
        res.status(500).json({ message: 'failed' });
    }
});

// Mark all parent_notifications as read
router.post('/parent/notifications/read-all', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    let user;
    try { user = jwt.verify(token, SECRET); } catch { return res.status(401).json({ message: 'invalid' }); }
    if (user.role !== 'parent') return res.status(403).end();
    try {
        await db.query('UPDATE parent_notifications SET is_read = 1 WHERE parent_id = ?', [user.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get('/_stats', (_req, res) => res.json(bus.stats()));

module.exports = router;

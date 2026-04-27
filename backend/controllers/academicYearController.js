const db = require('../db');

/* ──────────────────────────────────────────────────────────────────
   Academic Year + Term lifecycle
   ──────────────────────────────────────────────────────────────────
   Tables (created/augmented in db.js initAcademic()):

     academic_years (
        id, name UNIQUE, start_date, end_date,
        status ENUM('planning','active','closed'),
        is_current TINYINT(1),
        created_at, closed_at, closed_by
     )
     academic_terms (
        id, academic_year_id, term_number (1|2|3),
        name, start_date, end_date,
        status ENUM('upcoming','active','ended'),
        ended_at, ended_by, created_at
     )
     student_promotions (
        id, student_id, from_academic_year_id, to_academic_year_id,
        from_trade, to_trade, from_level, to_level,
        action ENUM('enrolled','promoted','retained','graduated','transferred'),
        notes, created_by, created_at
     )

   Promotion ladder per trade is data-driven and lives in `LEVEL_LADDER`.
*/

/* ────────────────────────────────────────────────────────────────
   Promotion ladders / cohort buckets per trade.

   Software Development (SOD)        : L3 → L4 → L5 → graduated
   Building & Construction (BDC)     : L3 → L4 → L5 → graduated
   Automobile Technology   (AUTO)    : split-cohort engine — there is no
                                       1-to-1 next level. Students are
                                       MIXED across sections each year:
       L3                  → split balanced into  L4a / L4b
       L4a + L4b combined  → mixed and split into L5a / L5b
       L5a + L5b           → graduated  (history)
   ──────────────────────────────────────────────────────────────── */
const DEFAULT_LADDER = ['Level 3', 'Level 4', 'Level 5'];
const LEVEL_LADDER = {
    'Software Development':       ['Level 3', 'Level 4', 'Level 5'],
    'Building and Construction':  ['Level 3', 'Level 4', 'Level 5'],
    // For UI / dropdown purposes only — the real promotion of Auto is
    // computed by the cohort engine (autoCohortPromotion) below.
    'Automobile Technology':      ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'],
};

const AUTO_TRADE = 'Automobile Technology';

function nextLevelFor(trade, currentLevel) {
    const ladder = LEVEL_LADDER[trade] || DEFAULT_LADDER;
    const idx = ladder.indexOf(currentLevel);
    if (idx === -1) {
        return { next: currentLevel, terminal: false, unknown: true };
    }
    if (idx === ladder.length - 1) {
        return { next: null, terminal: true, unknown: false };
    }
    return { next: ladder[idx + 1], terminal: false, unknown: false };
}

/**
 * Auto cohort promotion: deterministic balanced split.
 * Sort is stable (last_name, first_name, id) so the same input always yields
 * the same assignment; admins can override individuals afterwards.
 *
 *  - L3      → alternating L4a / L4b   (i%2 === 0 → L4a)
 *  - L4a/4b  → combined, sorted, alternating L5a / L5b
 *  - L5a/5b  → graduated
 *  - other   → retained (unknown level — flagged for manual fix)
 */
function autoCohortPromotion(students) {
    const sortFn = (a, b) =>
        (a.last_name || '').localeCompare(b.last_name || '') ||
        (a.first_name || '').localeCompare(b.first_name || '') ||
        a.id - b.id;

    const l3   = students.filter(s => s.level === 'Level 3').sort(sortFn);
    const l4   = students.filter(s => s.level === 'Level 4a' || s.level === 'Level 4b').sort(sortFn);
    const l5   = students.filter(s => s.level === 'Level 5a' || s.level === 'Level 5b').sort(sortFn);
    const odd  = students.filter(s => !['Level 3','Level 4a','Level 4b','Level 5a','Level 5b'].includes(s.level));

    const out = [];
    l3.forEach((s, i) => out.push({
        student: s,
        action: 'promoted',
        to_level: i % 2 === 0 ? 'Level 4a' : 'Level 4b',
        cohort: 'L3 → L4a/L4b (mixed split)',
    }));
    l4.forEach((s, i) => out.push({
        student: s,
        action: 'promoted',
        to_level: i % 2 === 0 ? 'Level 5a' : 'Level 5b',
        cohort: 'L4a+L4b → L5a/L5b (mixed split)',
    }));
    l5.forEach(s => out.push({
        student: s,
        action: 'graduated',
        to_level: null,
        cohort: 'L5a+L5b → Graduated',
    }));
    odd.forEach(s => out.push({
        student: s,
        action: 'retained',
        to_level: s.level,
        cohort: 'Unknown level — manual fix needed',
    }));
    return out;
}

/* ─── Years ───────────────────────────────────────────────────── */

exports.listYears = async (req, res) => {
    try {
        const [years] = await db.query(`
            SELECT y.*,
                   (SELECT COUNT(*) FROM academic_terms t WHERE t.academic_year_id = y.id) AS term_count,
                   (SELECT COUNT(*) FROM academic_terms t WHERE t.academic_year_id = y.id AND t.status = 'ended') AS ended_terms,
                   (SELECT COUNT(*) FROM students s WHERE s.academic_year_id = y.id) AS student_count
              FROM academic_years y
          ORDER BY y.start_date DESC, y.id DESC
        `);
        res.json(years);
    } catch (err) {
        console.error('listYears', err);
        res.status(500).json({ message: 'Habaye ikibazo gusoma imyaka.' });
    }
};

exports.getCurrentYear = async (req, res) => {
    try {
        const year = await loadCurrentYearWithTerms();
        if (!year) return res.json(null);
        res.json(year);
    } catch (err) {
        console.error('getCurrentYear', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    }
};

async function loadCurrentYearWithTerms() {
    const [rows] = await db.query(
        `SELECT * FROM academic_years
          WHERE is_current = 1
          ORDER BY id DESC LIMIT 1`
    );
    if (!rows.length) return null;
    const year = rows[0];
    const [terms] = await db.query(
        `SELECT * FROM academic_terms WHERE academic_year_id = ? ORDER BY term_number ASC`,
        [year.id]
    );
    year.terms = terms;
    return year;
}

exports.getYear = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM academic_years WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ message: 'Umwaka ntiwabonetse.' });
        const year = rows[0];
        const [terms] = await db.query(
            'SELECT * FROM academic_terms WHERE academic_year_id = ? ORDER BY term_number ASC',
            [id]
        );
        const [promotions] = await db.query(
            `SELECT p.*, s.first_name, s.last_name, s.reg_number
               FROM student_promotions p
               JOIN students s ON s.id = p.student_id
              WHERE p.from_academic_year_id = ? OR p.to_academic_year_id = ?
              ORDER BY p.created_at DESC LIMIT 500`,
            [id, id]
        );
        year.terms = terms;
        year.promotions = promotions;
        res.json(year);
    } catch (err) {
        console.error('getYear', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    }
};

/**
 * Create an academic year with 3 terms.
 * Body:
 *  { name: '2026-2027',
 *    start_date, end_date,
 *    terms: [
 *      { name: 'Term 1', start_date, end_date },
 *      { name: 'Term 2', start_date, end_date },
 *      { name: 'Term 3', start_date, end_date },
 *    ],
 *    set_current: bool }
 */
exports.createYear = async (req, res) => {
    const { name, start_date, end_date, terms, set_current } = req.body || {};
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ message: 'Andika izina, itariki itangira n\'irangira.' });
    }
    if (!Array.isArray(terms) || terms.length !== 3) {
        return res.status(400).json({ message: 'Umwaka ugomba kugira ibice 3 (terms).' });
    }
    for (let i = 0; i < 3; i++) {
        const t = terms[i];
        if (!t || !t.start_date || !t.end_date) {
            return res.status(400).json({ message: `Term ${i + 1} idafite itariki yuzuye.` });
        }
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Unique name guard
        const [dup] = await conn.query('SELECT id FROM academic_years WHERE name = ?', [name]);
        if (dup.length) {
            await conn.rollback();
            return res.status(409).json({ message: 'Umwaka ufite iri zina usanzweho.' });
        }

        if (set_current) {
            await conn.query('UPDATE academic_years SET is_current = 0');
        }

        const [yearRes] = await conn.query(
            `INSERT INTO academic_years (name, start_date, end_date, status, is_current)
             VALUES (?, ?, ?, 'active', ?)`,
            [name, start_date, end_date, set_current ? 1 : 0]
        );
        const yearId = yearRes.insertId;

        for (let i = 0; i < terms.length; i++) {
            const t = terms[i];
            await conn.query(
                `INSERT INTO academic_terms
                    (academic_year_id, term_number, name, start_date, end_date, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    yearId,
                    i + 1,
                    t.name || `Term ${i + 1}`,
                    t.start_date,
                    t.end_date,
                    i === 0 && set_current ? 'active' : 'upcoming',
                ]
            );
        }

        await conn.commit();
        const created = await loadYearById(yearId);
        res.status(201).json({ message: 'Umwaka mushya wandikishijwe.', year: created });
    } catch (err) {
        await conn.rollback();
        console.error('createYear', err);
        res.status(500).json({ message: 'Habaye ikibazo gushyiraho umwaka.' });
    } finally {
        conn.release();
    }
};

async function loadYearById(id) {
    const [[year]] = await db.query('SELECT * FROM academic_years WHERE id = ?', [id]);
    if (!year) return null;
    const [terms] = await db.query(
        'SELECT * FROM academic_terms WHERE academic_year_id = ? ORDER BY term_number ASC',
        [id]
    );
    year.terms = terms;
    return year;
}

exports.setCurrent = async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [exists] = await conn.query('SELECT id, status FROM academic_years WHERE id = ?', [id]);
        if (!exists.length) {
            await conn.rollback();
            return res.status(404).json({ message: 'Umwaka ntiwabonetse.' });
        }
        if (exists[0].status === 'closed') {
            await conn.rollback();
            return res.status(400).json({ message: 'Ntushobora gutoranya umwaka warangiye.' });
        }
        await conn.query('UPDATE academic_years SET is_current = 0');
        await conn.query('UPDATE academic_years SET is_current = 1, status = "active" WHERE id = ?', [id]);
        await conn.commit();
        res.json({ message: 'Umwaka watoranyijwe nk\'umwaka w\'ubu.' });
    } catch (err) {
        await conn.rollback();
        console.error('setCurrent', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    } finally {
        conn.release();
    }
};

/* ─── Terms ───────────────────────────────────────────────────── */

exports.updateTerm = async (req, res) => {
    const { yearId, termId } = req.params;
    const { name, start_date, end_date } = req.body || {};
    try {
        const [rows] = await db.query(
            'SELECT * FROM academic_terms WHERE id = ? AND academic_year_id = ?',
            [termId, yearId]
        );
        if (!rows.length) return res.status(404).json({ message: 'Term ntiboneka.' });

        const term = rows[0];
        await db.query(
            `UPDATE academic_terms
                SET name = ?, start_date = ?, end_date = ?
              WHERE id = ?`,
            [
                name || term.name,
                start_date || term.start_date,
                end_date || term.end_date,
                termId,
            ]
        );
        res.json({ message: 'Term ivuguruwe.' });
    } catch (err) {
        console.error('updateTerm', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    }
};

/**
 * End a term and (optionally) activate the next term.
 * If all 3 terms are ended this just marks the year as ready-to-close.
 */
exports.endTerm = async (req, res) => {
    const { yearId, termId } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [tRows] = await conn.query(
            'SELECT * FROM academic_terms WHERE id = ? AND academic_year_id = ? FOR UPDATE',
            [termId, yearId]
        );
        if (!tRows.length) {
            await conn.rollback();
            return res.status(404).json({ message: 'Term ntiboneka.' });
        }
        const term = tRows[0];
        if (term.status === 'ended') {
            await conn.rollback();
            return res.status(400).json({ message: 'Term yari isanzwe yarangiye.' });
        }

        await conn.query(
            `UPDATE academic_terms
                SET status = 'ended', ended_at = NOW(), ended_by = ?
              WHERE id = ?`,
            [req.user?.id || null, termId]
        );

        // Activate the next term automatically (if any)
        const [next] = await conn.query(
            `SELECT id FROM academic_terms
              WHERE academic_year_id = ? AND term_number = ?`,
            [yearId, term.term_number + 1]
        );
        if (next.length) {
            await conn.query(
                `UPDATE academic_terms SET status = 'active' WHERE id = ?`,
                [next[0].id]
            );
        }

        await conn.commit();

        // Report ready-to-close info for the UI.
        const [[counts]] = await db.query(
            `SELECT
                (SELECT COUNT(*) FROM academic_terms WHERE academic_year_id = ?) AS total,
                (SELECT COUNT(*) FROM academic_terms WHERE academic_year_id = ? AND status = 'ended') AS ended
            `,
            [yearId, yearId]
        );
        res.json({
            message: 'Term yarangiye.',
            ended: counts.ended,
            total: counts.total,
            ready_to_close: counts.ended === counts.total,
        });
    } catch (err) {
        await conn.rollback();
        console.error('endTerm', err);
        res.status(500).json({ message: 'Habaye ikibazo gufunga term.' });
    } finally {
        conn.release();
    }
};

/* ─── Year closure (promotion engine) ─────────────────────────── */

/**
 * Build promotion plan for a year. Uses linear ladder for SOD/BDC and
 * the Auto cohort engine (mixed split) for Auto students.
 *
 * @param {number|null} executor   Optional db connection (for inside a TX).
 */
async function buildPromotionPlan(fromYearId, executor = db) {
    const [students] = await executor.query(
        `SELECT id, reg_number, first_name, last_name, trade, level, current_status, academic_year_id
           FROM students
          WHERE current_status IN ('active','sick','on_leave','suspended')
            AND (academic_year_id = ? OR academic_year_id IS NULL)
          ORDER BY trade, level, last_name, first_name, id`,
        [fromYearId]
    );

    // Group by trade
    const byTrade = new Map();
    for (const s of students) {
        const t = s.trade || 'Unknown';
        if (!byTrade.has(t)) byTrade.set(t, []);
        byTrade.get(t).push(s);
    }

    const plan = [];
    for (const [trade, list] of byTrade.entries()) {
        if (trade === AUTO_TRADE) {
            const cohortRows = autoCohortPromotion(list);
            for (const c of cohortRows) {
                const s = c.student;
                plan.push({
                    student_id: s.id,
                    reg_number: s.reg_number,
                    name: `${s.first_name} ${s.last_name}`,
                    trade,
                    from_level: s.level,
                    to_level: c.to_level,
                    action: c.action,
                    cohort: c.cohort,
                });
            }
        } else {
            for (const s of list) {
                const { next, terminal, unknown } = nextLevelFor(trade, s.level);
                let action, to_level;
                if (unknown)        { action = 'retained';  to_level = s.level; }
                else if (terminal)  { action = 'graduated'; to_level = null; }
                else                { action = 'promoted';  to_level = next; }
                plan.push({
                    student_id: s.id,
                    reg_number: s.reg_number,
                    name: `${s.first_name} ${s.last_name}`,
                    trade,
                    from_level: s.level,
                    to_level,
                    action,
                    cohort: action === 'graduated' ? `${trade} L5 → Graduated` : `${trade} ladder`,
                });
            }
        }
    }

    return plan;
}

exports.getLadder = async (_req, res) => {
    res.json({
        default: DEFAULT_LADDER,
        ladders: LEVEL_LADDER,
    });
};

exports.previewClose = async (req, res) => {
    const { id } = req.params;
    try {
        const [yRows] = await db.query('SELECT * FROM academic_years WHERE id = ?', [id]);
        if (!yRows.length) return res.status(404).json({ message: 'Umwaka ntiwabonetse.' });
        const year = yRows[0];

        const [terms] = await db.query(
            'SELECT * FROM academic_terms WHERE academic_year_id = ? ORDER BY term_number ASC',
            [id]
        );
        const allEnded = terms.length === 3 && terms.every(t => t.status === 'ended');

        const plan = await buildPromotionPlan(id);

        const summary = plan.reduce(
            (acc, p) => {
                acc[p.action] = (acc[p.action] || 0) + 1;
                return acc;
            },
            { promoted: 0, graduated: 0, retained: 0 }
        );

        // Cohort breakdown (e.g. how many Auto students go L3→4a, L3→4b, etc.)
        const cohortBreakdown = {};
        for (const p of plan) {
            const key = `${p.trade} :: ${p.from_level || '—'} → ${p.to_level || 'graduated'}`;
            cohortBreakdown[key] = (cohortBreakdown[key] || 0) + 1;
        }

        // Pending intake = approved-but-not-yet-enrolled applications
        const [[pendingIntake]] = await db.query(`
            SELECT COUNT(*) AS n FROM applications
             WHERE status = 'approved' AND enrolled_student_id IS NULL
        `);

        res.json({
            year,
            terms,
            ready_to_close: allEnded,
            plan,
            summary,
            cohort_breakdown: cohortBreakdown,
            pending_intake: pendingIntake.n,
        });
    } catch (err) {
        console.error('previewClose', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    }
};

/**
 * Close a year. This is transactional and does:
 *   1. mark all terms ended (if not already)
 *   2. promote / graduate / retain every active student per the ladder
 *   3. record each move in `student_promotions`
 *   4. mark the year `closed`, clear is_current
 *   5. optionally create the next year (with 3 terms) and set it current
 *
 * Body:
 *   {
 *     next_year: {              // optional — when omitted, no new year is created
 *       name, start_date, end_date,
 *       terms: [ {name,start_date,end_date} x3 ],
 *     },
 *     overrides: [              // optional manual overrides per student
 *       { student_id, action: 'promoted'|'graduated'|'retained', to_level? }
 *     ]
 *   }
 */
exports.closeYear = async (req, res) => {
    const { id } = req.params;
    const { next_year, overrides, confirm } = req.body || {};

    if (confirm !== true) {
        return res.status(400).json({
            message: 'Wemeza ko ushaka gufunga umwaka? Ohereza confirm:true.',
        });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [yRows] = await conn.query('SELECT * FROM academic_years WHERE id = ? FOR UPDATE', [id]);
        if (!yRows.length) {
            await conn.rollback();
            return res.status(404).json({ message: 'Umwaka ntiwabonetse.' });
        }
        if (yRows[0].status === 'closed') {
            await conn.rollback();
            return res.status(400).json({ message: 'Umwaka usanzwe wararangiye.' });
        }

        // 1) ensure all terms are ended
        await conn.query(
            `UPDATE academic_terms
                SET status = 'ended',
                    ended_at = COALESCE(ended_at, NOW()),
                    ended_by = COALESCE(ended_by, ?)
              WHERE academic_year_id = ? AND status <> 'ended'`,
            [req.user?.id || null, id]
        );

        // 2) optionally create next year inside the same TX
        let newYearId = null;
        if (next_year && next_year.name) {
            if (!Array.isArray(next_year.terms) || next_year.terms.length !== 3) {
                await conn.rollback();
                return res.status(400).json({ message: 'Umwaka mushya ugomba kugira ibice 3.' });
            }
            const [dup] = await conn.query(
                'SELECT id FROM academic_years WHERE name = ?',
                [next_year.name]
            );
            if (dup.length) {
                await conn.rollback();
                return res.status(409).json({ message: 'Izina ry\'umwaka mushya risanzweho.' });
            }
            await conn.query('UPDATE academic_years SET is_current = 0');
            const [nyRes] = await conn.query(
                `INSERT INTO academic_years (name, start_date, end_date, status, is_current)
                 VALUES (?, ?, ?, 'active', 1)`,
                [next_year.name, next_year.start_date, next_year.end_date]
            );
            newYearId = nyRes.insertId;
            for (let i = 0; i < 3; i++) {
                const t = next_year.terms[i];
                await conn.query(
                    `INSERT INTO academic_terms
                        (academic_year_id, term_number, name, start_date, end_date, status)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        newYearId,
                        i + 1,
                        t.name || `Term ${i + 1}`,
                        t.start_date,
                        t.end_date,
                        i === 0 ? 'active' : 'upcoming',
                    ]
                );
            }
        }

        // 3) build promotion plan with the cohort engine + apply overrides.
        // We lock all eligible student rows first to make the close transactional.
        await conn.query(
            `SELECT id FROM students
              WHERE current_status IN ('active','sick','on_leave','suspended')
                AND (academic_year_id = ? OR academic_year_id IS NULL)
              FOR UPDATE`,
            [id]
        );

        const plan = await buildPromotionPlan(id, conn);

        const overrideMap = new Map();
        if (Array.isArray(overrides)) {
            for (const o of overrides) {
                if (o && o.student_id) overrideMap.set(Number(o.student_id), o);
            }
        }

        let promoted = 0, graduated = 0, retained = 0;
        for (const p of plan) {
            const ovr = overrideMap.get(p.student_id);
            let action  = p.action;
            let toLevel = p.to_level;
            let cohort  = p.cohort || null;

            if (ovr) {
                cohort = (cohort ? cohort + ' · ' : '') + 'manual override';
                if (ovr.action === 'promoted') {
                    action  = 'promoted';
                    toLevel = ovr.to_level || p.to_level
                              || nextLevelFor(p.trade, p.from_level).next
                              || p.from_level;
                } else if (ovr.action === 'graduated') {
                    action  = 'graduated';
                    toLevel = null;
                } else {
                    action  = 'retained';
                    toLevel = p.from_level;
                }
            }

            if (action === 'promoted') {
                await conn.query(
                    `UPDATE students
                        SET level = ?,
                            academic_year_id = ?
                      WHERE id = ?`,
                    [toLevel, newYearId, p.student_id]
                );
                promoted++;
            } else if (action === 'graduated') {
                await conn.query(
                    `UPDATE students
                        SET current_status = 'graduated',
                            graduation_status = 'graduated',
                            academic_year_id = ?
                      WHERE id = ?`,
                    [id, p.student_id]
                );
                graduated++;
            } else {
                if (newYearId) {
                    await conn.query(
                        `UPDATE students SET academic_year_id = ? WHERE id = ?`,
                        [newYearId, p.student_id]
                    );
                }
                retained++;
            }

            await conn.query(
                `INSERT INTO student_promotions
                    (student_id, from_academic_year_id, to_academic_year_id,
                     from_trade, to_trade, from_level, to_level, action, notes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    p.student_id,
                    id,
                    action === 'graduated' ? null : (newYearId || null),
                    p.trade,
                    p.trade,
                    p.from_level,
                    toLevel,
                    action,
                    cohort || 'auto by cohort engine',
                    req.user?.id || null,
                ]
            );
        }

        // 4) mark the year closed
        await conn.query(
            `UPDATE academic_years
                SET status = 'closed', is_current = 0,
                    closed_at = NOW(), closed_by = ?
              WHERE id = ?`,
            [req.user?.id || null, id]
        );

        await conn.commit();

        res.json({
            message: 'Umwaka warangiye neza.',
            promoted,
            graduated,
            retained,
            new_year_id: newYearId,
        });
    } catch (err) {
        await conn.rollback();
        console.error('closeYear', err);
        res.status(500).json({ message: 'Habaye ikibazo gufunga umwaka.' });
    } finally {
        conn.release();
    }
};

/* ─── Promotion history ───────────────────────────────────────── */

exports.listPromotions = async (req, res) => {
    try {
        const { student_id, year_id, action, limit = 200 } = req.query;
        let q = `SELECT p.*, s.first_name, s.last_name, s.reg_number,
                        fy.name AS from_year_name, ty.name AS to_year_name
                   FROM student_promotions p
                   JOIN students s ON s.id = p.student_id
              LEFT JOIN academic_years fy ON fy.id = p.from_academic_year_id
              LEFT JOIN academic_years ty ON ty.id = p.to_academic_year_id
                  WHERE 1 = 1`;
        const params = [];
        if (student_id) { q += ' AND p.student_id = ?'; params.push(student_id); }
        if (year_id)   { q += ' AND (p.from_academic_year_id = ? OR p.to_academic_year_id = ?)';
                         params.push(year_id, year_id); }
        if (action)    { q += ' AND p.action = ?'; params.push(action); }
        const safeLimit = Math.max(1, Math.min(2000, parseInt(limit, 10) || 200));
        q += ` ORDER BY p.created_at DESC LIMIT ${safeLimit}`;
        const [rows] = await db.query(q, params);
        res.json(rows);
    } catch (err) {
        console.error('listPromotions', err);
        res.status(500).json({ message: 'Habaye ikibazo.' });
    }
};

/* ─── Graduates yearbook ──────────────────────────────────────────
   Lists every student archived by `student_promotions.action='graduated'`,
   grouped by academic year and trade. Used by the printable yearbook
   roster in the front-end (frontend/src/pages/Graduates.jsx).
*/
exports.listGraduates = async (req, res) => {
    try {
        const { year_id, trade, search, limit = 5000 } = req.query;

        let sql = `
            SELECT
                p.id                   AS promotion_id,
                p.created_at           AS graduated_at,
                p.from_academic_year_id,
                p.from_trade,
                p.from_level,
                p.to_level,
                p.notes                AS promotion_notes,
                fy.name                AS academic_year_name,
                fy.start_date          AS academic_year_start,
                fy.end_date            AS academic_year_end,
                s.id                   AS student_id,
                s.reg_number,
                s.first_name,
                s.last_name,
                s.gender,
                s.date_of_birth,
                s.contact_phone,
                s.contact_email,
                s.guardian_name,
                s.guardian_phone,
                s.address_district,
                s.address_sector,
                s.trade,
                s.level                AS final_level,
                s.year_enrolled,
                s.student_type,
                s.photo_url
              FROM student_promotions p
              JOIN students s         ON s.id = p.student_id
         LEFT JOIN academic_years fy  ON fy.id = p.from_academic_year_id
             WHERE p.action = 'graduated'
        `;
        const params = [];
        if (year_id) {
            sql += ' AND p.from_academic_year_id = ?';
            params.push(year_id);
        }
        if (trade) {
            sql += ' AND s.trade = ?';
            params.push(trade);
        }
        if (search) {
            sql += ` AND (
                s.first_name LIKE ? OR s.last_name LIKE ?
                OR s.reg_number LIKE ?
                OR CONCAT(s.first_name, ' ', s.last_name) LIKE ?
            )`;
            const q = `%${search}%`;
            params.push(q, q, q, q);
        }

        const safeLimit = Math.max(1, Math.min(10000, parseInt(limit, 10) || 5000));
        sql += `
            ORDER BY fy.start_date DESC, fy.id DESC,
                     s.trade ASC, s.last_name ASC, s.first_name ASC
            LIMIT ${safeLimit}
        `;

        const [rows] = await db.query(sql, params);

        // Distinct academic years & trades present in graduates table — used
        // by the front-end filter chips (no extra round-trip needed).
        const [filterYearsRows] = await db.query(`
            SELECT DISTINCT fy.id, fy.name, fy.start_date, fy.end_date
              FROM student_promotions p
              JOIN academic_years fy ON fy.id = p.from_academic_year_id
             WHERE p.action = 'graduated'
             ORDER BY fy.start_date DESC, fy.id DESC
        `);
        const [filterTradesRows] = await db.query(`
            SELECT DISTINCT s.trade
              FROM student_promotions p
              JOIN students s ON s.id = p.student_id
             WHERE p.action = 'graduated' AND s.trade IS NOT NULL
             ORDER BY s.trade ASC
        `);

        // Group by academic year then trade.
        const groupsMap = new Map();
        for (const r of rows) {
            const yKey = r.academic_year_name
                || (r.from_academic_year_id ? `Year #${r.from_academic_year_id}` : 'Imyaka itazwi');
            if (!groupsMap.has(yKey)) {
                groupsMap.set(yKey, {
                    year_name:  yKey,
                    year_id:    r.from_academic_year_id,
                    start_date: r.academic_year_start,
                    end_date:   r.academic_year_end,
                    trades:     {},
                    total:      0,
                });
            }
            const g = groupsMap.get(yKey);
            const tKey = r.trade || 'Itazwi';
            if (!g.trades[tKey]) g.trades[tKey] = [];
            g.trades[tKey].push(r);
            g.total += 1;
        }

        // Convert trades to a sorted array per group.
        const groups = [...groupsMap.values()].map(g => ({
            ...g,
            trades: Object.entries(g.trades)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([trade, students]) => ({
                    trade,
                    count: students.length,
                    students,
                })),
        }));

        res.json({
            total: rows.length,
            groups,
            filters: {
                years:  filterYearsRows,
                trades: filterTradesRows.map(r => r.trade),
            },
        });
    } catch (err) {
        console.error('listGraduates', err);
        res.status(500).json({ message: 'Habaye ikibazo gusoma abasoje.' });
    }
};

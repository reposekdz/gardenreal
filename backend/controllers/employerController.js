/**
 * Employer Directory & Outreach controller.
 * Production-grade CRUD on partner companies that hire Garden TVET graduates,
 * plus the outreach feature that builds a real PDF roster and emails it
 * to selected employers (with a full audit trail in `employer_outreach`).
 */

const db = require('../db');
const { sendEmail, isConfigured: emailConfigured } = require('../utils/emailService');
const { buildRosterPdf } = require('../utils/pdfRosterService');

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nullish = (v) => v === undefined || v === null || v === '';

function normalizeStatus(v) {
    const allowed = ['active', 'inactive', 'archived'];
    const s = String(v || 'active').toLowerCase();
    return allowed.includes(s) ? s : 'active';
}

/* ─── CRUD ──────────────────────────────────────────────────────── */

exports.listEmployers = async (req, res) => {
    try {
        const { search, sector, status, trade } = req.query;
        const params = [];
        let where = ' WHERE 1=1 ';
        if (search) {
            where += ` AND (
                e.company_name LIKE ? OR e.contact_person LIKE ?
                OR e.email LIKE ? OR e.phone LIKE ? OR e.sector LIKE ?
            )`;
            const q = `%${search}%`;
            params.push(q, q, q, q, q);
        }
        if (sector) { where += ' AND e.sector = ?'; params.push(sector); }
        if (status) { where += ' AND e.status = ?'; params.push(normalizeStatus(status)); }
        if (trade)  { where += ' AND FIND_IN_SET(?, e.preferred_trades)'; params.push(trade); }

        const [rows] = await db.query(
            `SELECT e.*,
                    (SELECT COUNT(*) FROM employer_outreach o WHERE o.employer_id = e.id) AS outreach_count,
                    (SELECT MAX(o.sent_at) FROM employer_outreach o WHERE o.employer_id = e.id) AS last_contacted_at
               FROM employers e
               ${where}
              ORDER BY e.company_name ASC`,
            params,
        );

        const [sectors] = await db.query(
            `SELECT DISTINCT sector FROM employers WHERE sector IS NOT NULL AND sector <> '' ORDER BY sector ASC`,
        );

        return res.json({
            employers: rows,
            filters: {
                sectors: sectors.map(s => s.sector),
                statuses: ['active', 'inactive', 'archived'],
            },
            email_configured: emailConfigured(),
        });
    } catch (err) {
        console.error('[employers.list]', err);
        return res.status(500).json({ message: 'Habaye ikibazo gusoma employers.' });
    }
};

exports.getEmployer = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`SELECT * FROM employers WHERE id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Employer ntibonetse.' });

        const [history] = await db.query(
            `SELECT o.*, u.username AS sent_by_name
               FROM employer_outreach o
          LEFT JOIN users u ON u.id = o.sent_by
              WHERE o.employer_id = ?
              ORDER BY o.sent_at DESC LIMIT 100`,
            [id],
        );

        return res.json({ employer: rows[0], outreach_history: history });
    } catch (err) {
        console.error('[employers.get]', err);
        return res.status(500).json({ message: 'Habaye ikibazo gusoma employer.' });
    }
};

exports.createEmployer = async (req, res) => {
    try {
        const {
            company_name, contact_person, email, phone, sector, address,
            website, preferred_trades, notes, status,
        } = req.body || {};

        if (!company_name || !String(company_name).trim()) {
            return res.status(400).json({ message: 'Izina rya sosiyete ni ngombwa.' });
        }
        if (email && !EMAIL_RX.test(email)) {
            return res.status(400).json({ message: 'Email ntiyemewe.' });
        }

        const trades = Array.isArray(preferred_trades)
            ? preferred_trades.join(',')
            : (preferred_trades || '');

        const [r] = await db.query(
            `INSERT INTO employers
                (company_name, contact_person, email, phone, sector, address,
                 website, preferred_trades, notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                String(company_name).trim(),
                contact_person || null,
                email || null,
                phone || null,
                sector || null,
                address || null,
                website || null,
                trades || null,
                notes || null,
                normalizeStatus(status),
                req.user?.id || null,
            ],
        );

        const [rows] = await db.query(`SELECT * FROM employers WHERE id = ?`, [r.insertId]);
        return res.status(201).json({ employer: rows[0] });
    } catch (err) {
        console.error('[employers.create]', err);
        return res.status(500).json({ message: 'Habaye ikibazo wongera employer.' });
    }
};

exports.updateEmployer = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = [];
        const params = [];

        const map = {
            company_name: 'company_name',
            contact_person: 'contact_person',
            email: 'email',
            phone: 'phone',
            sector: 'sector',
            address: 'address',
            website: 'website',
            notes: 'notes',
            status: 'status',
        };
        for (const [k, col] of Object.entries(map)) {
            if (!nullish(req.body?.[k])) {
                if (k === 'status') {
                    fields.push(`${col} = ?`); params.push(normalizeStatus(req.body[k]));
                } else if (k === 'email' && req.body[k] && !EMAIL_RX.test(req.body[k])) {
                    return res.status(400).json({ message: 'Email ntiyemewe.' });
                } else {
                    fields.push(`${col} = ?`); params.push(req.body[k]);
                }
            }
        }
        if (!nullish(req.body?.preferred_trades)) {
            const trades = Array.isArray(req.body.preferred_trades)
                ? req.body.preferred_trades.join(',')
                : req.body.preferred_trades;
            fields.push('preferred_trades = ?'); params.push(trades || null);
        }
        if (!fields.length) return res.status(400).json({ message: 'Nta byo guhindura.' });

        params.push(id);
        await db.query(`UPDATE employers SET ${fields.join(', ')} WHERE id = ?`, params);

        const [rows] = await db.query(`SELECT * FROM employers WHERE id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Employer ntibonetse.' });
        return res.json({ employer: rows[0] });
    } catch (err) {
        console.error('[employers.update]', err);
        return res.status(500).json({ message: 'Habaye ikibazo guhindura employer.' });
    }
};

exports.deleteEmployer = async (req, res) => {
    try {
        const { id } = req.params;
        const [r] = await db.query(`DELETE FROM employers WHERE id = ?`, [id]);
        if (!r.affectedRows) return res.status(404).json({ message: 'Employer ntibonetse.' });
        return res.json({ message: 'Employer yasibwe.' });
    } catch (err) {
        console.error('[employers.delete]', err);
        return res.status(500).json({ message: 'Habaye ikibazo gusiba employer.' });
    }
};

/* ─── Outreach (send PDF roster via email) ─────────────────────── */

async function fetchGraduateGroups({ year_id, trade, search }) {
    const params = [];
    let where = `WHERE p.action = 'graduated'`;
    if (year_id) { where += ' AND p.from_academic_year_id = ?'; params.push(year_id); }
    if (trade)   { where += ' AND s.trade = ?';                  params.push(trade); }
    if (search) {
        where += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.reg_number LIKE ?
                       OR CONCAT(s.first_name,' ',s.last_name) LIKE ?)`;
        const q = `%${search}%`;
        params.push(q, q, q, q);
    }

    const [rows] = await db.query(`
        SELECT
            p.id AS promotion_id, p.created_at AS graduated_at,
            p.from_academic_year_id, p.from_level, p.to_level,
            p.notes AS promotion_notes,
            fy.name AS academic_year_name,
            fy.start_date AS academic_year_start, fy.end_date AS academic_year_end,
            s.id AS student_id, s.reg_number, s.first_name, s.last_name,
            s.gender, s.date_of_birth, s.contact_phone, s.contact_email,
            s.address_district, s.address_sector, s.trade, s.level AS final_level
          FROM student_promotions p
          JOIN students s ON s.id = p.student_id
     LEFT JOIN academic_years fy ON fy.id = p.from_academic_year_id
        ${where}
        ORDER BY fy.start_date DESC, fy.id DESC, s.trade ASC, s.last_name ASC
    `, params);

    const groupsMap = new Map();
    for (const r of rows) {
        const yKey = r.academic_year_name || `Year #${r.from_academic_year_id || '—'}`;
        if (!groupsMap.has(yKey)) {
            groupsMap.set(yKey, {
                year_name: yKey,
                start_date: r.academic_year_start,
                end_date: r.academic_year_end,
                trades: {},
                total: 0,
            });
        }
        const g = groupsMap.get(yKey);
        const tKey = r.trade || 'Itazwi';
        if (!g.trades[tKey]) g.trades[tKey] = [];
        g.trades[tKey].push(r);
        g.total += 1;
    }
    return [...groupsMap.values()].map(g => ({
        ...g,
        trades: Object.entries(g.trades)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([trade, students]) => ({ trade, count: students.length, students })),
    }));
}

exports.sendRoster = async (req, res) => {
    try {
        const {
            employer_ids,
            year_id, trade, search,
            subject, message,
            attach_pdf = true,
        } = req.body || {};

        if (!Array.isArray(employer_ids) || !employer_ids.length) {
            return res.status(400).json({ message: 'Hitamo nibura employer imwe.' });
        }
        if (!emailConfigured()) {
            return res.status(503).json({
                message: 'Email service ntiratunganywa. Andikira admin ashyireho SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM mu environment variables.',
                code: 'EMAIL_NOT_CONFIGURED',
            });
        }

        // Fetch valid employers with email
        const placeholders = employer_ids.map(() => '?').join(',');
        const [employers] = await db.query(
            `SELECT * FROM employers WHERE id IN (${placeholders}) AND status = 'active'`,
            employer_ids,
        );
        const validEmployers = employers.filter(e => e.email && EMAIL_RX.test(e.email));
        if (!validEmployers.length) {
            return res.status(400).json({ message: 'Nta employer ifite email yemewe.' });
        }

        // Build the graduate groups & PDF (once, attached to every email)
        const groups = await fetchGraduateGroups({ year_id, trade, search });
        if (!groups.length) {
            return res.status(400).json({ message: 'Nta basoje bahari ku byo washyizemo.' });
        }
        const totalGraduates = groups.reduce((s, g) => s + g.total, 0);
        const filterLine = [
            year_id ? 'Year filter applied' : null,
            trade   ? `Trade: ${trade}`     : null,
            search  ? `Search: "${search}"` : null,
        ].filter(Boolean).join(' · ') || 'All years · All trades';

        let pdfBuffer = null;
        if (attach_pdf) {
            pdfBuffer = await buildRosterPdf({
                school_name: 'Garden TVET School',
                subtitle: 'Official Graduate Roster — for partner employer review',
                filter_line: filterLine,
                groups,
            });
        }

        const finalSubject = (subject && String(subject).trim())
            || `Garden TVET — Graduate Roster (${totalGraduates} graduates)`;

        // Build a default HTML body if message is missing
        const buildHtml = (employer) => {
            const greet = employer.contact_person
                ? `Dear ${employer.contact_person},`
                : `Dear ${employer.company_name} team,`;
            const userMsg = (message && String(message).trim()) || `
                We are pleased to share the latest graduate roster from
                Garden TVET School. The attached PDF lists ${totalGraduates}
                qualified graduates across our trades, including their final
                level, location and contact details. Please feel free to reach
                out to any candidate directly, or contact our placement office
                if you would like us to organize interviews.
            `.trim().replace(/\s+/g, ' ');
            return `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;max-width:640px;margin:auto;">
                    <div style="background:linear-gradient(135deg,#92400e,#d97706);color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;">
                        <h2 style="margin:0;font-size:18px;">Garden TVET School</h2>
                        <p style="margin:4px 0 0;font-size:12px;opacity:.9;">East Province · Ngoma · Rwanda</p>
                    </div>
                    <div style="border:1px solid #f3f4f6;border-top:0;padding:22px;border-radius:0 0 14px 14px;background:#fff;">
                        <p style="font-size:14px;margin:0 0 10px;"><strong>${greet}</strong></p>
                        <p style="font-size:14px;line-height:1.55;margin:0 0 14px;">${userMsg}</p>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">
                            <tr><td style="padding:6px 0;color:#6b7280;">Total graduates</td><td style="padding:6px 0;font-weight:bold;">${totalGraduates}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280;">Years included</td><td style="padding:6px 0;font-weight:bold;">${groups.length}</td></tr>
                            <tr><td style="padding:6px 0;color:#6b7280;">Filters</td><td style="padding:6px 0;">${filterLine}</td></tr>
                        </table>
                        ${attach_pdf ? `<p style="font-size:13px;background:#fef3c7;color:#78350f;padding:10px 12px;border-radius:8px;margin:12px 0;">📎 The full roster PDF is attached.</p>` : ''}
                        <p style="font-size:13px;margin:18px 0 4px;">Warm regards,</p>
                        <p style="font-size:13px;margin:0;font-weight:bold;">Garden TVET Placement Office</p>
                        <hr style="border:0;border-top:1px solid #f3f4f6;margin:18px 0;" />
                        <p style="font-size:11px;color:#9ca3af;margin:0;">
                            This message and any attachments are confidential and intended only for ${employer.company_name}.
                            If you received it in error, please notify us and delete it.
                        </p>
                    </div>
                </div>
            `;
        };

        // Send sequentially so we don't hit SMTP rate limits, log each result.
        const results = [];
        for (const emp of validEmployers) {
            const html = buildHtml(emp);
            const attachments = pdfBuffer
                ? [{
                    filename: `Garden-TVET-Graduates-${Date.now()}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }]
                : undefined;

            const r = await sendEmail({
                to: emp.email,
                subject: finalSubject,
                html,
                attachments,
                category: 'graduate_roster',
                related_id: emp.id,
            });

            await db.query(
                `INSERT INTO employer_outreach
                    (employer_id, recipient_email, subject, message, attached_pdf,
                     filter_year_id, filter_trade, filter_search, graduate_count,
                     status, error, sent_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    emp.id,
                    emp.email,
                    finalSubject,
                    (message || '').slice(0, 4000) || null,
                    attach_pdf ? 1 : 0,
                    year_id || null,
                    trade || null,
                    search || null,
                    totalGraduates,
                    r.success ? 'sent' : 'failed',
                    r.success ? null : (r.error || 'unknown error').slice(0, 500),
                    req.user?.id || null,
                ],
            );

            results.push({
                employer_id: emp.id,
                company_name: emp.company_name,
                email: emp.email,
                success: r.success,
                error: r.error || null,
            });
        }

        const okCount = results.filter(r => r.success).length;
        return res.json({
            message: `${okCount}/${results.length} emails sent.`,
            sent: okCount,
            failed: results.length - okCount,
            results,
        });
    } catch (err) {
        console.error('[employers.sendRoster]', err);
        return res.status(500).json({ message: 'Habaye ikibazo wohereza roster.' });
    }
};

/* ─── Outreach history (cross-employer) ────────────────────────── */

exports.listOutreach = async (req, res) => {
    try {
        const { employer_id, status, limit = 200 } = req.query;
        const params = [];
        let where = ' WHERE 1=1 ';
        if (employer_id) { where += ' AND o.employer_id = ?'; params.push(employer_id); }
        if (status)      { where += ' AND o.status = ?';      params.push(status); }
        const safeLimit = Math.max(1, Math.min(1000, parseInt(limit, 10) || 200));

        const [rows] = await db.query(
            `SELECT o.*, e.company_name, e.contact_person, u.username AS sent_by_name
               FROM employer_outreach o
          LEFT JOIN employers e ON e.id = o.employer_id
          LEFT JOIN users u     ON u.id = o.sent_by
              ${where}
              ORDER BY o.sent_at DESC
              LIMIT ${safeLimit}`,
            params,
        );
        return res.json({ outreach: rows });
    } catch (err) {
        console.error('[employers.listOutreach]', err);
        return res.status(500).json({ message: 'Habaye ikibazo gusoma amateka y\'outreach.' });
    }
};

exports.emailStatus = async (_req, res) => {
    return res.json({
        configured: emailConfigured(),
        from: process.env.SMTP_FROM || null,
        host: process.env.SMTP_HOST || null,
    });
};

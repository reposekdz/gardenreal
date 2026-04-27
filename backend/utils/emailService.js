/**
 * Production email service for Garden TVET School
 * Uses Nodemailer over SMTP. Configure with the following env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS,
 *   SMTP_FROM (e.g. "Garden TVET <noreply@gardentvet.rw>")
 *
 * If SMTP is not configured the service refuses to send and returns a clear
 * error — there is NO mock/demo fallback. Outbound messages are always logged
 * to the `email_log` table (created idempotently in db.js) for full audit.
 */

const nodemailer = require('nodemailer');
const db = require('../db');

let cachedTransporter = null;
let cachedConfigKey = null;

function isConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
    if (!isConfigured()) return null;

    const key = [
        process.env.SMTP_HOST,
        process.env.SMTP_PORT,
        process.env.SMTP_SECURE,
        process.env.SMTP_USER,
        process.env.SMTP_PASS,
    ].join('|');

    if (cachedTransporter && cachedConfigKey === key) return cachedTransporter;

    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    cachedConfigKey = key;
    return cachedTransporter;
}

async function logEmail({ to, subject, status, error, message_id, category, related_id, body_preview }) {
    try {
        await db.query(
            `INSERT INTO email_log
                (recipient, subject, status, error, message_id, category, related_id, body_preview)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Array.isArray(to) ? to.join(', ') : (to || ''),
                (subject || '').slice(0, 500),
                status,
                (error || '').slice(0, 1000) || null,
                message_id || null,
                category || null,
                related_id || null,
                (body_preview || '').slice(0, 1000) || null,
            ],
        );
    } catch (_) {
        /* logging must never break the send */
    }
}

/**
 * @param {object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 * @param {Array<{filename:string,content:Buffer,contentType?:string}>} [opts.attachments]
 * @param {string} [opts.category]
 * @param {number} [opts.related_id]
 * @returns {Promise<{success:boolean, message_id?:string, error?:string}>}
 */
async function sendEmail({ to, subject, html, text, attachments, category, related_id }) {
    const transporter = getTransporter();
    if (!transporter) {
        const err = 'Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM environment variables.';
        await logEmail({ to, subject, status: 'failed', error: err, category, related_id, body_preview: text || html });
        return { success: false, error: err };
    }

    const from = process.env.SMTP_FROM || `Garden TVET School <${process.env.SMTP_USER}>`;
    try {
        const info = await transporter.sendMail({
            from,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text: text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''),
            html,
            attachments,
        });
        await logEmail({
            to,
            subject,
            status: 'sent',
            message_id: info.messageId,
            category,
            related_id,
            body_preview: text || html,
        });
        return { success: true, message_id: info.messageId };
    } catch (err) {
        const msg = err?.message || String(err);
        await logEmail({ to, subject, status: 'failed', error: msg, category, related_id, body_preview: text || html });
        return { success: false, error: msg };
    }
}

async function verifyConnection() {
    const transporter = getTransporter();
    if (!transporter) return { ok: false, error: 'SMTP not configured' };
    try {
        await transporter.verify();
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message || String(err) };
    }
}

module.exports = {
    sendEmail,
    isConfigured,
    verifyConnection,
};

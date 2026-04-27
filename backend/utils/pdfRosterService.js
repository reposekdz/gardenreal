/**
 * PDF roster generator using pdfkit.
 * Produces a printable, professionally laid-out roster of graduates grouped
 * by academic year and trade. Used by the Employer outreach feature to
 * attach a real PDF to outbound emails.
 */

const PDFDocument = require('pdfkit');

function fmt(d) {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-GB', {
            year: 'numeric', month: 'short', day: '2-digit',
        });
    } catch (_) { return String(d); }
}

/**
 * @param {object} payload
 * @param {string} payload.school_name
 * @param {string} [payload.subtitle]
 * @param {string} [payload.filter_line]
 * @param {Array} payload.groups - [{year_name, start_date, end_date, total, trades:[{trade,count,students:[]}]}]
 * @returns {Promise<Buffer>}
 */
function buildRosterPdf(payload) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 36,
                info: {
                    Title: `${payload.school_name} — Graduate Roster`,
                    Author: payload.school_name,
                    Subject: 'Graduate Roster',
                },
            });

            const chunks = [];
            doc.on('data', c => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ─── Header ─────────────────────────────────────────────
            doc.fillColor('#92400e').fontSize(18).font('Helvetica-Bold')
                .text(payload.school_name, { continued: false });
            doc.moveDown(0.1);
            doc.fillColor('#374151').fontSize(11).font('Helvetica')
                .text(payload.subtitle || 'Official Graduate Roster');
            if (payload.filter_line) {
                doc.moveDown(0.1);
                doc.fillColor('#6b7280').fontSize(9)
                    .text(payload.filter_line);
            }
            doc.moveDown(0.2);
            doc.strokeColor('#d97706').lineWidth(1.5)
                .moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
            doc.moveDown(0.6);

            const totalStudents = (payload.groups || []).reduce((s, g) => s + (g.total || 0), 0);
            doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
                .text(`Total graduates: ${totalStudents}    Years included: ${payload.groups.length}    Generated: ${fmt(new Date())}`);
            doc.moveDown(0.6);

            // ─── Body ────────────────────────────────────────────────
            const colWidths = {
                idx: 22,
                reg: 78,
                name: 130,
                gender: 38,
                level: 60,
                phone: 70,
                location: 88,
                date: 66,
            };
            const tableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

            const drawTableHeader = () => {
                const x0 = doc.page.margins.left;
                const y = doc.y;
                doc.fillColor('#fffbeb').rect(x0, y, tableWidth, 18).fill();
                doc.fillColor('#78350f').fontSize(8).font('Helvetica-Bold');
                let x = x0 + 4;
                const cells = [
                    ['#',           colWidths.idx],
                    ['Reg Number',  colWidths.reg],
                    ['Name',        colWidths.name],
                    ['Sex',         colWidths.gender],
                    ['Final Level', colWidths.level],
                    ['Phone',       colWidths.phone],
                    ['Location',    colWidths.location],
                    ['Graduated',   colWidths.date],
                ];
                cells.forEach(([label, w]) => {
                    doc.text(label, x, y + 5, { width: w - 6, ellipsis: true });
                    x += w;
                });
                doc.y = y + 18;
                doc.strokeColor('#e5e7eb').lineWidth(0.5)
                    .moveTo(x0, doc.y).lineTo(x0 + tableWidth, doc.y).stroke();
            };

            const drawRow = (s, idx) => {
                const rowH = 16;
                if (doc.y + rowH > doc.page.height - doc.page.margins.bottom - 30) {
                    doc.addPage();
                    drawTableHeader();
                }
                const x0 = doc.page.margins.left;
                const y  = doc.y;
                if (idx % 2 === 1) {
                    doc.fillColor('#fafafa').rect(x0, y, tableWidth, rowH).fill();
                }
                doc.fillColor('#1f2937').fontSize(8).font('Helvetica');
                let x = x0 + 4;
                const cells = [
                    [String(idx + 1),                                                colWidths.idx],
                    [s.reg_number || '—',                                            colWidths.reg],
                    [`${s.first_name || ''} ${s.last_name || ''}`.trim() || '—',     colWidths.name],
                    [s.gender || '—',                                                colWidths.gender],
                    [s.from_level || s.final_level || '—',                           colWidths.level],
                    [s.contact_phone || '—',                                         colWidths.phone],
                    [[s.address_district, s.address_sector].filter(Boolean).join(' / ') || '—', colWidths.location],
                    [fmt(s.graduated_at),                                            colWidths.date],
                ];
                cells.forEach(([val, w]) => {
                    doc.text(String(val), x, y + 4, { width: w - 6, ellipsis: true, lineBreak: false });
                    x += w;
                });
                doc.y = y + rowH;
                doc.strokeColor('#f3f4f6').lineWidth(0.3)
                    .moveTo(x0, doc.y).lineTo(x0 + tableWidth, doc.y).stroke();
            };

            (payload.groups || []).forEach((g, gi) => {
                if (gi > 0) doc.moveDown(0.6);
                if (doc.y + 60 > doc.page.height - doc.page.margins.bottom) doc.addPage();

                doc.fillColor('#92400e').fontSize(13).font('Helvetica-Bold')
                    .text(g.year_name);
                doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
                    .text(`${fmt(g.start_date)} → ${fmt(g.end_date)}    ·    ${g.total} graduates`);
                doc.moveDown(0.3);

                (g.trades || []).forEach((t) => {
                    if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) doc.addPage();
                    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
                        .text(`${t.trade}  (${t.count})`);
                    doc.moveDown(0.15);
                    drawTableHeader();
                    (t.students || []).forEach((s, i) => drawRow(s, i));
                });
            });

            // ─── Footer ─────────────────────────────────────────────
            const range = doc.bufferedPageRange();
            for (let i = 0; i < range.count; i++) {
                doc.switchToPage(range.start + i);
                const bottom = doc.page.height - doc.page.margins.bottom + 10;
                doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
                    .text(
                        `${payload.school_name} · Confidential — for partner-employer use only · Page ${i + 1} of ${range.count}`,
                        doc.page.margins.left,
                        bottom,
                        { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: 'center' },
                    );
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildRosterPdf };

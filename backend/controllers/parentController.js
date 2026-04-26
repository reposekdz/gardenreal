const db = require('../db');
const smsService = require('../utils/smsService');

// Parent: Submit a link request (by describing child info - admin manually matches to student)
exports.submitLinkRequest = async (req, res) => {
    const parentId = req.user.id;
    // Accept both old shape (student_*) and new shape (child_name + reg_number + relationship + notes)
    const student_name = req.body.student_name || req.body.child_name;
    const student_trade = req.body.student_trade || null;
    const student_level = req.body.student_level || null;
    const student_gender = req.body.student_gender || null;
    const reg_number = req.body.reg_number || null;
    const relationship = req.body.relationship || null;
    const notes = req.body.notes || null;

    if (!student_name) return res.status(400).json({ message: 'Izina ry\'umunyeshuri rirasabwa' });
    try {
        // If a reg_number was provided, try to auto-resolve to an existing student first
        let resolvedStudentId = null;
        if (reg_number) {
            const [stRows] = await db.execute(
                'SELECT id, first_name, last_name FROM students WHERE reg_number = ? LIMIT 1',
                [reg_number]
            );
            if (stRows.length > 0) {
                resolvedStudentId = stRows[0].id;
                // Block if this student is already linked to ANOTHER parent (approved)
                const [alreadyLinked] = await db.execute(
                    `SELECT id FROM parent_student_links
                     WHERE student_id = ? AND parent_id != ? AND status IN ('approved', 'linked')`,
                    [resolvedStudentId, parentId]
                );
                if (alreadyLinked.length > 0) {
                    return res.status(403).json({
                        message: 'Uyu munyeshuri yamaze guhuzwa n\'undi mubyeyi. Vugana n\'ubuyobozi bw\'ishuri.'
                    });
                }
                // Already linked to THIS parent → just say so
                const [meLinked] = await db.execute(
                    `SELECT id FROM parent_student_links
                     WHERE student_id = ? AND parent_id = ? AND status IN ('approved', 'linked')`,
                    [resolvedStudentId, parentId]
                );
                if (meLinked.length > 0) {
                    return res.status(409).json({ message: 'Wamaze guhuzwa n\'uyu munyeshuri.' });
                }
            }
        }

        // Check if identical pending request exists
        const [existing] = await db.execute(
            'SELECT id FROM parent_link_requests WHERE parent_id = ? AND student_name = ? AND status = "pending"',
            [parentId, student_name]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Ubusabe bwashyizwe asanzwe bugeraho. Tegereza kwemezwa.' });
        }

        // Insert link request — try with extended columns, fall back to legacy shape
        try {
            await db.execute(
                `INSERT INTO parent_link_requests
                 (parent_id, student_name, student_trade, student_level, student_gender,
                  reg_number, relationship, notes, linked_student_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [parentId, student_name, student_trade, student_level, student_gender,
                 reg_number, relationship, notes, resolvedStudentId]
            );
        } catch (insErr) {
            await db.execute(
                'INSERT INTO parent_link_requests (parent_id, student_name, student_trade, student_level, student_gender) VALUES (?, ?, ?, ?, ?)',
                [parentId, student_name, student_trade, student_level, student_gender]
            );
        }

        res.status(201).json({ message: 'Ubusabe bwakiriwe. Umuyobozi azabusuzuma vuba.' });
    } catch (error) {
        console.error('submitLinkRequest error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Parent: Get all children (approved links)
exports.getParentStudents = async (req, res) => {
    const parentId = req.user.id;
    try {
        // Try with 'status' column first, then 'link_status'
        let students;
        try {
            [students] = await db.execute(
                `SELECT s.*, psl.status as link_status, psl.id as link_id
                 FROM parent_student_links psl
                 JOIN students s ON psl.student_id = s.id
                 WHERE psl.parent_id = ? AND (psl.status = 'approved' OR psl.status = 'linked')`,
                [parentId]
            );
        } catch (e) {
            // If 'status' column doesn't exist, try 'link_status'
            [students] = await db.execute(
                `SELECT s.*, psl.link_status, psl.id as link_id
                 FROM parent_student_links psl
                 JOIN students s ON psl.student_id = s.id
                 WHERE psl.parent_id = ? AND (psl.link_status = 'approved' OR psl.link_status = 'linked')`,
                [parentId]
            );
        }
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Parent: Get their own link requests (for status tracking)
exports.getMyLinkRequests = async (req, res) => {
    const parentId = req.user.id;
    try {
        const [requests] = await db.execute(
            `SELECT * FROM parent_link_requests WHERE parent_id = ? ORDER BY requested_at DESC`,
            [parentId]
        );
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Get all pending parent link requests
exports.getAllLinkRequests = async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT plr.*, 
             u.first_name as parent_first, u.last_name as parent_last, u.phone as parent_phone,
             u.province, u.district, u.sector,
             s.first_name as student_first, s.last_name as student_last, s.reg_number, s.trade as student_trade, s.level as student_level, s.gender as student_gender,
             CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) as student_name,
             CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as parent_name
             FROM parent_link_requests plr
             LEFT JOIN users u ON plr.parent_id = u.id
             LEFT JOIN students s ON plr.linked_student_id = s.id
             ORDER BY plr.requested_at DESC`
        );
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Manually link a parent to a specific student (by request ID + student_id)
exports.adminLinkParentToStudent = async (req, res) => {
    const { request_id, student_id } = req.body;
    if (!request_id || !student_id) return res.status(400).json({ message: 'Amakuru ya request_id na student_id arasabwa' });
    try {
        const [reqs] = await db.execute(
            `SELECT plr.*, u.phone as parent_phone, u.first_name as pname
             FROM parent_link_requests plr JOIN users u ON plr.parent_id = u.id
             WHERE plr.id = ?`, [request_id]
        );
        if (reqs.length === 0) return res.status(404).json({ message: 'Ubusabe ntiboneka' });
        const req_data = reqs[0];

        // Check if link already exists
        const [existLink] = await db.execute(
            'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
            [req_data.parent_id, student_id]
        );

        if (existLink.length === 0) {
            await db.execute(
                'INSERT INTO parent_student_links (parent_id, student_id, status) VALUES (?, ?, "approved")',
                [req_data.parent_id, student_id]
            );
        } else {
            await db.execute(
                'UPDATE parent_student_links SET status = "approved" WHERE parent_id = ? AND student_id = ?',
                [req_data.parent_id, student_id]
            );
        }

        // Mark request as linked
        await db.execute(
            'UPDATE parent_link_requests SET status = "linked", linked_student_id = ? WHERE id = ?',
            [student_id, request_id]
        );

        // Get student info for SMS
        const [students] = await db.execute('SELECT * FROM students WHERE id = ?', [student_id]);
        const student = students[0];

        // Send SMS to parent using SMS service (async, don't wait)
        if (req_data.parent_phone && student) {
            const phone = req_data.parent_phone.startsWith('+') ? req_data.parent_phone : '+' + req_data.parent_phone;
            const msg = `Amakuru meza ${req_data.pname || 'Cheresite'}! Guhuza n'umwana wawe ${student.first_name} ${student.last_name} (${student.reg_number}) kwemejwe na Garden TVET School. Ubu urashobora kureba amakuru ye kuri app. Murakoze!`;

            // Try SMS service first, with fallback to direct send
            smsService.notifyLinkApproved(req_data.parent_id, student_id)
                .then(result => {
                    if (!result.success) {
                        // Fallback to direct SMS
                        smsService.sendSMS(phone, msg)
                            .catch(e => console.log('Direct SMS fallback failed:', e.message));
                    }
                })
                .catch(err => {
                    console.log('SMS notifyLinkApproved failed, trying direct:', err.message);
                    // Fallback to direct SMS
                    smsService.sendSMS(phone, msg)
                        .catch(e => console.log('Direct SMS also failed:', e.message));
                });
        }

        res.json({ message: `Umubyeyi ahuriwe n'umunyeshuri ${student?.first_name} ${student?.last_name}. SMS yoherejwe!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin: Reject a link request
exports.rejectLinkRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const [reqs] = await db.execute(
            `SELECT plr.*, u.phone as parent_phone, u.first_name as pname
             FROM parent_link_requests plr JOIN users u ON plr.parent_id = u.id WHERE plr.id = ?`, [id]
        );

        // Send SMS using SMS service
        if (reqs.length > 0) {
            smsService.notifyLinkRejected(reqs[0].parent_id, 'Your request was not approved. Please contact the school.')
                .catch(err => console.log('SMS skipped:', err.message));
        }

        await db.execute('UPDATE parent_link_requests SET status = "rejected" WHERE id = ?', [id]);
        res.json({ message: 'Ubusabe bwanzwe. SMS yoherejwe.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Legacy: approve/reject direct parent_student_links
exports.approveLink = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.execute('UPDATE parent_student_links SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: `Link ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPendingLinks = async (req, res) => {
    try {
        const [links] = await db.execute(
            `SELECT psl.*, u.first_name as parent_first, u.last_name as parent_last, u.phone,
             s.first_name as student_first, s.last_name as student_last, s.reg_number
             FROM parent_student_links psl
             JOIN users u ON psl.parent_id = u.id
             JOIN students s ON psl.student_id = s.id
             WHERE psl.status = 'pending'`
        );
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all approved links (for viewing all linked parent-student pairs)
exports.getAllLinkedStudents = async (req, res) => {
    try {
        const [links] = await db.execute(
            `SELECT psl.*, 
             u.first_name as parent_first, u.last_name as parent_last, u.phone as parent_phone, u.email as parent_email,
             s.first_name as student_first, s.last_name as student_last, s.reg_number, s.trade as student_trade, s.level as student_level, s.gender as student_gender,
             CONCAT(u.first_name, ' ', u.last_name) as parent_name,
             CONCAT(s.first_name, ' ', s.last_name) as student_name
             FROM parent_student_links psl
             JOIN users u ON psl.parent_id = u.id
             JOIN students s ON psl.student_id = s.id
             WHERE psl.status = 'approved'
             ORDER BY psl.created_at DESC`
        );
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Unlink a parent from a student
exports.unlinkParentStudent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM parent_student_links WHERE id = ?', [id]);
        res.json({ message: 'Umubyeyi atagaritswe ku muhanshi' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all parents (for admin, director of discipline)
exports.getAllParents = async (req, res) => {
    try {
        const [parents] = await db.execute(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
                    (SELECT COUNT(*) FROM parent_student_links WHERE parent_id = u.id AND status = 'approved') as linked_children
             FROM users u 
             WHERE u.role = 'parent'
             ORDER BY u.created_at DESC`
        );
        res.json(parents);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get parents linked to a specific student
exports.getParentsByStudent = async (req, res) => {
    const { studentId } = req.params;
    try {
        const [links] = await db.execute(
            `SELECT psl.*, 
                    u.first_name as parent_first, u.last_name as parent_last, u.phone as parent_phone, u.email as parent_email,
                    s.first_name as student_first, s.last_name as student_last, s.reg_number, s.trade as student_trade, s.level as student_level,
                    CONCAT(u.first_name, ' ', u.last_name) as parent_name,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    psl.relationship as relationship
             FROM parent_student_links psl
             JOIN users u ON psl.parent_id = u.id
             JOIN students s ON psl.student_id = s.id
             WHERE psl.student_id = ? AND psl.status = 'approved'
             ORDER BY psl.is_primary DESC, psl.created_at DESC`,
            [studentId]
        );
        res.json(links);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a parent (admin only)
exports.deleteParent = async (req, res) => {
    const { id } = req.params;
    try {
        // First delete all links associated with this parent
        await db.execute('DELETE FROM parent_student_links WHERE parent_id = ?', [id]);

        // Then delete the parent user
        const [result] = await db.execute('DELETE FROM users WHERE id = ? AND role = "parent"', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        res.json({ message: 'Parent deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    submitLinkRequest: exports.submitLinkRequest,
    getMyLinkRequests: exports.getMyLinkRequests,
    getParentStudents: exports.getParentStudents,
    getAllLinkRequests: exports.getAllLinkRequests,
    adminLinkParentToStudent: exports.adminLinkParentToStudent,
    rejectLinkRequest: exports.rejectLinkRequest,
    approveLink: exports.approveLink,
    getPendingLinks: exports.getPendingLinks,
    getAllLinkedStudents: exports.getAllLinkedStudents,
    unlinkParentStudent: exports.unlinkParentStudent,
    getAllParents: exports.getAllParents,
    getParentsByStudent: exports.getParentsByStudent,
    deleteParent: exports.deleteParent
};

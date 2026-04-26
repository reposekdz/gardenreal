const db = require('../db');
const smsService = require('../utils/smsService');

// Helper to calculate grade letter
const calculateGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    else if (percentage >= 80) return 'B';
    else if (percentage >= 70) return 'C';
    else if (percentage >= 60) return 'D';
    else return 'F';
};

exports.getGrades = async (req, res) => {
    try {
        const { student_id, term, academic_year } = req.query;

        let query = `
            SELECT g.*, s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   u.first_name as recorded_by_name, u.last_name as recorded_by_last
            FROM student_grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN users u ON g.recorded_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (student_id) {
            query += ' AND g.student_id = ?';
            params.push(student_id);
        }

        if (term) {
            query += ' AND g.term = ?';
            params.push(term);
        }

        if (academic_year) {
            query += ' AND g.academic_year = ?';
            params.push(academic_year);
        }

        query += ' ORDER BY g.created_at DESC';

        const grades = await db.query(query, params);
        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ message: 'Failed to fetch grades' });
    }
};

exports.getStudentPerformance = async (req, res) => {
    try {
        const { student_id } = req.params;

        // Get all grades for the student
        const grades = await db.query(
            'SELECT * FROM student_grades WHERE student_id = ? ORDER BY academic_year, term, created_at',
            [student_id]
        );

        if (grades.length === 0) {
            return res.json({
                student_id,
                average: null,
                grades: [],
                subjects: [],
                performance_by_term: []
            });
        }

        // Calculate average
        const totalScore = grades.reduce((sum, g) => sum + parseFloat(g.score), 0);
        const totalMax = grades.reduce((sum, g) => sum + parseFloat(g.max_score), 0);
        const average = (totalScore / totalMax) * 100;

        // Get unique subjects
        const subjects = [...new Set(grades.map(g => g.subject))];

        // Group by term
        const performance_by_term = grades.reduce((acc, g) => {
            const key = `${g.term} ${g.academic_year}`;
            if (!acc[key]) {
                acc[key] = { term: g.term, academic_year: g.academic_year, scores: [], average: 0 };
            }
            acc[key].scores.push(g);
            return acc;
        }, {});

        // Calculate term averages
        Object.keys(performance_by_term).forEach(key => {
            const termGrades = performance_by_term[key].scores;
            const termTotal = termGrades.reduce((sum, g) => sum + parseFloat(g.score), 0);
            const termMax = termGrades.reduce((sum, g) => sum + parseFloat(g.max_score), 0);
            performance_by_term[key].average = (termTotal / termMax) * 100;
        });

        res.json({
            student_id,
            average: average.toFixed(2),
            total_exams: grades.length,
            subjects,
            grades,
            performance_by_term: Object.values(performance_by_term)
        });
    } catch (error) {
        console.error('Error fetching student performance:', error);
        res.status(500).json({ message: 'Failed to fetch student performance' });
    }
};

exports.addGrade = async (req, res) => {
    try {
        const { student_id, subject, term, academic_year, grade_type, score, max_score, notes } = req.body;

        if (!student_id || !subject || !term || !academic_year || !grade_type || score === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const maxScore = max_score || 100;
        const percentage = (score / maxScore) * 100;

        // Calculate grade letter
        let grade_letter;
        if (percentage >= 90) grade_letter = 'A';
        else if (percentage >= 80) grade_letter = 'B';
        else if (percentage >= 70) grade_letter = 'C';
        else if (percentage >= 60) grade_letter = 'D';
        else grade_letter = 'F';

        const result = await db.query(
            `INSERT INTO student_grades (student_id, subject, term, academic_year, grade_type, score, max_score, grade_letter, notes, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [student_id, subject, term, academic_year, grade_type, score, maxScore, grade_letter, notes || null, req.user.id]
        );

        // Update student GPA
        const allGrades = await db.query(
            'SELECT score, max_score FROM student_grades WHERE student_id = ?',
            [student_id]
        );

        if (allGrades.length > 0) {
            const totalScore = allGrades.reduce((sum, g) => sum + parseFloat(g.score), 0);
            const totalMax = allGrades.reduce((sum, g) => sum + parseFloat(g.max_score), 0);
            const gpa = (totalScore / totalMax) * 100;

            await db.query('UPDATE students SET gpa = ? WHERE id = ?', [gpa.toFixed(2), student_id]);
        }

        // Send SMS to parents using SMS service
        smsService.notifyGradeAdded(student_id, {
            subject,
            grade_type,
            score,
            max_score: maxScore,
            grade_letter
        }).catch(err => console.log('SMS notification skipped:', err.message));

        res.status(201).json({
            message: 'Grade added successfully',
            gradeId: result.insertId,
            grade_letter
        });
    } catch (error) {
        console.error('Error adding grade:', error);
        res.status(500).json({ message: 'Failed to add grade' });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, term, academic_year, grade_type, score, max_score, notes } = req.body;

        const maxScore = max_score || 100;
        const percentage = (score / maxScore) * 100;

        let grade_letter;
        if (percentage >= 90) grade_letter = 'A';
        else if (percentage >= 80) grade_letter = 'B';
        else if (percentage >= 70) grade_letter = 'C';
        else if (percentage >= 60) grade_letter = 'D';
        else grade_letter = 'F';

        // Get student_id before updating
        const [existingGrade] = await db.execute('SELECT student_id FROM student_grades WHERE id = ?', [id]);
        const studentId = existingGrade[0]?.student_id;

        await db.query(
            `UPDATE student_grades SET subject = ?, term = ?, academic_year = ?, grade_type = ?, score = ?, max_score = ?, grade_letter = ?, notes = ?
             WHERE id = ?`,
            [subject, term, academic_year, grade_type, score, maxScore, grade_letter, notes || null, id]
        );

        // Notify parents via SMS
        if (studentId) {
            try {
                await smsService.notifyGradeChange(studentId, subject, 'updated', {
                    score,
                    max_score: maxScore,
                    grade: grade_letter
                });
            } catch (smsErr) {
                console.log('SMS notification skipped:', smsErr.message);
            }
        }

        res.json({ message: 'Grade updated successfully', grade_letter });
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({ message: 'Failed to update grade' });
    }
};

exports.deleteGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get the grade before deleting
        const [grades] = await db.execute('SELECT * FROM student_grades WHERE id = ?', [id]);

        if (grades.length === 0) {
            return res.status(404).json({ message: 'Grade not found' });
        }

        const grade = grades[0];
        const percentage = (grade.score / grade.max_score) * 100;

        // Archive the grade before deleting
        await db.execute(
            `INSERT INTO grade_archives 
            (original_grade_id, student_id, subject, term, academic_year, grade_type, score, max_score, percentage, grade_letter, notes, deleted_by, deleted_reason, archived_from) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'delete')`,
            [id, grade.student_id, grade.subject, grade.term, grade.academic_year, grade.grade_type,
                grade.score, grade.max_score, percentage, grade.grade_letter, grade.notes,
                req.user.id, reason || 'Grade deleted']
        );

        // Delete the grade
        await db.execute('DELETE FROM student_grades WHERE id = ?', [id]);

        // Notify parents via SMS
        try {
            const student = await db.query('SELECT first_name, last_name FROM students WHERE id = ?', [grade.student_id]);
            if (student.length > 0) {
                await smsService.notifyGradeChange(grade.student_id, grade.subject, 'deleted', {
                    score: grade.score,
                    max_score: grade.max_score,
                    grade: grade.grade_letter
                });
            }
        } catch (smsErr) {
            console.log('SMS notification skipped:', smsErr.message);
        }

        res.json({ message: 'Grade archived successfully. Parents have been notified.' });
    } catch (error) {
        console.error('Error deleting grade:', error);
        res.status(500).json({ message: 'Failed to delete grade' });
    }
};

exports.getGradeStats = async (req, res) => {
    try {
        const { student_id } = req.params;

        const stats = {
            total_grades: 0,
            average: 0,
            highest: 0,
            lowest: 0,
            by_subject: {},
            by_term: {}
        };

        const grades = await db.query(
            'SELECT * FROM student_grades WHERE student_id = ? ORDER BY created_at DESC',
            [student_id]
        );

        if (grades.length === 0) {
            return res.json(stats);
        }

        stats.total_grades = grades.length;

        const scores = grades.map(g => (g.score / g.max_score) * 100);
        stats.average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
        stats.highest = Math.max(...scores).toFixed(2);
        stats.lowest = Math.min(...scores).toFixed(2);

        // By subject
        grades.forEach(g => {
            if (!stats.by_subject[g.subject]) {
                stats.by_subject[g.subject] = { total: 0, count: 0, average: 0 };
            }
            stats.by_subject[g.subject].total += (g.score / g.max_score) * 100;
            stats.by_subject[g.subject].count += 1;
        });

        Object.keys(stats.by_subject).forEach(subject => {
            stats.by_subject[subject].average = (stats.by_subject[subject].total / stats.by_subject[subject].count).toFixed(2);
        });

        // By term
        grades.forEach(g => {
            const termKey = `${g.term} ${g.academic_year}`;
            if (!stats.by_term[termKey]) {
                stats.by_term[termKey] = { total: 0, count: 0, average: 0 };
            }
            stats.by_term[termKey].total += (g.score / g.max_score) * 100;
            stats.by_term[termKey].count += 1;
        });

        Object.keys(stats.by_term).forEach(term => {
            stats.by_term[term].average = (stats.by_term[term].total / stats.by_term[term].count).toFixed(2);
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching grade stats:', error);
        res.status(500).json({ message: 'Failed to fetch grade stats' });
    }
};

// Get grade history (including archived/deleted grades)
exports.getGradeHistory = async (req, res) => {
    try {
        const { student_id, academic_year, term } = req.query;

        let query = `
            SELECT 
                g.id,
                g.student_id,
                g.subject,
                g.term,
                g.academic_year,
                g.grade_type,
                g.score,
                g.max_score,
                g.percentage,
                g.grade_letter,
                g.notes,
                g.created_at,
                'active' as status,
                NULL as deleted_by,
                NULL as deleted_reason,
                NULL as deleted_at
            FROM student_grades g
            WHERE 1=1
        `;

        const archiveQuery = `
            SELECT 
                ga.original_grade_id as id,
                ga.student_id,
                ga.subject,
                ga.term,
                ga.academic_year,
                ga.grade_type,
                ga.score,
                ga.max_score,
                ga.percentage,
                ga.grade_letter,
                ga.notes,
                ga.deleted_at as created_at,
                'deleted' as status,
                ga.deleted_by,
                ga.deleted_reason,
                ga.deleted_at
            FROM grade_archives ga
            WHERE 1=1
        `;

        const params = [];
        const archiveParams = [];

        if (student_id) {
            query += ' AND g.student_id = ?';
            archiveQuery += ' AND ga.student_id = ?';
            params.push(student_id);
            archiveParams.push(student_id);
        }

        if (academic_year) {
            query += ' AND g.academic_year = ?';
            archiveQuery += ' AND ga.academic_year = ?';
            params.push(academic_year);
            archiveParams.push(academic_year);
        }

        if (term) {
            query += ' AND g.term = ?';
            archiveQuery += ' AND ga.term = ?';
            params.push(term);
            archiveParams.push(term);
        }

        query += ' ORDER BY g.created_at DESC';
        archiveQuery += ' ORDER BY ga.deleted_at DESC';

        const activeGrades = await db.query(query, params);
        const archivedGrades = await db.query(archiveQuery, archiveParams);

        res.json({
            active: activeGrades,
            archived: archivedGrades,
            summary: {
                total_active: activeGrades.length,
                total_archived: archivedGrades.length,
                total: activeGrades.length + archivedGrades.length
            }
        });
    } catch (error) {
        console.error('Error fetching grade history:', error);
        res.status(500).json({ message: 'Failed to fetch grade history' });
    }
};

// Get archived grades only
exports.getArchivedGrades = async (req, res) => {
    try {
        const { student_id, academic_year } = req.query;

        let query = `
            SELECT ga.*, 
                   s.first_name, s.last_name, s.reg_number, s.trade, s.level,
                   u.first_name as deleted_by_name, u.last_name as deleted_by_last
            FROM grade_archives ga
            LEFT JOIN students s ON ga.student_id = s.id
            LEFT JOIN users u ON ga.deleted_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (student_id) {
            query += ' AND ga.student_id = ?';
            params.push(student_id);
        }

        if (academic_year) {
            query += ' AND ga.academic_year = ?';
            params.push(academic_year);
        }

        query += ' ORDER BY ga.deleted_at DESC';

        const archived = await db.query(query, params);
        res.json(archived);
    } catch (error) {
        console.error('Error fetching archived grades:', error);
        res.status(500).json({ message: 'Failed to fetch archived grades' });
    }
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, Edit2, Save, X, Search, Filter, Download, Upload, TrendingUp, Award, BookOpen, History, Eye, EyeOff } from 'lucide-react';

const GradesManager = () => {
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStudent, setFilterStudent] = useState('');
    const [filterTerm, setFilterTerm] = useState('');

    // Grade history state
    const [showHistory, setShowHistory] = useState(false);
    const [gradeHistory, setGradeHistory] = useState({ active: [], archived: [] });
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [form, setForm] = useState({
        student_id: '', unit_name: '', unit_code: '', academic_year: new Date().getFullYear().toString(),
        term: 'Term 1', theory_marks: '', practical_marks: '', assignment_marks: '', exam_marks: '', comments: ''
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const API_URL = import.meta.env.VITE_API_URL || '';

    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gradesRes, studentsRes] = await Promise.all([
                axios.get(`${API_URL}/api/grades`, { headers }),
                axios.get(`${API_URL}/api/students`, { headers })
            ]);
            setGrades(gradesRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGradeHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${API_URL}/api/grades/history`, { headers });
            setGradeHistory(res.data || { active: [], archived: [] });
        } catch (err) {
            console.error('Error fetching grade history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                student_id: parseInt(form.student_id),
                unit_name: form.unit_name,
                unit_code: form.unit_code,
                academic_year: form.academic_year,
                term: form.term,
                theory_marks: parseFloat(form.theory_marks) || 0,
                practical_marks: parseFloat(form.practical_marks) || 0,
                assignment_marks: parseFloat(form.assignment_marks) || 0,
                exam_marks: parseFloat(form.exam_marks) || 0,
                comments: form.comments
            };

            if (editingGrade) {
                await axios.put(`${API_URL}/api/grades/${editingGrade.id}`, payload, headers);
                toast.success('Grade updated!');
            } else {
                await axios.post(`${API_URL}/api/grades`, payload, headers);
                toast.success('Grade added!');
            }
            setShowForm(false);
            setEditingGrade(null);
            resetForm();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save grade');
        }
    };

    const handleEdit = (grade) => {
        setEditingGrade(grade);
        setForm({
            student_id: grade.student_id,
            unit_name: grade.unit_name || '',
            unit_code: grade.unit_code || '',
            academic_year: grade.academic_year || '',
            term: grade.term || 'Term 1',
            theory_marks: grade.theory_marks || '',
            practical_marks: grade.practical_marks || '',
            assignment_marks: grade.assignment_marks || '',
            exam_marks: grade.exam_marks || '',
            comments: grade.comments || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const reason = window.prompt('Andika imp理由 (Reason for deleting):');
        if (reason === null) return; // User cancelled
        try {
            await axios.delete(`${API_URL}/api/grades/${id}`, {
                headers,
                data: { reason: reason || 'Grade deleted by teacher' }
            });
            toast.success('Grade sibitswe! Ababyeyi batumwiriye SMS.');
            fetchData();
        } catch (err) {
            toast.error('Habaye ikibazo mu gusiba');
        }
    };

    const resetForm = () => {
        setForm({
            student_id: '', unit_name: '', unit_code: '', academic_year: new Date().getFullYear().toString(),
            term: 'Term 1', theory_marks: '', practical_marks: '', assignment_marks: '', exam_marks: '', comments: ''
        });
    };

    const calculateTotal = (g) => {
        return ((parseFloat(g.theory_marks) || 0) + (parseFloat(g.practical_marks) || 0) +
            (parseFloat(g.assignment_marks) || 0) + (parseFloat(g.exam_marks) || 0));
    };

    const getGradeColor = (total) => {
        if (total >= 80) return 'bg-green-100 text-green-800';
        if (total >= 60) return 'bg-blue-100 text-blue-800';
        if (total >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const filteredGrades = grades.filter(g => {
        const student = students.find(s => s.id === g.student_id);
        const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
        return (
            (!searchTerm || studentName.includes(searchTerm.toLowerCase()) ||
                g.unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.unit_code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!filterStudent || g.student_id === parseInt(filterStudent)) &&
            (!filterTerm || g.term === filterTerm)
        );
    });

    const stats = {
        total: grades.length,
        average: grades.length > 0 ? (grades.reduce((sum, g) => sum + calculateTotal(g), 0) / grades.length).toFixed(1) : 0,
        passed: grades.filter(g => calculateTotal(g) >= 50).length,
        failed: grades.filter(g => calculateTotal(g) < 50).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ibyerekeyo by'Abana</h2>
                    <p className="text-gray-500">Ragura kugira niberekeyo by'abanza</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowHistory(!showHistory);
                            if (!showHistory) fetchGradeHistory();
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${showHistory ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}>
                        <History size={20} /> {showHistory ? 'Hide History' : 'Grade History'}
                    </button>
                    <button onClick={() => { resetForm(); setEditingGrade(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <PlusCircle size={20} /> Ongeramo Ibyerekeyo
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg"><BookOpen size={20} className="text-primary-600" /></div>
                        <div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-gray-500">Total</div></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
                        <div><div className="text-2xl font-bold">{stats.average}%</div><div className="text-xs text-gray-500">Average</div></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><Award size={20} className="text-blue-600" /></div>
                        <div><div className="text-2xl font-bold">{stats.passed}</div><div className="text-xs text-gray-500">Pass</div></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg"><X size={20} className="text-red-600" /></div>
                        <div><div className="text-2xl font-bold">{stats.failed}</div><div className="text-xs text-gray-500">Fail</div></div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
                <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="">All Terms</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                </select>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Unit</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Term</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Theory</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Practical</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Assign</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Exam</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredGrades.length === 0 ? (
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Nta byerekeyo bihari</td></tr>
                        ) : (
                            filteredGrades.map(grade => {
                                const student = students.find(s => s.id === grade.student_id);
                                const total = calculateTotal(grade);
                                return (
                                    <tr key={grade.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{student?.first_name} {student?.last_name}</td>
                                        <td className="px-4 py-3">{grade.unit_name}<br /><span className="text-xs text-gray-400">{grade.unit_code}</span></td>
                                        <td className="px-4 py-3">{grade.term}<br /><span className="text-xs text-gray-400">{grade.academic_year}</span></td>
                                        <td className="px-4 py-3">{grade.theory_marks || '-'}</td>
                                        <td className="px-4 py-3">{grade.practical_marks || '-'}</td>
                                        <td className="px-4 py-3">{grade.assignment_marks || '-'}</td>
                                        <td className="px-4 py-3">{grade.exam_marks || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded font-bold ${getGradeColor(total)}`}>{total}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(grade)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(grade.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingGrade ? 'Hindura Ibyerekeyo' : 'Ongeramo Ibyerekeyo'}</h3>
                            <button onClick={() => { setShowForm(false); setEditingGrade(null); }} className="p-2 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Umwana</label>
                                    <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                                        className="w-full p-2 border rounded-lg">
                                        <option value="">Select Student</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Academic Year</label>
                                    <input type="text" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                                        className="w-full p-2 border rounded-lg" placeholder="2024" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Term</label>
                                    <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                                        className="w-full p-2 border rounded-lg">
                                        <option value="Term 1">Term 1</option>
                                        <option value="Term 2">Term 2</option>
                                        <option value="Term 3">Term 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit Name</label>
                                    <input type="text" value={form.unit_name} onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                                        className="w-full p-2 border rounded-lg" placeholder="e.g. Web Development" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit Code</label>
                                    <input type="text" value={form.unit_code} onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
                                        className="w-full p-2 border rounded-lg" placeholder="e.g. WD101" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Theory (40)</label>
                                    <input type="number" min="0" max="40" value={form.theory_marks} onChange={(e) => setForm({ ...form, theory_marks: e.target.value })}
                                        className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Practical (30)</label>
                                    <input type="number" min="0" max="30" value={form.practical_marks} onChange={(e) => setForm({ ...form, practical_marks: e.target.value })}
                                        className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Assignment (10)</label>
                                    <input type="number" min="0" max="10" value={form.assignment_marks} onChange={(e) => setForm({ ...form, assignment_marks: e.target.value })}
                                        className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Exam (20)</label>
                                    <input type="number" min="0" max="20" value={form.exam_marks} onChange={(e) => setForm({ ...form, exam_marks: e.target.value })}
                                        className="w-full p-2 border rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Comments</label>
                                <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                                    className="w-full p-2 border rounded-lg" rows={2} placeholder="Optional comments..." />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold">
                                    {editingGrade ? 'Hindura' : 'Bika'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingGrade(null); }}
                                    className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grade History View */}
            {showHistory && (
                <div className="bg-white rounded-xl border shadow-sm mt-6">
                    <div className="p-4 border-b bg-purple-50">
                        <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                            <History size={20} /> Am التاريخ y'Ibyerekeyo (Grade History)
                        </h3>
                        <p className="text-sm text-purple-600">
                            Active: {gradeHistory.summary?.total_active || 0} | Deleted: {gradeHistory.summary?.total_archived || 0}
                        </p>
                    </div>

                    {loadingHistory ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="p-4">
                            {/* Archived Grades */}
                            {gradeHistory.archived && gradeHistory.archived.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                                        <EyeOff size={16} /> Ibyasibitswe (Deleted Grades)
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-red-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Student</th>
                                                    <th className="px-3 py-2 text-left">Subject</th>
                                                    <th className="px-3 py-2 text-left">Term</th>
                                                    <th className="px-3 py-2 text-left">Score</th>
                                                    <th className="px-3 py-2 text-left">Deleted Reason</th>
                                                    <th className="px-3 py-2 text-left">Deleted Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {gradeHistory.archived.map((g, i) => (
                                                    <tr key={i} className="bg-red-50/50">
                                                        <td className="px-3 py-2">{g.first_name} {g.last_name}</td>
                                                        <td className="px-3 py-2">{g.subject}</td>
                                                        <td className="px-3 py-2">{g.term} {g.academic_year}</td>
                                                        <td className="px-3 py-2">{g.score}/{g.max_score} ({g.grade_letter})</td>
                                                        <td className="px-3 py-2 text-red-600">{g.deleted_reason}</td>
                                                        <td className="px-3 py-2 text-gray-500">{new Date(g.deleted_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {(!gradeHistory.archived || gradeHistory.archived.length === 0) && (
                                <div className="text-center py-8 text-gray-400">
                                    <History size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>Nta grade zasibitswe</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GradesManager;

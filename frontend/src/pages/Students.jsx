import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Filter, Plus, X, ChevronDown, ChevronUp,
    GraduationCap, Calendar, MapPin, Phone, Mail, Edit, Trash2, Eye,
    CheckCircle, XCircle, AlertTriangle, RefreshCw, Save,
    ChevronLeft, ChevronRight, UserCheck, UserX, Award, BookOpen, DollarSign,
    MessageSquare, Plane, Clock, Wallet, CreditCard, FileText, Send, Check, Ban,
    UserPlus, Bell, History, Settings, Printer, PhoneCall, HomeIcon,
    BarChart3, PieChart, Grid3X3, List, Archive, RotateCcw, UsersRound,
    Shield, Menu, LogOut, FileCheck, ClipboardList, TrendingUp, Activity,
    GraduationCap as GradeIcon, Receipt, Send as MessageIcon, FileSignature,
    EyeOff, Lock, Unlock, Award as MedalIcon
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const getHeaders = (token) => ({ Authorization: `Bearer ${token}` });

// Only admin, dod, accountant can access students page
// Stock manager manages stock only, not students
const STAFF_ROLES = ['admin', 'dod', 'director_of_discipline', 'accountant'];
const FINANCE_ROLES = ['admin', 'accountant'];
const DOD_ROLES = ['admin', 'dod', 'director_of_discipline'];

const Students = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();

    const [isInitialized, setIsInitialized] = useState(false);
    const hasAccess = user && STAFF_ROLES.includes(user.role);
    const isAdmin = user?.role === 'admin';
    const isAccountant = user?.role === 'accountant';
    const isDod = user?.role === 'dod' || user?.role === 'director_of_discipline';
    const canManageFinance = user && FINANCE_ROLES.includes(user.role);
    const canManageConduct = user && DOD_ROLES.includes(user.role);

    useEffect(() => {
        if (user !== undefined) setIsInitialized(true);
    }, [user]);

    useEffect(() => {
        if (isInitialized && !hasAccess && user) {
            toast.error('You do not have permission to access this page');
            navigate('/dashboard');
        }
    }, [isInitialized, hasAccess, user, navigate]);

    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tradesList, setTradesList] = useState([]);
    const [levelsList, setLevelsList] = useState([]);
    const [tradesData, setTradesData] = useState([]); // Full trade data with levels
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTrade, setFilterTrade] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const [sortField, setSortField] = useState('first_name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [studentStats, setStudentStats] = useState({ total: 0, active: 0, suspended: 0, left: 0, expelled: 0 });

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showConductModal, setShowConductModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showLinkParentModal, setShowLinkParentModal] = useState(false);
    const [showReinstateModal, setShowReinstateModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudentAction, setSelectedStudentAction] = useState(null);

    const [formData, setFormData] = useState({
        reg_number: '', first_name: '', last_name: '', gender: 'Male', dob: '',
        trade: '', level: '', contact_phone: '', contact_email: '',
        address_province: 'Kigali City', address_district: '', address_sector: '',
        guardian_name: '', guardian_phone: '', guardian_relation: '',
        student_type: 'private', academic_year_id: '',
        current_status: 'active', enrollment_date: ''
    });
    const [academicYears, setAcademicYears] = useState([]);
    const [editData, setEditData] = useState({});
    const [actionMessage, setActionMessage] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [conductForm, setConductForm] = useState({ points_deducted: 5, removal_reason: '', parent_notified: true });
    const [messageForm, setMessageForm] = useState({ message: '', notify_parent: true, notify_student: false });

    const [parents, setParents] = useState([]);
    const [linkedParents, setLinkedParents] = useState([]);
    const [selectedParentToLink, setSelectedParentToLink] = useState('');
    const [availableParents, setAvailableParents] = useState([]);
    const [loadingParents, setLoadingParents] = useState(false);

    const [studentGrades, setStudentGrades] = useState([]);
    const [gradesLoading, setGradesLoading] = useState(false);
    const [studentPayments, setStudentPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [studentDiscipline, setStudentDiscipline] = useState([]);
    const [disciplineLoading, setDisciplineLoading] = useState(false);

    const [saving, setSaving] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [conductLoading, setConductLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);

    // Attendance state
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [attendanceTrade, setAttendanceTrade] = useState('');
    const [attendanceLevel, setAttendanceLevel] = useState('');

    const TRADES = ['Software Development', 'Automobile Technology', 'Building and Construction'];
    const LEVELS = {
        'Software Development': ['Level 3', 'Level 4', 'Level 5'],
        'Automobile Technology': ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'],
        'Building and Construction': ['Level 3', 'Level 4', 'Level 5'],
    };
    const ALL_LEVELS = ['Level 3', 'Level 4', 'Level 5', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'];
    const STATUS_OPTIONS = [
        { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
        { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'left', label: 'Left', color: 'bg-gray-100 text-gray-800' },
        { value: 'expelled', label: 'Expelled', color: 'bg-red-100 text-red-800' },
        { value: 'sick', label: 'Sick', color: 'bg-orange-100 text-orange-800' }
    ];

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/students`, { headers: getHeaders(token) });
            console.log('Students API response:', res.data);
            // Handle both array response and paginated object response
            const studentsData = res.data.students || res.data;
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (err) {
            console.error('Error fetching students:', err.response || err);
            if (err.response?.status === 403) {
                toast.error('You do not have permission to view students');
            } else {
                toast.error(err.response?.data?.message || 'Failed to load students');
            }
            setStudents([]);
        }
        finally { setLoading(false); }
    }, [token]);

    const fetchStudentStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/students/stats`, { headers: getHeaders(token) });
            const stats = res.data;
            setStudentStats({
                total: stats.total || 0,
                active: stats.byStatus?.find(s => s.current_status === 'active')?.count || 0,
                suspended: stats.byStatus?.find(s => s.current_status === 'suspended')?.count || 0,
                left: stats.byStatus?.find(s => s.current_status === 'left')?.count || 0,
                expelled: stats.byStatus?.find(s => s.current_status === 'expelled')?.count || 0
            });
        } catch { }
    }, [token]);

    const fetchParents = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parents`, { headers: getHeaders(token) });
            setParents(res.data || []);
        } catch { }
    }, [token]);

    // Fetch trades and levels from API
    const fetchTradesAndLevels = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/trades`, { headers: getHeaders(token) });
            const tradesData = res.data || [];
            setTradesData(tradesData);
            setTradesList(tradesData.map(t => t.name));
            // Extract unique levels from all trades
            const allLevels = new Set();
            tradesData.forEach(t => {
                if (t.levels && Array.isArray(t.levels)) {
                    t.levels.forEach(l => allLevels.add(l));
                }
            });
            setLevelsList([...allLevels].sort());
        } catch (err) {
            console.error('Error fetching trades:', err);
            // Fallback to default values matching database format
            setTradesData([
                { name: 'Software Development', levels: ['Level 3', 'Level 4', 'Level 5'] },
                { name: 'Automobile Technology', levels: ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'] },
                { name: 'Building and Construction', levels: ['Level 3', 'Level 4', 'Level 5'] }
            ]);
            setTradesList(['Software Development', 'Automobile Technology', 'Building and Construction']);
            setLevelsList(['Level 3', 'Level 4', 'Level 5', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b']);
        }
    }, [token]);

    // Get levels for a specific trade
    const getLevelsForTrade = (tradeName) => {
        if (!tradeName) return [];
        const trade = tradesData.find(t => t.name === tradeName);
        return trade?.levels || [];
    };

    const fetchLinkedParents = useCallback(async (studentId) => {
        try {
            const res = await axios.get(`${API_URL}/api/parents/students/${studentId}/parents`, { headers: getHeaders(token) });
            setLinkedParents(res.data || []);
        } catch { setLinkedParents([]); }
    }, [token]);

    const fetchStudentGrades = useCallback(async (studentId) => {
        setGradesLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/grades?student_id=${studentId}`, { headers: getHeaders(token) });
            // Handle both array and object response
            const gradesData = res.data.grades || res.data;
            setStudentGrades(Array.isArray(gradesData) ? gradesData : []);
        } catch { setStudentGrades([]); }
        finally { setGradesLoading(false); }
    }, [token]);

    const fetchStudentPayments = useCallback(async (studentId) => {
        setPaymentsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/finance/student/${studentId}/payments`, { headers: getHeaders(token) });
            // Handle both array and object response
            const paymentsData = res.data.payments || res.data;
            setStudentPayments(Array.isArray(paymentsData) ? paymentsData : []);
        } catch { setStudentPayments([]); }
        finally { setPaymentsLoading(false); }
    }, [token]);

    const fetchStudentDiscipline = useCallback(async (studentId) => {
        setDisciplineLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/discipline?student_id=${studentId}`, { headers: getHeaders(token) });
            // Handle both array and object response
            const disciplineData = res.data.discipline || res.data;
            setStudentDiscipline(Array.isArray(disciplineData) ? disciplineData : []);
        } catch { setStudentDiscipline([]); }
        finally { setDisciplineLoading(false); }
    }, [token]);

    const fetchAttendanceOverview = useCallback(async () => {
        if (!attendanceTrade || !attendanceLevel || !attendanceDate) return;
        setLoadingAttendance(true);
        try {
            const res = await axios.get(`${API_URL}/api/attendance/overview?date=${attendanceDate}&trade=${encodeURIComponent(attendanceTrade)}&level=${encodeURIComponent(attendanceLevel)}`, { headers: getHeaders(token) });
            setAttendanceRecords(res.data.data.map(r => ({
                studentId: r.id,
                first_name: r.first_name,
                last_name: r.last_name,
                reg_number: r.reg_number,
                status: r.status || 'present',
                notes: r.notes || ''
            })));
        } catch (err) {
            toast.error('Failed to load attendance');
        } finally {
            setLoadingAttendance(false);
        }
    }, [attendanceTrade, attendanceLevel, attendanceDate, token]);

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/attendance/bulk`, {
                date: attendanceDate,
                attendanceData: attendanceRecords,
                recordedBy: user.id
            }, { headers: getHeaders(token) });
            toast.success('Attendance recorded and SMS notifications sent!');
            fetchAttendanceOverview();
        } catch (err) {
            toast.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const updateAttendanceStatus = (studentId, status) => {
        setAttendanceRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
    };

    const updateAttendanceNotes = (studentId, notes) => {
        setAttendanceRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, notes } : r));
    };

    const fetchAcademicYears = useCallback(async () => {
        try {
            const r = await axios.get(`${API_URL}/api/academic-years`, { headers: getHeaders(token) });
            setAcademicYears(r.data || []);
            const cur = (r.data || []).find(y => y.is_current);
            if (cur) setFormData(prev => ({ ...prev, academic_year_id: prev.academic_year_id || cur.id }));
        } catch (_) { /* non-admins lack access; silently ignore */ }
    }, [token]);

    useEffect(() => {
        if (isInitialized && hasAccess) {
            fetchStudents();
            fetchStudentStats();
            fetchParents();
            fetchTradesAndLevels();
            fetchAcademicYears();
        }
    }, [isInitialized, hasAccess, fetchStudents, fetchStudentStats, fetchParents, fetchTradesAndLevels, fetchAcademicYears]);

    const filteredStudents = useMemo(() => {
        if (!Array.isArray(students)) return [];
        let result = students.filter(s => {
            const matchSearch = !searchTerm ||
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.reg_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.contact_phone?.includes(searchTerm);
            const matchStatus = filterStatus === 'all' || s.current_status === filterStatus;
            const matchTrade = filterTrade === 'all' || s.trade === filterTrade;
            const matchLevel = filterLevel === 'all' || s.level === filterLevel;
            return matchSearch && matchStatus && matchTrade && matchLevel;
        });
        result.sort((a, b) => {
            const aVal = a[sortField] || '';
            const bVal = b[sortField] || '';
            const cmp = aVal.toString().localeCompare(bVal.toString());
            return sortOrder === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [students, searchTerm, filterStatus, filterTrade, filterLevel, sortField, sortOrder]);

    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * 20;
        return filteredStudents.slice(start, start + 20);
    }, [filteredStudents, currentPage]);

    const totalPages = Math.ceil(filteredStudents.length / 20);

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };

    const getStatusColor = (status) => {
        const opt = STATUS_OPTIONS.find(o => o.value === status);
        return opt ? opt.color : 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        const opt = STATUS_OPTIONS.find(o => o.value === status);
        return opt ? opt.label : status;
    };

    const getGradeColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
        if (percentage >= 60) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const studentData = {
                reg_number: formData.reg_number || undefined,
                first_name: formData.first_name,
                last_name: formData.last_name,
                gender: formData.gender.toLowerCase(),
                date_of_birth: formData.dob || null,
                trade: formData.trade,
                level: formData.level,
                contact_phone: formData.contact_phone,
                contact_email: formData.contact_email,
                address_province: formData.address_province,
                address_district: formData.address_district,
                address_sector: formData.address_sector,
                guardian_name: formData.guardian_name || null,
                guardian_phone: formData.guardian_phone || null,
                guardian_relation: formData.guardian_relation || null,
                student_type: formData.student_type || 'private',
                academic_year_id: formData.academic_year_id || undefined,
            };
            const res = await axios.post(`${API_URL}/api/students`, studentData, { headers: getHeaders(token) });
            toast.success(`Student added — Reg ${res.data.reg_number}`);
            setShowAddModal(false);
            setFormData({
                reg_number: '', first_name: '', last_name: '', gender: 'Male', dob: '',
                trade: '', level: '', contact_phone: '', contact_email: '',
                address_province: 'Kigali City', address_district: '', address_sector: '',
                guardian_name: '', guardian_phone: '', guardian_relation: '',
                student_type: 'private',
                academic_year_id: academicYears.find(y => y.is_current)?.id || '',
                current_status: 'active', enrollment_date: ''
            });
            fetchStudents();
            fetchStudentStats();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add student'); }
        finally { setSaving(false); }
    };

    const handleEditStudent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Transform edit data to match backend field names
            const studentData = {
                first_name: editData.first_name,
                last_name: editData.last_name,
                gender: editData.gender?.toLowerCase() || 'male',
                trade: editData.trade,
                level: editData.level,
                contact_phone: editData.contact_phone,
                contact_email: editData.contact_email,
                address_province: editData.address_province,
                address_district: editData.address_district,
                address_sector: editData.address_sector,
                student_type: editData.student_type
            };
            await axios.put(`${API_URL}/api/students/${selectedStudent.id}`, studentData, { headers: getHeaders(token) });
            toast.success('Student updated successfully!');
            setShowEditModal(false);
            fetchStudents();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update student'); }
        finally { setSaving(false); }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Are you sure? This action cannot be undone!')) return;
        try {
            await axios.delete(`${API_URL}/api/students/${id}`, { headers: getHeaders(token) });
            toast.success('Student deleted successfully!');
            fetchStudents();
            fetchStudentStats();
        } catch (err) { toast.error('Failed to delete student'); }
    };

    const handleStatusChange = async (e) => {
        e.preventDefault();
        setProcessingAction(true);
        try {
            await axios.put(`${API_URL}/api/students/${selectedStudentAction.id}/status`,
                { current_status: actionReason, reason: actionMessage }, { headers: getHeaders(token) });
            toast.success('Status changed successfully!');
            setShowStatusModal(false);
            setActionReason('');
            setActionMessage('');
            setSelectedStudentAction(null);
            fetchStudents();
            fetchStudentStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change status');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleConductRemoval = async (e) => {
        e.preventDefault();
        setConductLoading(true);
        try {
            await axios.post(`${API_URL}/api/discipline`,
                {
                    student_id: selectedStudent.id,
                    action_type: 'conduct_removal',
                    description: conductForm.removal_reason || 'Conduct violation recorded',
                    severity: 'medium',
                    points_deducted: conductForm.points_deducted,
                    removal_reason: conductForm.removal_reason,
                    parent_notified: conductForm.parent_notified
                }, { headers: getHeaders(token) });
            toast.success('Conduct points deducted! SMS notification sent.');
            setShowConductModal(false);
            setConductForm({ points_deducted: 10, removal_reason: '', parent_notified: true });
            fetchStudents();
            fetchStudentDiscipline(selectedStudent.id);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record conduct');
        } finally {
            setConductLoading(false);
        }
    };

    const handleLinkParent = async () => {
        if (!selectedParentToLink) return;
        try {
            // Check if selectedParentToLink contains underscore (format: parentId_studentName)
            const [parentId, studentName] = selectedParentToLink.split('_');
            await axios.post(`${API_URL}/api/parents/link`, { parent_id: parentId, student_id: selectedStudent.id, relationship: 'parent' }, { headers: getHeaders(token) });
            toast.success('Parent linked successfully!');
            setShowLinkParentModal(false);
            setSelectedParentToLink('');
            fetchLinkedParents(selectedStudent.id);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to link parent'); }
    };

    const fetchAvailableParentsForStudent = async (student) => {
        setLoadingParents(true);
        try {
            // Get parents from applications for this student's trade and level
            const res = await axios.get(`${API_URL}/api/parents/by-trade-level?trade=${encodeURIComponent(student.trade)}&level=${encodeURIComponent(student.level)}`, { headers: getHeaders(token) });
            const data = res.data;

            // Combine parents from applications and link requests
            const allParents = [];

            // Add parents from approved applications
            if (data.applications) {
                data.applications.forEach(app => {
                    if (app.parent_id) {
                        allParents.push({
                            id: app.parent_id,
                            parent_id: app.parent_id,
                            first_name: app.first_name,
                            last_name: app.parent_name?.split(' ').slice(1).join(' ') || '',
                            name: `${app.first_name} ${app.parent_name?.split(' ').slice(1).join(' ') || ''}`,
                            phone: app.phone,
                            source: 'application'
                        });
                    }
                });
            }

            // Add parents from pending link requests
            if (data.linkRequests) {
                data.linkRequests.forEach(req => {
                    if (req.parent_id && !allParents.find(p => p.parent_id === req.parent_id)) {
                        allParents.push({
                            id: req.parent_id,
                            parent_id: req.parent_id,
                            first_name: req.first_name,
                            last_name: req.last_name || '',
                            name: `${req.first_name} ${req.last_name || ''}`,
                            phone: req.phone,
                            source: 'request'
                        });
                    }
                });
            }

            setAvailableParents(allParents);
        } catch (err) {
            console.error('Error fetching available parents:', err);
            setAvailableParents([]);
        }
        finally { setLoadingParents(false); }
    };

    const handleOpenLinkParentModal = () => {
        fetchAvailableParentsForStudent(selectedStudent);
        setShowLinkParentModal(true);
    };

    const handleUnlinkParent = async (parentId) => {
        if (!window.confirm('Are you sure you want to unlink this parent?')) return;
        try {
            await axios.delete(`${API_URL}/api/parents/link/${parentId}/${selectedStudent.id}`, { headers: getHeaders(token) });
            toast.success('Parent unlinked successfully!');
            fetchLinkedParents(selectedStudent.id);
        } catch { toast.error('Failed to unlink parent'); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setMessageLoading(true);
        try {
            await axios.post(`${API_URL}/api/students/${selectedStudent.id}/notify-parents`,
                { message: messageForm.message, notify_parent: messageForm.notify_parent },
                { headers: getHeaders(token) }
            );
            toast.success('Message sent successfully!');
            setShowMessageModal(false);
            setMessageForm({ message: '', notify_parent: true, notify_student: false });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send message');
        } finally {
            setMessageLoading(false);
        }
    };

    const handleReinstate = async () => {
        if (!window.confirm('Are you sure you want to reinstate this student?')) return;
        setProcessingAction(true);
        try {
            await axios.post(`${API_URL}/api/students/${selectedStudent.id}/reinstate`,
                { reason: actionMessage },
                { headers: getHeaders(token) }
            );
            toast.success('Student reinstated successfully! SMS notification sent to parents.');
            setShowReinstateModal(false);
            setActionMessage('');
            fetchStudents();
            fetchStudentStats();
            setShowDetailsModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reinstate student');
        } finally {
            setProcessingAction(false);
        }
    };

    const openStudentDetails = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
        fetchLinkedParents(student.id);
        fetchStudentGrades(student.id);
        fetchStudentPayments(student.id);
        fetchStudentDiscipline(student.id);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF' }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!hasAccess && user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                                <Users className="text-primary-600" /> Students Management
                            </h1>
                            <p className="text-sm text-gray-500">Manage all students, grades, payments and communications</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { fetchStudents(); fetchStudentStats(); }} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <RefreshCw size={18} /> Refresh
                            </button>
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                                <Plus size={18} /> Add Student
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 border-b overflow-x-auto">
                        <button onClick={() => setActiveTab('students')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <Users size={16} className="inline mr-2" /> Students
                        </button>
                        <button onClick={() => setActiveTab('grades')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'grades' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <GradeIcon size={16} className="inline mr-2" /> Grades
                        </button>
                        {canManageFinance && (
                            <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Receipt size={16} className="inline mr-2" /> Payments
                            </button>
                        )}
                        <button onClick={() => setActiveTab('messages')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'messages' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <MessageIcon size={16} className="inline mr-2" /> Messages
                        </button>
                        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'attendance' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <ClipboardList size={16} className="inline mr-2" /> Attendance
                        </button>
                    </div>
                </div>
            </div>

            {/* Students Tab */}
            {activeTab === 'students' && (
                <>
                    {/* Stats */}
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-primary-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <Users className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{studentStats.total}</p>
                                        <p className="text-xs text-gray-500">Total</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <UserCheck className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{studentStats.active}</p>
                                        <p className="text-xs text-gray-500">Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="text-yellow-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{studentStats.suspended}</p>
                                        <p className="text-xs text-gray-500">Suspended</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <UserX className="text-gray-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{studentStats.left}</p>
                                        <p className="text-xs text-gray-500">Left</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <Ban className="text-red-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-800">{studentStats.expelled}</p>
                                        <p className="text-xs text-gray-500">Expelled</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="max-w-7xl mx-auto px-4 pb-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg">
                                    <option value="all">All Status</option>
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <select value={filterTrade} onChange={e => setFilterTrade(e.target.value)} className="px-4 py-2 border rounded-lg">
                                    <option value="all">All Trades</option>
                                    {tradesList.length > 0 ? tradesList.map(t => <option key={t} value={t}>{t}</option>) :
                                        TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="px-4 py-2 border rounded-lg">
                                    <option value="all">All Levels</option>
                                    {levelsList.length > 0 ? levelsList.map(l => <option key={l} value={l}>{l}</option>) :
                                        ALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="max-w-7xl mx-auto px-4 pb-8">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('reg_number')}>
                                                Reg # {sortField === 'reg_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('first_name')}>
                                                Name {sortField === 'first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trade</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Conduct</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {loading ? (
                                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                                <div className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" /> Loading...</div>
                                            </td></tr>
                                        ) : paginatedStudents.length === 0 ? (
                                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                                        ) : paginatedStudents.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-sm">{s.reg_number || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-800">{s.first_name} {s.last_name}</div>
                                                    <div className="text-sm text-gray-400">{s.contact_phone || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">{s.trade || '-'}</td>
                                                <td className="px-4 py-3 text-sm">{s.level || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(s.current_status)}`}>
                                                        {getStatusLabel(s.current_status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`font-bold ${s.conduct_points < 15 ? 'text-red-600' : s.conduct_points < 25 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {s.conduct_points || 40}/40
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openStudentDetails(s)} className="p-1 text-gray-400 hover:text-primary-600" title="View Details"><Eye size={18} /></button>
                                                        <button onClick={() => { setSelectedStudent(s); setEditData(s); setShowEditModal(true); }} className="p-1 text-gray-400 hover:text-blue-600" title="Edit"><Edit size={18} /></button>
                                                        {isAdmin && <button onClick={() => handleDeleteStudent(s.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={18} /></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="px-4 py-3 border-t flex items-center justify-between">
                                    <div className="text-sm text-gray-500">Page {currentPage} of {totalPages} ({filteredStudents.length} students)</div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Grades Tab */}
            {activeTab === 'grades' && (
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><GradeIcon className="text-primary-600" /> Student Grades Overview</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Subject</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Term</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Score</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {gradesLoading ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center"><RefreshCw className="animate-spin inline" /> Loading...</td></tr>
                                    ) : studentGrades.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No grades found. Select a student from the Students tab to view grades.</td></tr>
                                    ) : (
                                        studentGrades.map((g, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{g.first_name} {g.last_name}</td>
                                                <td className="px-4 py-3">{g.subject}</td>
                                                <td className="px-4 py-3">{g.term}</td>
                                                <td className="px-4 py-3">{g.score}/{g.max_score}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(g.score, g.max_score)}`}>
                                                        {Math.round((g.score / g.max_score) * 100)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">💡 Tip: Click on any student in the Students tab to view their detailed grades.</p>
                    </div>
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && canManageFinance && (
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Receipt className="text-primary-600" /> Student Payments Overview</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Method</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paymentsLoading ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center"><RefreshCw className="animate-spin inline" /> Loading...</td></tr>
                                    ) : studentPayments.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No payments found. Select a student from the Students tab to view payments.</td></tr>
                                    ) : (
                                        studentPayments.map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">{p.student_name || 'N/A'}</td>
                                                <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                                                <td className="px-4 py-3">{formatDate(p.payment_date)}</td>
                                                <td className="px-4 py-3 capitalize">{p.payment_method || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${p.payment_status === 'paid' || p.payment_status === 'completed' ? 'bg-green-100 text-green-800' : p.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                        {p.payment_status || 'pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">💡 Tip: Click on any student in the Students tab to view their payment history.</p>
                    </div>
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageIcon className="text-primary-600" /> Send Messages to Parents</h2>
                        <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="mb-4">Send SMS messages to parents about their children.</p>
                            <p className="text-sm">💡 Tip: Click on any student in the Students tab, then click "Send Message" to contact their parents.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="text-primary-600" /> Daily Attendance Marking</h2>
                            <div className="flex flex-wrap gap-2">
                                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                                <select value={attendanceTrade} onChange={e => { setAttendanceTrade(e.target.value); setAttendanceLevel(''); }} className="px-3 py-2 border rounded-lg text-sm">
                                    <option value="">Select Trade</option>
                                    {(tradesList.length > 0 ? tradesList : TRADES).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={attendanceLevel} onChange={e => setAttendanceLevel(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" disabled={!attendanceTrade}>
                                    <option value="">Select Level</option>
                                    {attendanceTrade && ((tradesData.length > 0 ? getLevelsForTrade(attendanceTrade) : (LEVELS[attendanceTrade] || LEVELS['Software Development']))).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <button onClick={fetchAttendanceOverview} disabled={!attendanceTrade || !attendanceLevel || loadingAttendance} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                                    {loadingAttendance ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />} Load Students
                                </button>
                            </div>
                        </div>

                        {attendanceRecords.length > 0 ? (
                            <>
                                <div className="overflow-x-auto mb-6 border rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Student Name</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3 text-left">Internal Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {attendanceRecords.map(r => (
                                                <tr key={r.studentId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-800">{r.first_name} {r.last_name}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{r.reg_number}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-center gap-1">
                                                            {['present', 'absent', 'late', 'excused'].map(status => (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    onClick={() => updateAttendanceStatus(r.studentId, status)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${r.status === status ? 
                                                                        (status === 'present' ? 'bg-green-500 text-white shadow-md' : 
                                                                         status === 'absent' ? 'bg-red-500 text-white shadow-md' : 
                                                                         status === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-blue-500 text-white shadow-md') : 
                                                                        'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            type="text" 
                                                            value={r.notes} 
                                                            onChange={e => updateAttendanceNotes(r.studentId, e.target.value)}
                                                            placeholder="Optional notes..."
                                                            className="w-full px-3 py-1.5 border border-gray-100 rounded-lg text-sm bg-gray-50/50"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-primary-50 rounded-xl border border-primary-100 shadow-inner">
                                    <div className="flex items-center gap-2 text-primary-700">
                                        <Bell size={18} />
                                        <p className="text-xs font-medium italic">⚠️ SMS notifications will be automatically sent to parents for students marked as <span className="font-bold underline">Absent</span> or <span className="font-bold underline">Late</span>.</p>
                                    </div>
                                    <button onClick={handleSaveAttendance} disabled={saving} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-black text-sm hover:bg-primary-700 shadow-lg disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all">
                                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Save & Send Notifications
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                                <ClipboardList className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                                <p className="text-gray-500 font-medium">Select a trade, level, and date to start marking attendance.</p>
                                <p className="text-xs text-gray-400 mt-2">Only "Absent" and "Late" statuses trigger SMS notifications.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">Add New Student</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">First Name *</label><input required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Last Name *</label><input required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option>Male</option><option>Female</option></select></div>
                                <div><label className="block text-sm font-medium mb-1">Date of Birth</label><input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Trade *</label><select required value={formData.trade} onChange={e => setFormData({ ...formData, trade: e.target.value, level: '' })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Trade</option>{(tradesList.length > 0 ? tradesList : TRADES).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label className="block text-sm font-medium mb-1">Level *</label><select required value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={!formData.trade}><option value="">{formData.trade ? 'Select Level' : 'Select Trade First'}</option>{formData.trade && ((tradesData.length > 0 ? getLevelsForTrade(formData.trade) : (LEVELS[formData.trade] || LEVELS['Software Development']))).map(l => <option key={l}>{l}</option>)}</select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Phone</label><input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Province</label><input value={formData.address_province} onChange={e => setFormData({ ...formData, address_province: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">District</label><input value={formData.address_district} onChange={e => setFormData({ ...formData, address_district: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Sector</label><input value={formData.address_sector} onChange={e => setFormData({ ...formData, address_sector: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>

                            <div className="border-t pt-3">
                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Enrollment</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Student Type *</label>
                                        <select required value={formData.student_type}
                                            onChange={e => setFormData({ ...formData, student_type: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg">
                                            <option value="private">Private</option>
                                            <option value="government">Government</option>
                                            <option value="bursary">Bursary</option>
                                            <option value="sponsored">Sponsored</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Academic Year</label>
                                        <select value={formData.academic_year_id}
                                            onChange={e => setFormData({ ...formData, academic_year_id: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg">
                                            <option value="">— current —</option>
                                            {academicYears.map(y => (
                                                <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' ★' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reg Number</label>
                                        <input placeholder="auto-generate niba ureka ubusa"
                                            value={formData.reg_number}
                                            onChange={e => setFormData({ ...formData, reg_number: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Guardian (option)</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-medium mb-1">Name</label><input value={formData.guardian_name} onChange={e => setFormData({ ...formData, guardian_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div><label className="block text-sm font-medium mb-1">Phone</label><input value={formData.guardian_phone} onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                    <div><label className="block text-sm font-medium mb-1">Relation</label><input placeholder="Father / Mother / Guardian" value={formData.guardian_relation} onChange={e => setFormData({ ...formData, guardian_relation: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Student'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Edit Student</h2>
                            <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">First Name</label><input required value={editData.first_name || ''} onChange={e => setEditData({ ...editData, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Last Name</label><input required value={editData.last_name || ''} onChange={e => setEditData({ ...editData, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Trade</label><select required value={editData.trade || ''} onChange={e => setEditData({ ...editData, trade: e.target.value, level: '' })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Trade</option>{(tradesList.length > 0 ? tradesList : TRADES).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label className="block text-sm font-medium mb-1">Level</label><select required value={editData.level || ''} onChange={e => setEditData({ ...editData, level: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={!editData.trade}><option value="">{editData.trade ? 'Select Level' : 'Select Trade First'}</option>{editData.trade && ((tradesData.length > 0 ? getLevelsForTrade(editData.trade) : (LEVELS[editData.trade] || LEVELS['Software Development']))).map(l => <option key={l}>{l}</option>)}</select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1">Phone</label><input value={editData.contact_phone || ''} onChange={e => setEditData({ ...editData, contact_phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                                <div><label className="block text-sm font-medium mb-1">Email</label><input value={editData.contact_email || ''} onChange={e => setEditData({ ...editData, contact_email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {showDetailsModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">Student Details</h2>
                            <button onClick={() => setShowDetailsModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start gap-6 mb-6">
                                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                                    <span className="text-3xl font-black text-primary-600">{selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                                    <p className="text-gray-500 font-mono">{selectedStudent.reg_number || 'No Reg Number'}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedStudent.current_status)}`}>
                                            {getStatusLabel(selectedStudent.current_status)}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedStudent.conduct_points < 15 ? 'bg-red-100 text-red-700' : selectedStudent.conduct_points < 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                            Conduct: {selectedStudent.conduct_points || 40}/40
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><GraduationCap size={18} /> Academic Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Trade:</span><span className="font-medium">{selectedStudent.trade || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Level:</span><span className="font-medium">{selectedStudent.level || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Gender:</span><span className="font-medium capitalize">{selectedStudent.gender || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">DOB:</span><span className="font-medium">{selectedStudent.dob ? formatDate(selectedStudent.dob) : '-'}</span></div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Phone size={18} /> Contact Info</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{selectedStudent.contact_phone || '-'}</div>
                                        <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{selectedStudent.contact_email || '-'}</div>
                                        <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{selectedStudent.address_district || '-'}, {selectedStudent.address_sector || ''}</div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Payment Status</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Total Fees:</span><span className="font-medium">{formatCurrency(selectedStudent.total_fees)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Paid:</span><span className="font-medium text-green-600">{formatCurrency(selectedStudent.total_paid)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Balance:</span><span className="font-medium text-red-600">{formatCurrency(selectedStudent.balance)}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Parents Section */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18} /> Linked Parents</h4>
                                    <button onClick={handleOpenLinkParentModal} className="text-sm text-primary-600 font-medium flex items-center gap-1"><Plus size={16} /> Add Parent</button>
                                </div>
                                {linkedParents.length === 0 ? <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded">No parents linked</p> : (
                                    <div className="space-y-2">
                                        {linkedParents.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div><p className="font-medium">{p.first_name} {p.last_name}</p><p className="text-sm text-gray-500">{p.phone}</p></div>
                                                <button onClick={() => handleUnlinkParent(p.id)} className="text-red-500 text-sm hover:underline">Unlink</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button onClick={() => { setSelectedStudentAction(selectedStudent); setShowStatusModal(true); }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-200"><RefreshCw size={14} /> Change Status</button>
                                {canManageConduct && (
                                    <button onClick={() => setShowConductModal(true)} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-1 border border-red-200 hover:bg-red-100"><Shield size={14} /> Conduct Points</button>
                                )}
                                {(selectedStudent.current_status === 'suspended' || selectedStudent.current_status === 'expelled') && canManageConduct && (
                                    <button onClick={() => setShowReinstateModal(true)} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-1 border border-green-200 hover:bg-green-100"><CheckCircle size={14} /> Reinstate</button>
                                )}
                                <button onClick={() => setShowMessageModal(true)} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-1 border border-blue-200 hover:bg-blue-100"><MessageSquare size={14} /> Send Message</button>
                                <button onClick={() => { setSelectedStudentAction(selectedStudent); setShowLeaveModal(true); }} className="px-3 py-2 bg-gray-100 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-200"><Plane size={14} /> On Leave</button>
                            </div>

                            {/* Grades Summary */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><GradeIcon size={18} /> Recent Grades</h4>
                                {gradesLoading ? <p className="text-sm text-gray-500"><RefreshCw className="animate-spin inline" /> Loading...</p> : studentGrades.length === 0 ? (
                                    <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded">No grades recorded yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Subject</th>
                                                    <th className="px-3 py-2 text-left">Term</th>
                                                    <th className="px-3 py-2 text-left">Score</th>
                                                    <th className="px-3 py-2 text-left">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {studentGrades.slice(0, 5).map((g, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2">{g.subject}</td>
                                                        <td className="px-3 py-2">{g.term}</td>
                                                        <td className="px-3 py-2">{g.score}/{g.max_score}</td>
                                                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${getGradeColor(g.score, g.max_score)}`}>{Math.round((g.score / g.max_score) * 100)}%</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payments Summary */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Receipt size={18} /> Recent Payments</h4>
                                {paymentsLoading ? <p className="text-sm text-gray-500"><RefreshCw className="animate-spin inline" /> Loading...</p> : studentPayments.length === 0 ? (
                                    <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded">No payments recorded yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Date</th>
                                                    <th className="px-3 py-2 text-left">Amount</th>
                                                    <th className="px-3 py-2 text-left">Method</th>
                                                    <th className="px-3 py-2 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {studentPayments.slice(0, 5).map((p, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2">{formatDate(p.payment_date)}</td>
                                                        <td className="px-3 py-2 font-medium">{formatCurrency(p.amount)}</td>
                                                        <td className="px-3 py-2 capitalize">{p.payment_method || '-'}</td>
                                                        <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${p.payment_status === 'paid' || p.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.payment_status || 'pending'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Discipline History */}
                            {canManageConduct && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Shield size={18} /> Discipline History</h4>
                                    {disciplineLoading ? <p className="text-sm text-gray-500"><RefreshCw className="animate-spin inline" /> Loading...</p> : studentDiscipline.length === 0 ? (
                                        <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded">No discipline records</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {studentDiscipline.slice(0, 5).map((d, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                                    <div>
                                                        <p className="font-medium text-red-800">{d.action_type}</p>
                                                        <p className="text-sm text-gray-500">{d.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-red-600">-{d.points_deducted} pts</p>
                                                        <p className="text-xs text-gray-500">{formatDate(d.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">Change Student Status</h3>
                        </div>
                        <form onSubmit={handleStatusChange} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">New Status</label>
                                <select value={actionReason} onChange={e => setActionReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                                    <option value="">Select status...</option>
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Reason</label>
                                <textarea value={actionMessage} onChange={e => setActionMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter reason..."></textarea>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowStatusModal(false); setActionReason(''); setActionMessage(''); }} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={processingAction} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50">{processingAction ? 'Processing...' : 'Confirm'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Conduct Modal */}
            {showConductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Shield className="text-red-600" size={24} /> Deduct Conduct Points
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">Student: <span className="font-bold text-gray-800">{selectedStudent?.first_name} {selectedStudent?.last_name}</span></p>
                            <p className="text-gray-500 text-sm">Current Points: <span className={`font-bold ${selectedStudent?.conduct_points < 50 ? 'text-red-600' : selectedStudent?.conduct_points < 80 ? 'text-yellow-600' : 'text-green-600'}`}>{selectedStudent?.conduct_points || 100}/100</span></p>
                        </div>
                        <form onSubmit={handleConductRemoval} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Points to Deduct</label>
                                    <input type="number" min="1" max={selectedStudent?.conduct_points || 100} value={conductForm.points_deducted} onChange={(e) => setConductForm({ ...conductForm, points_deducted: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason</label>
                                    <textarea value={conductForm.removal_reason} onChange={(e) => setConductForm({ ...conductForm, removal_reason: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" placeholder="Enter reason..."></textarea>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="parentNotified" checked={conductForm.parent_notified} onChange={(e) => setConductForm({ ...conductForm, parent_notified: e.target.checked })} className="w-4 h-4 text-red-600 rounded" />
                                    <label htmlFor="parentNotified" className="text-sm text-gray-700">Send SMS notification to parent</label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => { setShowConductModal(false); setConductForm({ points_deducted: 10, removal_reason: '', parent_notified: true }); }} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold">Cancel</button>
                                <button type="submit" disabled={conductLoading} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {conductLoading ? <RefreshCw className="animate-spin" size={18} /> : <Shield size={18} />} Deduct Points
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">Student Leave</h3>
                        </div>
                        <form onSubmit={async (e) => { e.preventDefault(); setProcessingAction(true); try { await axios.post(`${API_URL}/api/discipline/leaves`, { student_id: selectedStudentAction.id, leave_type: 'personal', start_date: new Date(), end_date: actionReason, reason: actionMessage }, { headers: getHeaders(token) }); toast.success('Leave recorded!'); setShowLeaveModal(false); } catch { toast.error('Error'); } finally { setProcessingAction(false); } }} className="p-6">
                            <div className="mb-4"><label className="block text-sm font-medium mb-2">Return Date</label><input type="date" value={actionReason} onChange={e => setActionReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required /></div>
                            <div className="mb-4"><label className="block text-sm font-medium mb-2">Reason</label><textarea value={actionMessage} onChange={e => setActionMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
                            <div className="flex gap-3"><button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button type="submit" disabled={processingAction} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg">{processingAction ? 'Saving...' : 'Save'}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reinstate Modal */}
            {showReinstateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-green-100 bg-green-50">
                            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2"><CheckCircle /> Reinstate Student</h3>
                            <p className="text-sm text-gray-600 mt-1">Student: <span className="font-medium">{selectedStudent?.first_name} {selectedStudent?.last_name}</span></p>
                            <p className="text-xs text-gray-500">Current Status: <span className="font-medium text-red-600">{getStatusLabel(selectedStudent?.current_status)}</span></p>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Reinstatement Reason (optional)</label>
                                <textarea value={actionMessage} onChange={e => setActionMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter reason for reinstatement..."></textarea>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">This will change the student's status back to Active and notify their parents via SMS.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowReinstateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                <button onClick={handleReinstate} disabled={processingAction} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {processingAction ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />} Reinstate Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Parent Modal */}
            {showLinkParentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">Link Parent to Student</h3>
                            <p className="text-sm text-gray-500">Student: {selectedStudent?.first_name} {selectedStudent?.last_name}</p>
                            <p className="text-xs text-gray-400">Trade: {selectedStudent?.trade} - {selectedStudent?.level}</p>
                        </div>
                        <div className="p-6">
                            {loadingParents ? (
                                <div className="text-center py-4"><RefreshCw className="animate-spin inline" /> Loading parents from applications...</div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">Select Parent (from applications)</label>
                                        {availableParents.length > 0 ? (
                                            <select value={selectedParentToLink} onChange={e => setSelectedParentToLink(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                                                <option value="">Select parent...</option>
                                                {availableParents.map(p => (
                                                    <option key={p.parent_id} value={p.parent_id}>
                                                        {p.first_name} {p.last_name} - {p.phone} ({p.source === 'application' ? 'Applied' : 'Pending Request'})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">No parents found from applications for this trade/level</p>
                                        )}
                                    </div>
                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-sm text-gray-600 mb-2">Or link any parent manually:</p>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium mb-2">Search by phone</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter phone number..."
                                                    className="flex-1 px-3 py-2 border rounded-lg"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const phone = e.target.value;
                                                            try {
                                                                const res = await axios.get(`${API_URL}/api/parents/find?phone=${phone}`, { headers: getHeaders(token) });
                                                                if (res.data) {
                                                                    setSelectedParentToLink(res.data.id);
                                                                    toast.success('Parent found!');
                                                                }
                                                            } catch { toast.error('Parent not found'); }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => { setShowLinkParentModal(false); setAvailableParents([]); }} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                        <button onClick={handleLinkParent} disabled={!selectedParentToLink} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50">Link</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="text-blue-600" /> Send Message to Parents</h3>
                            <p className="text-sm text-gray-500 mt-1">Student: <span className="font-medium">{selectedStudent?.first_name} {selectedStudent?.last_name}</span></p>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Message</label>
                                <textarea value={messageForm.message} onChange={e => setMessageForm({ ...messageForm, message: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter your message..." required></textarea>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <input type="checkbox" id="notifyParent" checked={messageForm.notify_parent} onChange={(e) => setMessageForm({ ...messageForm, notify_parent: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="notifyParent" className="text-sm text-gray-700">Send to parent</label>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowMessageModal(false); setMessageForm({ message: '', notify_parent: true, notify_student: false }); }} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" disabled={messageLoading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {messageLoading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />} Send SMS
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Students;

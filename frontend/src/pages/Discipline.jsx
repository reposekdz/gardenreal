import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Plus, Search, Filter, Download, AlertTriangle, CheckCircle, XCircle,
    Calendar, Clock, User, BookOpen, TrendingUp, FileText, MessageSquare,
    Send, Bell, ChevronDown, X, Eye, Edit, Trash2, RefreshCw, PlusCircle,
    Users, Briefcase, Plane, Home, Phone, Mail, MapPin, Award, MinusCircle,
    ExternalLink, Paperclip, Upload as UploadIcon, Image as ImageIconLucide,
    File as FileIconLucide, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const DISCIPLINE_ACTIONS = [
    'Warning', 'Suspended', 'Expelled', 'Detention', 'Community Service',
    'Counseling', 'Parent Meeting', 'Suspension', 'Behavioral Contract'
];

const LEAVE_TYPES = ['sick', 'personal', 'emergency', 'bereavement', 'academic', 'other'];

const Discipline = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const headers = { Authorization: `Bearer ${token}` };
    const isDod = user.role === 'dod' || user.role === 'admin' || user.role === 'director_of_discipline';
    const isTeacher = user.role === 'teacher';

    // State
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('records');

    // Modals
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [showSMSModal, setShowSMSModal] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Forms
    const [recordForm, setRecordForm] = useState({
        student_id: '', action_type: '', description: '', points_deducted: '', incident_date: ''
    });
    const [evidenceFiles, setEvidenceFiles] = useState([]); // {url, name, size, type}
    const [evidenceUploading, setEvidenceUploading] = useState(false);

    // Add Record filters - for selecting class/filtering students
    const [recordFilters, setRecordFilters] = useState({ trade: '', level: '' });
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectAllStudents, setSelectAllStudents] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);

    // SMS filters and state
    const [smsMode, setSmsMode] = useState('single'); // 'single' or 'broadcast'
    const [smsSearch, setSmsSearch] = useState('');
    const [smsFilters, setSmsFilters] = useState({ trade: '', level: '', gender: '' });
    const [filteredParents, setFilteredParents] = useState([]);
    const [smsLoading, setSmsLoading] = useState(false);
    const [broadcastResults, setBroadcastResults] = useState(null);

    const [trades, setTrades] = useState([]);
    const [levels, setLevels] = useState([]);

    const [leaveForm, setLeaveForm] = useState({
        leave_type: '', start_date: '', end_date: '', reason: '', student_id: '',
        start_time: '', end_time: '', lesson: ''
    });

    const [smsForm, setSMSForm] = useState({
        parent_id: '', student_id: '', message: '', reminder_type: 'general'
    });

    const [parents, setParents] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [appeals, setAppeals] = useState([]);

    // Conduct Sheet state
    const [conductSheet, setConductSheet] = useState([]);
    const [conductStats, setConductStats] = useState(null);
    const [conductFilters, setConductFilters] = useState({ trade: '', level: '', status: '', search: '' });
    const [clearingConduct, setClearingConduct] = useState(null);

    // Fetch data
    useEffect(() => {
        fetchRecords();
        fetchStudents();
        fetchStats();
        if (isDod) {
            fetchLeaveRequests();
            fetchAppeals();
            fetchParents();
            fetchFiltersData();
            fetchConductSheet();
        }
    }, []);

    const fetchConductSheet = async () => {
        try {
            const params = new URLSearchParams();
            if (conductFilters.trade) params.append('trade', conductFilters.trade);
            if (conductFilters.level) params.append('level', conductFilters.level);
            if (conductFilters.status) params.append('status', conductFilters.status);
            if (conductFilters.search) params.append('search', conductFilters.search);

            const res = await axios.get(`${API_URL}/api/discipline/conduct-sheet?${params}`, { headers });
            setConductSheet(res.data.students);
            setConductStats(res.data.summary);
        } catch (err) {
            console.error('Failed to fetch conduct sheet:', err);
        }
    };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType) params.append('action_type', filterType);
            if (filterStatus) params.append('status', filterStatus);

            const res = await axios.get(`${API_URL}/api/discipline?${params}`, { headers });
            setRecords(res.data);
        } catch { toast.error('Habaye ikibazo'); }
        finally { setLoading(false); }
    };

    // Delete discipline record
    const deleteRecord = async (id) => {
        if (!window.confirm('Wereka guhagarika iri ryampaye?..')) return;
        try {
            await axios.delete(`${API_URL}/api/discipline/${id}`, { headers });
            toast.success('Icyifuzo cyasibwe');
            fetchRecords();
        } catch (err) { toast.error('Habaye ikibazo'); }
    };

    // Clear conduct records for a student (DOD function)
    const clearStudentConduct = async (studentId, clearType = 'all') => {
        if (!window.confirm(`Urashaka guhagarika${clearType === 'all' ? '' : ' actives'} ibibazo by'uburebure by'uyu mwana?`)) return;
        try {
            setClearingConduct(studentId);
            await axios.delete(`${API_URL}/api/discipline/clear/${studentId}`,
                { headers, data: { clear_type: clearType } });
            toast.success('Ibibazo by uburebure byasibwe');
            fetchConductSheet();
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo');
        } finally {
            setClearingConduct(null);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/students?status=active`, { headers });
            setStudents(res.data);
        } catch { setStudents([]); }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/discipline/stats`, { headers });
            setStats(res.data);
        } catch { setStats(null); }
    };

    const fetchLeaveRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/discipline/leaves`, { headers });
            setLeaveRequests(res.data);
        } catch { setLeaveRequests([]); }
    };

    const fetchAppeals = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/discipline/appeals`, { headers });
            setAppeals(res.data);
        } catch { setAppeals([]); }
    };

    const fetchParents = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parents`, { headers });
            setParents(res.data);
        } catch { setParents([]); }
    };

    // Fetch trades and levels for filters
    const fetchFiltersData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/sms/filters-data`, { headers });
            setTrades(res.data.trades || []);
            setLevels(res.data.levels || []);
        } catch {
            setTrades([]);
            setLevels([]);
        }
    };

    // Fetch filtered students for discipline record
    const fetchFilteredStudents = async (trade, level) => {
        try {
            const params = new URLSearchParams();
            if (trade) params.append('trade', trade);
            if (level) params.append('level', level);
            const res = await axios.get(`${API_URL}/api/sms/students-for-discipline?${params}`, { headers });
            setFilteredStudents(res.data);
        } catch { setFilteredStudents([]); }
    };

    // Fetch filtered parents for SMS
    const fetchFilteredParents = async (search, trade, level) => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (trade) params.append('trade', trade);
            if (level) params.append('level', level);
            const res = await axios.get(`${API_URL}/api/sms/parents?${params}`, { headers });
            setFilteredParents(res.data);
        } catch { setFilteredParents([]); }
    };

    // Submit discipline record (handles single or multiple students)
    const handleRecordSubmit = async (e) => {
        e.preventDefault();
        try {
            const studentsToProcess = selectAllStudents ? filteredStudents : [students.find(s => s.id === parseInt(recordForm.student_id))].filter(Boolean);

            if (studentsToProcess.length === 0) {
                toast.error('Hitamo umunyeshuri');
                return;
            }

            // Create records for each student
            for (const student of studentsToProcess) {
                await axios.post(`${API_URL}/api/discipline`, {
                    student_id: student.id,
                    action_type: recordForm.action_type,
                    description: recordForm.description,
                    points_deducted: recordForm.points_deducted,
                    incident_date: recordForm.incident_date,
                    evidence_files: evidenceFiles
                }, { headers });
            }

            toast.success(`Icyifuzo cyatangiye kuri ${studentsToProcess.length} ${studentsToProcess.length === 1 ? 'umunyeshuri' : 'abahutu'}`);
            setShowRecordModal(false);
            setRecordForm({ student_id: '', action_type: '', description: '', points_deducted: '', incident_date: '' });
            setEvidenceFiles([]);
            setRecordFilters({ trade: '', level: '' });
            setFilteredStudents([]);
            setSelectAllStudents(false);
            setSelectedStudents([]);
            fetchRecords();
            fetchStats();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
    };

    // Submit leave request
    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/discipline/leaves`, leaveForm, { headers });
            toast.success('Icyifuzo cyatumijwe');
            setShowLeaveModal(false);
            setLeaveForm({ leave_type: '', start_date: '', end_date: '', reason: '', student_id: '', start_time: '', end_time: '', lesson: '' });
            fetchLeaveRequests();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
    };

    // Approve/reject leave
    const handleLeaveReview = async (id, status) => {
        try {
            await axios.put(`${API_URL}/api/discipline/leaves/${id}`,
                { status, review_notes: '' }, { headers });
            toast.success(`Icyifuzo ${status === 'approved' ? 'byemejwe' : 'byangijwe'}`);
            fetchLeaveRequests();
        } catch (err) { toast.error('Habaye ikibazo'); }
    };

    // Mark a leave as returned — auto-records timestamp + sends SMS to parents
    const handleMarkReturned = async (id) => {
        const note = window.prompt('Optional note about the return (e.g. "back on time, no issues"):', '');
        if (note === null) return; // cancelled
        try {
            const res = await axios.put(`${API_URL}/api/discipline/leaves/${id}/return`,
                { return_notes: note }, { headers });
            toast.success(res.data?.message || 'Marked as returned & parents notified');
            fetchLeaveRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to mark returned');
        }
    };

    // Submit appeal decision
    const handleAppealDecision = async (id, status) => {
        try {
            await axios.put(`${API_URL}/api/discipline/appeals/${id}`,
                { status, decision_notes: '' }, { headers });
            toast.success(`Igikomerego ${status === 'accepted' ? 'byemejwe' : 'byangijwe'}`);
            fetchAppeals();
            fetchRecords();
        } catch (err) { toast.error('Habaye ikibazo'); }
    };

    // Send SMS (single or broadcast) - using new discipline broadcast endpoint
    const handleSendSMS = async (e) => {
        e.preventDefault();
        try {
            setSmsLoading(true);

            if (smsMode === 'broadcast') {
                // Broadcast to all parents with filters - use new endpoint
                const res = await axios.post(`${API_URL}/api/discipline/broadcast/sms`, {
                    message: smsForm.message,
                    recipient_type: 'linked', // linked parents only
                    trade: smsFilters.trade,
                    level: smsFilters.level,
                    gender: smsFilters.gender
                }, { headers });

                toast.success(res.data.message || `SMS sent to ${res.data.sent_count || 0} recipients`);
                setBroadcastResults(res.data);
            } else {
                // Single SMS - use existing endpoint
                await axios.post(`${API_URL}/api/sms/send`, smsForm, { headers });
                toast.success('SMS yoherejwe!');
            }

            setShowSMSModal(false);
            setSMSForm({ parent_id: '', student_id: '', message: '', reminder_type: 'general' });
            setSmsMode('single');
            setSmsSearch('');
            setSmsFilters({ trade: '', level: '', gender: '' });
            setBroadcastResults(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'SMS yanze');
        } finally {
            setSmsLoading(false);
        }
    };

    const filteredRecords = records.filter(r =>
        searchTerm === '' ||
        r.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reg_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingAppeals = appeals.filter(a => a.status === 'pending');
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <Shield className="text-primary-600" />
                        {isDod ? 'Director of Discipline' : 'Discipline Management'}
                    </h1>
                    <p className="text-gray-500">
                        {isDod ? 'Manage discipline, leaves, and parent communications' : 'Track student behavior records'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchRecords} className="btn-secondary flex items-center gap-2">
                        <RefreshCw size={18} /> Refresh
                    </button>
                    {!isTeacher && (
                        <button onClick={() => setShowRecordModal(true)} className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Add Record
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{stats?.total_records || 0}</p>
                            <p className="text-xs text-gray-500">Total Records</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{stats?.last_30_days || 0}</p>
                            <p className="text-xs text-gray-500">Last 30 Days</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{pendingAppeals.length}</p>
                            <p className="text-xs text-gray-500">Pending Appeals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Plane size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{pendingLeaves.length}</p>
                            <p className="text-xs text-gray-500">Leave Requests</p>
                        </div>
                    </div>
                </div>
                {isDod && (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Phone size={20} className="text-green-600" />
                            </div>
                            <div>
                                <button onClick={() => setShowSMSModal(true)} className="text-sm font-bold text-primary-600 hover:underline">
                                    Send SMS
                                </button>
                                <p className="text-xs text-gray-500">Contact Parents</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                <button
                    onClick={() => navigate('/students')}
                    className="px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg"
                >
                    <Users size={16} />
                    Manage Students
                </button>
                {[
                    { id: 'records', label: 'Discipline Records', count: records.length },
                    ...(isDod ? [
                        { id: 'conduct', label: 'Conduct Sheet', icon: FileText },
                        { id: 'leaves', label: 'Leave Requests', count: pendingLeaves.length },
                        { id: 'appeals', label: 'Appeals', count: pendingAppeals.length }
                    ] : [])
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {tab.icon && <tab.icon size={16} />}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Filters */}
            {activeTab === 'records' && (
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                        <select value={filterType} onChange={e => { setFilterType(e.target.value); fetchRecords(); }} className="input">
                            <option value="">All Actions</option>
                            {DISCIPLINE_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchRecords(); }} className="input">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="appealed">Appealed</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Records Table */}
            {activeTab === 'records' && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-4 py-12 text-center"><RefreshCw className="animate-spin mx-auto" /></td></tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400"><Shield size={48} className="mx-auto mb-2 opacity-20" />No records</td></tr>
                                ) : filteredRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-bold">{record.first_name} {record.last_name}</p>
                                                <p className="text-xs text-gray-400">{record.reg_number} • {record.trade}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${record.action_type === 'Expelled' ? 'bg-red-100 text-red-700' :
                                                record.action_type === 'Suspended' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {record.action_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm max-w-xs truncate">{record.description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(record.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${record.status === 'appealed' ? 'bg-purple-100 text-purple-700' :
                                                record.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {record.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => deleteRecord(record.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Global Conduct Sheet Tab */}
            {activeTab === 'conduct' && isDod && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    {conductStats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-green-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-green-700">{conductStats.good_conduct}</p>
                                <p className="text-xs text-green-600">Good Conduct</p>
                            </div>
                            <div className="bg-yellow-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-yellow-700">{conductStats.monitoring}</p>
                                <p className="text-xs text-yellow-600">Monitoring</p>
                            </div>
                            <div className="bg-orange-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-orange-700">{conductStats.warning}</p>
                                <p className="text-xs text-orange-600">Warning</p>
                            </div>
                            <div className="bg-red-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-red-700">{conductStats.suspended}</p>
                                <p className="text-xs text-red-600">Suspended</p>
                            </div>
                            <div className="bg-blue-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-blue-700">{conductStats.total_students}</p>
                                <p className="text-xs text-blue-600">Total Students</p>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    value={conductFilters.search}
                                    onChange={e => setConductFilters({ ...conductFilters, search: e.target.value })}
                                    className="input pl-10"
                                />
                            </div>
                            <select
                                value={conductFilters.trade}
                                onChange={e => { setConductFilters({ ...conductFilters, trade: e.target.value }); fetchConductSheet(); }}
                                className="input"
                            >
                                <option value="">All Trades</option>
                                {trades.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select
                                value={conductFilters.level}
                                onChange={e => { setConductFilters({ ...conductFilters, level: e.target.value }); fetchConductSheet(); }}
                                className="input"
                            >
                                <option value="">All Levels</option>
                                {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <select
                                value={conductFilters.status}
                                onChange={e => { setConductFilters({ ...conductFilters, status: e.target.value }); fetchConductSheet(); }}
                                className="input"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="sick">Sick</option>
                            </select>
                        </div>
                    </div>

                    {/* Conduct Sheet Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trade/Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Incidents</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Active</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Suspensions</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Conduct Status</th>
                                        {isDod && <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {conductSheet.length === 0 ? (
                                        <tr><td colSpan={isDod ? 7 : 6} className="px-4 py-12 text-center text-gray-400">No students found</td></tr>
                                    ) : conductSheet.map(student => (
                                        <tr key={student.student_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                                                <p className="text-xs text-gray-400">{student.reg_number}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm">{student.trade}</p>
                                                <p className="text-xs text-gray-400">{student.level}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-bold">{student.total_incidents || 0}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${student.active_incidents > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {student.active_incidents || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${student.suspension_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {student.suspension_count || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.conduct_color === 'green' ? 'bg-green-100 text-green-700' :
                                                    student.conduct_color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                        student.conduct_color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.conduct_status}
                                                </span>
                                            </td>
                                            {isDod && (
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => clearStudentConduct(student.student_id, 'all')}
                                                        disabled={clearingConduct === student.student_id}
                                                        className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                                                    >
                                                        {clearingConduct === student.student_id ? '...' : 'Clear Conduct'}
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Requests Tab */}
            {activeTab === 'leaves' && isDod && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Leave & Sick Requests</h3>
                        <button
                            onClick={() => setShowLeaveModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
                        >
                            <Plane size={16} /> New Leave Request
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Requester</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Dates</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lesson</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Days</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaveRequests.length === 0 ? (
                                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400"><Plane size={48} className="mx-auto mb-2 opacity-20" />No leave requests</td></tr>
                                ) : leaveRequests.map(leave => (
                                    <tr key={leave.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-bold">
                                                {leave.student_name ? `${leave.student_name} ${leave.student_lastname}` : `${leave.staff_name} ${leave.staff_lastname}`}
                                            </p>
                                            <p className="text-xs text-gray-400">{leave.student_name ? 'Student' : 'Staff'}</p>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{leave.leave_type}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {(leave.start_time || leave.end_time)
                                                ? `${leave.start_time || '—'} → ${leave.end_time || '—'}`
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{leave.lesson || <span className="text-gray-300">—</span>}</td>
                                        <td className="px-4 py-3 font-bold">{leave.total_days}</td>
                                        <td className="px-4 py-3 text-sm max-w-xs truncate">{leave.reason}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col gap-1 items-end">
                                                {leave.status === 'pending' && (
                                                    <div className="flex gap-1 justify-end">
                                                        <button onClick={() => handleLeaveReview(leave.id, 'approved')}
                                                            title="Approve"
                                                            className="p-1.5 bg-green-100 hover:bg-green-200 rounded">
                                                            <CheckCircle size={14} className="text-green-600" />
                                                        </button>
                                                        <button onClick={() => handleLeaveReview(leave.id, 'rejected')}
                                                            title="Reject"
                                                            className="p-1.5 bg-red-100 hover:bg-red-200 rounded">
                                                            <XCircle size={14} className="text-red-600" />
                                                        </button>
                                                    </div>
                                                )}
                                                {leave.actual_return_time ? (
                                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-medium whitespace-nowrap">
                                                        ✓ Returned {new Date(leave.actual_return_time).toLocaleString()}
                                                    </span>
                                                ) : leave.status !== 'rejected' && (
                                                    <button onClick={() => handleMarkReturned(leave.id)}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold whitespace-nowrap">
                                                        Mark Returned
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Leave Request Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-lg font-bold text-gray-800">New Leave / Sick Request</h3>
                            <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Student (optional)</label>
                                    <select
                                        className="input-field"
                                        value={leaveForm.student_id}
                                        onChange={e => setLeaveForm({ ...leaveForm, student_id: e.target.value })}
                                    >
                                        <option value="">— For self (staff) —</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.reg_number})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={leaveForm.leave_type}
                                        onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                                    >
                                        <option value="">Choose...</option>
                                        <option value="sick">Sick / On leave (medical)</option>
                                        <option value="personal">Personal leave</option>
                                        <option value="family">Family emergency</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={leaveForm.start_date}
                                        onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={leaveForm.end_date}
                                        onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Time (from)</label>
                                    <input
                                        type="time" className="input-field"
                                        value={leaveForm.start_time}
                                        onChange={e => setLeaveForm({ ...leaveForm, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                                    <input
                                        type="time" className="input-field"
                                        value={leaveForm.end_time}
                                        onChange={e => setLeaveForm({ ...leaveForm, end_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Missed</label>
                                    <input
                                        type="text" className="input-field" placeholder="e.g. Mathematics period 3"
                                        value={leaveForm.lesson}
                                        onChange={e => setLeaveForm({ ...leaveForm, lesson: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                                <textarea
                                    required rows={3} className="input-field"
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appeals Tab */}
            {activeTab === 'appeals' && isDod && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Original Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Appeal Reason</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parent</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appeals.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400"><MessageSquare size={48} className="mx-auto mb-2 opacity-20" />No appeals</td></tr>
                                ) : appeals.map(appeal => (
                                    <tr key={appeal.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-bold">{appeal.student_name} {appeal.student_lastname}</p>
                                            <p className="text-xs text-gray-400">{appeal.reg_number}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                                {appeal.action_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm max-w-xs">{appeal.appeal_reason}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold">{appeal.parent_name} {appeal.parent_lastname}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${appeal.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                appeal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {appeal.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {appeal.status === 'pending' && (
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => handleAppealDecision(appeal.id, 'accepted')}
                                                        className="p-1.5 bg-green-100 hover:bg-green-200 rounded">
                                                        <CheckCircle size={14} className="text-green-600" />
                                                    </button>
                                                    <button onClick={() => handleAppealDecision(appeal.id, 'rejected')}
                                                        className="p-1.5 bg-red-100 hover:bg-red-200 rounded">
                                                        <XCircle size={14} className="text-red-600" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Record Modal - Enhanced with filters and bulk selection */}
            {showRecordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-3xl sticky top-0">
                            <h3 className="font-black text-white text-lg">Add Discipline Record</h3>
                            <p className="text-white/80 text-xs">Select single student or whole class</p>
                        </div>
                        <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
                            {/* Filters */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase">Filter Students by Class</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Trade</label>
                                        <select
                                            value={recordFilters.trade}
                                            onChange={e => {
                                                setRecordFilters(p => ({ ...p, trade: e.target.value }));
                                                fetchFilteredStudents(e.target.value, recordFilters.level);
                                            }}
                                            className="input text-sm"
                                        >
                                            <option value="">All Trades</option>
                                            {trades.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Level</label>
                                        <select
                                            value={recordFilters.level}
                                            onChange={e => {
                                                setRecordFilters(p => ({ ...p, level: e.target.value }));
                                                fetchFilteredStudents(recordFilters.trade, e.target.value);
                                            }}
                                            className="input text-sm"
                                        >
                                            <option value="">All Levels</option>
                                            {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bulk Selection Toggle */}
                            {filteredStudents.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="selectAll"
                                        checked={selectAllStudents}
                                        onChange={e => {
                                            setSelectAllStudents(e.target.checked);
                                            if (e.target.checked) {
                                                setSelectedStudents((filteredStudents || []).map(s => s.id));
                                            } else {
                                                setSelectedStudents([]);
                                            }
                                        }}
                                        className="w-5 h-5 rounded text-blue-600"
                                    />
                                    <label htmlFor="selectAll" className="flex-1">
                                        <span className="font-bold text-blue-700">Select All {filteredStudents.length} Students</span>
                                        <span className="text-xs text-blue-600 block">This will apply the action to all filtered students</span>
                                    </label>
                                </div>
                            )}

                            {/* Student Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Student {!selectAllStudents && <span className="text-red-500">*</span>}
                                    {selectAllStudents && <span className="text-blue-600 font-normal"> (All selected)</span>}
                                </label>
                                {selectAllStudents ? (
                                    <div className="bg-green-50 p-3 rounded-xl">
                                        <p className="text-sm text-green-700 font-bold">
                                            ✓ {filteredStudents.length} students will receive this discipline record
                                        </p>
                                        <p className="text-xs text-green-600 mt-1">
                                            {(filteredStudents || []).slice(0, 5).map(s => s.first_name).join(', ')}
                                            {filteredStudents?.length > 5 && ` + ${filteredStudents.length - 5} more`}
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        value={recordForm.student_id}
                                        onChange={e => setRecordForm(p => ({ ...p, student_id: e.target.value }))}
                                        className="input"
                                    >
                                        <option value="">Select student</option>
                                        {((recordFilters.trade || recordFilters.level ? filteredStudents : students) || []).map(s =>
                                            <option key={s.id} value={s.id}>
                                                {s.first_name} {s.last_name} - {s.reg_number} ({s.trade} {s.level})
                                            </option>
                                        )}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Action Type *</label>
                                <select required value={recordForm.action_type} onChange={e => setRecordForm(p => ({ ...p, action_type: e.target.value }))}
                                    className="input">
                                    <option value="">Select action</option>
                                    {DISCIPLINE_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                                <textarea required value={recordForm.description} onChange={e => setRecordForm(p => ({ ...p, description: e.target.value }))}
                                    className="input" rows="3" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Points Deducted</label>
                                    <input type="number" value={recordForm.points_deducted} onChange={e => setRecordForm(p => ({ ...p, points_deducted: e.target.value }))}
                                        className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Incident Date</label>
                                    <input type="date" value={recordForm.incident_date} onChange={e => setRecordForm(p => ({ ...p, incident_date: e.target.value }))}
                                        className="input" />
                                </div>
                            </div>

                            {/* Evidence files uploader */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Paperclip size={14} /> Ibimenyetso (Evidence files)
                                    <span className="text-xs font-normal text-gray-400">— amafoto, video, audio, cyangwa PDF (max 8 · 25MB)</span>
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed cursor-pointer text-sm font-bold ${evidenceUploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-primary-300 text-primary-700 hover:bg-primary-50'}`}>
                                        {evidenceUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadIcon size={14} />}
                                        {evidenceUploading ? 'Uploading...' : 'Add files'}
                                        <input type="file" multiple disabled={evidenceUploading}
                                            accept="image/*,application/pdf,video/*,audio/*"
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files || []);
                                                e.target.value = '';
                                                if (!files.length) return;
                                                if (evidenceFiles.length + files.length > 8) {
                                                    toast.error('Max 8 files');
                                                    return;
                                                }
                                                setEvidenceUploading(true);
                                                try {
                                                    const fd = new FormData();
                                                    files.forEach(f => fd.append('files', f));
                                                    const res = await axios.post(`${API_URL}/api/discipline/evidence/upload`, fd, {
                                                        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    setEvidenceFiles(prev => [...prev, ...(res.data.files || [])]);
                                                    toast.success(`${res.data.files?.length || 0} file(s) uploaded`);
                                                } catch (err) {
                                                    toast.error(err.response?.data?.message || 'Upload failed');
                                                } finally {
                                                    setEvidenceUploading(false);
                                                }
                                            }}
                                            className="hidden" />
                                    </label>
                                    {evidenceFiles.length > 0 && (
                                        <span className="text-xs font-bold text-gray-500">{evidenceFiles.length} attached</span>
                                    )}
                                </div>
                                {evidenceFiles.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {evidenceFiles.map((f, i) => {
                                            const isImg = f.type?.startsWith('image/');
                                            return (
                                                <div key={i} className="relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group">
                                                    {isImg ? (
                                                        <img src={`${API_URL}${f.url}`} alt={f.name} className="w-full h-20 object-cover" />
                                                    ) : (
                                                        <div className="h-20 flex items-center justify-center bg-gray-100">
                                                            <FileIconLucide size={28} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-700 truncate" title={f.name}>{f.name}</div>
                                                    <button type="button" onClick={() => setEvidenceFiles(prev => prev.filter((_, j) => j !== i))}
                                                        className="absolute top-1 right-1 bg-white/90 hover:bg-red-500 hover:text-white text-red-600 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => {
                                    setShowRecordModal(false);
                                    setRecordFilters({ trade: '', level: '' });
                                    setFilteredStudents([]);
                                    setSelectAllStudents(false);
                                    setEvidenceFiles([]);
                                }} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl">
                                    {selectAllStudents ? `Save for ${filteredStudents.length} Students` : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SMS Modal - Enhanced with broadcast, search and filters */}
            {showSMSModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-3xl sticky top-0">
                            <h3 className="font-black text-white text-lg">Send SMS</h3>
                            <p className="text-white/80 text-xs">Send to single parent or broadcast to all</p>
                        </div>

                        {/* Mode Selection Tabs */}
                        <div className="flex border-b">
                            <button
                                type="button"
                                onClick={() => {
                                    setSmsMode('single');
                                    setBroadcastResults(null);
                                }}
                                className={`flex-1 py-3 font-bold text-sm ${smsMode === 'single' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                            >
                                📱 Single SMS
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSmsMode('broadcast');
                                    setBroadcastResults(null);
                                }}
                                className={`flex-1 py-3 font-bold text-sm ${smsMode === 'broadcast' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                            >
                                📢 Broadcast to All
                            </button>
                        </div>

                        <form onSubmit={handleSendSMS} className="p-6 space-y-4">
                            {smsMode === 'broadcast' ? (
                                <>
                                    {/* Broadcast Filters */}
                                    <div className="bg-blue-50 p-4 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-blue-700 uppercase">Filter Parents by Student Class</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Trade Filter</label>
                                                <select
                                                    value={smsFilters.trade}
                                                    onChange={e => setSmsFilters(p => ({ ...p, trade: e.target.value }))}
                                                    className="input text-sm"
                                                >
                                                    <option value="">All Trades</option>
                                                    {trades.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Level Filter</label>
                                                <select
                                                    value={smsFilters.level}
                                                    onChange={e => setSmsFilters(p => ({ ...p, level: e.target.value }))}
                                                    className="input text-sm"
                                                >
                                                    <option value="">All Levels</option>
                                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Gender Filter</label>
                                                <select
                                                    value={smsFilters.gender}
                                                    onChange={e => setSmsFilters(p => ({ ...p, gender: e.target.value }))}
                                                    className="input text-sm"
                                                >
                                                    <option value="">All Genders</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-600">
                                            💡 This will send SMS to all parents whose children match the selected trade / level / gender
                                        </p>
                                    </div>

                                    {/* Broadcast Results */}
                                    {broadcastResults && (
                                        <div className="bg-green-50 p-4 rounded-xl">
                                            <p className="font-bold text-green-700">Broadcast Complete!</p>
                                            <p className="text-sm text-green-600">
                                                Total: {broadcastResults.total} | Sent: {broadcastResults.sent} | Failed: {broadcastResults.failed}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Single SMS - Search and Select */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Search Parent</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by name, phone or email..."
                                                value={smsSearch}
                                                onChange={e => {
                                                    setSmsSearch(e.target.value);
                                                    fetchFilteredParents(e.target.value, '', '');
                                                }}
                                                className="input pl-10"
                                            />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Select Parent *</label>
                                        {smsSearch && filteredParents.length > 0 ? (
                                            <div className="max-h-48 overflow-y-auto border rounded-lg">
                                                {filteredParents.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSMSForm(f => ({ ...f, parent_id: p.id }))}
                                                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${smsForm.parent_id === p.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
                                                    >
                                                        <p className="font-bold text-sm">{p.first_name} {p.last_name}</p>
                                                        <p className="text-xs text-gray-500">{p.phone} | {p.email}</p>
                                                        <p className="text-xs text-blue-600">Linked children: {p.linked_children || 0}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <select
                                                required
                                                value={smsForm.parent_id}
                                                onChange={e => setSMSForm(p => ({ ...p, parent_id: e.target.value }))}
                                                className="input"
                                            >
                                                <option value="">Select parent</option>
                                                {parents.map(p =>
                                                    <option key={p.id} value={p.id}>
                                                        {p.first_name} {p.last_name} - {p.phone} ({p.linked_children || 0} children)
                                                    </option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Message {smsMode === 'broadcast' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    required
                                    value={smsForm.message}
                                    onChange={e => setSMSForm(p => ({ ...p, message: e.target.value }))}
                                    className="input"
                                    rows="4"
                                    placeholder={smsMode === 'broadcast' ? "Enter message to broadcast to all parents..." : "Enter your message..."}
                                />
                                <p className="text-xs text-gray-400 mt-1">{smsForm.message?.length || 0} characters</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSMSModal(false);
                                        setSmsMode('single');
                                        setSmsSearch('');
                                        setSmsFilters({ trade: '', level: '', gender: '' });
                                        setBroadcastResults(null);
                                        setSMSForm({ parent_id: '', student_id: '', message: '', reminder_type: 'general' });
                                    }}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={smsLoading}
                                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {smsLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            {smsMode === 'broadcast' ? 'Broadcast SMS' : 'Send SMS'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discipline;

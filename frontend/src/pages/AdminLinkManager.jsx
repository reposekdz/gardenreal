import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    Link2, Search, Filter, Plus, X, Check, CheckCircle, XCircle, Eye,
    Users, User, Phone, Mail, MapPin, Calendar, BookOpen, GraduationCap,
    RefreshCw, Send, ChevronRight, UserPlus, Link, Unlink, AlertCircle,
    MessageSquare, Clock, Building, Award, Download, Upload, ChevronDown,
    Trash2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_LEVELS_FALLBACK = ['Level 3', 'Level 4', 'Level 5'];

const AdminLinkManager = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const headers = { Authorization: `Bearer ${token}` };

    // State
    const [linkRequests, setLinkRequests] = useState([]);
    const [pendingLinks, setPendingLinks] = useState([]);
    const [students, setStudents] = useState([]);
    const [parents, setParents] = useState([]);
    const [linkedStudents, setLinkedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [linkedSearchTerm, setLinkedSearchTerm] = useState('');
    const [linkedFilterTrade, setLinkedFilterTrade] = useState('');
    const [linkedFilterLevel, setLinkedFilterLevel] = useState('');

    // Trade/Level Filters
    const [filterTrade, setFilterTrade] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [availableLevels, setAvailableLevels] = useState([]);

    // State for detail modal student selection
    const [detailModalTrade, setDetailModalTrade] = useState('');
    const [detailModalLevel, setDetailModalLevel] = useState('');
    const [detailModalLevels, setDetailModalLevels] = useState([]);
    const [selectedStudentForLink, setSelectedStudentForLink] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Form state
    const [linkForm, setLinkForm] = useState({
        parent_id: '',
        student_id: '',
        relationship: 'father',
        is_primary: true
    });

    // Modal trade/level filters
    const [modalTrade, setModalTrade] = useState('');
    const [modalLevel, setModalLevel] = useState('');
    const [modalLevels, setModalLevels] = useState([]);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    // Cohort lookup (applications + eligible students + already-linked) for the
    // currently selected trade/level/gender — populated by fetchCohort()
    const [cohort, setCohort] = useState({ applications: [], students: [], linkedParents: [], linkRequests: [], counts: null });
    const [filterGender, setFilterGender] = useState('');
    const [cohortLoading, setCohortLoading] = useState(false);

    // Real trades from API
    const [trades, setTrades] = useState([]);
    const TRADES = trades.map(t => t.name);
    const LEVELS = trades.reduce((acc, t) => {
        let lv = t.levels;
        if (typeof lv === 'string') { try { lv = JSON.parse(lv); } catch (_) { lv = null; } }
        acc[t.name] = (Array.isArray(lv) && lv.length) ? lv : DEFAULT_LEVELS_FALLBACK;
        return acc;
    }, {});

    // Fetch real trades on mount
    useEffect(() => {
        axios.get(`${API_URL}/api/trades`)
            .then(r => setTrades(Array.isArray(r.data) ? r.data : []))
            .catch(() => setTrades([]));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [requestsRes, pendingRes, studentsRes, parentsRes, linkedRes] = await Promise.all([
                axios.get(`${API_URL}/api/parents/link-requests`, { headers }),
                axios.get(`${API_URL}/api/parents/pending-links`, { headers }),
                axios.get(`${API_URL}/api/students?status=active&limit=500`, { headers }),
                axios.get(`${API_URL}/api/parents`, { headers }),
                axios.get(`${API_URL}/api/parents/linked-students`, { headers })
            ]);
            // Endpoints may return either an array or an object with a known key.
            const asArr = (v, key) => Array.isArray(v) ? v : (v?.[key] || v?.data || []);
            setLinkRequests(asArr(requestsRes.data, 'requests'));
            setPendingLinks(asArr(pendingRes.data, 'links'));
            setStudents(asArr(studentsRes.data, 'students'));
            setParents(asArr(parentsRes.data, 'parents'));
            setLinkedStudents(asArr(linkedRes.data, 'linkedStudents'));
        } catch (err) {
            console.error('AdminLinkManager fetch error:', err);
            toast.error(err.response?.data?.message || 'Habaye ikibazo mu gufungura amakuru');
        }
        finally { setLoading(false); }
    };

    // Re-fetch the cohort whenever trade + level are chosen (gender optional)
    const fetchCohort = async (trade, level, gender) => {
        if (!trade || !level) {
            setCohort({ applications: [], students: [], linkedParents: [], linkRequests: [], counts: null });
            return;
        }
        setCohortLoading(true);
        try {
            const params = { trade, level };
            if (gender) params.gender = gender;
            const res = await axios.get(`${API_URL}/api/parents/by-trade-level`, { headers, params });
            setCohort({
                applications: res.data.applications || [],
                students: res.data.students || [],
                linkedParents: res.data.linkedParents || [],
                linkRequests: res.data.linkRequests || [],
                counts: res.data.counts || null
            });
        } catch (err) {
            console.error('Cohort fetch error:', err);
            toast.error(err.response?.data?.message || 'Failed to load cohort');
        } finally {
            setCohortLoading(false);
        }
    };

    // Auto-fetch cohort whenever trade/level/gender filters change
    useEffect(() => {
        fetchCohort(filterTrade, filterLevel, filterGender);
    }, [filterTrade, filterLevel, filterGender]);

    // One-click link: link a parent (from applications) to a student in the cohort
    const quickLinkParentToStudent = async (parent, studentId, relationship = 'guardian') => {
        try {
            // If parent already has a user account, link by parent_id; otherwise create one first
            let parentId = parent.parent_id;
            if (!parentId && parent.phone) {
                // Try to find or auto-provision a parent user from the application
                const findRes = await axios.get(`${API_URL}/api/parents/find`, { headers, params: { phone: parent.phone } });
                parentId = findRes.data?.id;
            }
            if (!parentId) {
                toast.error('Parent has no account yet — ask them to register first');
                return;
            }
            await axios.post(`${API_URL}/api/parents/admin-link`, {
                parent_id: parentId,
                student_id: parseInt(studentId, 10),
                relationship,
                is_primary: true,
                send_sms: true
            }, { headers });
            toast.success('Linked! SMS sent to parent.');
            await Promise.all([fetchData(), fetchCohort(filterTrade, filterLevel, filterGender)]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to link parent');
        }
    };

    // Approve link request - shows modal to select student
    const handleApprove = async (request) => {
        // Store the request and show student selection modal
        setSelectedRequest(request);
        setShowDetailModal(true);
    };

    // Actually link the student to parent (called from detail modal)
    const confirmApproveLink = async (studentId) => {
        if (!selectedRequest || !studentId) {
            toast.error('Hitamo umunyeshuri');
            return;
        }
        try {
            await axios.post(`${API_URL}/api/parents/admin-link`, {
                request_id: selectedRequest.id,
                student_id: parseInt(studentId),
                send_sms: true
            }, { headers });
            toast.success('✅ Umwana yahawe ababyeyi! SMS yoherejwe.');
            setShowDetailModal(false);
            setSelectedRequest(null);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
    };

    // Reject link request
    const handleReject = async (id) => {
        if (!window.confirm('Wereka ko ufite?..')) return;
        try {
            await axios.put(`${API_URL}/api/parents/link-requests/${id}/reject`, {}, { headers });
            toast.success('Icyifuzo cyangijwe');
            fetchData();
        } catch (err) { toast.error('Habaye ikibazo'); }
    };

    // Unlink parent from student
    const handleUnlink = async (id) => {
        if (!window.confirm('Wereka guhagarika ikwirikano?..')) return;
        try {
            await axios.delete(`${API_URL}/api/parents/unlink/${id}`, { headers });
            toast.success('Umubyeyi yahagaritswe ku muhanshi');
            fetchData();
        } catch (err) { toast.error('Habaye ikibazo'); }
    };

    // Manual link
    const handleManualLink = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/parents/admin-link`, {
                ...linkForm,
                send_sms: true
            }, { headers });
            toast.success('✅ Ubucuti bwikoreye! SMS yoherejwe.');
            setShowLinkModal(false);
            setLinkForm({ parent_id: '', student_id: '', relationship: 'father', is_primary: true });
            setModalTrade('');
            setModalLevel('');
            setModalLevels([]);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
    };

    // View request details
    const viewRequestDetails = (request) => {
        setSelectedRequest(request);
        setShowDetailModal(true);
        // Reset detail modal filters
        setDetailModalTrade('');
        setDetailModalLevel('');
        setDetailModalLevels([]);
        setSelectedStudentForLink('');
    };

    // Filter requests
    const filteredRequests = linkRequests.filter(r => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (
                !r.student_name?.toLowerCase().includes(term) &&
                !r.parent_name?.toLowerCase().includes(term) &&
                !r.phone?.includes(term) &&
                !r.student_trade?.toLowerCase().includes(term)
            ) return false;
        }
        if (filterStatus && r.status !== filterStatus) return false;
        if (filterTrade && r.student_trade !== filterTrade) return false;
        if (filterLevel && r.student_level !== filterLevel) return false;
        return true;
    });

    // Get available students for linking (not already linked) - filtered by trade/level
    const availableStudents = students.filter(s => {
        const isLinked = pendingLinks.some(p => p.student_id === s.id) ||
            linkRequests.some(r => r.requested_student_id === s.id && r.status === 'approved');
        if (isLinked) return false;
        if (filterTrade && s.trade !== filterTrade) return false;
        if (filterLevel && s.level !== filterLevel) return false;
        return true;
    });

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        <Link2 className="text-primary-600" /> Parent-Student Link Manager
                    </h1>
                    <p className="text-gray-500">Manage parent linking requests and manual links</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/students')} className="btn-secondary flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                        <Users size={18} /> Manage Students
                    </button>
                    <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
                        <RefreshCw size={18} /> Refresh
                    </button>
                    <button onClick={() => setShowLinkModal(true)} className="btn-primary flex items-center gap-2">
                        <UserPlus size={18} /> Manual Link
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{linkRequests.filter(r => r.status === 'pending').length}</p>
                            <p className="text-xs text-gray-500">Pending Requests</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{linkRequests.filter(r => r.status === 'approved').length}</p>
                            <p className="text-xs text-gray-500">Approved</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <XCircle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{linkRequests.filter(r => r.status === 'rejected').length}</p>
                            <p className="text-xs text-gray-500">Rejected</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black">{parents.length}</p>
                            <p className="text-xs text-gray-500">Total Parents</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'requests' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Link Requests ({linkRequests.filter(r => r.status === 'pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('linked')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'linked' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Request History ({linkRequests.filter(r => r.status !== 'pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('all-linked')}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'all-linked' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    All Linked ({linkedStudents.length})
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, trade..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select
                        value={filterTrade}
                        onChange={e => {
                            setFilterTrade(e.target.value);
                            setFilterLevel('');
                            setAvailableLevels(e.target.value ? LEVELS[e.target.value] || [] : []);
                        }}
                        className="input"
                    >
                        <option value="">All Trades</option>
                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                        value={filterLevel}
                        onChange={e => setFilterLevel(e.target.value)}
                        className="input"
                        disabled={!filterTrade}
                    >
                        <option value="">All Levels</option>
                        {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select
                        value={filterGender}
                        onChange={e => setFilterGender(e.target.value)}
                        className="input"
                    >
                        <option value="">All Genders</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </div>

            {/* Cohort panel: applications + eligible students for selected trade/level/gender */}
            {filterTrade && filterLevel && (
                <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={18} />
                            <span className="font-bold">
                                Cohort: {filterTrade} • {filterLevel}{filterGender ? ` • ${filterGender}` : ''}
                            </span>
                        </div>
                        {cohort.counts && (
                            <div className="flex gap-3 text-xs">
                                <span className="bg-white/20 px-2 py-1 rounded">{cohort.counts.applications} applications</span>
                                <span className="bg-white/20 px-2 py-1 rounded">{cohort.counts.eligibleStudents} students</span>
                                <span className="bg-white/20 px-2 py-1 rounded">{cohort.counts.linkedParents} already linked</span>
                            </div>
                        )}
                    </div>
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Applied parents */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <UserPlus size={16} /> Applied parents ({cohort.applications.length})
                            </h4>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {cohortLoading ? (
                                    <div className="text-center py-6 text-gray-400"><RefreshCw className="animate-spin inline" /></div>
                                ) : cohort.applications.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-lg">No approved applications for this cohort yet.</div>
                                ) : cohort.applications.map(app => (
                                    <div key={app.application_id} className="border rounded-lg p-3 hover:bg-gray-50">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{app.applicant_first} {app.applicant_last}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/>{app.phone}</p>
                                                {app.parent_id ? (
                                                    <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Parent account exists</span>
                                                ) : (
                                                    <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">No account yet</span>
                                                )}
                                            </div>
                                            <select
                                                onChange={e => e.target.value && quickLinkParentToStudent(app, e.target.value)}
                                                className="text-xs border rounded px-2 py-1 max-w-[140px]"
                                                defaultValue=""
                                            >
                                                <option value="">Link to…</option>
                                                {cohort.students.map(s => (
                                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Already-linked parents */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Link2 size={16} /> Already linked ({cohort.linkedParents.length})
                            </h4>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {cohort.linkedParents.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-lg">No linked parents yet.</div>
                                ) : cohort.linkedParents.map((lp, i) => (
                                    <div key={`${lp.parent_id}-${lp.student_id}-${i}`} className="border rounded-lg p-3 hover:bg-gray-50">
                                        <p className="font-bold text-sm">{lp.first_name} {lp.last_name}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/>{lp.phone}</p>
                                        <p className="text-xs text-gray-600 mt-1">→ {lp.student_first} {lp.student_last} <span className="text-gray-400">({lp.reg_number})</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Requests Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parent Info</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Info</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trade & Level</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Requested</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <RefreshCw className="animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        <Link2 size={48} className="mx-auto mb-2 opacity-20" />
                                        <p>No requests found</p>
                                    </td>
                                </tr>
                            ) : filteredRequests.map(request => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-bold">{request.parent_name}</p>
                                            <p className="text-xs text-gray-500">{request.phone}</p>
                                            <p className="text-xs text-gray-400 capitalize">{request.relationship}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-bold">{request.student_name}</p>
                                            <p className="text-xs text-gray-500">{request.student_gender}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium">{request.student_trade}</p>
                                            <p className="text-xs text-gray-500">{request.student_level}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {new Date(request.requested_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => viewRequestDetails(request)}
                                                className="p-2 hover:bg-gray-100 rounded-lg" title="View Details">
                                                <Eye size={16} className="text-gray-500" />
                                            </button>
                                            {request.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleApprove(request)}
                                                        className="p-2 bg-green-100 hover:bg-green-200 rounded-lg" title="Approve">
                                                        <CheckCircle size={16} className="text-green-600" />
                                                    </button>
                                                    <button onClick={() => handleReject(request.id)}
                                                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg" title="Reject">
                                                        <XCircle size={16} className="text-red-600" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* All Linked Tab Content */}
            {activeTab === 'all-linked' && (
                <div className="space-y-4">
                    {/* Filters for All Linked */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search parent or student..."
                                    value={linkedSearchTerm}
                                    onChange={e => setLinkedSearchTerm(e.target.value)}
                                    className="input pl-10"
                                />
                            </div>
                            <select
                                value={linkedFilterTrade}
                                onChange={e => {
                                    setLinkedFilterTrade(e.target.value);
                                    setLinkedFilterLevel('');
                                }}
                                className="input"
                            >
                                <option value="">All Trades</option>
                                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select
                                value={linkedFilterLevel}
                                onChange={e => setLinkedFilterLevel(e.target.value)}
                                className="input"
                                disabled={!linkedFilterTrade}
                            >
                                <option value="">All Levels</option>
                                {linkedFilterTrade && LEVELS[linkedFilterTrade]?.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Linked Students Table */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parent</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trade & Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Linked Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center">
                                                <RefreshCw className="animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    ) : linkedStudents.filter(l => {
                                        if (linkedSearchTerm) {
                                            const term = linkedSearchTerm.toLowerCase();
                                            if (!l.parent_name?.toLowerCase().includes(term) &&
                                                !l.student_name?.toLowerCase().includes(term) &&
                                                !l.parent_phone?.includes(term)) return false;
                                        }
                                        if (linkedFilterTrade && l.student_trade !== linkedFilterTrade) return false;
                                        if (linkedFilterLevel && l.student_level !== linkedFilterLevel) return false;
                                        return true;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                                <Users size={48} className="mx-auto mb-2 opacity-20" />
                                                <p>No linked records found</p>
                                            </td>
                                        </tr>
                                    ) : linkedStudents.filter(l => {
                                        if (linkedSearchTerm) {
                                            const term = linkedSearchTerm.toLowerCase();
                                            if (!l.parent_name?.toLowerCase().includes(term) &&
                                                !l.student_name?.toLowerCase().includes(term) &&
                                                !l.parent_phone?.includes(term)) return false;
                                        }
                                        if (linkedFilterTrade && l.student_trade !== linkedFilterTrade) return false;
                                        if (linkedFilterLevel && l.student_level !== linkedFilterLevel) return false;
                                        return true;
                                    }).map(link => (
                                        <tr key={link.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-bold">{link.parent_name}</p>
                                                    <p className="text-xs text-gray-500">{link.parent_phone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-bold">{link.student_name}</p>
                                                    <p className="text-xs text-gray-500">{link.reg_number}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{link.student_trade}</p>
                                                    <p className="text-xs text-gray-500">{link.student_level}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(link.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleUnlink(link.id)}
                                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg"
                                                    title="Unlink"
                                                >
                                                    <Unlink size={16} className="text-red-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 rounded-t-3xl flex justify-between items-center">
                            <h3 className="font-black text-white text-lg">Manual Link Parent to Student</h3>
                            <button onClick={() => setShowLinkModal(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleManualLink} className="p-6 space-y-4">
                            {/* Trade/Level Filters */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Filter by Trade</label>
                                    <select
                                        value={modalTrade}
                                        onChange={e => {
                                            setModalTrade(e.target.value);
                                            setModalLevel('');
                                            setModalLevels(e.target.value ? LEVELS[e.target.value] || [] : []);
                                            setLinkForm(p => ({ ...p, student_id: '' }));
                                        }}
                                        className="input"
                                    >
                                        <option value="">All Trades</option>
                                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Filter by Level</label>
                                    <select
                                        value={modalLevel}
                                        onChange={e => {
                                            setModalLevel(e.target.value);
                                            setLinkForm(p => ({ ...p, student_id: '' }));
                                        }}
                                        className="input"
                                        disabled={!modalTrade}
                                    >
                                        <option value="">All Levels</option>
                                        {modalLevels.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Parent *</label>
                                <select required value={linkForm.parent_id} onChange={e => setLinkForm(p => ({ ...p, parent_id: e.target.value }))}
                                    className="input">
                                    <option value="">Select parent</option>
                                    {parents.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Student *</label>
                                <select required value={linkForm.student_id} onChange={e => setLinkForm(p => ({ ...p, student_id: e.target.value }))}
                                    className="input">
                                    <option value="">Select student</option>
                                    {availableStudents.filter(s => {
                                        if (modalTrade && s.trade !== modalTrade) return false;
                                        if (modalLevel && s.level !== modalLevel) return false;
                                        return true;
                                    }).map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} - {s.trade} {s.level}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Relationship</label>
                                    <select value={linkForm.relationship} onChange={e => setLinkForm(p => ({ ...p, relationship: e.target.value }))}
                                        className="input">
                                        <option value="father">Father</option>
                                        <option value="mother">Mother</option>
                                        <option value="guardian">Guardian</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Primary Contact</label>
                                    <select value={linkForm.is_primary} onChange={e => setLinkForm(p => ({ ...p, is_primary: e.target.value === 'true' }))}
                                        className="input">
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm text-blue-700">
                                    📱 Parent will receive an SMS notification confirming the link.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowLinkModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                    <Link size={18} /> Link & Send SMS
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-3xl flex justify-between items-center">
                            <h3 className="font-black text-white text-lg">Request Details</h3>
                            <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Parent Info */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <User size={18} /> Parent Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-bold">{selectedRequest.parent_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="font-bold">{selectedRequest.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-bold">{selectedRequest.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Relationship</p>
                                        <p className="font-bold capitalize">{selectedRequest.relationship}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <GraduationCap size={18} /> Student Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="font-bold">{selectedRequest.student_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Gender</p>
                                        <p className="font-bold">{selectedRequest.student_gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Trade</p>
                                        <p className="font-bold">{selectedRequest.student_trade}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Level</p>
                                        <p className="font-bold">{selectedRequest.student_level}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Request Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <p className="text-xs text-gray-500">Requested Date</p>
                                    <p className="font-bold">{new Date(selectedRequest.requested_at).toLocaleString()}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${selectedRequest.status === 'approved' ? 'bg-green-50' :
                                    selectedRequest.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
                                    }`}>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className={`font-bold capitalize ${selectedRequest.status === 'approved' ? 'text-green-700' :
                                        selectedRequest.status === 'rejected' ? 'text-red-700' : 'text-yellow-700'
                                        }`}>{selectedRequest.status}</p>
                                </div>
                            </div>
                        </div>

                        {selectedRequest.status === 'pending' && (
                            <div className="space-y-4">
                                {/* Student Selection with filters */}
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                        <GraduationCap size={18} /> Select Student to Link
                                    </h4>
                                    <p className="text-sm text-green-700 mb-3">
                                        Parent is requesting to link with: <strong>{selectedRequest.student_name || 'Not specified'}</strong>
                                        {selectedRequest.student_trade && ` (${selectedRequest.student_trade} - ${selectedRequest.student_level})`}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <select
                                            value={detailModalTrade}
                                            onChange={e => {
                                                setDetailModalTrade(e.target.value);
                                                setDetailModalLevel('');
                                                setDetailModalLevels(e.target.value ? LEVELS[e.target.value] || [] : []);
                                                setSelectedStudentForLink('');
                                            }}
                                            className="input text-sm"
                                        >
                                            <option value="">All Trades</option>
                                            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <select
                                            value={detailModalLevel}
                                            onChange={e => {
                                                setDetailModalLevel(e.target.value);
                                                setSelectedStudentForLink('');
                                            }}
                                            className="input text-sm"
                                            disabled={!detailModalTrade}
                                        >
                                            <option value="">All Levels</option>
                                            {detailModalLevels.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>

                                    <select
                                        value={selectedStudentForLink}
                                        onChange={e => setSelectedStudentForLink(e.target.value)}
                                        className="input text-sm"
                                    >
                                        <option value="">Select student...</option>
                                        {availableStudents.filter(s => {
                                            if (detailModalTrade && s.trade !== detailModalTrade) return false;
                                            if (detailModalLevel && s.level !== detailModalLevel) return false;
                                            return true;
                                        }).map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.first_name} {s.last_name} - {s.trade} {s.level} ({s.reg_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => { setShowDetailModal(false); handleReject(selectedRequest.id); }}
                                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        onClick={() => confirmApproveLink(selectedStudentForLink)}
                                        disabled={!selectedStudentForLink}
                                        className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 ${selectedStudentForLink
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}>
                                        <CheckCircle size={18} /> Approve & Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLinkManager;

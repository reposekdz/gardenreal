import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    User, BookOpen, AlertTriangle, TrendingUp, Bell,
    DollarSign, Calendar, Award, Phone, LogOut,
    RefreshCw, CheckCircle, ClockIcon, XCircle, Star,
    MessageSquare, GraduationCap, Shield, Home, Activity,
    Send, Inbox, PlusCircle
} from 'lucide-react';
import RealtimeBell from '../components/RealtimeBell';

const API_URL = import.meta.env.VITE_API_URL || '';

const ParentPortal = () => {
    const { token, user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [linkedChildren, setLinkedChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childData, setChildData] = useState({
        grades: [],
        discipline: [],
        attendance: [],
        fees: null,
        notifications: [],
        smsLogs: [],
        reminders: []
    });
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [pendingOpenThread, setPendingOpenThread] = useState(null);

    // ─── Fetch linked children ───────────────────────────────────────────────
    const fetchLinkedChildren = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parents/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const children = Array.isArray(res.data) ? res.data : [];
            setLinkedChildren(children);
            if (children.length > 0 && !selectedChild) {
                setSelectedChild(children[0]);
            }
        } catch (err) {
            console.error('Error fetching children:', err);
        }
    }, [token, selectedChild]);

    // ─── Fetch all child data ────────────────────────────────────────────────
    const fetchChildData = useCallback(async (child) => {
        if (!child?.student_id) return;
        setRefreshing(true);
        const sid = child.student_id;

        const auth = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const [gradesRes, disciplineRes, feesRes, notifRes, attendanceRes, smsLogsRes, remindersRes] = await Promise.allSettled([
                axios.get(`${API_URL}/api/parents/grades?student_id=${sid}`, auth),
                axios.get(`${API_URL}/api/parents/discipline?student_id=${sid}`, auth),
                axios.get(`${API_URL}/api/parents/fees-summary?student_id=${sid}`, auth),
                axios.get(`${API_URL}/api/notifications?student_id=${sid}&limit=20`, auth),
                axios.get(`${API_URL}/api/parents/attendance?student_id=${sid}`, auth),
                axios.get(`${API_URL}/api/parents/sms-logs?limit=50`, auth),
                axios.get(`${API_URL}/api/parents/payment-reminders?limit=50`, auth)
            ]);

            setChildData(prev => ({
                ...prev,
                grades: gradesRes.status === 'fulfilled' ? (gradesRes.value.data || []) : [],
                discipline: disciplineRes.status === 'fulfilled' ? (disciplineRes.value.data || []) : [],
                fees: feesRes.status === 'fulfilled' ? feesRes.value.data : null,
                notifications: notifRes.status === 'fulfilled' ? (notifRes.value.data || []) : [],
                attendance: attendanceRes.status === 'fulfilled' ? (attendanceRes.value.data || []) : [],
                smsLogs: smsLogsRes.status === 'fulfilled' ? (smsLogsRes.value.data || []) : [],
                reminders: remindersRes.status === 'fulfilled' ? (remindersRes.value.data || []) : []
            }));
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Error fetching child data:', err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [token]);

    // ─── Initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchLinkedChildren();
    }, [fetchLinkedChildren]);

    useEffect(() => {
        if (selectedChild) fetchChildData(selectedChild);
    }, [selectedChild, fetchChildData]);

    // ─── Auto-refresh every 2 minutes ────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            if (selectedChild) fetchChildData(selectedChild);
        }, 120000);
        return () => clearInterval(interval);
    }, [selectedChild, fetchChildData]);

    const handleRefresh = () => {
        if (selectedChild) fetchChildData(selectedChild);
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────
    const getGradeColor = (score) => {
        if (score >= 70) return 'text-green-600 bg-green-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getDisciplineColor = (type) => {
        const colors = {
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            suspension: 'bg-red-100 text-red-800 border-red-200',
            praise: 'bg-green-100 text-green-800 border-green-200',
            default: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colors[type] || colors.default;
    };

    const avgGrade = childData.grades.length
        ? Math.round(childData.grades.reduce((s, g) => s + (parseFloat(g.score) || 0), 0) / childData.grades.length)
        : null;

    const disciplineWarnings = childData.discipline.filter(d => d.incident_type !== 'praise').length;
    const disciplinePraises = childData.discipline.filter(d => d.incident_type === 'praise').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Gutunganya amakuru...</p>
                </div>
            </div>
        );
    }

    if (linkedChildren.length === 0) {
        return <NoChildLinkRequest user={user} token={token} logout={logout} onLinked={fetchLinkedChildren} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                            <Home size={22} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Portal y'Umubyeyi</h1>
                            <p className="text-emerald-200 text-sm">Garden TVET School</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <RealtimeBell
                            apiUrl={API_URL}
                            token={token}
                            onOpenThread={(threadId) => {
                                setActiveTab('messages');
                                setPendingOpenThread(threadId);
                            }}
                            onAnyEvent={(type) => {
                                if (type === 'message_reply') {
                                    toast.info('🔔 Igisubizo gishya kuva ku ishuri!', { autoClose: 4000 });
                                }
                            }}
                        />
                        <div className="text-right hidden sm:block ml-1">
                            <p className="font-semibold text-sm leading-tight">{user?.first_name} {user?.last_name}</p>
                            <p className="text-emerald-200 text-xs">Umubyeyi</p>
                        </div>
                        <button onClick={logout} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" title="Sohoka">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Child Selector */}
                {linkedChildren.length > 1 && (
                    <div className="max-w-6xl mx-auto px-4 pb-4 flex gap-2 overflow-x-auto">
                        {linkedChildren.map(child => (
                            <button
                                key={child.student_id}
                                onClick={() => setSelectedChild(child)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${selectedChild?.student_id === child.student_id
                                    ? 'bg-white text-emerald-700 shadow-md'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {child.student_name || `${child.first_name} ${child.last_name}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Child Profile Banner */}
                {selectedChild && (
                    <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-emerald-100">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <GraduationCap size={30} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">
                                        {selectedChild.student_name || `${selectedChild.first_name} ${selectedChild.last_name}`}
                                    </h2>
                                    <p className="text-gray-500 font-medium">
                                        {selectedChild.student_trade || selectedChild.trade} • {selectedChild.student_level || selectedChild.level}
                                    </p>
                                    {selectedChild.reg_number && (
                                        <p className="text-xs text-gray-400 mt-0.5">Reg: {selectedChild.reg_number}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Ikanyarufu ryanya:</p>
                                    <p className="text-xs font-medium text-gray-600">{lastRefresh.toLocaleTimeString()}</p>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all"
                                >
                                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                                <p className="text-2xl font-black text-blue-700">{avgGrade ?? '—'}</p>
                                <p className="text-xs text-blue-600 font-medium mt-0.5">Iciraniro</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center">
                                <p className="text-2xl font-black text-red-700">{disciplineWarnings}</p>
                                <p className="text-xs text-red-600 font-medium mt-0.5">Indagano</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
                                <p className="text-2xl font-black text-green-700">{disciplinePraises}</p>
                                <p className="text-xs text-green-600 font-medium mt-0.5">Ishimwe</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                                <p className="text-2xl font-black text-purple-700">{childData.notifications.length}</p>
                                <p className="text-xs text-purple-600 font-medium mt-0.5">Amakuru</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {[
                        { id: 'overview', label: 'Incamake', icon: Activity },
                        { id: 'attendance', label: 'Kuhari', icon: ClockIcon },
                        { id: 'grades', label: 'Amanota', icon: BookOpen },
                        { id: 'discipline', label: 'Imyitwarire', icon: Shield },
                        { id: 'fees', label: 'Amishyuri', icon: DollarSign },
                        { id: 'reminders', label: 'Kwibutsa', icon: Send },
                        { id: 'messages', label: 'Ubutumwa', icon: MessageSquare },
                        { id: 'sms_logs', label: 'SMS Yose', icon: Inbox },
                        { id: 'notifications', label: 'Amakuru', icon: Bell },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Recent Notifications */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Bell size={20} className="text-emerald-600" /> Amakuru Mashya
                            </h3>
                            {childData.notifications.length === 0 ? (
                                <p className="text-gray-400 text-center py-4">Nta makuru mashya</p>
                            ) : (
                                <div className="space-y-3">
                                    {childData.notifications.slice(0, 5).map((notif, i) => (
                                        <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Bell size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800">{notif.message || notif.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Grades */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-blue-600" /> Amanota Mashya
                            </h3>
                            {childData.grades.length === 0 ? (
                                <p className="text-gray-400 text-center py-4">Nta manota yaraboneka</p>
                            ) : (
                                <div className="space-y-2">
                                    {childData.grades.slice(0, 5).map((grade, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{grade.unit_name || grade.unit_code || 'Inyigisho'}</p>
                                                <p className="text-xs text-gray-400">{grade.assessment_type || 'Isuzuma'}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-black ${getGradeColor(parseFloat(grade.score))}`}>
                                                {grade.score}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Discipline */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-orange-600" /> Imyitwarire Iya Vuba
                            </h3>
                            {childData.discipline.length === 0 ? (
                                <div className="text-center py-4">
                                    <CheckCircle size={40} className="text-green-300 mx-auto mb-2" />
                                    <p className="text-gray-400">Imyitwarire myiza! Nta kibazo cyashyizweho.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {childData.discipline.slice(0, 4).map((d, i) => (
                                        <div key={i} className={`p-3 rounded-xl border ${getDisciplineColor(d.incident_type)}`}>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm capitalize">{d.incident_type}</p>
                                                <p className="text-xs opacity-70">{d.incident_date ? new Date(d.incident_date).toLocaleDateString() : ''}</p>
                                            </div>
                                            {d.description && <p className="text-xs mt-1 opacity-80">{d.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Tab: GRADES ── */}
                {activeTab === 'grades' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen size={20} className="text-blue-600" /> Amanota Yose
                            </h3>
                            {avgGrade !== null && (
                                <div className={`px-4 py-2 rounded-xl font-black text-lg ${getGradeColor(avgGrade)}`}>
                                    Iciraniro: {avgGrade}%
                                </div>
                            )}
                        </div>
                        {childData.grades.length === 0 ? (
                            <div className="p-12 text-center">
                                <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400">Nta manota yaraboneka</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Inyigisho</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ubwoko</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amanota</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Itariki</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {childData.grades.map((g, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-800">{g.unit_name || g.unit_code}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{g.assessment_type}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(parseFloat(g.score))}`}>
                                                        {g.score}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {g.assessment_date ? new Date(g.assessment_date).toLocaleDateString() : g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: DISCIPLINE ── */}
                {activeTab === 'discipline' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 sm:p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-black text-red-600">{disciplineWarnings}</p>
                                <p className="text-xs sm:text-sm text-red-500 mt-1">Indagano</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 sm:p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-black text-green-600">{disciplinePraises}</p>
                                <p className="text-xs sm:text-sm text-green-500 mt-1">Ishimwe</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 sm:p-4 text-center">
                                <p className="text-2xl sm:text-3xl font-black text-blue-600">{childData.discipline.length}</p>
                                <p className="text-xs sm:text-sm text-blue-500 mt-1">Byose</p>
                            </div>
                        </div>

                        {childData.discipline.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                                <CheckCircle size={60} className="text-green-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Imyitwarire Myiza!</h3>
                                <p className="text-gray-400">Umwana wawe afite imyitwarire myiza. Nta kibazo cyashyizweho.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {childData.discipline.map((d, i) => (
                                    <div key={i} className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${d.incident_type === 'praise' ? 'border-green-500' : d.incident_type === 'suspension' ? 'border-red-500' : 'border-orange-400'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getDisciplineColor(d.incident_type)}`}>
                                                        {d.incident_type}
                                                    </span>
                                                    {d.action_taken && (
                                                        <span className="text-xs text-gray-400">→ {d.action_taken}</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-700">{d.description}</p>
                                                {d.recorded_by_name && (
                                                    <p className="text-xs text-gray-400 mt-2">Yashyizweho na: {d.recorded_by_name}</p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-medium text-gray-600">
                                                    {d.incident_date ? new Date(d.incident_date).toLocaleDateString('fr-RW') : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: FEES ── */}
                {activeTab === 'fees' && (
                    <div className="space-y-4">
                        {childData.fees ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-center shadow-lg">
                                        <p className="text-xl font-black">{(childData.fees.total_fee || 0).toLocaleString()} RWF</p>
                                        <p className="text-blue-200 text-sm mt-1">Amafaranga Yose</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 text-center shadow-lg">
                                        <p className="text-xl font-black">{(childData.fees.total_paid || 0).toLocaleString()} RWF</p>
                                        <p className="text-green-200 text-sm mt-1">Byatanzwe</p>
                                    </div>
                                    <div className={`bg-gradient-to-br ${(childData.fees.balance || 0) > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} text-white rounded-2xl p-6 text-center shadow-lg`}>
                                        <p className="text-xl font-black">{(childData.fees.balance || 0).toLocaleString()} RWF</p>
                                        <p className="text-red-200 text-sm mt-1">Hasigaye</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="bg-white rounded-2xl shadow-md p-6">
                                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                                        <span>Ishyirwaho ry'Amafaranga</span>
                                        <span>{childData.fees.total_fee > 0 ? Math.round((childData.fees.total_paid / childData.fees.total_fee) * 100) : 0}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${childData.fees.total_fee > 0 ? Math.min(100, Math.round((childData.fees.total_paid / childData.fees.total_fee) * 100)) : 0}%` }}
                                        />
                                    </div>
                                    {(childData.fees.balance || 0) > 0 && (
                                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                                            <p className="text-red-700 font-bold text-sm flex items-center gap-2">
                                                <AlertTriangle size={16} />
                                                Ugomba gutanga {(childData.fees.balance).toLocaleString()} RWF
                                            </p>
                                            <p className="text-red-500 text-xs mt-1">Tanga kugirango umwana wawe akomeze kwiga neza.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment history */}
                                {childData.fees.payments && childData.fees.payments.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-md p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Amatariki yo Gutanga</h3>
                                        <div className="space-y-2">
                                            {childData.fees.payments.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                                                    <div>
                                                        <p className="font-medium text-sm">{p.payment_method || 'Kwishyura'}</p>
                                                        <p className="text-xs text-gray-400">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : ''}</p>
                                                    </div>
                                                    <p className="font-bold text-green-700">{(p.amount_paid || 0).toLocaleString()} RWF</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                                <DollarSign size={60} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400">Nta makuru y'amafaranga araboneka</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: PAYMENT REMINDERS ── */}
                {activeTab === 'reminders' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-orange-100">
                        <div className="p-6 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-xl font-black text-orange-900 flex items-center gap-3">
                                <Send size={22} className="text-orange-600" /> Kwibutsa Kwishyura
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-3 py-1 bg-white rounded-full border border-orange-200 text-orange-700 font-bold">
                                    {childData.reminders.length} Reminder
                                </span>
                                {(() => {
                                    const sent = childData.reminders.filter(r => r.status === 'sent' || r.status === 'delivered').length;
                                    const failed = childData.reminders.filter(r => r.status === 'failed').length;
                                    const pending = childData.reminders.filter(r => r.status === 'pending').length;
                                    return (
                                        <>
                                            <span className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-700 font-bold">{sent} byahawe</span>
                                            {pending > 0 && <span className="px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200 text-yellow-700 font-bold">{pending} bitegerejwe</span>}
                                            {failed > 0 && <span className="px-3 py-1 bg-red-50 rounded-full border border-red-200 text-red-700 font-bold">{failed} byanze</span>}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {childData.reminders.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-orange-200">
                                    <Send size={36} className="text-orange-300" />
                                </div>
                                <p className="text-gray-500 font-bold">Nta kwibutsa kwakorewe</p>
                                <p className="text-xs text-gray-400 mt-1">Reminder zose za amafaranga zizagaragara hano</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {childData.reminders.map((r) => {
                                    const statusMap = {
                                        sent: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Yoherejwe', icon: CheckCircle },
                                        delivered: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Yashyikirijwe', icon: CheckCircle },
                                        failed: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Yanze', icon: XCircle },
                                        pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Bitegerejwe', icon: ClockIcon },
                                    };
                                    const s = statusMap[r.status] || statusMap.pending;
                                    const StatusIcon = s.icon;
                                    return (
                                        <div key={r.id} className="p-5 hover:bg-orange-50/40 transition-colors flex flex-col md:flex-row gap-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${s.color}`}>
                                                    <StatusIcon size={20} />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded border ${s.color}`}>{s.label}</span>
                                                    {r.reminder_type && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700">{r.reminder_type.replace(/_/g, ' ')}</span>
                                                    )}
                                                    {r.amount_due && (
                                                        <span className="text-xs font-black text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                                            {Number(r.amount_due).toLocaleString()} RWF
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-800 leading-relaxed break-words">{r.message}</p>
                                                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-500">
                                                    {r.student_first_name && (
                                                        <span className="flex items-center gap-1"><User size={12} />{r.student_first_name} {r.student_last_name}</span>
                                                    )}
                                                    {r.due_date && (
                                                        <span className="flex items-center gap-1"><Calendar size={12} />Iherezo: {new Date(r.due_date).toLocaleDateString('fr-RW')}</span>
                                                    )}
                                                    {r.sent_at && (
                                                        <span className="flex items-center gap-1"><CheckCircle size={12} />Yoherejwe: {new Date(r.sent_at).toLocaleString('fr-RW')}</span>
                                                    )}
                                                    {r.scheduled_at && !r.sent_at && (
                                                        <span className="flex items-center gap-1"><ClockIcon size={12} />{new Date(r.scheduled_at).toLocaleString('fr-RW')}</span>
                                                    )}
                                                </div>
                                                {r.error_message && (
                                                    <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⚠ {r.error_message}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: SMS LOGS ── */}
                {activeTab === 'sms_logs' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-indigo-100">
                        <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-xl font-black text-indigo-900 flex items-center gap-3">
                                <Inbox size={22} className="text-indigo-600" /> Ubutumwa SMS bwose Bwakwakiriye
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-3 py-1 bg-white rounded-full border border-indigo-200 text-indigo-700 font-bold">
                                    {childData.smsLogs.length} SMS
                                </span>
                                {(() => {
                                    const sent = childData.smsLogs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
                                    const failed = childData.smsLogs.filter(l => l.status === 'failed').length;
                                    return (
                                        <>
                                            <span className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-700 font-bold">{sent} OK</span>
                                            {failed > 0 && <span className="px-3 py-1 bg-red-50 rounded-full border border-red-200 text-red-700 font-bold">{failed} byanze</span>}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {childData.smsLogs.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-indigo-200">
                                    <MessageSquare size={36} className="text-indigo-300" />
                                </div>
                                <p className="text-gray-500 font-bold">Nta SMS yakwoherejwe</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                                {childData.smsLogs.map((log) => {
                                    const isSuccess = log.status === 'sent' || log.status === 'delivered';
                                    return (
                                        <div key={log.id} className="p-4 hover:bg-indigo-50/40 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    isSuccess ? 'bg-emerald-50 text-emerald-600' : log.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                                }`}>
                                                    <MessageSquare size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${
                                                            isSuccess ? 'bg-emerald-100 text-emerald-700' : log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>{log.status}</span>
                                                        {log.phone && <span className="text-[11px] text-gray-500 font-mono">{log.phone}</span>}
                                                        <span className="text-[11px] text-gray-400 ml-auto">
                                                            {log.created_at ? new Date(log.created_at).toLocaleString('fr-RW') : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 break-words leading-relaxed">{log.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                    <div className="space-y-3">
                        {childData.notifications.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                                <Bell size={60} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400">Nta makuru mashya</p>
                            </div>
                        ) : (
                            childData.notifications.map((notif, i) => (
                                <div key={i} className="bg-white rounded-2xl shadow-sm p-5 flex gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Bell size={18} className="text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">{notif.title || 'Amakuru'}</p>
                                        <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {notif.created_at ? new Date(notif.created_at).toLocaleString('fr-RW') : ''}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── Tab: MESSAGES (Ikinyabiziga) ── */}
                {activeTab === 'messages' && (
                    <ParentMessagesPanel
                        token={token}
                        linkedChildren={linkedChildren}
                        autoOpenThreadId={pendingOpenThread}
                        onAutoOpened={() => setPendingOpenThread(null)}
                    />
                )}

                {/* ── Tab: ATTENDANCE ── */}
                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-emerald-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
                            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-3">
                                <ClockIcon size={24} className="text-emerald-600" /> Raporo yo Kuhari
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">Real-time Data</span>
                            </div>
                        </div>
                        
                        {childData.attendance.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-emerald-200">
                                    <ClockIcon size={48} className="text-emerald-200" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">Nta raporo ihari kuri ubu</h4>
                                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">Nta raporo yo kuhari imaze kwandikwa kuri uyu mwana mu minsi ya vuba. Reba nyuma gato.</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Status Summary Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                                    {[
                                        { label: 'Yaje', status: 'present', color: 'from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100', icon: CheckCircle, shadow: 'shadow-emerald-100' },
                                        { label: 'Nsibi', status: 'absent', color: 'from-red-50 to-orange-50 text-red-700 border-red-100', icon: XCircle, shadow: 'shadow-red-100' },
                                        { label: 'Yakererewe', status: 'late', color: 'from-amber-50 to-yellow-50 text-amber-700 border-amber-100', icon: ClockIcon, shadow: 'shadow-amber-100' },
                                        { label: 'Uruhushya', status: 'excused', color: 'from-blue-50 to-indigo-50 text-blue-700 border-blue-100', icon: Calendar, shadow: 'shadow-blue-100' }
                                    ].map(stat => {
                                        const count = childData.attendance.filter(a => a.status === stat.status).length;
                                        return (
                                            <div key={stat.status} className={`bg-gradient-to-br ${stat.color} rounded-[2rem] p-6 border shadow-lg ${stat.shadow} transition-all hover:-translate-y-1`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-2 bg-white/50 rounded-xl backdrop-blur-sm">
                                                        <stat.icon size={22} />
                                                    </div>
                                                    <span className="text-4xl font-black tracking-tighter">{count}</span>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{stat.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Attendance Timeline */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h4 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Activity size={18} className="text-emerald-500" /> Amateka yo Kuhari
                                        </h4>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{childData.attendance.length} iminsi</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {childData.attendance.map((a, i) => (
                                            <div key={i} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${
                                                        a.status === 'present' ? 'bg-emerald-50 text-emerald-600' :
                                                        a.status === 'absent' ? 'bg-red-50 text-red-600' :
                                                        a.status === 'late' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        <ClockIcon size={28} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-lg leading-tight">
                                                            {new Date(a.date).toLocaleDateString('fr-RW', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-1">
                                                            {new Date(a.date).toLocaleDateString('fr-RW', { weekday: 'long' })}
                                                        </p>
                                                        {a.notes && (
                                                            <div className="mt-3 text-[11px] bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-gray-500 italic max-w-[200px] truncate">
                                                                "{a.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                                    a.status === 'present' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                                    a.status === 'absent' ? 'bg-red-500 text-white shadow-red-200' :
                                                    a.status === 'late' ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-blue-500 text-white shadow-blue-200'
                                                }`}>
                                                    {a.status === 'present' ? 'Yaje' : a.status === 'absent' ? 'Nsibi' : a.status === 'late' ? 'Kuhagera' : 'Uruhushya'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Parent Messages Panel (two-way thread chat with school) ──────────────────
const ParentMessagesPanel = ({ token, linkedChildren, autoOpenThreadId, onAutoOpened }) => {
    const [threads, setThreads] = useState([]);
    const [activeThread, setActiveThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [newMsg, setNewMsg] = useState({ subject: '', body: '', category: 'general', student_id: '' });

    const loadThreads = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parent-messages/my-threads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setThreads(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Ntibyashobotse gufata ubutumwa');
        } finally {
            setLoading(false);
        }
    }, [token]);

    const openThread = async (thread) => {
        setActiveThread(thread);
        try {
            const res = await axios.get(`${API_URL}/api/parent-messages/threads/${thread.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages || []);
            // Refresh thread list to clear unread count
            loadThreads();
        } catch (err) {
            toast.error('Ntibyashobotse kufungura iki giciro');
        }
    };

    useEffect(() => { loadThreads(); }, [loadThreads]);
    // Auto-refresh active thread every 15s
    useEffect(() => {
        if (!activeThread) return;
        const interval = setInterval(() => openThread(activeThread), 15000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeThread?.id]);

    // Auto-open a thread requested via the bell
    useEffect(() => {
        if (!autoOpenThreadId || threads.length === 0) return;
        const t = threads.find(x => x.id === Number(autoOpenThreadId));
        if (t) {
            openThread(t);
            onAutoOpened?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenThreadId, threads]);

    const handleReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            await axios.post(`${API_URL}/api/parent-messages/threads/${activeThread.id}/reply`,
                { body: reply.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReply('');
            openThread(activeThread);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ntibyagenze neza');
        } finally {
            setSending(false);
        }
    };

    const handleNewThread = async (e) => {
        e.preventDefault();
        if (!newMsg.subject.trim() || !newMsg.body.trim()) {
            toast.error('Andika umutwe n\'ubutumwa');
            return;
        }
        setSending(true);
        try {
            const payload = { ...newMsg, student_id: newMsg.student_id || null };
            await axios.post(`${API_URL}/api/parent-messages/threads`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Ubutumwa bwoherejwe ku ishuri');
            setNewMsg({ subject: '', body: '', category: 'general', student_id: '' });
            setComposing(false);
            loadThreads();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ntibyagenze neza');
        } finally {
            setSending(false);
        }
    };

    const categoryLabel = (c) => ({
        general: 'Rusange',
        fees: 'Amafaranga',
        discipline: 'Imyitwarire',
        academic: 'Amasomo',
        attendance: 'Kuhari',
        health: 'Ubuzima',
        other: 'Ibindi'
    }[c] || c);

    if (loading) return <div className="text-center py-12 text-gray-500">Birapakirwa...</div>;

    // Detail view of one thread
    if (activeThread) {
        return (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-3">
                    <button onClick={() => { setActiveThread(null); setMessages([]); loadThreads(); }}
                        className="p-2 hover:bg-white rounded-lg" title="Subira inyuma">
                        ←
                    </button>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-emerald-900 truncate">{activeThread.subject}</h3>
                        <p className="text-xs text-emerald-700">
                            {categoryLabel(activeThread.category)}
                            {activeThread.student_first && ` • ${activeThread.student_first} ${activeThread.student_last || ''}`}
                            {activeThread.status === 'closed' && ' • Cyarafunzwe'}
                        </p>
                    </div>
                </div>

                <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto bg-gray-50">
                    {messages.map(m => {
                        const mine = m.sender_role === 'parent';
                        return (
                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                    mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm'
                                }`}>
                                    {!mine && (
                                        <p className="text-[11px] font-bold text-emerald-700 mb-1">
                                            {m.sender_first ? `${m.sender_first} ${m.sender_last || ''}` : 'Ubuyobozi'} {m.sender_user_role && `• ${m.sender_user_role}`}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                                    <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-gray-400'}`}>
                                        {new Date(m.created_at).toLocaleString('fr-RW')}
                                        {m.sms_sent ? ' • SMS' : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {messages.length === 0 && <p className="text-center text-gray-400 py-8">Nta butumwa</p>}
                </div>

                {activeThread.status === 'open' ? (
                    <div className="p-3 border-t bg-white flex gap-2">
                        <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            placeholder="Andika igisubizo cyawe..."
                            rows={2}
                            className="flex-1 px-3 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-emerald-500"
                            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                        />
                        <button onClick={handleReply} disabled={sending || !reply.trim()}
                            className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold">
                            <Send size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="p-3 border-t bg-gray-50 text-center text-sm text-gray-500">
                        Iki giciro cyarafunzwe.
                    </div>
                )}
            </div>
        );
    }

    // List + compose
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <MessageSquare size={20} className="text-emerald-600" /> Ubutumwa n'Ishuri
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Vugana n'ubuyobozi kuri zose: amafaranga, amasomo, imyitwarire...</p>
                </div>
                <button onClick={() => setComposing(!composing)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2">
                    <PlusCircle size={16} /> {composing ? 'Reka' : 'Andika Bushya'}
                </button>
            </div>

            {composing && (
                <form onSubmit={handleNewThread} className="bg-white rounded-2xl shadow-md p-5 space-y-3 border-2 border-emerald-200">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Umutwe *</label>
                        <input type="text" value={newMsg.subject} onChange={e => setNewMsg({ ...newMsg, subject: e.target.value })}
                            placeholder="urugero: Ikibazo cy'amafaranga"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Icyiciro</label>
                            <select value={newMsg.category} onChange={e => setNewMsg({ ...newMsg, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                                <option value="general">Rusange</option>
                                <option value="fees">Amafaranga</option>
                                <option value="academic">Amasomo</option>
                                <option value="discipline">Imyitwarire</option>
                                <option value="attendance">Kuhari</option>
                                <option value="health">Ubuzima</option>
                                <option value="other">Ibindi</option>
                            </select>
                        </div>
                        {linkedChildren && linkedChildren.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Umwana (si itegeko)</label>
                                <select value={newMsg.student_id} onChange={e => setNewMsg({ ...newMsg, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                                    <option value="">— Hitamo —</option>
                                    {linkedChildren.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.reg_number})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ubutumwa *</label>
                        <textarea value={newMsg.body} onChange={e => setNewMsg({ ...newMsg, body: e.target.value })}
                            rows={4} placeholder="Andika ubutumwa bwawe hano..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <button type="submit" disabled={sending}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                        {sending ? <><RefreshCw size={16} className="animate-spin" /> Birakorwa...</> : <><Send size={16} /> Ohereza</>}
                    </button>
                </form>
            )}

            {threads.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                    <MessageSquare size={60} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">Nta butumwa burahari</p>
                    <p className="text-xs text-gray-400 mt-1">Kanda "Andika Bushya" kugirango ufungure ikiganiro</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {threads.map(t => (
                        <button key={t.id} onClick={() => openThread(t)}
                            className="w-full text-left bg-white rounded-2xl shadow-sm hover:shadow-md p-4 border border-transparent hover:border-emerald-200 transition-all">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold text-gray-900 truncate">{t.subject}</h4>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                            {categoryLabel(t.category)}
                                        </span>
                                        {t.status === 'closed' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">CYAFUNZWE</span>
                                        )}
                                        {t.unread_by_parent > 0 && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
                                                {t.unread_by_parent} bushya
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 truncate">
                                        <span className="font-semibold text-gray-700">
                                            {t.last_sender_role === 'parent' ? 'Wewe: ' : 'Ishuri: '}
                                        </span>
                                        {t.last_body || '—'}
                                    </p>
                                    {t.student_first && (
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {t.student_first} {t.student_last} ({t.reg_number})
                                        </p>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 whitespace-nowrap">
                                    {new Date(t.last_message_at).toLocaleDateString('fr-RW', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── No-child empty state with link-request form ──────────────────────────────
const NoChildLinkRequest = ({ user, token, logout, onLinked }) => {
    const [regNumber, setRegNumber] = useState('');
    const [relationship, setRelationship] = useState('father');
    const [childName, setChildName] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [loadingReqs, setLoadingReqs] = useState(true);

    const fetchMyRequests = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parents/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Could not load link requests', err);
        } finally {
            setLoadingReqs(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    const submit = async (e) => {
        e.preventDefault();
        if (!regNumber.trim() || !childName.trim()) {
            toast.error('Andika nimero ya munyeshuri n\'amazina yuzuye');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/parents/link-request`,
                { reg_number: regNumber.trim(), child_name: childName.trim(), relationship, notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Icyifuzo cyoherejwe! Ubuyobozi bwishuri buzasubiza vuba.');
            setRegNumber(''); setChildName(''); setNotes('');
            fetchMyRequests();
            onLinked && onLinked();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo. Gerageza nanone.');
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (s) => {
        const cls = s === 'approved' ? 'bg-green-100 text-green-700'
            : s === 'rejected' ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700';
        const label = s === 'approved' ? 'Yemejwe' : s === 'rejected' ? 'Yangijwe' : 'Iratangirwa';
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{label}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <User size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Muraho {user?.first_name || 'Mubyeyi'}</h1>
                            <p className="text-sm text-gray-500">Konekta umwana wawe kuri konti yawe</p>
                        </div>
                    </div>
                    <button onClick={logout} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
                        <LogOut size={16} /> Sohoka
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <Send size={20} /> Saba Guhuzwa n'Umwana Wawe
                        </h2>
                        <p className="text-emerald-50 text-sm mt-1">Tanga amakuru y'umwana wawe ari mu ishuri kandi ubuyobozi buzakwemerera.</p>
                    </div>
                    <form onSubmit={submit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nimero ya Munyeshuri (Reg Number) *</label>
                            <input type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)} required
                                placeholder="urugero: GTV/2025/001"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Amazina Yuzuye y'Umwana *</label>
                            <input type="text" value={childName} onChange={e => setChildName(e.target.value)} required
                                placeholder="urugero: UWASE Aline"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Isano</label>
                            <select value={relationship} onChange={e => setRelationship(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <option value="father">Papa</option>
                                <option value="mother">Mama</option>
                                <option value="guardian">Umurezi</option>
                                <option value="other">Indi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Ibisobanuro (si itegeko)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                placeholder="Ibindi byasanga byafasha ubuyobozi..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                        </div>
                        <button type="submit" disabled={submitting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                            {submitting ? <><RefreshCw size={18} className="animate-spin" /> Birakorwa...</> : <><Send size={18} /> Ohereza Icyifuzo</>}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Inbox size={18} /> Ibyifuzo Byanyu
                    </h3>
                    {loadingReqs ? (
                        <p className="text-sm text-gray-500">Birapakirwa...</p>
                    ) : myRequests.length === 0 ? (
                        <p className="text-sm text-gray-500">Nta cyifuzo cyari cyoherejwe.</p>
                    ) : (
                        <div className="space-y-2">
                            {myRequests.map(r => (
                                <div key={r.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{r.child_name} <span className="text-gray-500 font-normal">({r.reg_number})</span></p>
                                        <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</p>
                                        {r.review_notes && <p className="text-xs text-gray-600 mt-1 italic">"{r.review_notes}"</p>}
                                    </div>
                                    {statusBadge(r.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentPortal;

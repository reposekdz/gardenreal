import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import {
    Bell, Search, Filter, Check, CheckCheck, Trash2, Send,
    Users, DollarSign, GraduationCap, AlertTriangle, Calendar,
    Clock, ArrowRight, X, MessageSquare, BarChart3, RefreshCw,
    Mail, Phone, ChevronDown, StickyNote
} from 'lucide-react';

const Notifications = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState({ type: '', priority: '', is_read: '' });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [selectedTab, setSelectedTab] = useState('all');
    const [showSMSModal, setShowSMSModal] = useState(false);
    const [smsForm, setSmsForm] = useState({ message: '', recipients: 'all', trade: '', level: '' });
    const [parents, setParents] = useState([]);
    const [smsHistory, setSmsHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.append('page', pagination.page);
            params.append('limit', 20);
            if (filter.type) params.append('type', filter.type);
            if (filter.priority) params.append('priority', filter.priority);
            if (filter.is_read) params.append('is_read', filter.is_read);

            const response = await api.get(`/notifications2?${params.toString()}`);
            setNotifications(response.data.notifications);
            setPagination(prev => ({ ...prev, ...response.data.pagination }));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, pagination.page]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/notifications2/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchParents = async () => {
        try {
            const response = await api.get('/sms/parents');
            setParents(response.data || []);
        } catch (error) {
            console.error('Error fetching parents:', error);
        }
    };

    const fetchSMSHistory = async () => {
        try {
            const response = await api.get('/notifications2/sms-history');
            setSmsHistory(response.data || []);
        } catch (error) {
            console.error('Error fetching SMS history:', error);
        }
    };

    const refreshAll = async () => {
        setRefreshing(true);
        await Promise.all([fetchNotifications(), fetchStats()]);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotifications();
        fetchStats();
        fetchSMSHistory();
        if (['admin', 'accountant', 'dod'].includes(user?.role)) {
            fetchParents();
        }
    }, [fetchNotifications, user?.role]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications2/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true, read_at: new Date() } : n
            ));
            fetchStats();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications2/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date() })));
            fetchStats();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications2/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            fetchStats();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const sendBulkSMS = async () => {
        if (!smsForm.message.trim()) return;

        setSending(true);
        try {
            const response = await api.post('/sms/broadcast', {
                message: smsForm.message,
                trade_filter: smsForm.recipients === 'trade' ? smsForm.trade : null,
                level_filter: smsForm.recipients === 'trade' ? smsForm.level : null
            });

            alert(`SMS sent successfully! ${response.data.sent} messages delivered.`);
            setShowSMSModal(false);
            setSmsForm({ message: '', recipients: 'all', trade: '', level: '' });
            fetchSMSHistory();
        } catch (error) {
            alert('Failed to send SMS: ' + (error.response?.data?.message || error.message));
        } finally {
            setSending(false);
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            'sms_sent': '📱',
            'student_created': '👶',
            'student_updated': '✏️',
            'student_deleted': '🗑️',
            'student_status': '📊',
            'grade_added': '📝',
            'grade_updated': '📝',
            'payment_received': '💰',
            'payment_reminder': '💳',
            'link_approved': '✅',
            'link_rejected': '❌',
            'discipline_warning': '⚠️',
            'discipline_suspension': '🚫',
            'application_received': '📨',
            'application_approved': '🎉',
            'application_rejected': '😔',
            'staff_created': '👨‍🏫',
            'staff_deleted': '👋',
            'system': '⚙️',
            'announcement': '📢',
            'general': '📋'
        };
        return icons[type] || '🔔';
    };

    const getTypeColor = (type) => {
        const colors = {
            'sms_sent': 'bg-green-100 text-green-700',
            'student_created': 'bg-blue-100 text-blue-700',
            'student_updated': 'bg-blue-100 text-blue-700',
            'grade_added': 'bg-purple-100 text-purple-700',
            'payment_received': 'bg-green-100 text-green-700',
            'payment_reminder': 'bg-yellow-100 text-yellow-700',
            'link_approved': 'bg-green-100 text-green-700',
            'discipline_warning': 'bg-red-100 text-red-700',
            'discipline_suspension': 'bg-red-100 text-red-700',
            'application_received': 'bg-indigo-100 text-indigo-700',
            'application_approved': 'bg-green-100 text-green-700',
            'announcement': 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'bg-red-500',
            'high': 'bg-orange-500',
            'normal': 'bg-blue-500',
            'low': 'bg-gray-400'
        };
        return colors[priority] || colors.normal;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString();
    };

    const tabs = [
        { id: 'all', label: 'All', icon: Bell, count: stats?.total || 0 },
        { id: 'unread', label: 'Unread', icon: Mail, count: stats?.unread_count || 0 },
        { id: 'urgent', label: 'Urgent', icon: AlertTriangle, count: stats?.unread_urgent || 0 },
        { id: 'grades', label: 'Grades', icon: GraduationCap, count: stats?.by_type?.find(t => t.notification_type === 'grade_added')?.count || 0 },
        { id: 'payments', label: 'Payments', icon: DollarSign, count: stats?.by_type?.find(t => t.notification_type?.includes('payment'))?.count || 0 },
    ];

    const filteredNotifications = notifications.filter(n => {
        if (selectedTab === 'unread') return !n.is_read;
        if (selectedTab === 'urgent') return n.priority === 'urgent' && !n.is_read;
        if (selectedTab === 'grades') return n.notification_type?.includes('grade');
        if (selectedTab === 'payments') return n.notification_type?.includes('payment');
        return true;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Notifications Center
                        </h1>
                        <p className="text-gray-600 mt-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Last updated: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={refreshAll}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {['admin', 'accountant', 'dod'].includes(user?.role) && (
                            <button
                                onClick={() => setShowSMSModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                            >
                                <Send className="w-4 h-4" />
                                Send SMS
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Unread</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.unread_count}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Urgent</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.unread_urgent}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Categories</p>
                                    <p className="text-3xl font-bold text-indigo-600">{stats.by_type?.length || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar - Tabs */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                Categories
                            </h3>
                            <div className="space-y-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedTab === tab.id
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className="w-5 h-5" />
                                            <span className="font-medium">{tab.label}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-50 text-gray-700 transition-all"
                                >
                                    <CheckCheck className="w-5 h-5 text-green-600" />
                                    Mark All Read
                                </button>
                                <button
                                    onClick={() => navigate('/parents')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 transition-all"
                                >
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Manage Parents
                                </button>
                            </div>
                        </div>

                        {/* Recent SMS History */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-4">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Recent SMS
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {smsHistory.slice(0, 5).map((sms, idx) => (
                                    <div key={idx} className="p-2 bg-gray-50 rounded-lg text-xs">
                                        <p className="font-medium text-gray-700 truncate">{sms.message}</p>
                                        <p className="text-gray-500">{sms.phone} • {formatDate(sms.created_at)}</p>
                                    </div>
                                ))}
                                {smsHistory.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No SMS history</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Notifications List */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Filters */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filter.type}
                                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="student_created">Student Created</option>
                                    <option value="student_updated">Student Updated</option>
                                    <option value="grade_added">Grade Added</option>
                                    <option value="payment_received">Payment Received</option>
                                    <option value="link_approved">Link Approved</option>
                                    <option value="discipline_warning">Discipline</option>
                                    <option value="announcement">Announcement</option>
                                </select>
                                <select
                                    value={filter.priority}
                                    onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="normal">Normal</option>
                                    <option value="low">Low</option>
                                </select>
                                <select
                                    value={filter.is_read}
                                    onChange={(e) => setFilter({ ...filter, is_read: e.target.value })}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="false">Unread</option>
                                    <option value="true">Read</option>
                                </select>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-white/50">
                                    <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="mt-3 text-gray-500">Loading notifications...</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-white/50">
                                    <div className="text-6xl mb-4">🔔</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                                    <p className="text-gray-500">No notifications to display</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border-l-4 transition-all hover:shadow-xl hover:scale-[1.01] ${notification.is_read ? 'border-gray-200 opacity-75' : 'border-blue-500'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-3xl">{getTypeIcon(notification.notification_type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className={`font-bold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.notification_type)}`}>
                                                        {notification.notification_type?.replace(/_/g, ' ')}
                                                    </span>
                                                    {!notification.is_read && (
                                                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">New</span>
                                                    )}
                                                    {notification.priority === 'urgent' && (
                                                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> Urgent
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{notification.message}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(notification.created_at)}
                                                    </span>
                                                    {notification.action_url && (
                                                        <button
                                                            onClick={() => navigate(notification.action_url)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                        >
                                                            {notification.action_label || 'View'} <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-600 font-medium">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SMS Modal */}
            {showSMSModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Send className="w-6 h-6" />
                                    Send Bulk SMS
                                </h2>
                                <button
                                    onClick={() => setShowSMSModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-blue-100 mt-1">Send SMS to parents of students</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['all', 'trade', 'level'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSmsForm({ ...smsForm, recipients: opt })}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${smsForm.recipients === opt
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {opt === 'all' ? 'All Parents' : opt === 'trade' ? 'By Trade' : 'By Level'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {smsForm.recipients === 'trade' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Trade</label>
                                    <select
                                        value={smsForm.trade}
                                        onChange={(e) => setSmsForm({ ...smsForm, trade: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Trades</option>
                                        <option value="Software Development">Software Development</option>
                                        <option value="Automobile Technology">Automobile Technology</option>
                                        <option value="Building and Construction">Building and Construction</option>
                                    </select>
                                </div>
                            )}

                            {smsForm.recipients === 'level' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Level</label>
                                    <select
                                        value={smsForm.level}
                                        onChange={(e) => setSmsForm({ ...smsForm, level: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Levels</option>
                                        <option value="Level 1">Level 1</option>
                                        <option value="Level 2">Level 2</option>
                                        <option value="Level 3">Level 3</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    value={smsForm.message}
                                    onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                                    placeholder="Enter your message..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">{smsForm.message.length}/160 characters</p>
                            </div>

                            <button
                                onClick={sendBulkSMS}
                                disabled={sending || !smsForm.message.trim()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send SMS
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;

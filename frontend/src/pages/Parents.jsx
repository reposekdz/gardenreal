import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Heart, AlertCircle, CheckCircle, CreditCard, History, Send, Link2, Clock,
    ChevronRight, DollarSign, BookOpen, Calendar, Bell, Shield, User, Phone,
    Mail, MapPin, Award, TrendingUp, FileText, MessageSquare, Settings,
    LogOut, Menu, X, Eye, Download, GraduationCap, Activity, AlertTriangle,
    Check, XCircle, Plane, Home, Wallet, BarChart3, Plus, Send as ApplyIcon,
    Upload, Image, Search, Filter, RefreshCw, MoreVertical, MailOpen,
    FileCheck, Wallet2, BookMarked, ClipboardList, BellRing, Info, ChevronDown,
    Newspaper, MessageCirclePlus
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const TRADES = ['Software Development', 'Automobile Technology', 'Building and Construction'];
const LEVELS = {
    'Software Development': ['Level 3', 'Level 4', 'Level 5'],
    'Automobile Technology': ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'],
    'Building and Construction': ['Level 3', 'Level 4', 'Level 5'],
};

const Parents = () => {
    const { token, user, logout } = useAuthStore();
    const headers = { Authorization: `Bearer ${token}` };
    const isParent = user.role === 'parent';

    const [children, setChildren] = useState([]);
    const [linkRequests, setLinkRequests] = useState([]);
    const [disciplineRecords, setDisciplineRecords] = useState([]);
    const [fees, setFees] = useState([]);
    const [payHistory, setPayHistory] = useState([]);
    const [leaveRecords, setLeaveRecords] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [smsLogs, setSmsLogs] = useState([]);
    const [loadingSms, setLoadingSms] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    // Forms
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkForm, setLinkForm] = useState({ student_name: '', student_trade: '', student_level: '', student_gender: '' });
    const [submittingLink, setSubmittingLink] = useState(false);

    const [showPayModal, setShowPayModal] = useState(false);
    const [payTarget, setPayTarget] = useState(null);
    const [payForm, setPayForm] = useState({ fee_id: '', amount_paid: '', payment_method: 'bank_transfer', transaction_ref: '' });
    const [payLoading, setPayLoading] = useState(false);

    // Receipt upload state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptTarget, setReceiptTarget] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptDescription, setReceiptDescription] = useState('');
    const [receiptLoading, setReceiptLoading] = useState(false);

    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '', student_id: '' });
    const leaveLoading = useState(false);

    // Application form state
    const [showAppForm, setShowAppForm] = useState(false);
    const [applications, setApplications] = useState([]);
    const [appLoading, setAppLoading] = useState(false);
    const [appForm, setAppForm] = useState({
        student_name: '', trade: '', level: '', gender: ''
    });

    // News state
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

    // Contact/SMS state
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactForm, setContactForm] = useState({ subject: '', message: '' });
    const [contactLoading, setContactLoading] = useState(false);
    const [sentMessages, setSentMessages] = useState([]);

    // SMS Balance state
    const [smsBalance, setSmsBalance] = useState(null);
    const [smsLoading, setSmsLoading] = useState(false);

    // Search and filter state for children
    const [childSearch, setChildSearch] = useState('');
    const [childFilter, setChildFilter] = useState('all'); // all, active, suspended, sick, left

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [childRes, reqRes, discRes, payData, histRes, leaveRes, appRes, notifRes] = await Promise.all([
                axios.get(`${API_URL}/api/parents/students`, { headers }),
                axios.get(`${API_URL}/api/parents/my-requests`, { headers }),
                axios.get(`${API_URL}/api/discipline`, { headers }),
                axios.get(`${API_URL}/api/parent-payments/fees`, { headers }),
                axios.get(`${API_URL}/api/parent-payments/history`, { headers }),
                axios.get(`${API_URL}/api/discipline/leaves`, { headers }),
                axios.get(`${API_URL}/api/applications`, { headers }),
                axios.get(`${API_URL}/api/notifications`, { headers }),
            ]);
            setChildren(childRes.data);
            setLinkRequests(reqRes.data);
            const approvedIds = childRes.data.filter(c => c.link_status === 'approved').map(c => c.id);
            setDisciplineRecords(discRes.data.filter(r => approvedIds.includes(r.student_id)));
            setFees(payData.data.fees || []);
            setPayHistory(histRes.data);
            setLeaveRecords(leaveRes.data);
            setApplications(appRes.data || []);

            // Process notifications
            const notifs = notifRes.data || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);

            // Fetch grades for approved children
            if (approvedIds.length > 0) {
                try {
                    const gradesRes = await axios.get(`${API_URL}/api/parent/grades?student_id=${approvedIds[0]}`, { headers });
                    setGrades(gradesRes.data || []);
                } catch { setGrades([]); }
            }

            // Set first child as selected if available
            if (childRes.data.length > 0 && !selectedChild) {
                setSelectedChild(childRes.data[0]);
            }
        } catch { toast.error('Habaye ikibazo mu gufungura amakuru'); }
        finally { setLoading(false); }
    };

    // Fetch SMS logs for parent
    const fetchSmsLogs = async () => {
        setLoadingSms(true);
        try {
            const res = await axios.get(`${API_URL}/api/notifications/sms-history`, { headers });
            const smsData = res.data || [];
            setSmsLogs(smsData);
            // Add SMS to notifications
            const smsNotifications = smsData.map(sms => ({
                id: `sms-${sms.id}`,
                type: 'sms',
                title: 'SMS Yoherejwe',
                message: sms.message || 'SMS yoherejwe',
                date: sms.created_at || sms.sent_at || new Date().toISOString(),
                read: false,
                phone: sms.phone
            }));
            setNotifications(prev => [...smsNotifications, ...prev]);
            setUnreadCount(prev => prev + smsNotifications.length);
        } catch (err) {
            console.error('Error fetching SMS logs:', err);
            setSmsLogs([]);
        } finally {
            setLoadingSms(false);
        }
    };

    // Fetch news for parent dashboard
    const fetchNews = async () => {
        setNewsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/news?status=published&limit=10`, { headers });
            setNews(res.data.slice(0, 6) || []);
        } catch (err) {
            console.error('Error fetching news:', err);
            setNews([]);
        } finally {
            setNewsLoading(false);
        }
    };

    // Contact school (send message)
    const contactSchool = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            await axios.post(`${API_URL}/api/notifications/contact`, contactForm, { headers });
            toast.success('Ubutumwa bwoherejwe! Twabakugeraho vuba');
            setSentMessages(prev => [{
                ...contactForm,
                id: Date.now(),
                sent_at: new Date().toISOString(),
                status: 'sent'
            }, ...prev]);
            setContactForm({ subject: '', message: '' });
            setShowContactForm(false);
        } catch (err) {
            toast.error('Ikibazo mu gutuma ubutumwa');
        } finally {
            setContactLoading(false);
        }
    };

    // Fetch SMS balance
    const fetchSMSBalance = async () => {
        setSmsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/finance/sms/balance`, { headers });
            setSmsBalance(res.data);
        } catch (err) {
            console.error('Error fetching SMS balance:', err);
        } finally {
            setSmsLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, { headers });
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.put(`${API_URL}/api/notifications/read-all`, {}, { headers });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('Byose byatangiye kubonwa');
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => { if (isParent) { fetchAll(); fetchNews(); fetchSMSBalance(); } }, []);

    // Fetch SMS logs when tab changes to SMS
    useEffect(() => {
        if (isParent && activeTab === 'sms') {
            fetchSmsLogs();
        }
    }, [activeTab]);

    // Fetch news when tab changes to news
    useEffect(() => {
        if (isParent && activeTab === 'news') {
            fetchNews();
            fetchSMSBalance();
        }
    }, [activeTab]);

    // Fetch SMS balance when tab changes to contact
    useEffect(() => {
        if (isParent && activeTab === 'contact') {
            fetchSMSBalance();
        }
    }, [activeTab]);

    const submitLinkRequest = async (e) => {
        e.preventDefault();
        if (!linkForm.student_name.trim()) return toast.error('Injiza izina ry\'umwana wawe');
        setSubmittingLink(true);
        try {
            await axios.post(`${API_URL}/api/parents/link-request`, linkForm, { headers });
            toast.success('✅ Ubusabe bwakiriwe! Umuyobozi azabusuzuma. Uzabona SMS.');
            setShowLinkForm(false);
            setLinkForm({ student_name: '', student_trade: '', student_level: '', student_gender: '' });
            // Redirect to wait confirmation page
            navigate('/wait-confirmation');
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
        finally { setSubmittingLink(false); }
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        if (!payForm.fee_id || !payForm.amount_paid) return toast.error('Uzuza amakuru yose');
        setPayLoading(true);
        try {
            await axios.post(`${API_URL}/api/parent-payments/pay`, {
                student_id: payTarget.id,
                fee_id: payForm.fee_id,
                amount_paid: parseFloat(payForm.amount_paid),
                payment_method: payForm.payment_method || 'bank_transfer',
                transaction_ref: payForm.transaction_ref || '',
            }, { headers });
            toast.success('🎉 Kwishyura byagenze neza! Uzabona SMS.');
            setShowPayModal(false);
            setPayForm({ fee_id: '', amount_paid: '', payment_method: 'bank_transfer', transaction_ref: '' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Kwishyura byanze'); }
        finally { setPayLoading(false); }
    };

    // Upload receipt for payment
    const uploadReceipt = async (e) => {
        e.preventDefault();
        if (!receiptFile) return toast.error('Hitamo igitabo cyishyura');
        setReceiptLoading(true);
        try {
            const formData = new FormData();
            formData.append('receipt', receiptFile);
            formData.append('payment_id', receiptTarget.payment_id);
            formData.append('description', receiptDescription);

            await axios.post(`${API_URL}/api/parent-payments/receipt`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            toast.success('📸 Igitabo cyishyura cyashyizweho!');
            setShowReceiptModal(false);
            setReceiptFile(null);
            setReceiptDescription('');
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Igitabo nticyashyizweho'); }
        finally { setReceiptLoading(false); }
    };

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveForm.student_id || !leaveForm.leave_type || !leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) {
            return toast.error('Uzuza amakuru yose');
        }
        try {
            await axios.post(`${API_URL}/api/discipline/leaves`, leaveForm, { headers });
            toast.success('✅ Icyifuzo cyatumijwe! Uzabona SMS iyo bisuzume.');
            setShowLeaveForm(false);
            setLeaveForm({ leave_type: '', start_date: '', end_date: '', reason: '', student_id: '' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
    };

    // Submit new student application
    const submitApplication = async (e) => {
        e.preventDefault();
        if (!appForm.student_name || !appForm.trade || !appForm.level || !appForm.gender) {
            return toast.error('Uzuza amakuru yose (izina ry umwana, ikiganiro, level, igitsina)');
        }
        setAppLoading(true);
        try {
            await axios.post(`${API_URL}/api/applications`, {
                student_name: appForm.student_name,
                trade: appForm.trade,
                level: appForm.level,
                gender: appForm.gender,
                parent_name: user.first_name + ' ' + user.last_name,
                parent_phone: user.phone
            }, { headers });
            toast.success('Ubusase bwatangiye! Uzabona SMS iyo busuzume.');
            setShowAppForm(false);
            setAppForm({ student_name: '', trade: '', level: '', gender: '' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Habaye ikibazo'); }
        finally { setAppLoading(false); }
    };

    // Calculate balance for a child
    const getChildBalance = (childId) => {
        const childFees = fees;
        const totalFee = childFees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
        const childPayments = payHistory.filter(p => p.student_id === childId);
        const totalPaid = childPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        return { totalFee, totalPaid, balance: totalFee - totalPaid };
    };

    // Get child specific discipline records
    const getChildDiscipline = (childId) => {
        return disciplineRecords.filter(r => r.student_id === childId);
    };

    // Get child specific leave records
    const getChildLeaves = (childId) => {
        return leaveRecords.filter(l => l.student_id === childId);
    };

    // Get child specific grades
    const getChildGrades = (childId) => {
        return grades.filter(g => g.student_id === childId);
    };

    // Get child specific payments
    const getChildPayments = (childId) => {
        return payHistory.filter(p => p.student_id === childId);
    };

    // Filter children based on search and status
    const filteredChildren = children.filter(child => {
        const matchesSearch = child.first_name?.toLowerCase().includes(childSearch.toLowerCase()) ||
            child.last_name?.toLowerCase().includes(childSearch.toLowerCase()) ||
            child.reg_number?.toLowerCase().includes(childSearch.toLowerCase());
        const matchesStatus = childFilter === 'all' || child.current_status === childFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats for dashboard
    const totalBalance = children.reduce((sum, child) => {
        const bal = getChildBalance(child.id);
        return sum + (child.link_status === 'approved' ? bal.balance : 0);
    }, 0);

    const totalPaid = children.reduce((sum, child) => {
        const bal = getChildBalance(child.id);
        return sum + (child.link_status === 'approved' ? bal.totalPaid : 0);
    }, 0);

    const approvedChildren = children.filter(c => c.link_status === 'approved');

    if (!isParent) return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white shadow-xl">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Heart size={28} /> Ubuyobozi bw'Ababyeyi
                </h2>
                <p className="text-primary-200 text-sm mt-1">Reba kandi uhindure konti z'ababyeyi n'abyo bagaho</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <Heart size={64} className="mx-auto mb-4 text-primary-200" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Ubuyobozi bw'Ababyeyi</h3>
                <p className="text-gray-400 mb-6">Shyiramo itsinda ryababyeyi kugira ngo ubashe kubafashanya.</p>
                <a href="/link-manager" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors">
                    <Link2 size={18} /> Go to Link Manager
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 sticky top-0 z-30 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="font-bold">Urubuga rw'Ababyeyi</h1>
                            <p className="text-xs text-primary-200">{user.first_name} {user.last_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell - Mobile */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                        {user.first_name?.charAt(0)}
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">Urubuga rw'Ababyeyi</h1>
                        <p className="text-sm text-gray-500">{user.first_name} {user.last_name} • {user.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell - Desktop */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 hover:bg-primary-50 rounded-xl transition-colors relative rounded-xl relative"
                        >
                            {unreadCount > 0 ? (
                                <BellRing size={22} className="text-primary-600" />
                            ) : (
                                <Bell size={22} className="text-gray-600" />
                            )}
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <BellRing size={18} /> Amatangazo
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                                        >
                                            Byose bonge
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Bell size={40} className="mx-auto mb-2 text-gray-300" />
                                            <p>Nta matangazo</p>
                                        </div>
                                    ) : (
                                        notifications.slice(0, 10).map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className={`p-4 border-b border-gray-50 hover:bg-primary-50 cursor-pointer transition-colors ${!notif.read ? 'bg-primary-50/50' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'sms' ? 'bg-green-100' : 'bg-primary-100'}`}>
                                                        {notif.type === 'sms' ? (
                                                            <MessageSquare size={18} className="text-primary-600" />
                                                        ) : (
                                                            <BellRing size={18} className="text-primary-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                                                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notif.message}</p>
                                                        <p className="text-gray-400 text-xs mt-2">
                                                            {new Date(notif.date).toLocaleDateString('rw-RW', {
                                                                day: 'numeric', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {!notif.read && (
                                                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-3 border-t border-gray-100">
                                    <button
                                        onClick={() => { setShowNotifications(false); setActiveTab('notifications'); }}
                                        className="w-full py-2 text-primary-600 font-bold text-sm hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        Reba byose →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Sokudugudu</span>
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-primary-500 to-primary-700 min-h-screen fixed left-0 top-0 text-white">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Heart size={28} className="fill-primary-300" />
                            </div>
                            <div>
                                <h2 className="font-black text-xl">Urubuga rw'Ababyeyi</h2>
                                <p className="text-xs text-primary-200">Garden TVET</p>
                            </div>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                                    {user.first_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold">{user.first_name} {user.last_name}</p>
                                    <p className="text-xs text-primary-200">{user.phone}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {[
                                { id: 'overview', icon: Heart, label: 'Ibirimo' },
                                { id: 'apply', icon: ApplyIcon, label: 'Gusaba' },
                                { id: 'children', icon: User, label: 'Abana Bawe' },
                                { id: 'discipline', icon: Shield, label: 'Imyitwarire' },
                                { id: 'leaves', icon: Plane, label: 'Amasomo' },
                                { id: 'fees', icon: DollarSign, label: 'Kwishyura' },
                                { id: 'requests', icon: Link2, label: 'Ibyifuzo' },
                                { id: 'sms', icon: MessageSquare, label: 'SMS' },
                                { id: 'performance', icon: TrendingUp, label: 'Ibyerekeyo' },
                                { id: 'news', icon: Newspaper, label: 'Amatangazo' },
                                { id: 'contact', icon: MessageCirclePlus, label: 'Uburyo bw\'ivyongeramo' },
                                { id: 'notifications', icon: BellRing, label: 'Notifike' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-white text-primary-600 shadow-lg' : 'hover:bg-white/10'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                    {item.id === 'notifications' && unreadCount > 0 && (
                                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-4 mt-auto bg-primary-800/30">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                            <LogOut size={18} /> Sokudugudu (Logout)
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-72 p-4 lg:p-8 pb-24">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Welcome Card */}
                            <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl">
                                <h2 className="text-2xl lg:text-3xl font-black mb-2">Murakaza neza, {user.first_name}! 👋</h2>
                                <p className="text-primary-100 mb-4">Kurikirana abana bawe mu ishuri ryose.🏫</p>

                                {approvedChildren.length === 0 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setShowLinkForm(true)}
                                            className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition-colors"
                                        >
                                            💎 Kwihuza numwana wawe
                                        </button>
                                    </div>
                                )}

                                {approvedChildren.length > 0 && (
                                    <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                                            <div className="text-3xl font-black">{approvedChildren.length}</div>
                                            <div className="text-xs text-primary-200">Abana</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                                            <div className="text-3xl font-black">{payHistory.length}</div>
                                            <div className="text-xs text-primary-200">Kwishyura</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                                            <div className="text-3xl font-black">{totalPaid.toLocaleString()}</div>
                                            <div className="text-xs text-primary-200">RWF Yishyuye</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                                            <div className="text-3xl font-black">{linkRequests.filter(r => r.status === 'pending').length}</div>
                                            <div className="text-xs text-primary-200">Ibyifuzo</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions - Redesigned */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={() => setShowLinkForm(true)} className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-white group">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Link2 size={26} />
                                    </div>
                                    <p className="font-bold">Kwihuza Umwana</p>
                                    <p className="text-xs text-primary-200 mt-1">Numwana</p>
                                </button>
                                {approvedChildren.length > 0 && (
                                    <>
                                        <button onClick={() => { setActiveTab('fees'); setShowPayModal(true); }} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:scale-105 transition-all border-2 border-transparent hover:border-green-200 group">
                                            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Wallet2 size={26} className="text-green-600" />
                                            </div>
                                            <p className="font-bold text-gray-800">Kwishyura</p>
                                            <p className="text-xs text-gray-400 mt-1">Shyigikore</p>
                                        </button>
                                        <button onClick={() => setActiveTab('discipline')} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:scale-105 transition-all border-2 border-transparent hover:border-blue-200 group">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Shield size={26} className="text-blue-600" />
                                            </div>
                                            <p className="font-bold text-gray-800">Imyitwarire</p>
                                            <p className="text-xs text-gray-400 mt-1">Reba</p>
                                        </button>
                                        <button onClick={() => setShowLeaveForm(true)} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl hover:scale-105 transition-all border-2 border-transparent hover:border-purple-200 group">
                                            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <Plane size={26} className="text-purple-600" />
                                            </div>
                                            <p className="font-bold text-gray-800">Sabira Uruhushya</p>
                                            <p className="text-xs text-gray-400 mt-1">Umwana</p>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Linked Children Cards - Modern Design */}
                            {approvedChildren.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                            <User className="text-primary-600" /> Abana Bawe
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('children')}
                                            className="text-primary-600 font-bold text-sm hover:underline"
                                        >
                                            Reba byose →
                                        </button>
                                    </div>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {approvedChildren.slice(0, 3).map(child => {
                                            const balance = getChildBalance(child.id);
                                            const discipline = getChildDiscipline(child.id);
                                            return (
                                                <div
                                                    key={child.id}
                                                    onClick={() => { setSelectedChild(child); setActiveTab('children'); }}
                                                    className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all border border-gray-100 cursor-pointer"
                                                >
                                                    {/* Header with avatar */}
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                            {child.first_name?.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-lg text-gray-800">{child.first_name} {child.last_name}</p>
                                                            <p className="text-sm text-gray-400">{child.reg_number}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${child.current_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {child.current_status || 'Active'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Trade info */}
                                                    <div className="bg-primary-50 rounded-xl p-3 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen size={16} className="text-primary-600" />
                                                            <span className="font-medium text-primary-800">{child.trade}</span>
                                                        </div>
                                                        <p className="text-xs text-primary-600 ml-6">{child.level}</p>
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                                            <p className="text-xs text-gray-500">Imyitwarire</p>
                                                            <p className={`font-bold ${discipline.length > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                                                {discipline.length > 0 ? `${discipline.length} ikibazo` : 'Nta kibazo'}
                                                            </p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                                            <p className="text-xs text-gray-500">Ibyishyuye</p>
                                                            <p className={`font-bold ${balance.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {balance.balance > 0 ? `${balance.balance.toLocaleString()} RWF` : 'Byose'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                                                        <Eye size={16} /> Reba Byose
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Pending Requests */}
                            {linkRequests.filter(r => r.status === 'pending').length > 0 && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                                    <h3 className="font-bold text-yellow-800 mb-4 flex items-center gap-2">
                                        <Clock size={20} /> Ibyifuzo Bisiganye
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {linkRequests.filter(r => r.status === 'pending').map(r => (
                                            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                                        <Clock size={18} className="text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{r.student_name}</p>
                                                        <p className="text-xs text-gray-400">Ugace</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            {payHistory.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <History size={20} className="text-primary-600" /> Ibikorwa Biheruka
                                    </h3>
                                    <div className="space-y-3">
                                        {payHistory.slice(0, 5).map((payment, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                                        <CheckCircle size={18} className="text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{payment.student_name || 'Umwana'}</p>
                                                        <p className="text-xs text-gray-400">{new Date(payment.payment_date).toLocaleDateString('rw-RW')}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-green-600">{Number(payment.amount_paid).toLocaleString()} RWF</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Children Tab - Advanced Modern Design */}
                    {activeTab === 'children' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <User className="text-primary-600" /> Abana Bawe
                                    </h2>
                                    <p className="text-gray-500 text-sm">Reba amakuru yose kuri baana bawe</p>
                                </div>
                                <button
                                    onClick={() => setShowLinkForm(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Plus size={18} /> Funganya Umwana
                                </button>
                            </div>

                            {/* Search and Filter */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Shakisha umwana..."
                                            value={childSearch}
                                            onChange={(e) => setChildSearch(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {['all', 'active', 'suspended', 'sick', 'left'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setChildFilter(status)}
                                                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${childFilter === status
                                                    ? 'bg-primary-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {status === 'all' ? 'Byose' : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {filteredChildren.length === 0 ? (
                                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
                                        <User size={48} className="text-primary-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Nta Mana Arfungunzwe</h3>
                                    <p className="text-gray-400 mb-8 max-w-md mx-auto">Funganya abana bawe kugira nibashobore kubona amakuru yose yaschool.</p>
                                    <button
                                        onClick={() => setShowLinkForm(true)}
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg"
                                    >
                                        <Link2 size={20} /> Kwihuza numwana wawe
                                    </button>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {filteredChildren.map(child => {
                                        const balance = getChildBalance(child.id);
                                        const discipline = getChildDiscipline(child.id);
                                        const leaves = getChildLeaves(child.id);
                                        const payments = getChildPayments(child.id);
                                        const childGrades = getChildGrades(child.id);
                                        const isSelected = selectedChild?.id === child.id;

                                        return (
                                            <div
                                                key={child.id}
                                                className={`bg-white rounded-3xl shadow-sm border-2 transition-all cursor-pointer ${isSelected ? 'border-primary-500 shadow-xl' : 'border-transparent hover:border-primary-200 hover:shadow-lg'
                                                    }`}
                                                onClick={() => setSelectedChild(child)}
                                            >
                                                {/* Card Header */}
                                                <div className="p-6 border-b border-gray-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                            {child.first_name?.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-xl text-gray-800">{child.first_name} {child.last_name}</h3>
                                                            <p className="text-gray-500 text-sm">{child.reg_number}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${child.current_status === 'active' ? 'bg-green-100 text-green-700' :
                                                                    child.current_status === 'suspended' ? 'bg-red-100 text-red-700' :
                                                                        child.current_status === 'sick' ? 'bg-yellow-100 text-yellow-700' :
                                                                            'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {child.current_status || 'Active'}
                                                                </span>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${child.link_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    {child.link_status === 'approved' ? 'Afite' : 'Ugace'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-6 space-y-4">
                                                    {/* Trade & Level */}
                                                    <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                                            <BookOpen size={18} className="text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-primary-800">{child.trade}</p>
                                                            <p className="text-xs text-primary-600">{child.level}</p>
                                                        </div>
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* Balance */}
                                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Wallet2 size={16} className="text-green-600" />
                                                                <span className="text-xs font-bold text-green-700">Ibyishyuye</span>
                                                            </div>
                                                            <p className={`font-bold text-lg ${balance.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                {balance.balance > 0 ? `${balance.balance.toLocaleString()} RWF` : 'Byose'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{balance.totalPaid.toLocaleString()} RWF yishyuye</p>
                                                        </div>

                                                        {/* Discipline */}
                                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Shield size={16} className="text-blue-600" />
                                                                <span className="text-xs font-bold text-blue-700">Imyitwarire</span>
                                                            </div>
                                                            <p className={`font-bold text-lg ${discipline.length > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                                                {discipline.length > 0 ? `${discipline.length} ikibazo` : 'Nta kibazo'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{leaves.length} ureroma</p>
                                                        </div>

                                                        {/* Payments */}
                                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CreditCard size={16} className="text-purple-600" />
                                                                <span className="text-xs font-bold text-purple-700">Payments</span>
                                                            </div>
                                                            <p className="font-bold text-lg text-purple-600">{payments.length}</p>
                                                            <p className="text-xs text-gray-500">ibikorwa {payments.length}</p>
                                                        </div>

                                                        {/* Grades */}
                                                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Award size={16} className="text-yellow-600" />
                                                                <span className="text-xs font-bold text-yellow-700">Notes</span>
                                                            </div>
                                                            <p className="font-bold text-lg text-yellow-600">{childGrades.length}</p>
                                                            <p className="text-xs text-gray-500">igikoni {childGrades.length}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="p-4 pt-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setActiveTab('performance'); }}
                                                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <TrendingUp size={18} /> Reba Byose
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Performance Tab */}
                    {activeTab === 'performance' && selectedChild && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveTab('children')} className="p-2 hover:bg-primary-50 rounded-lg transition-colors">
                                    <ChevronRight className="rotate-180" size={24} />
                                </button>
                                <h2 className="text-2xl font-bold text-gray-800">Ibyerekeye: {selectedChild.first_name} {selectedChild.last_name}</h2>
                            </div>

                            {/* Child Overview Card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                                        {selectedChild.first_name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-800">{selectedChild.first_name} {selectedChild.last_name}</h3>
                                        <p className="text-gray-500">{selectedChild.reg_number}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">{selectedChild.trade}</span>
                                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">{selectedChild.level}</span>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedChild.current_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>{selectedChild.current_status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Grid */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Fees Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                        <DollarSign className="text-primary-600" /> Kwishyura
                                    </h3>
                                    <div className="space-y-3">
                                        {(() => {
                                            const balance = getChildBalance(selectedChild.id);
                                            return (
                                                <>
                                                    <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                                                        <span className="text-gray-600">Ibyateganywe</span>
                                                        <span className="font-bold">{balance.totalFee.toLocaleString()} RWF</span>
                                                    </div>
                                                    <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                                                        <span className="text-green-700">Yishyuye</span>
                                                        <span className="font-bold text-green-600">{balance.totalPaid.toLocaleString()} RWF</span>
                                                    </div>
                                                    <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                                                        <span className="text-red-700">Ibisigaye</span>
                                                        <span className="font-bold text-red-600">{balance.balance.toLocaleString()} RWF</span>
                                                    </div>
                                                    {balance.balance > 0 && (
                                                        <button
                                                            onClick={() => { setPayTarget(selectedChild); setShowPayModal(true); }}
                                                            className="w-full py-3 bg-primary-500 text-white font-bold rounded-xl mt-2"
                                                        >
                                                            Kwishyura
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Discipline Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                        <Shield className="text-primary-600" /> Imyitwarire
                                    </h3>
                                    <div className="space-y-3">
                                        {getChildDiscipline(selectedChild.id).length === 0 ? (
                                            <div className="text-center py-8">
                                                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                                                <p className="text-gray-500">Nta kibazo</p>
                                            </div>
                                        ) : (
                                            getChildDiscipline(selectedChild.id).map((record, idx) => (
                                                <div key={idx} className="p-3 bg-orange-50 rounded-xl">
                                                    <p className="font-bold text-orange-800">{record.action_type}</p>
                                                    <p className="text-sm text-gray-600">{record.description}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(record.created_at).toLocaleDateString()}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Leaves Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                        <Plane className="text-primary-600" /> Amasomo
                                    </h3>
                                    <div className="space-y-3">
                                        {getChildLeaves(selectedChild.id).length === 0 ? (
                                            <div className="text-center py-8">
                                                <Plane size={40} className="mx-auto text-gray-300 mb-2" />
                                                <p className="text-gray-500">Nta ureroma</p>
                                            </div>
                                        ) : (
                                            getChildLeaves(selectedChild.id).map((leave, idx) => (
                                                <div key={idx} className="p-3 bg-blue-50 rounded-xl">
                                                    <p className="font-bold text-blue-800">{leave.leave_type}</p>
                                                    <p className="text-sm text-gray-600">{leave.start_date} - {leave.end_date}</p>
                                                    <p className={`text-xs font-bold mt-1 ${leave.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {leave.status}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Grades */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <Award className="text-primary-600" /> Ibyifuzo by'Imyigaragarire
                                </h3>
                                {grades.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Award size={40} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">Nta myigaragarire</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 font-bold text-gray-600">Igikoni</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-600">Icyiciro</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-600">Note</th>
                                                    <th className="text-left py-3 px-4 font-bold text-gray-600">Itariki</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grades.map((grade, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 hover:bg-primary-50">
                                                        <td className="py-3 px-4">{grade.subject || grade.trade}</td>
                                                        <td className="py-3 px-4">{grade.level || grade.term}</td>
                                                        <td className="py-3 px-4 font-bold text-primary-600">{grade.grade || grade.score}</td>
                                                        <td className="py-3 px-4 text-gray-500">{new Date(grade.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payment History */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="text-primary-600" /> Amashyirahamwe
                                </h3>
                                {getChildPayments(selectedChild.id).length === 0 ? (
                                    <div className="text-center py-8">
                                        <CreditCard size={40} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-gray-500">Nta mashyirahamwe</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {getChildPayments(selectedChild.id).map((payment, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                                                <div>
                                                    <p className="font-bold text-green-800">{Number(payment.amount_paid).toLocaleString()} RWF</p>
                                                    <p className="text-sm text-gray-500">{payment.payment_method} - {payment.transaction_ref || 'N/A'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                                                    <span className="px-2 py-1 bg-green-200 text-green-700 rounded-full text-xs font-bold">Byemewe</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fees Tab */}
                    {activeTab === 'fees' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800">Kwishyura</h2>

                            {approvedChildren.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {approvedChildren.map(child => {
                                        const balance = getChildBalance(child.id);
                                        return (
                                            <div key={child.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                        {child.first_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{child.first_name} {child.last_name}</p>
                                                        <p className="text-sm text-gray-500">{child.reg_number}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Ibyateganywe</span>
                                                        <span className="font-bold">{balance.totalFee.toLocaleString()} RWF</span>
                                                    </div>
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Yishyuye</span>
                                                        <span className="font-bold">{balance.totalPaid.toLocaleString()} RWF</span>
                                                    </div>
                                                    <div className="flex justify-between text-red-600 font-bold pt-2 border-t">
                                                        <span>Ibisigaye</span>
                                                        <span>{balance.balance.toLocaleString()} RWF</span>
                                                    </div>
                                                </div>
                                                {balance.balance > 0 && (
                                                    <button
                                                        onClick={() => { setPayTarget(child); setShowPayModal(true); }}
                                                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl"
                                                    >
                                                        Kwishyura
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">Ntawana ufite</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SMS Tab - Full Powerful View */}
                    {activeTab === 'sms' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <MessageSquare className="text-primary-600" /> SMS Zoherejwe
                                    </h2>
                                    <p className="text-gray-500 text-sm">Reba SMS zose wohereje</p>
                                </div>
                                <button
                                    onClick={fetchSmsLogs}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-2"
                                >
                                    <RefreshCw size={16} /> Ohereza
                                </button>
                            </div>

                            {/* SMS Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
                                    <p className="text-3xl font-black">{smsLogs.length}</p>
                                    <p className="text-sm text-green-200">Byose</p>
                                </div>
                                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
                                    <p className="text-3xl font-black">{smsLogs.filter(s => s.status === 'sent').length}</p>
                                    <p className="text-sm text-primary-200">Zoherejwe</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg">
                                    <p className="text-3xl font-black">{smsLogs.filter(s => s.status === 'failed').length}</p>
                                    <p className="text-sm text-red-200">Zanze</p>
                                </div>
                            </div>

                            {loadingSms ? (
                                <div className="text-center py-12">
                                    <RefreshCw size={40} className="mx-auto text-primary-500 animate-spin" />
                                </div>
                            ) : smsLogs.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl">
                                    <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nta SMS zoherejwe</p>
                                    <p className="text-gray-400 text-sm mt-1">SMS zizahererekwe hano</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-600">#</th>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-600">Message</th>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-600">Phone</th>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-600">Status</th>
                                                    <th className="text-left py-4 px-6 font-bold text-gray-600">Itariki</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {smsLogs.map((sms, idx) => (
                                                    <tr key={idx} className="hover:bg-green-50 transition-colors">
                                                        <td className="py-4 px-6 text-gray-500">{idx + 1}</td>
                                                        <td className="py-4 px-6">
                                                            <p className="text-gray-800 font-medium line-clamp-2">{sms.message}</p>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="flex items-center gap-1 text-gray-600">
                                                                <Phone size={14} /> {sms.phone}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${sms.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                                sms.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {sms.status === 'sent' ? 'Yoherejwe' :
                                                                    sms.status === 'failed' ? 'Ibyanze' : sms.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-gray-500 text-sm">
                                                            {new Date(sms.created_at || sms.sent_at).toLocaleDateString('rw-RW', {
                                                                day: 'numeric', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notifications Tab - Full Powerful Dashboard */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <BellRing className="text-primary-600" /> Amatangazo
                                    </h2>
                                    <p className="text-gray-500 text-sm">Reba byose byatezwe & SMS zose</p>
                                </div>
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center gap-2"
                                        >
                                            <Check size={16} /> Byose bonge
                                        </button>
                                    )}
                                    <button
                                        onClick={fetchAll}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} /> Ohereza
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <BellRing size={24} className="text-primary-200" />
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Total</span>
                                    </div>
                                    <p className="text-3xl font-black">{notifications.length + smsLogs.length}</p>
                                    <p className="text-sm text-primary-200">Byose</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Bell size={24} className="text-blue-200" />
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Yisome</span>
                                    </div>
                                    <p className="text-3xl font-black">{notifications.filter(n => n.is_read || n.read).length + smsLogs.length}</p>
                                    <p className="text-sm text-blue-200">Zisomewe</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <MessageSquare size={24} className="text-green-200" />
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">SMS</span>
                                    </div>
                                    <p className="text-3xl font-black">{smsLogs.length}</p>
                                    <p className="text-sm text-green-200">SMS Zoherejwe</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <AlertCircle size={24} className="text-orange-200" />
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ntisome</span>
                                    </div>
                                    <p className="text-3xl font-black">{unreadCount}</p>
                                    <p className="text-sm text-orange-200">Zisome</p>
                                </div>
                            </div>

                            {/* Combined Notifications and SMS */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="border-b border-gray-100">
                                    <div className="flex">
                                        <button className="flex-1 py-4 px-6 font-bold text-primary-600 border-b-2 border-primary-600 bg-primary-50">
                                            Byose ({notifications.length + smsLogs.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[600px] overflow-y-auto">
                                    {notifications.length === 0 && smsLogs.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <BellRing size={64} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500 font-medium">Nta matangazo</p>
                                            <p className="text-gray-400 text-sm mt-1">Amatangazo azabonwa aha</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {/* Notifications */}
                                            {notifications.map((notif, idx) => (
                                                <div
                                                    key={`notif-${idx}`}
                                                    onClick={() => markAsRead(notif.id)}
                                                    className={`p-4 hover:bg-primary-50 cursor-pointer transition-all ${!notif.read && !notif.is_read ? 'bg-primary-50/50' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notif.notification_type === 'payment' ? 'bg-green-100' :
                                                            notif.notification_type === 'system' ? 'bg-primary-100' : 'bg-blue-100'
                                                            }`}>
                                                            {notif.notification_type === 'payment' ? (
                                                                <DollarSign size={20} className="text-green-600" />
                                                            ) : notif.notification_type === 'discipline' ? (
                                                                <Shield size={20} className="text-red-600" />
                                                            ) : (
                                                                <BellRing size={20} className="text-primary-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-gray-800 truncate">{notif.title || notif.message?.substring(0, 30)}</p>
                                                                {!notif.read && !notif.is_read && (
                                                                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-600 text-sm line-clamp-2">{notif.message}</p>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {new Date(notif.created_at || notif.date).toLocaleDateString('rw-RW', {
                                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${notif.notification_type === 'payment' ? 'bg-green-100 text-green-700' :
                                                                    notif.notification_type === 'system' ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {notif.notification_type === 'payment' ? 'Kwishyura' :
                                                                        notif.notification_type === 'system' ? 'Sistemu' :
                                                                            notif.notification_type === 'discipline' ? 'Imyitwarire' : 'Ibindi'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {!notif.read && !notif.is_read && (
                                                            <div className="flex-shrink-0">
                                                                <button className="p-2 hover:bg-primary-100 rounded-lg transition-colors">
                                                                    <Check size={16} className="text-primary-600" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* SMS Logs */}
                                            {smsLogs.map((sms, idx) => (
                                                <div key={`sms-${idx}`} className="p-4 hover:bg-green-50 cursor-pointer transition-all">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                                            <MessageSquare size={20} className="text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-bold text-gray-800">SMS Yoherejwe</p>
                                                            </div>
                                                            <p className="text-gray-600 text-sm line-clamp-2">{sms.message}</p>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Phone size={12} /> {sms.phone}
                                                                </p>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {new Date(sms.created_at || sms.sent_at).toLocaleDateString('rw-RW', {
                                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sms.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                                    sms.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {sms.status === 'sent' ? 'Yoherejwe' :
                                                                        sms.status === 'failed' ? 'Ibyanze' : sms.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity Timeline */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                    <History className="text-primary-600" /> Ibikorwa Biheruka
                                </h3>
                                <div className="space-y-4">
                                    {[...notifications, ...smsLogs]
                                        .sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0))
                                        .slice(0, 10)
                                        .map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className={`w-3 h-3 rounded-full mt-1.5 ${item.message ? 'bg-green-500' : 'bg-primary-500'
                                                    }`}></div>
                                                <div className="flex-1 pb-3 border-b border-gray-100 last:border-0">
                                                    <p className="text-sm text-gray-800">{item.message || item.title}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(item.created_at || item.date || item.sent_at).toLocaleString('rw-RW')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Discipline Tab */}
                    {activeTab === 'discipline' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Shield className="text-primary-600" /> Imyitwarire
                            </h2>

                            {disciplineRecords.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl">
                                    <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
                                    <p className="text-gray-500 font-medium">Nta bibazo byagaragajwe</p>
                                    <p className="text-gray-400 text-sm mt-1">Abana bawe bafite imyitwarire myiza</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {disciplineRecords.map((record, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${record.action_type === 'sick' ? 'bg-yellow-100' : record.action_type === 'leave' ? 'bg-blue-100' : 'bg-red-100'}`}>
                                                    <Shield size={20} className={record.action_type === 'sick' ? 'text-yellow-600' : record.action_type === 'leave' ? 'text-blue-600' : 'text-red-600'} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-gray-800">{record.action_type}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${record.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {record.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{record.description}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(record.created_at).toLocaleDateString('rw-RW')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leaves Tab */}
                    {activeTab === 'leaves' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Plane className="text-primary-600" /> Amasomo / Ureroma
                                </h2>
                                <button
                                    onClick={() => setShowLeaveForm(true)}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center gap-2"
                                >
                                    <Plus size={16} /> Gusaba
                                </button>
                            </div>

                            {leaveRecords.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl">
                                    <Plane size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nta ureroma</p>
                                    <p className="text-gray-400 text-sm mt-1">Hasaba ureroma hano</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {leaveRecords.map((leave, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${leave.status === 'approved' ? 'bg-green-100' : leave.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                    <Plane size={20} className={leave.status === 'approved' ? 'text-green-600' : leave.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-gray-800">{leave.leave_type}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {leave.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-2">{leave.reason}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span>📅 {leave.start_date} - {leave.end_date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Link2 className="text-primary-600" /> Ibyifuzo
                                </h2>
                                <button
                                    onClick={() => setShowLinkForm(true)}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center gap-2"
                                >
                                    <Plus size={16} /> Funganya Umwana
                                </button>
                            </div>

                            {linkRequests.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl">
                                    <Link2 size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nta byifuzo</p>
                                    <p className="text-gray-400 text-sm mt-1">Funganya umwana kugira ngo ubashe kubona amakuru</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {linkRequests.map((request, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${request.status === 'approved' ? 'bg-green-100' :
                                                    request.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                                                    }`}>
                                                    <Link2 size={20} className={
                                                        request.status === 'approved' ? 'text-green-600' :
                                                            request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                                    } />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-gray-800">{request.student_name}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {request.status === 'approved' ? 'Byemewe' :
                                                                request.status === 'rejected' ? 'Byanze' : 'Ugace'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm">
                                                        {request.student_trade && `${request.student_trade} - `}
                                                        {request.student_level}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* News Tab - School Announcements */}
                    {activeTab === 'news' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <Newspaper className="text-primary-600" /> Amatangazo y'Ishuri
                                    </h2>
                                    <p className="text-gray-500 text-sm">Reba amatangazo yose yatewe n'ishuri</p>
                                </div>
                                <button
                                    onClick={() => { setNewsLoading(true); fetchNews(); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                                >
                                    <RefreshCw size={18} className={newsLoading ? 'animate-spin' : ''} />
                                    ongera
                                </button>
                            </div>

                            {/* SMS Balance Display */}
                            {smsBalance !== null && (
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">SMS Balance</p>
                                            <p className="text-3xl font-black">{smsBalance.toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <MessageSquare size={24} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {newsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="animate-spin text-primary-600" size={32} />
                                </div>
                            ) : news.length === 0 ? (
                                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                                    <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">Nta matangazo ariho</p>
                                    <p className="text-gray-400 text-sm mt-1">Amatangazo yose agaragara aha</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {news.map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-100"
                                            onClick={() => setSelectedNews(item)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {item.category && (
                                                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400 text-xs flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(item.created_at).toLocaleDateString('rw-RW', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                                                    <p className="text-gray-500 text-sm line-clamp-2">{item.content}</p>
                                                    {item.image_url && (
                                                        <div className="mt-3">
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.title}
                                                                className="w-full max-h-48 object-cover rounded-xl"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Eye size={14} /> {item.views || 0} Reba
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-gray-300" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact Tab - Message School */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <MessageCirclePlus className="text-primary-600" /> Uburyo bw'Ivyongeramo
                                    </h2>
                                    <p className="text-gray-500 text-sm">Ohereza ubutumwa kugira ngo ucanze ku ishuri</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Ohereza Ubutumwa</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ishusho (Subject)</label>
                                        <input
                                            type="text"
                                            value={contactForm.subject}
                                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            placeholder="Ubumeny目w0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ubutumwa</label>
                                        <textarea
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                            placeholder="Andika ubutumwa wawe..." />
                                    </div>
                                    <button
                                        onClick={contactSchool}
                                        disabled={contactLoading || !contactForm.subject || !contactForm.message}
                                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {contactLoading ? (
                                            <RefreshCw className="animate-spin" size={20} />
                                        ) : (
                                            <Send size={20} />
                                        )}
                                        Ohereza
                                    </button>
                                </div>
                            </div>

                            {/* Sent Messages */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Ubutumwa Watse</h3>
                                {sentMessages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500">Nta butumwa bwatumwe</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sentMessages.map(msg => (
                                            <div key={msg.id} className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-gray-800">{msg.subject}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${msg.status === 'read' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {msg.status === 'read' ? 'Byuzuye' : 'Birateganijwe'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{msg.message}</p>
                                                <p className="text-gray-400 text-xs mt-2">
                                                    {new Date(msg.created_at).toLocaleString('rw-RW')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                                <h3 className="text-lg font-bold mb-4">Amakuru y'ishuri</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Phone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-primary-200">Telefone</p>
                                            <p className="font-bold">+250 788 XXX XXX</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-primary-200">Email</p>
                                            <p className="font-bold">info@garden.edu.rw</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-primary-200">Aho Utuye</p>
                                            <p className="font-bold">Kigali, Rwanda</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Apply Tab */}
                    {activeTab === 'apply' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        <GraduationCap className="text-primary-600" /> Gusaba Iwanyu
                                    </h2>
                                    <p className="text-gray-500 text-sm">Shyigikore umwana mushya</p>
                                </div>
                                <button
                                    onClick={() => setShowAppForm(true)}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl flex items-center gap-2"
                                >
                                    <Plus size={16} /> Gusaba
                                </button>
                            </div>

                            {applications.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl">
                                    <GraduationCap size={64} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nta bubasha</p>
                                    <p className="text-gray-400 text-sm mt-1">Funganya umwana mushya muri school</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((app, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.status === 'approved' ? 'bg-green-100' :
                                                    app.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                                                    }`}>
                                                    <GraduationCap size={20} className={
                                                        app.status === 'approved' ? 'text-green-600' :
                                                            app.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                                    } />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-bold text-gray-800">{app.student_name}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {app.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm">
                                                        {app.trade} - {app.level}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Link Request Modal */}
            {showLinkForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">💎 Kwihuza numwana wawe</h3>
                            <button onClick={() => setShowLinkForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitLinkRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Izina ry'umwana *</label>
                                <input
                                    required
                                    value={linkForm.student_name}
                                    onChange={(e) => setLinkForm({ ...linkForm, student_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ikiganiro *</label>
                                <select
                                    required
                                    value={linkForm.student_trade}
                                    onChange={(e) => setLinkForm({ ...linkForm, student_trade: e.target.value, student_level: '' })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Ikiganiro --</option>
                                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Icyiciro *</label>
                                <select
                                    required
                                    value={linkForm.student_level}
                                    onChange={(e) => setLinkForm({ ...linkForm, student_level: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    disabled={!linkForm.student_trade}
                                >
                                    <option value="">-- Hitamo Icyiciro --</option>
                                    {linkForm.student_trade && LEVELS[linkForm.student_trade]?.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Igitsina *</label>
                                <select
                                    required
                                    value={linkForm.student_gender}
                                    onChange={(e) => setLinkForm({ ...linkForm, student_gender: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Igitsina --</option>
                                    <option value="male">Gabo</option>
                                    <option value="female">Gore</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={submittingLink}
                                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                {submittingLink ? 'Biraba...' : 'Ohereza'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayModal && payTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Kwishyura - {payTarget.first_name}</h3>
                            <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitPayment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ibirenge *</label>
                                <select
                                    required
                                    value={payForm.fee_id}
                                    onChange={(e) => setPayForm({ ...payForm, fee_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Ibirenge --</option>
                                    {fees.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.term} - {Number(f.amount).toLocaleString()} RWF
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amafaranga *</label>
                                <input
                                    required
                                    type="number"
                                    value={payForm.amount_paid}
                                    onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    placeholder="Andika amafaranga"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ubucuruzi</label>
                                <select
                                    value={payForm.payment_method}
                                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction Ref</label>
                                <input
                                    value={payForm.transaction_ref}
                                    onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ref # (nibyifuje)"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={payLoading}
                                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                {payLoading ? 'Biraba...' : 'Emeza Kwishyura'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave Request Modal */}
            {showLeaveForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Icyifuzo cy'Ureroma</h3>
                            <button onClick={() => setShowLeaveForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitLeaveRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Umwana *</label>
                                <select
                                    required
                                    value={leaveForm.student_id}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, student_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Umwana --</option>
                                    {approvedChildren.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ubwoko *</label>
                                <select
                                    required
                                    value={leaveForm.leave_type}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Ubwoko --</option>
                                    <option value="sick">Indwara</option>
                                    <option value="family">Imiryango</option>
                                    <option value="other">Ikindi</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Itariki yo kurangura *</label>
                                    <input
                                        required
                                        type="date"
                                        value={leaveForm.start_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Itariki yo kongera *</label>
                                    <input
                                        required
                                        type="date"
                                        value={leaveForm.end_date}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Impamvu *</label>
                                <textarea
                                    required
                                    value={leaveForm.reason}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    rows="3"
                                    placeholder="Andika impamvu..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl"
                            >
                                Ohereza
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Application Modal */}
            {showAppForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Gusaba Iwanyu</h3>
                            <button onClick={() => setShowAppForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitApplication} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Izina ry'umwana *</label>
                                <input
                                    required
                                    value={appForm.student_name}
                                    onChange={(e) => setAppForm({ ...appForm, student_name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ikiganiro *</label>
                                <select
                                    required
                                    value={appForm.trade}
                                    onChange={(e) => setAppForm({ ...appForm, trade: e.target.value, level: '' })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Ikiganiro --</option>
                                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Icyiciro *</label>
                                <select
                                    required
                                    value={appForm.level}
                                    onChange={(e) => setAppForm({ ...appForm, level: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    disabled={!appForm.trade}
                                >
                                    <option value="">-- Hitamo Icyiciro --</option>
                                    {appForm.trade && LEVELS[appForm.trade]?.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Igitsina *</label>
                                <select
                                    required
                                    value={appForm.gender}
                                    onChange={(e) => setAppForm({ ...appForm, gender: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">-- Hitamo Igitsina --</option>
                                    <option value="male">Gabo</option>
                                    <option value="female">Gore</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={appLoading}
                                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                {appLoading ? 'Biraba...' : 'Ohereza'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Parents;

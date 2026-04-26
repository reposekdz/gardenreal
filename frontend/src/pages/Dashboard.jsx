import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Users, ShieldAlert, DollarSign, Package, Heart, Newspaper,
    Clock, UserCheck, TrendingUp, Calendar, AlertTriangle,
    UserPlus, GraduationCap, CheckCircle, XCircle, Bell,
    PieChart, BarChart3, Activity, RefreshCw, Download,
    TrendingDown, Users2, BookOpen, Award, Receipt, FileText, MessageCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const StatCard = ({ icon: Icon, label, value, color, to, trend, trendValue, subValue }) => {
    const card = (
        <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all group ${to ? 'cursor-pointer hover:-translate-y-1' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-black mt-2 text-gray-900">
                        {value === null || value === undefined ? (
                            <span className="text-xl text-gray-300 animate-pulse">—</span>
                        ) : typeof value === 'number' ? (
                            value.toLocaleString()
                        ) : (
                            value
                        )}
                    </p>
                    {subValue && (
                        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
                    )}
                    {trend && (
                        <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {trendValue}
                        </p>
                    )}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
    return to ? <Link to={to}>{card}</Link> : card;
};

// Mini Bar Chart Component for Revenue
const MiniBarChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-end justify-between h-32 gap-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-100 rounded-t-lg animate-pulse" style={{ height: '20%' }} />
                ))}
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.revenue), 1);

    return (
        <div className="flex items-end justify-between h-32 gap-2">
            {data.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-500 hover:from-primary-500 hover:to-primary-300"
                        style={{ height: `${Math.max((item.revenue / maxValue) * 100, 5)}%` }}
                        title={`${item.month}: ${item.revenue.toLocaleString()} RWF`}
                    />
                    <span className="text-[10px] text-gray-400">{item.month?.slice(5)}</span>
                </div>
            ))}
        </div>
    );
};

// Gender Distribution Component
const GenderChart = ({ male, female }) => {
    const total = male + female || 1;
    const malePercent = Math.round((male / total) * 100);
    const femalePercent = Math.round((female / total) * 100);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-gray-600">Male</span>
                </span>
                <span className="font-bold text-gray-900">{male} ({malePercent}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{ width: `${malePercent}%` }}
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500" />
                    <span className="text-gray-600">Female</span>
                </span>
                <span className="font-bold text-gray-900">{female} ({femalePercent}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${femalePercent}%` }}
                />
            </div>
        </div>
    );
};

// Collection Rate Gauge
const CollectionGauge = ({ rate }) => {
    const getColor = (r) => {
        if (r >= 80) return 'text-green-600';
        if (r >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="relative pt-6">
            <div className="flex items-center justify-center">
                <div className="relative w-32 h-16 overflow-hidden">
                    <div className="absolute w-32 h-32 rounded-full border-[12px] border-gray-100" />
                    <div
                        className={`absolute w-32 h-32 rounded-full border-[12px] border-transparent border-t-current -rotate-45 transition-all duration-1000 ${getColor(rate)}`}
                        style={{ transform: `rotate(${(rate / 100) * 180 - 45}deg)` }}
                    />
                </div>
            </div>
            <p className="text-center mt-2">
                <span className={`text-2xl font-black ${getColor(rate)}`}>{rate}%</span>
            </p>
            <p className="text-center text-xs text-gray-400">Collection Rate</p>
        </div>
    );
};

const Dashboard = () => {
    const { user, token } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [smsBalance, setSmsBalance] = useState(null);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);

            // Fetch SMS balance (admin only)
            if (user.role === 'admin') {
                try {
                    const smsRes = await axios.get(`${API_URL}/api/sms/balance`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSmsBalance(smsRes.data);
                } catch (smsErr) {
                    console.log('SMS balance not available');
                }
            }

            // Fetch recent payments as activity
            try {
                const payRes = await axios.get(`${API_URL}/api/finance/payments?limit=5`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecentActivity(payRes.data.slice(0, 5));
            } catch (e) { }
        } catch (error) {
            console.error('Failed to load stats');
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Dashboard refreshed!');
    };

    const isAdmin = user.role === 'admin';
    const isDod = user.role === 'dod';
    const isAccountant = user.role === 'accountant';
    const isStock = user.role === 'stock_manager';
    const isParent = user.role === 'parent';

    const roleConfig = {
        admin: { title: 'Umuyobozi Mukuru', color: 'from-purple-600 to-purple-800', roleColor: 'bg-purple-500' },
        dod: { title: 'Ushinzwe Imyitwarire', color: 'from-red-600 to-red-800', roleColor: 'bg-red-500' },
        accountant: { title: 'Ushinzwe Imari', color: 'from-green-600 to-green-800', roleColor: 'bg-green-500' },
        stock_manager: { title: 'Ushinzwe Ububiko', color: 'from-amber-600 to-amber-800', roleColor: 'bg-amber-500' },
        parent: { title: 'Umubyeyi', color: 'from-pink-600 to-pink-800', roleColor: 'bg-pink-500' },
    };

    const currentRole = roleConfig[user.role] || roleConfig.admin;

    const allCards = [
        {
            icon: Users,
            label: 'Total Students',
            value: stats?.total_students,
            color: 'bg-primary-500',
            to: '/students',
            show: isAdmin || isDod || isAccountant,
            subValue: `+${stats?.recent_students || 0} this month`
        },
        {
            icon: ShieldAlert,
            label: 'Active Cases',
            value: stats?.active_discipline,
            color: 'bg-red-500',
            to: '/discipline',
            show: isAdmin || isDod,
            subValue: `${stats?.resolved_discipline || 0} resolved this month`
        },
        {
            icon: DollarSign,
            label: 'Total Collected',
            value: stats?.total_fees_collected,
            color: 'bg-green-500',
            to: '/finance',
            show: isAdmin || isAccountant || isDod,
            trend: 'up',
            trendValue: `${stats?.collection_rate || 0}% collection rate`
        },
        {
            icon: Package,
            label: 'Low Stock',
            value: stats?.low_stock,
            color: 'bg-amber-500',
            to: '/stock',
            show: isAdmin || isStock,
            subValue: 'Items need attention'
        },
        {
            icon: Heart,
            label: 'Parents',
            value: stats?.total_parents,
            color: 'bg-pink-500',
            to: '/link-manager',
            show: isAdmin || isDod || isAccountant,
            subValue: 'Registered'
        },
        {
            icon: Clock,
            label: 'Pending Links',
            value: stats?.pending_links,
            color: 'bg-orange-500',
            to: '/link-manager',
            show: isAdmin || isDod || isAccountant,
            subValue: 'Requests waiting'
        },
        {
            icon: Newspaper,
            label: 'Applications',
            value: stats?.pending_applications,
            color: 'bg-indigo-500',
            to: '/applications',
            show: isAdmin || isDod,
            subValue: 'Pending review'
        },
        {
            icon: UserCheck,
            label: 'On Leave',
            value: stats?.on_leave,
            color: 'bg-blue-500',
            to: '/students',
            show: isAdmin || isDod,
            subValue: 'Students'
        },
        {
            icon: MessageCircle,
            label: 'SMS Balance',
            value: smsBalance?.balance || 'N/A',
            color: 'bg-cyan-500',
            show: isAdmin,
            subValue: smsBalance?.message || 'Airtime'
        },
    ];

    const visibleCards = allCards.filter(c => c.show);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner with Refresh */}
            <div className={`bg-gradient-to-br ${currentRole.color} rounded-2xl px-8 py-8 text-white relative overflow-hidden shadow-2xl`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40" />
                <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-white/5 rounded-full translate-y-30" />
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl" />
                <button
                    onClick={handleRefresh}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                    title="Refresh dashboard"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${currentRole.roleColor} rounded-xl bg-white/20`}>
                            <GraduationCap size={20} />
                        </div>
                        <p className="text-white/80 text-sm font-medium">{currentRole.title}</p>
                    </div>
                    <h2 className="text-3xl font-black mb-2">Murakaza neza, {user.first_name || user.username}! 👋</h2>
                    <p className="text-white/80 max-w-xl">Garden TVET School Management System - Track students, manage finances, and monitor school operations all in one place.</p>

                    {(isAdmin || isDod) && stats?.pending_links > 0 && (
                        <Link to="/link-manager" className="inline-flex items-center gap-2 mt-6 bg-accent-500 hover:bg-accent-400 text-primary-900 font-black px-5 py-3 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl">
                            <Bell size={16} /> {stats.pending_links} New Parent Requests
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            {loadingStats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(visibleCards.length || 4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                            <div className="h-10 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {visibleCards.map((card, i) => (
                        <StatCard key={i} {...card} />
                    ))}
                </div>
            )}

            {/* Analytics Section - Advanced Charts */}
            {isAdmin && !loadingStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <BarChart3 size={20} className="text-primary-600" /> Revenue Trend
                            </h3>
                            <span className="text-xs text-gray-400">Last 6 months</span>
                        </div>
                        <MiniBarChart data={stats?.monthly_revenue} />
                    </div>

                    {/* Gender Distribution */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-primary-600" /> Gender Distribution
                        </h3>
                        <GenderChart male={stats?.male_students || 0} female={stats?.female_students || 0} />
                    </div>
                </div>
            )}

            {/* Collection Rate & Today's Stats */}
            {isAdmin && !loadingStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Collection Rate */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-green-600" /> Collection Rate
                        </h3>
                        <CollectionGauge rate={stats?.collection_rate || 0} />
                    </div>

                    {/* Today's Stats */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-amber-600" /> Today's Activity
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <DollarSign size={20} className="text-green-600" />
                                    <span className="text-sm text-gray-600">Payments</span>
                                </div>
                                <span className="font-black text-green-600">{Number(stats?.today_payments || 0).toLocaleString()} RWF</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Receipt size={20} className="text-blue-600" />
                                    <span className="text-sm text-gray-600">Transactions</span>
                                </div>
                                <span className="font-black text-blue-600">{stats?.today_count || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Trades */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-600" /> Top Trades
                        </h3>
                        <div className="space-y-3">
                            {stats?.top_trades?.slice(0, 4).map((trade, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">{i + 1}</span>
                                        <span className="text-sm text-gray-600">{trade.trade}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{trade.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                        <Calendar size={20} className="text-primary-600" /> Quick Actions
                    </h3>
                    <div className="space-y-3">
                        {isAdmin && (
                            <>
                                <Link to="/students" className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 transition-all group">
                                    <Users size={20} className="text-primary-600 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Add New Student</span>
                                </Link>
                                <Link to="/link-manager" className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all group">
                                    <Heart size={20} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Review Parent Requests</span>
                                </Link>
                                <Link to="/staff" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all group">
                                    <UserPlus size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Add New Staff</span>
                                </Link>
                                <Link to="/cms" className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all group">
                                    <Newspaper size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Post News</span>
                                </Link>
                            </>
                        )}
                        {isDod && (
                            <>
                                <Link to="/students" className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 transition-all group">
                                    <Users size={20} className="text-primary-600 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Manage Students</span>
                                </Link>
                                <Link to="/discipline" className="flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-all group">
                                    <ShieldAlert size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Manage Discipline</span>
                                </Link>
                                <Link to="/applications" className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all group">
                                    <Newspaper size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Review Applications</span>
                                </Link>
                                <Link to="/link-manager" className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all group">
                                    <Heart size={20} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Parent Links</span>
                                </Link>
                            </>
                        )}
                        {isAccountant && (
                            <>
                                <Link to="/finance" className="flex items-center gap-3 p-4 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-all group">
                                    <DollarSign size={20} className="text-green-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Manage Finances</span>
                                </Link>
                                <Link to="/link-manager" className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all group">
                                    <Heart size={20} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Parent Links</span>
                                </Link>
                                <Link to="/students" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all group">
                                    <GraduationCap size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">View Students</span>
                                </Link>
                                <Link to="/applications" className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all group">
                                    <FileText size={20} className="text-purple-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Applications</span>
                                </Link>
                                <Link to="/stock" className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all group">
                                    <Package size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Stock</span>
                                </Link>
                                <Link to="/parents" className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all group">
                                    <Users size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Parents</span>
                                </Link>
                            </>
                        )}
                        {isStock && (
                            <Link to="/stock" className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all group">
                                <Package size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold">Manage Inventory</span>
                            </Link>
                        )}
                        {isParent && (
                            <Link to="/parents" className="flex items-center gap-3 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-all group">
                                <Heart size={20} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold">View My Children</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary-600" /> Recent Payments
                    </h3>
                    <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                            <DollarSign size={18} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">
                                                {activity.first_name} {activity.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{activity.term || 'Payment'} • {activity.receipt_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-green-600">{Number(activity.amount_paid).toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">{new Date(activity.payment_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <DollarSign size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No recent payments</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-600 font-medium">System Status: Operational</span>
                </div>
                <div className="text-sm text-gray-500">
                    Garden TVET School Management System v2.0
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

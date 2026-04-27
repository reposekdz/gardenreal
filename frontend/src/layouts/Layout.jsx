import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';
import MobileBottomNav from '../components/MobileBottomNav';
import api from '../utils/api';
import {
    LogOut, LayoutDashboard, Users, ShieldAlert, DollarSign, Package,
    Globe, Bell, Search, Settings, Shield,
    Menu, X, ChevronDown, User, Calendar, Clock, GraduationCap,
    Briefcase, TrendingUp, BarChart3, FileText, Link2, BookOpen
} from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuthStore();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const userMenuRef = useRef(null);
    const notifRef = useRef(null);

    if (!user) {
        return <Navigate to="/home" />;
    }

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    const isActive = (path) => location.pathname === path;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications count
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications2/unread-count');
                setUnreadCount(response.data.unread_count || 0);

                // Also fetch recent notifications for dropdown
                const notifResponse = await api.get('/notifications2?limit=5');
                setRecentNotifications(notifResponse.data.notifications || []);
            } catch (error) {
                console.log('Notifications not available');
            }
        };

        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const isAdmin = user.role === 'admin';
    const isDod = user.role === 'dod' || user.role === 'director_of_discipline';
    const isAccountant = user.role === 'accountant';
    const isStockManager = user.role === 'stock_manager';
    const isParent = user.role === 'parent';

    const roleConfig = {
        admin: { label: t('roles.admin'), color: 'bg-purple-500', icon: Briefcase },
        dod: { label: t('roles.dod'), color: 'bg-red-500', icon: ShieldAlert },
        accountant: { label: t('roles.accountant'), color: 'bg-green-500', icon: DollarSign },
        stock_manager: { label: t('roles.stock_manager'), color: 'bg-amber-500', icon: Package },
        parent: { label: 'Parent', color: 'bg-gray-500', icon: User },
        teacher: { label: 'Teacher', color: 'bg-blue-500', icon: GraduationCap },
        librarian: { label: 'Librarian', color: 'bg-indigo-500', icon: BookOpen },
        director: { label: 'Director', color: 'bg-pink-500', icon: TrendingUp },
        registrar: { label: 'Registrar', color: 'bg-teal-500', icon: FileText },
    };

    const RoleIcon = roleConfig[user.role]?.icon || User;
    const roleColor = roleConfig[user.role]?.color || 'bg-gray-500';

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },
        { to: '/notifications', icon: Bell, label: 'Notifications', show: true, badge: unreadCount },
        { to: '/applications', icon: FileText, label: t('nav.applications') || 'Applications', show: isAdmin || isDod || isAccountant },
        { to: '/academic-year', icon: Calendar, label: t('nav.academicYear') || 'Academic Year', show: isAdmin || user.role === 'director' },
        { to: '/graduates', icon: GraduationCap, label: t('nav.graduates') || 'Abasoje', show: isAdmin || user.role === 'director' || user.role === 'registrar' || isDod || isAccountant },
        { to: '/employers', icon: Briefcase, label: t('nav.employers') || 'Employers', show: isAdmin || user.role === 'director' || user.role === 'registrar' },
        { to: '/students', icon: Users, label: t('nav.students'), show: isAdmin || isDod || isAccountant },
        { to: '/link-manager', icon: Link2, label: 'Link Manager', show: isAdmin || isDod || isAccountant },
        { to: '/discipline', icon: ShieldAlert, label: t('nav.discipline'), show: isAdmin || isDod },
        { to: '/finance', icon: DollarSign, label: t('nav.finance'), show: isAdmin || isAccountant },
        { to: '/stock', icon: Package, label: t('nav.stock'), show: isAdmin || isStockManager },
        { to: '/parents', icon: User, label: isParent ? 'My Children' : (t('nav.parents') || 'Parents'), show: isAdmin || isDod || isAccountant || isParent },
        { to: '/staff', icon: Shield, label: 'Staff', show: isAdmin },
        { to: '/cms', icon: Globe, label: t('nav.cms') || 'CMS', show: isAdmin },
        { to: '/settings', icon: Settings, label: t('nav.settings') || 'Settings', show: true },
        { to: '/home', icon: Globe, label: t('pub.nav.home') || 'Public Site', show: true },
    ];

    const filteredNavItems = navItems.filter(item => item.show);

    // Get page title
    const getPageTitle = () => {
        const path = location.pathname.split('/')[1];
        const titles = {
            'dashboard': t('nav.dashboard'),
            'students': t('nav.students'),
            'discipline': t('nav.discipline'),
            'finance': t('nav.finance'),
            'stock': t('nav.stock'),
            'parents': t('nav.parents') || 'Parents',
            'applications': t('nav.applications') || 'Applications',
            'link-manager': 'Link Manager',
            'staff': 'Staff Management',
            'cms': t('nav.cms') || 'CMS',
            'settings': t('nav.settings') || 'Settings',
        };
        return titles[path] || 'Garden TVET';
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-72 bg-gradient-to-b from-primary-700 to-primary-900 text-white 
                flex flex-col transition-transform duration-300 shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-20 flex items-center px-6 bg-primary-800/50 border-b border-primary-600/30">
                    <Link to="/dashboard" className="flex items-center group">
                        <img
                            src="/logo.png"
                            alt="Garden TVET"
                            className="w-14 h-14 object-contain rounded-xl mr-3 shadow-lg group-hover:scale-105 transition-transform"
                        />
                        <div>
                            <span className="text-xl font-black tracking-tight">Garden</span>
                            <span className="text-accent-400 font-bold">TVET</span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden p-2 rounded-lg hover:bg-primary-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {filteredNavItems.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200
                                    ${active
                                        ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm'
                                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                                    }
                                `}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-accent-400' : ''}`} />
                                {item.label}
                                {active && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info at bottom */}
                <div className="p-4 bg-primary-800/50 border-t border-primary-600/30">
                    <div className="flex items-center mb-3 p-3 rounded-xl bg-primary-700/50">
                        <div className={`w-10 h-10 rounded-xl ${roleColor} flex items-center justify-center shadow-lg`}>
                            <RoleIcon size={18} className="text-white" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-primary-200 truncate">{roleConfig[user.role]?.label || user.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Modern Header */}
                <header className="h-20 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-20">
                    {/* Left side */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <Menu size={24} className="text-gray-600" />
                        </button>

                        {/* Page Title */}
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {getPageTitle()}
                            </h1>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search students, payments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                            {[
                                { code: 'rw', label: 'RW' },
                                { code: 'en', label: 'EN' },
                                { code: 'fr', label: 'FR' }
                            ].map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`
                                        px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                                        ${i18n.language === lang.code
                                            ? 'bg-white text-primary-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }
                                    `}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => { setShowNotifications(!showNotifications); navigate('/notifications'); }}
                                className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <Bell size={20} className="text-gray-600" />
                                {(unreadCount > 0) && (
                                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full border-2 border-white text-white text-xs font-bold animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {recentNotifications.length > 0 ? (
                                            recentNotifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                                    onClick={() => navigate(notif.action_url || '/notifications')}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="text-lg">
                                                            {notif.notification_type?.includes('grade') ? '📝' :
                                                                notif.notification_type?.includes('payment') ? '💰' :
                                                                    notif.notification_type?.includes('student') ? '👶' :
                                                                        notif.notification_type?.includes('discipline') ? '⚠️' :
                                                                            notif.notification_type?.includes('link') ? '🔗' :
                                                                                notif.notification_type?.includes('application') ? '📨' : '🔔'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                                        </div>
                                                        {!notif.is_read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                                        <button
                                            onClick={() => navigate('/notifications')}
                                            className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View All Notifications →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                                    {user.first_name?.charAt(0) || 'U'}
                                </div>
                                <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
                            </button>

                            {/* User Dropdown */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
                                        <p className="font-bold text-gray-800">{user.first_name} {user.last_name}</p>
                                        <p className="text-xs text-gray-500">{user.phone}</p>
                                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${roleColor} text-white`}>
                                            {roleConfig[user.role]?.label || user.role}
                                        </span>
                                    </div>
                                    <div className="p-2">
                                        <Link
                                            to="/settings"
                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                        >
                                            <Settings size={16} className="mr-3 text-gray-400" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <LogOut size={16} className="mr-3" />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 pb-20 lg:pb-8">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
};

export default Layout;

import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import {
    LayoutDashboard, FileText, MessageCircleQuestion, Users, ShieldAlert,
    Heart, Settings, LogOut, Menu, X, GraduationCap, Bell, Globe, Clock
} from 'lucide-react';

const TeacherLayout = () => {
    const { user, token, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [pendingQs, setPendingQs] = useState(0);

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'teacher' && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

    useEffect(() => {
        let stop = false;
        const load = async () => {
            try {
                const r = await axios.get(`${API_URL}/api/student-questions/pending-count`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!stop) setPendingQs(r.data?.pending || 0);
            } catch {}
        };
        load();
        const t = setInterval(load, 30000);
        return () => { stop = true; clearInterval(t); };
    }, [API_URL, token]);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { to: '/teacher',             icon: LayoutDashboard,    label: 'Akanya k\'Ibanze' },
        { to: '/teacher/notes',       icon: FileText,           label: 'Inyandiko' },
        { to: '/teacher/questions',   icon: MessageCircleQuestion, label: 'Ibibazo by\'Abanyeshuri', badge: pendingQs },
        { to: '/teacher/students',    icon: Users,              label: 'Abanyeshuri' },
        { to: '/teacher/conduct',     icon: ShieldAlert,        label: 'Imyitwarire' },
        { to: '/teacher/engagement',  icon: Heart,              label: 'Reactions & Comments' },
        { to: '/settings',            icon: Settings,           label: 'Settings' },
        { to: '/home',                icon: Globe,              label: 'Urubuga rusange' }
    ];

    const titles = {
        '/teacher':            'Akanya k\'Ibanze',
        '/teacher/notes':      'Inyandiko zanjye',
        '/teacher/questions':  'Ibibazo by\'Abanyeshuri',
        '/teacher/students':   'Abanyeshuri (read-only)',
        '/teacher/conduct':    'Imyitwarire y\'abanyeshuri',
        '/teacher/engagement': 'Likes / Comments / Hands'
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40 w-72
                bg-gradient-to-b from-primary-700 to-primary-900 text-white
                flex flex-col transition-transform duration-300 shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-20 flex items-center px-6 bg-primary-800/50 border-b border-primary-600/30">
                    <Link to="/teacher" className="flex items-center group">
                        <img src="/logo.png" alt="Garden TVET" className="w-14 h-14 object-contain rounded-xl mr-3 shadow-lg group-hover:scale-105 transition-transform" />
                        <div>
                            <span className="text-xl font-black tracking-tight">Garden</span>
                            <span className="text-accent-400 font-bold">TVET</span>
                            <p className="text-[10px] text-primary-200 font-bold uppercase tracking-wider">Teacher Portal</p>
                        </div>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2 rounded-lg hover:bg-primary-600">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                    active
                                        ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm'
                                        : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                                }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-accent-400' : ''}`} />
                                <span className="flex-1">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
                                        {item.badge}
                                    </span>
                                )}
                                {active && !item.badge && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 bg-primary-800/50 border-t border-primary-600/30">
                    <div className="flex items-center mb-3 p-3 rounded-xl bg-primary-700/50">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                            <GraduationCap size={18} className="text-white" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-primary-200 truncate">Mwarimu</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-100 text-sm font-bold"
                    >
                        <LogOut size={16} /> Sohoka
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-800">{titles[location.pathname] || 'Teacher Portal'}</h1>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl text-blue-800 text-sm font-bold">
                            <Bell size={14} /> {pendingQs} ibibazo bitarasubizwa
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 lg:p-8 pb-20 lg:pb-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;

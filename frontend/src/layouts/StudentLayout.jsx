import React, { useState } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
    LayoutDashboard, BookOpen, DollarSign, Calendar, ShieldAlert, Bell,
    Settings, LogOut, Menu, X, GraduationCap, Clock, Globe
} from 'lucide-react';

const StudentLayout = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'student') return <Navigate to="/dashboard" replace />;

    const isActive = (hash) => location.hash === hash || (hash === '#overview' && !location.hash);

    const navItems = [
        { hash: '#overview',     icon: LayoutDashboard,  label: 'Akanya k\'Ibanze' },
        { hash: '#grades',       icon: BookOpen,         label: 'Amanota' },
        { hash: '#fees',         icon: DollarSign,       label: 'Amafaranga' },
        { hash: '#attendance',   icon: Calendar,         label: 'Kwitabira' },
        { hash: '#conduct',      icon: ShieldAlert,      label: 'Imyitwarire' },
        { hash: '#notifications',icon: Bell,             label: 'Ubutumwa' },
        { hash: '#settings',     icon: Settings,         label: 'Hindura ijambobanga' }
    ];

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40 w-72
                bg-gradient-to-b from-emerald-700 to-emerald-900 text-white
                flex flex-col transition-transform duration-300 shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-20 flex items-center px-6 bg-emerald-800/50 border-b border-emerald-600/30">
                    <Link to="/student-dashboard" className="flex items-center group">
                        <img src="/logo.png" alt="Garden TVET" className="w-14 h-14 object-contain rounded-xl mr-3 shadow-lg group-hover:scale-105 transition-transform" />
                        <div>
                            <span className="text-xl font-black tracking-tight">Garden</span>
                            <span className="text-accent-400 font-bold">TVET</span>
                            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Student Portal</p>
                        </div>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2 rounded-lg hover:bg-emerald-600">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.hash);
                        return (
                            <a
                                key={item.hash}
                                href={item.hash}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                                    active
                                        ? 'bg-white/20 text-white shadow-lg border border-white/10 backdrop-blur-sm'
                                        : 'text-emerald-100 hover:bg-emerald-600 hover:text-white'
                                }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-accent-400' : ''}`} />
                                <span className="flex-1">{item.label}</span>
                                {active && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                                )}
                            </a>
                        );
                    })}
                    <Link
                        to="/kwiga"
                        className="flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl text-emerald-100 hover:bg-emerald-600 hover:text-white"
                    >
                        <Globe className="mr-3 h-5 w-5" />
                        Inyandiko z'amasomo
                    </Link>
                </nav>

                <div className="p-4 bg-emerald-800/50 border-t border-emerald-600/30">
                    <div className="flex items-center mb-3 p-3 rounded-xl bg-emerald-700/50">
                        <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
                            <GraduationCap size={18} className="text-emerald-900" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-emerald-200 truncate">{user.reg_number}</p>
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
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Murakaza neza, {user.first_name}</h1>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date().toLocaleDateString('rw-RW', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
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

export default StudentLayout;

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Users, ShieldAlert, DollarSign, Package,
    Heart, UserCheck, Menu, X, Home, Settings, Bell, LogOut, Plus
} from 'lucide-react';

// Reusable Nav Button Component
const NavButton = ({ to, icon: Icon, label }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <button
            onClick={() => navigate(to)}
            className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-200 relative
                ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}
            `}
        >
            <div className={`
                p-1.5 rounded-xl transition-all duration-200
                ${isActive ? 'bg-primary-100 shadow-md' : ''}
            `}>
                <Icon size={22} className={isActive ? 'text-primary-600' : ''} />
            </div>
            <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                {label}
            </span>
            {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary-600 rounded-t-full" />
            )}
        </button>
    );
};

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const [showMenu, setShowMenu] = useState(false);

    // Only show on authenticated pages (not on login/public pages)
    const isPublicPage = location.pathname === '/login' ||
        location.pathname === '/home' ||
        location.pathname === '/about' ||
        location.pathname === '/services' ||
        location.pathname === '/news' ||
        location.pathname === '/contact' ||
        location.pathname === '/driving-rules' ||
        location.pathname === '/apply' ||
        location.pathname === '/parent-apply' ||
        location.pathname === '/register' ||
        location.pathname.startsWith('/trade/');

    // Show on all mobile pages including public
    if (isPublicPage) {
        return (
            <>
                {/* Public Mobile Bottom Navigation - Fixed at bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden z-[9999] safe-area-pb pb-safe">
                    <div className="flex justify-around items-center h-16 px-1 bg-white">
                        <NavButton to="/home" icon={Home} label="Home" />
                        <NavButton to="/about" icon={LayoutDashboard} label="About" />
                        <NavButton to="/driving-rules" icon={ShieldAlert} label="Imodoka" />
                        <NavButton to="/news" icon={Bell} label="News" />
                        <NavButton to="/contact" icon={ShieldAlert} label="Contact" />
                    </div>
                </div>
                <div className="h-20 lg:hidden" />
            </>
        );
    }

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    const isAdmin = user.role === 'admin';
    const isDod = user.role === 'director_of_discipline' || user.role === 'dod';
    const isAccountant = user.role === 'accountant';
    const isStock = user.role === 'stock_manager';
    const isParent = user.role === 'parent';

    // Main navigation items based on role
    const getMainNavItems = () => {
        const items = [
            { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard'), show: true },
            { to: '/students', icon: Users, label: t('nav.students'), show: isAdmin || isDod || isAccountant },
            { to: '/discipline', icon: ShieldAlert, label: t('nav.discipline'), show: isAdmin || isDod },
            { to: '/finance', icon: DollarSign, label: t('nav.finance'), show: isAdmin || isAccountant },
            { to: '/stock', icon: Package, label: t('nav.stock'), show: isAdmin || isStock },
            { to: '/parents', icon: Heart, label: t('nav.parents'), show: isParent },
        ];
        return items.filter(item => item.show);
    };

    // Additional navigation items
    const getExtraNavItems = () => {
        const items = [
            { to: '/cms', icon: Settings, label: t('nav.cms'), show: isAdmin },
            { to: '/link-manager', icon: UserCheck, label: t('nav.applications'), show: isAdmin },
            { to: '/staff', icon: Users, label: t('nav.staff'), show: isAdmin },
        ];
        return items.filter(item => item.show);
    };

    const mainNavItems = getMainNavItems();
    const extraNavItems = getExtraNavItems();

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    return (
        <>
            {/* Mobile Bottom Navigation - Modern Design - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden z-[9999] safe-area-pb pb-safe">
                {/* Main Navigation */}
                <div className="flex justify-around items-center h-16 px-1">
                    {mainNavItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.to);
                        return (
                            <button
                                key={item.to}
                                onClick={() => navigate(item.to)}
                                className={`
                                    flex flex-col items-center justify-center flex-1 h-full
                                    transition-all duration-200 relative
                                    ${active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}
                                `}
                            >
                                <div className={`
                                    p-1.5 rounded-xl transition-all duration-200
                                    ${active ? 'bg-primary-100 shadow-md' : ''}
                                `}>
                                    <Icon size={22} className={active ? 'text-primary-600' : ''} />
                                </div>
                                <span className={`text-[10px] mt-0.5 font-semibold ${active ? 'text-primary-600' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                                {/* Active Indicator */}
                                {active && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary-600 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}

                    {/* More Menu Button */}
                    {extraNavItems.length > 0 && (
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex flex-col items-center justify-center flex-1 h-full text-gray-400"
                        >
                            <div className="p-1.5 rounded-xl">
                                <Menu size={22} />
                            </div>
                            <span className="text-[10px] mt-0.5 font-semibold text-gray-500">More</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Menu Overlay */}
            {showMenu && (
                <div className="fixed inset-0 z-[10000] lg:hidden" onClick={() => setShowMenu(false)}>
                    <div className="absolute bottom-20 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-48 animate-slide-up">
                        {/* Extra Nav Items */}
                        {extraNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.to);
                            return (
                                <button
                                    key={item.to}
                                    onClick={() => {
                                        navigate(item.to);
                                        setShowMenu(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                                        ${active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}
                                    `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Divider */}
                        <div className="h-px bg-gray-200 my-2" />

                        {/* User Info */}
                        <div className="px-4 py-2 text-xs text-gray-500">
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="capitalize">{user.role?.replace('_', ' ')}</p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => {
                                handleLogout();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Settings size={20} />
                            <span className="font-medium text-sm">{t('nav.logout')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Spacer for fixed bottom nav */}
            <div className="h-20 lg:hidden" />
        </>
    );
};

export default MobileBottomNav;

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Menu, X, GraduationCap, Globe, Phone, Mail, MapPin,
    ChevronDown, Facebook, Twitter, Instagram, Youtube, Search,
    Bell, Calendar, User, Lock, LogIn, ChevronUp, Home
} from 'lucide-react';

// Mobile Footer Accordion Component
const MobileFooterSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-primary-800 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between bg-primary-800/50 hover:bg-primary-800 transition-colors"
            >
                <span className="font-bold text-white">{title}</span>
                {isOpen ? <ChevronUp size={20} className="text-accent-400" /> : <ChevronDown size={20} className="text-accent-400" />}
            </button>
            {isOpen && (
                <div className="px-4 py-3 bg-primary-900/50">
                    {children}
                </div>
            )}
        </div>
    );
};

const PublicLayout = () => {
    const { t, i18n } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { to: '/home', label: t('pub.nav.home') },
        { to: '/about', label: t('pub.nav.about') },
        { to: '/services', label: t('pub.nav.services') },
        { to: '/kwiga', label: 'Kwiga' },
        { to: '/news', label: t('pub.nav.news') },
        { to: '/driving-rules', label: 'Kwiga Gutwara Ibinyabiziga' },
        { to: '/contact', label: t('pub.nav.contact') },
    ];

    const isActive = (path) => location.pathname === path;

    const quickLinks = [
        { to: '/apply', label: t('pub.nav.apply_now'), primary: true },
        { to: '/register', label: t('pub.nav.parent_portal'), primary: false },
        { to: '/login', label: t('pub.nav.login'), icon: Lock, admin: true },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-white overflow-x-hidden pb-20 lg:pb-0">
            {/* Top Bar - Modern Gradient */}
            <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white text-xs">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 font-medium">
                                <MapPin size={14} className="text-accent-400" />
                                East, Ngoma
                            </span>
                            <Link to="/contact" className="flex items-center gap-2 font-medium hover:text-accent-400 transition-colors">
                                <Phone size={14} className="text-accent-400" />
                                Contact Us
                            </Link>
                            <span className="flex items-center gap-2 font-medium hidden lg:flex">
                                <Mail size={14} className="text-accent-400" />
                                info@gardentvet.rw
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Social Icons */}
                            <div className="flex items-center gap-2">
                                <a href="#" className="w-7 h-7 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all">
                                    <Facebook size={12} />
                                </a>
                                <a href="#" className="w-7 h-7 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all">
                                    <Twitter size={12} />
                                </a>
                                <a href="#" className="w-7 h-7 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all">
                                    <Instagram size={12} />
                                </a>
                                <a href="#" className="w-7 h-7 rounded-full bg-white/10 hover:bg-accent-500 flex items-center justify-center transition-all">
                                    <Youtube size={12} />
                                </a>
                            </div>
                            <div className="w-px h-4 bg-white/20" />
                            {/* Language Switcher */}
                            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                                {[
                                    { code: 'rw', label: 'RW' },
                                    { code: 'en', label: 'EN' },
                                    { code: 'fr', label: 'FR' }
                                ].map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => i18n.changeLanguage(lang.code)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${i18n.language === lang.code
                                            ? 'bg-accent-500 text-primary-900 shadow-lg'
                                            : 'hover:bg-white/10'
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navbar - Glassmorphism Effect */}
            <nav className={`
                sticky top-0 z-50 transition-all duration-300
                ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-primary-900/5 py-2'
                    : 'bg-white shadow-md py-0'
                }
            `}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/home" className="flex items-center gap-3 group">
                            <img
                                src="/logo.png"
                                alt="Garden TVET School"
                                className="w-14 h-14 object-contain rounded-xl shadow-lg group-hover:scale-110 transition-transform"
                            />
                            <div className="leading-none">
                                <span className="font-black text-2xl text-primary-800 block">Garden</span>
                                <span className="text-xs text-accent-500 font-bold tracking-[0.25em]">TVET SCHOOL</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`
                                        px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative group
                                        ${isActive(link.to)
                                            ? 'text-primary-700 bg-primary-50'
                                            : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50/50'
                                        }
                                    `}
                                >
                                    {link.label}
                                    <span className={`
                                        absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-accent-500 rounded-full transition-all duration-300
                                        ${isActive(link.to) ? 'w-3/4' : 'w-0 group-hover:w-1/2'}
                                    `} />
                                </Link>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden lg:flex items-center gap-2 ml-auto">
                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-primary-100 flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors"
                            >
                                <Search size={18} />
                            </button>

                            {quickLinks.map((link, i) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`
                                        h-10 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5
                                        ${link.primary
                                            ? 'bg-gradient-to-r from-accent-400 to-accent-500 text-primary-900 hover:from-accent-300 hover:to-accent-400'
                                            : link.admin
                                                ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white hover:from-primary-600 hover:to-primary-700 border border-primary-500/30'
                                                : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }
                                    `}
                                >
                                    {link.icon && <link.icon size={14} />}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? (
                                <X size={28} className="text-primary-700" />
                            ) : (
                                <Menu size={28} className="text-primary-700" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                {searchOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-2xl p-4 animate-slide-down">
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for courses, news, events..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 shadow-2xl">
                        <div className="px-6 py-4 space-y-2">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`
                                        block px-4 py-3 rounded-xl text-base font-semibold transition-colors
                                        ${isActive(link.to)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                {quickLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMenuOpen(false)}
                                        className={`
                                            block px-4 py-3 rounded-xl text-center font-bold transition-colors
                                            ${link.primary
                                                ? 'bg-accent-500 text-primary-900'
                                                : 'bg-primary-600 text-white'
                                            }
                                        `}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer - Mobile First Modern Design */}
            <footer className="bg-primary-900 text-white mt-auto relative overflow-hidden lg:mb-0 mb-16">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-800/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 lg:py-16 relative z-10">
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Brand Column */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center">
                                    <GraduationCap className="text-primary-900" size={24} />
                                </div>
                                <div>
                                    <span className="font-black text-xl text-white block">Garden TVET</span>
                                    <span className="text-xs text-accent-400 font-bold tracking-wider">SCHOOL</span>
                                </div>
                            </div>
                            <p className="text-primary-300 leading-relaxed mb-6">
                                Empowering students with practical skills and knowledge for a brighter future in Rwanda and beyond.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-10 h-10 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Facebook size={18} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Twitter size={18} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Instagram size={18} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Youtube size={18} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-accent-400">Quick Links</h4>
                            <ul className="space-y-3">
                                {navLinks.map(link => (
                                    <li key={link.to}>
                                        <Link to={link.to} className="text-primary-300 hover:text-accent-400 transition-colors flex items-center gap-2">
                                            <ChevronDown size={12} className="rotate-[-90deg]" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Programs */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-accent-400">Programs</h4>
                            <ul className="space-y-3 text-primary-300">
                                <li className="flex items-center gap-2">
                                    <ChevronDown size={12} className="rotate-[-90deg]" />
                                    Software Development
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronDown size={12} className="rotate-[-90deg]" />
                                    Automobile Technology
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronDown size={12} className="rotate-[-90deg]" />
                                    Building & Construction
                                </li>
                                <li className="flex items-center gap-2">
                                    <ChevronDown size={12} className="rotate-[-90deg]" />
                                    Electrical Engineering
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-accent-400">Contact Us</h4>
                            <ul className="space-y-4 text-primary-300">
                                <li className="flex items-start gap-3">
                                    <MapPin size={20} className="text-accent-400 mt-0.5 flex-shrink-0" />
                                    <span>Kigali City, Rwanda<br />Near Kigali Convention Centre</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={20} className="text-accent-400 flex-shrink-0" />
                                    <span>+250 780 000 000</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={20} className="text-accent-400 flex-shrink-0" />
                                    <span>info@gardentvet.rw</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Mobile Footer - Accordion Style */}
                    <div className="lg:hidden space-y-4">
                        {/* Mobile Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center">
                                <GraduationCap className="text-primary-900" size={24} />
                            </div>
                            <div>
                                <span className="font-black text-xl text-white block">Garden TVET</span>
                                <span className="text-xs text-accent-400 font-bold tracking-wider">SCHOOL</span>
                            </div>
                        </div>

                        {/* Mobile Quick Actions */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <Link to="/apply" className="bg-accent-500 text-primary-900 py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                <GraduationCap size={18} />
                                Apply Now
                            </Link>
                            <Link to="/contact" className="bg-primary-800 text-white py-3 px-4 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                                <Mail size={18} />
                                Contact
                            </Link>
                        </div>

                        {/* Mobile Accordion Sections */}
                        <MobileFooterSection title="Quick Links" defaultOpen>
                            {navLinks.map(link => (
                                <Link key={link.to} to={link.to} className="block py-2 text-primary-300 hover:text-accent-400">
                                    {link.label}
                                </Link>
                            ))}
                        </MobileFooterSection>

                        <MobileFooterSection title="Programs">
                            <Link to="/services" className="block py-2 text-primary-300 hover:text-accent-400">Software Development</Link>
                            <Link to="/services" className="block py-2 text-primary-300 hover:text-accent-400">Automobile Technology</Link>
                            <Link to="/services" className="block py-2 text-primary-300 hover:text-accent-400">Building & Construction</Link>
                            <Link to="/services" className="block py-2 text-primary-300 hover:text-accent-400">Electrical Engineering</Link>
                        </MobileFooterSection>

                        <MobileFooterSection title="Contact">
                            <a href="tel:+250780000000" className="flex items-center gap-3 py-2 text-primary-300">
                                <Phone size={18} className="text-accent-400" />
                                +250 780 000 000
                            </a>
                            <a href="mailto:info@gardentvet.rw" className="flex items-center gap-3 py-2 text-primary-300">
                                <Mail size={18} className="text-accent-400" />
                                info@gardentvet.rw
                            </a>
                            <div className="flex items-start gap-3 py-2 text-primary-300">
                                <MapPin size={18} className="text-accent-400 mt-1" />
                                Kigali, Rwanda
                            </div>
                        </MobileFooterSection>

                        {/* Mobile Social Links */}
                        <div className="pt-4 border-t border-primary-800">
                            <h4 className="font-bold text-accent-400 mb-4">Follow Us</h4>
                            <div className="flex gap-3">
                                <a href="#" className="w-12 h-12 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Facebook size={20} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-12 h-12 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Twitter size={20} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-12 h-12 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Instagram size={20} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                                <a href="#" className="w-12 h-12 rounded-xl bg-primary-800 hover:bg-accent-500 flex items-center justify-center transition-colors group">
                                    <Youtube size={20} className="text-primary-300 group-hover:text-primary-900" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-primary-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-primary-400 text-sm">
                            © {new Date().getFullYear()} Garden TVET School. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-primary-400">
                            <a href="#" className="hover:text-accent-400 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-accent-400 transition-colors">Terms</a>
                            <a href="#" className="hover:text-accent-400 transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
                <div className="flex items-center justify-around h-16">
                    <Link to="/home" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive('/home') ? 'text-primary-600' : 'text-gray-500'}`}>
                        <Home size={20} />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    <Link to="/services" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive('/services') ? 'text-primary-600' : 'text-gray-500'}`}>
                        <GraduationCap size={20} />
                        <span className="text-xs mt-1">Programs</span>
                    </Link>
                    <Link to="/apply" className="flex flex-col items-center justify-center flex-1 h-full text-accent-500">
                        <div className="w-12 h-12 -mt-6 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                            <GraduationCap size={24} className="text-primary-900" />
                        </div>
                        <span className="text-xs mt-1 font-bold">Apply</span>
                    </Link>
                    <Link to="/news" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive('/news') ? 'text-primary-600' : 'text-gray-500'}`}>
                        <Bell size={20} />
                        <span className="text-xs mt-1">News</span>
                    </Link>
                    <Link to="/contact" className={`flex flex-col items-center justify-center flex-1 h-full ${isActive('/contact') ? 'text-primary-600' : 'text-gray-500'}`}>
                        <Phone size={20} />
                        <span className="text-xs mt-1">Contact</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PublicLayout;

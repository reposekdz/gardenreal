import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Lock, User, Eye, EyeOff, Loader2,
    Globe, ArrowRight, Shield, ArrowLeft, Home
} from 'lucide-react';

const Login = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const loginStore = useAuthStore(state => state.login);
    const API_URL = import.meta.env.VITE_API_URL || '';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        // Auto-redirect if already logged in
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    // Student registration codes look like 2026/SOF/001 or 2025/AUTO/12
    const isStudentCode = (s) => /^\d{4}\s*\/\s*[A-Za-z]{2,5}\s*\/\s*\d{1,5}$/.test(String(s).trim());

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1) Try student auth if username matches the reg-number pattern
            if (isStudentCode(username)) {
                try {
                    const sres = await axios.post(`${API_URL}/api/student-auth/login`, {
                        code: username.trim().toUpperCase().replace(/\s+/g, ''),
                        password
                    });
                    const { accessToken, ...sdata } = sres.data;
                    loginStore(sdata, accessToken);
                    toast.success('Murakaza neza, ' + (sdata.first_name || ''));
                    navigate('/student-dashboard');
                    return;
                } catch (sErr) {
                    if (sErr.response?.status === 404 || sErr.response?.status === 401) {
                        toast.error(sErr.response?.data?.message || 'Kode cyangwa ijambobanga si byo');
                        return;
                    }
                    // fall through to staff login if other error
                }
            }

            // 2) Staff login
            const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
            const { accessToken, ...userData } = response.data;
            loginStore(userData, accessToken);

            toast.success('Login Successful! Welcome back.');
            if (userData.role === 'parent') navigate('/parents');
            else if (userData.role === 'teacher') navigate('/teacher');
            else if (userData.role === 'student') navigate('/student-dashboard');
            else navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
                    {/* Logo Image */}
                    <img
                        src="/logo.png"
                        alt="Garden TVET School Logo"
                        className="w-40 h-40 object-contain mb-8 rounded-2xl shadow-2xl"
                    />
                    <h1 className="text-5xl font-black mb-4 text-center">
                        <span className="text-accent-400">Garden</span> TVET
                    </h1>
                    <p className="text-xl text-primary-200 text-center max-w-md mb-8">
                        School Management System
                    </p>

                    <div className="space-y-4 text-center">
                        <div className="flex items-center gap-3 text-primary-200">
                            <Shield size={20} className="text-accent-400" />
                            <span>Secure Authentication</span>
                        </div>
                        <div className="flex items-center gap-3 text-primary-200">
                            <Globe size={20} className="text-accent-400" />
                            <span>Multi-language Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Back to Home Button */}
                    <Link to="/home" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors">
                        <ArrowLeft size={20} />
                        {t('pub.nav.home') || 'Back to Home'}
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Garden TVET Logo"
                            className="w-20 h-20 object-contain rounded-xl shadow-lg"
                        />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Murakaza neza</h2>
                        <p className="text-gray-500 mt-2">Injira muri konte yawe</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Izina, Telephone, cyangwa Kode (2026/SOF/001)
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-800 placeholder-gray-400"
                                    placeholder="Andika izina, telephone, cyangwa kode y'umunyeshuri"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                                Abanyeshuri: koresha kode yawe (urugero: <span className="font-mono font-bold">2026/SOF/001</span>) na ijambobanga rya nyuma 4 z'imibare ya telefoni yawe.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ijambobanga
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-12 pr-14 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-800 placeholder-gray-400"
                                    placeholder="Injira ijambobanga"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-600">Nigukumbira</span>
                            </label>
                            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                Ibyifuzo by'ijambobanga?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    Injira
                                    <ArrowRight size={20} className="ml-2" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">
                            Uri umubyeyi?{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Iyandikishe hano
                            </Link>
                        </p>
                    </div>

                    {/* Language Selector */}
                    <div className="mt-8 flex justify-center gap-2">
                        {[
                            { code: 'rw', label: '🇷🇼 Kinyarwanda' },
                            { code: 'en', label: '🇬🇧 English' },
                            { code: 'fr', label: '🇫🇷 Français' }
                        ].map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => i18n.changeLanguage(lang.code)}
                                className={`px-4-sm rounded-xl transition py-2 text-colors ${i18n.language === lang.code
                                    ? 'bg-primary-100 text-primary-700 font-semibold'
                                    : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

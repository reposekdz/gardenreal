import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    CheckCircle, Send, ChevronDown, User, MapPin, GraduationCap,
    Phone, Mail, Calendar, Home, Award, FileText, ArrowRight, ArrowLeft,
    Check, Loader2, Building2, Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Trade options with images
const TRADE_OPTIONS = [
    {
        id: 'software',
        name: 'Software Development',
        name_rw: 'Ikigoziro software',
        description: 'Learn programming, web development, mobile apps, and software engineering',
        description_rw: 'Uburyo bwo gukora programme, ikoranabuhanga, nibikoresho bikoresha哑',
        image: `${API_URL}/uploads/trade card image/sod.jpg`,
        color: 'from-blue-500 to-blue-700'
    },
    {
        id: 'automobile',
        name: 'Automobile Technology',
        name_rw: 'Ikigoziro ibinyabiziga',
        description: 'Master automotive repair, engine mechanics, electrical systems, and diagnostics',
        description_rw: 'Uburyo bwo gutunganya ibinyabiziga, motor, nibikoranabuhanga bya maratari',
        image: `${API_URL}/uploads/trade card image/auto.jpg`,
        color: 'from-green-500 to-green-700'
    },
    {
        id: 'building',
        name: 'Building and Construction',
        name_rw: 'Ikigoziro uguhinga',
        description: 'Civil engineering, masonry, plumbing, electrical installation, and architecture',
        description_rw: 'Injeneriya y ubuhinzi, amabuye, ibikoresho byamazi, nibyinshi',
        image: `${API_URL}/uploads/trade card image/bdc.jpg`,
        color: 'from-amber-500 to-amber-700'
    }
];

const LEVELS = {
    'software': ['Level 3 - Foundation', 'Level 4 - Intermediate', 'Level 5 - Advanced'],
    'automobile': ['Level 3 - Foundation', 'Level 4A - Engine', 'Level 4B - Electrical', 'Level 5A - Advanced Engine', 'Level 5B - Diagnostics'],
    'building': ['Level 3 - Foundation', 'Level 4 - Intermediate', 'Level 5 - Advanced']
};

const LEVELS_RW = {
    'software': ['Level 3 - Itangiriro', 'Level 4 - Hagati', 'Level 5 - Hejuru'],
    'automobile': ['Level 3 - Itangiriro', 'Level 4A - Motor', 'Level 4B - Ibinyabiziga', 'Level 5A - Motor yikize', 'Level 5B - Diagnostique'],
    'building': ['Level 3 - Itangiriro', 'Level 4 - Hagati', 'Level 5 - Hejuru']
};

const PROVINCES = ['Kigali', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province', 'Kigali'];
const PROVINCES_RW = ['Kigali', 'Amajyaruguru', 'Amajyepfo', 'Iburasirazuba', 'Iburengerazuba', 'Kigali'];

const ApplyPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'rw';
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
    const [errors, setErrors] = useState({});

    const [form, setForm] = useState({
        // Step 1: Personal Info
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        // Step 2: Contact Info
        phone: '',
        email: '',
        province: '',
        district: '',
        sector: '',
        // Step 3: Education
        trade: '',
        level: '',
        previous_school: '',
        previous_sector: '',
        // Step 4: Additional
        has_laptop: '',
        heard_from: '',
        motivation: ''
    });

    const totalSteps = 4;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value,
            // Reset level when trade changes
            ...(name === 'trade' ? { level: '' } : {}),
            // Reset district when province changes
            ...(name === 'province' ? { district: '', sector: '' } : {}),
            ...(name === 'district' ? { sector: '' } : {})
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
            if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
            if (!form.gender) newErrors.gender = 'Please select gender';
            if (!form.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        }

        if (currentStep === 2) {
            if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
            else if (!/^\d{9,10}$/.test(form.phone.replace(/\D/g, ''))) newErrors.phone = 'Enter a valid phone number';
            if (!form.province) newErrors.province = 'Please select province';
        }

        if (currentStep === 3) {
            if (!form.trade) newErrors.trade = 'Please select a trade';
            if (!form.level) newErrors.level = 'Please select a level';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(3)) {
            setStep(3);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/applications`, form);
            setApplicationId(response.data.id || response.data.application_id);
            setSubmitted(true);
            toast.success('Application submitted successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return lang === 'rw' ? 'Amakuru yibatswe' : 'Personal Information';
            case 2: return lang === 'rw' ? 'Contact Information' : 'Contact Information';
            case 3: return lang === 'rw' ? 'Ishami na Level' : 'Trade & Level';
            case 4: return lang === 'rw' ? 'Ibindi bisobanuro' : 'Additional Info';
            default: return '';
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-6 py-12">
                <div className="max-w-lg w-full text-center bg-white rounded-3xl shadow-2xl p-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">🎉 {t('pub.apply.success')}</h2>
                    <p className="text-gray-500 mb-2">Uzabona ubutumwa (SMS) kuri telefone yawe mu gihe gito.</p>
                    {applicationId && (
                        <p className="text-sm text-primary-600 font-mono bg-primary-50 p-2 rounded-lg mb-6">
                            Application ID: {applicationId}
                        </p>
                    )}
                    <button onClick={() => window.location.href = '/home'}
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                        Subira Ahabanza
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-800 to-primary-900 py-20 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />

                <h1 className="text-5xl font-black mb-4 relative z-10">{t('pub.apply.title')}</h1>
                <p className="text-primary-200 text-lg relative z-10 max-w-xl mx-auto">{t('pub.apply.subtitle')}</p>

                {/* Progress Steps */}
                <div className="flex justify-center mt-8 relative z-10">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s
                                ? 'bg-accent-500 text-primary-900'
                                : 'bg-white/20 text-white/60'
                                }`}>
                                {step > s ? <CheckCircle size={20} /> : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-16 h-1 mx-1 ${step > s ? 'bg-accent-500' : 'bg-white/20'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-16">
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Step Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    {step === 1 && <User size={24} />}
                                    {step === 2 && <MapPin size={24} />}
                                    {step === 3 && <GraduationCap size={24} />}
                                    {step === 4 && <FileText size={24} />}
                                    {getStepTitle()}
                                </h2>
                                <p className="text-primary-200 text-sm mt-1">
                                    Step {step} of {totalSteps}
                                </p>
                            </div>
                            <div className="text-white/60 text-sm">
                                {Math.round((step / totalSteps) * 100)}% Complete
                            </div>
                        </div>
                        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-500 transition-all duration-500"
                                style={{ width: `${(step / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('pub.apply.firstName')} * <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Ex: Jean Pierre"
                                    />
                                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('pub.apply.lastName')} * <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Ex: Mugisha"
                                    />
                                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.gender === 'Male' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                                            <input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={handleChange} className="hidden" />
                                            <Users size={20} className={form.gender === 'Male' ? 'text-primary-600' : 'text-gray-400'} />
                                            <span className={`font-medium ${form.gender === 'Male' ? 'text-primary-600' : 'text-gray-600'}`}>Male</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.gender === 'Female' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                                            <input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={handleChange} className="hidden" />
                                            <Users size={20} className={form.gender === 'Female' ? 'text-primary-600' : 'text-gray-400'} />
                                            <span className={`font-medium ${form.gender === 'Female' ? 'text-primary-600' : 'text-gray-600'}`}>Female</span>
                                        </label>
                                    </div>
                                    {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Calendar size={14} className="inline mr-1" /> Date of Birth *
                                    </label>
                                    <input
                                        required
                                        name="date_of_birth"
                                        value={form.date_of_birth}
                                        onChange={handleChange}
                                        type="date"
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Contact Info */}
                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Phone size={14} className="inline mr-1" /> {t('pub.apply.phone')} * <span className="font-normal text-gray-400">(SMS izaza hano)</span>
                                    </label>
                                    <input
                                        required
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        placeholder="Ex: 0780000000"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Mail size={14} className="inline mr-1" /> {t('pub.apply.email')}
                                    </label>
                                    <input
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        type="email"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder="Ex: jean@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <MapPin size={14} className="inline mr-1" /> Province *
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="province"
                                            value={form.province}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white pr-10 ${errors.province ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            <option value="">-- Hitamo Intara --</option>
                                            {PROVINCES.map((p, i) => (
                                                <option key={p} value={p}>{lang === 'rw' ? PROVINCES_RW[i] : p}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Home size={14} className="inline mr-1" /> District / Akarere
                                    </label>
                                    <input
                                        name="district"
                                        value={form.district}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder="Ex: Gasabo"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Sector / Umurenge
                                    </label>
                                    <input
                                        name="sector"
                                        value={form.sector}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder="Ex: Kacyiru"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Trade & Level with Images */}
                        {step === 3 && (
                            <div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-4">
                                        {t('pub.apply.trade')} * <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {TRADE_OPTIONS.map((trade) => (
                                            <label
                                                key={trade.id}
                                                className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all group ${form.trade === trade.id ? 'ring-4 ring-primary-500 ring-offset-2' : 'hover:shadow-lg'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="trade"
                                                    value={trade.id}
                                                    checked={form.trade === trade.id}
                                                    onChange={handleChange}
                                                    className="hidden"
                                                />
                                                <div className="h-40 relative">
                                                    <img
                                                        src={trade.image}
                                                        alt={trade.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className={`absolute inset-0 bg-gradient-to-t ${trade.color} opacity-80`} />
                                                    <div className="absolute bottom-3 left-3 right-3">
                                                        <h3 className="text-white font-black text-lg">{lang === 'rw' ? trade.name_rw : trade.name}</h3>
                                                    </div>
                                                    {form.trade === trade.id && (
                                                        <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                                            <CheckCircle size={20} className="text-primary-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.trade && <p className="text-red-500 text-xs mt-2">{errors.trade}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {t('pub.apply.level')} * <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="level"
                                            value={form.level}
                                            onChange={handleChange}
                                            disabled={!form.trade}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${errors.level ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            <option value="">-- Hitamo Urwego --</option>
                                            {(LEVELS[form.trade] || []).map((lv, i) => (
                                                <option key={lv} value={lv}>{lang === 'rw' ? LEVELS_RW[form.trade][i] : lv}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Additional Info */}
                        {step === 4 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Building2 size={14} className="inline mr-1" /> {t('pub.apply.prevSchool')}
                                    </label>
                                    <input
                                        name="previous_school"
                                        value={form.previous_school}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder="Ex: GS Kigali"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Award size={14} className="inline mr-1" /> Do you have a laptop?
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.has_laptop === 'yes' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                                            <input type="radio" name="has_laptop" value="yes" checked={form.has_laptop === 'yes'} onChange={handleChange} className="hidden" />
                                            <span className={`font-medium ${form.has_laptop === 'yes' ? 'text-green-600' : 'text-gray-600'}`}>Yes</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.has_laptop === 'no' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                                            <input type="radio" name="has_laptop" value="no" checked={form.has_laptop === 'no'} onChange={handleChange} className="hidden" />
                                            <span className={`font-medium ${form.has_laptop === 'no' ? 'text-amber-600' : 'text-gray-600'}`}>No</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        How did you hear about us?
                                    </label>
                                    <select
                                        name="heard_from"
                                        value={form.heard_from}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white"
                                    >
                                        <option value="">-- Select --</option>
                                        <option value="social">Social Media</option>
                                        <option value="friend">Friend/Relative</option>
                                        <option value="school">School Visit</option>
                                        <option value="radio">Radio</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Why do you want to join Garden TVET?
                                    </label>
                                    <textarea
                                        name="motivation"
                                        value={form.motivation}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder="Tell us about your goals and motivations..."
                                    />
                                </div>

                                {/* Terms notice */}
                                <div className="md:col-span-2 bg-primary-50 rounded-xl p-4 border border-primary-100">
                                    <p className="text-xs text-primary-700">
                                        📱 <strong>Note:</strong> You will receive an SMS on your phone after submission. Make sure your phone number is correct.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="px-8 py-6 bg-gray-50 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${step === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                            >
                                Next <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-black rounded-xl transition-all flex items-center gap-3 shadow-lg shadow-primary-500/30 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Submitting...
                                    </>
                                ) : (
                                    <>
                                        {t('pub.apply.submit')} <Send size={20} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyPage;

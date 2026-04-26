import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    CheckCircle, Send, ChevronDown, User, MapPin, GraduationCap,
    Phone, Mail, Calendar, Home, Award, FileText, ArrowRight, ArrowLeft,
    Check, Loader2, Building2, Users, Heart, Baby, BookOpen, Clock,
    Shield, AlertCircle, CheckSquare, Info, ChevronUp, Star, Target,
    Briefcase, TrendingUp, Wallet, Smile, Frown
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Trade options with images and details
const TRADE_OPTIONS = [
    {
        id: 'software',
        name: 'Software Development',
        name_rw: 'Ikigoziro software',
        description: 'Learn programming, web development, mobile apps, and software engineering',
        description_rw: 'Uburyo bwo gukora programme, ikoranabuhanga, nibikoresho bikoresha',
        image: `${API_URL}/uploads/trade card image/sod.jpg`,
        color: 'from-blue-500 to-blue-700',
        duration: '3 Years',
        levels: ['Level 3 - Foundation', 'Level 4 - Intermediate', 'Level 5 - Advanced'],
        career_paths: ['Software Developer', 'Web Developer', 'Mobile App Developer', 'Database Administrator']
    },
    {
        id: 'automobile',
        name: 'Automobile Technology',
        name_rw: 'Ikigoziro ibinyabiziga',
        description: 'Master automotive repair, engine mechanics, electrical systems, and diagnostics',
        description_rw: 'Uburyo bwo gutunganya ibinyabiziga, motor, nibikoranabuhanga bya maratari',
        image: `${API_URL}/uploads/trade card image/auto.jpg`,
        color: 'from-green-500 to-green-700',
        duration: '3 Years',
        levels: ['Level 3 - Foundation', 'Level 4A - Engine', 'Level 4B - Electrical', 'Level 5A - Advanced Engine', 'Level 5B - Diagnostics'],
        career_paths: ['Automotive Technician', 'Mechanic', 'Auto Electrician', 'Diagnostic Specialist']
    },
    {
        id: 'building',
        name: 'Building and Construction',
        name_rw: 'Ikigoziro uguhinga',
        description: 'Civil engineering, masonry, plumbing, electrical installation, and architecture',
        description_rw: 'Injeneriya y ubuhinzi, amabuye, ibikoresho byamazi, nibyinshi',
        image: `${API_URL}/uploads/trade card image/bdc.jpg`,
        color: 'from-amber-500 to-amber-700',
        duration: '3 Years',
        levels: ['Level 3 - Foundation', 'Level 4 - Intermediate', 'Level 5 - Advanced'],
        career_paths: ['Civil Engineer', 'Mason', 'Plumber', 'Electrician', 'Architect']
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

const RELATIONSHIPS = [
    { value: 'Father', label: 'Father', label_rw: 'Papa' },
    { value: 'Mother', label: 'Mother', label_rw: 'Mama' },
    { value: 'Guardian', label: 'Guardian', label_rw: 'Umugari' },
    { value: 'Other', label: 'Other', label_rw: 'Ibindi' }
];

const ParentApplyPage = () => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language || 'rw';
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
    const [errors, setErrors] = useState({});
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [showAllCareers, setShowAllCareers] = useState(false);

    // Parent Information (Step 1)
    const [parentForm, setParentForm] = useState({
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        relationship: '',
        province: '',
        district: '',
        sector: ''
    });

    // Student Information (Step 2)
    const [studentForm, setStudentForm] = useState({
        student_first_name: '',
        student_last_name: '',
        student_gender: '',
        student_dob: '',
        student_phone: '',
        trade: '',
        level: ''
    });

    // Additional Information (Step 3)
    const [additionalForm, setAdditionalForm] = useState({
        previous_school: '',
        previous_sector: '',
        has_laptop: '',
        motivation: '',
        terms_accepted: false
    });

    const totalSteps = 3;

    const handleParentChange = (e) => {
        const { name, value } = e.target;
        setParentForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'province' ? { district: '', sector: '' } : {}),
            ...(name === 'district' ? { sector: '' } : {})
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleStudentChange = (e) => {
        const { name, value } = e.target;
        setStudentForm(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'trade' ? { level: '' } : {})
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleAdditionalChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAdditionalForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!parentForm.parent_name.trim()) newErrors.parent_name = lang === 'rw' ? 'Izina ry\'umubyeyi rirakenewe' : 'Parent/Guardian name is required';
            if (!parentForm.parent_phone.trim()) newErrors.parent_phone = lang === 'rw' ? 'Telefone irakenewe' : 'Phone number is required';
            if (!parentForm.relationship) newErrors.relationship = lang === 'rw' ? 'Hitamo isano n\'umwana' : 'Please select relationship';
            if (!parentForm.province) newErrors.province = lang === 'rw' ? 'Hitamo intara' : 'Please select province';
        }

        if (currentStep === 2) {
            if (!studentForm.student_first_name.trim()) newErrors.student_first_name = lang === 'rw' ? 'Izina rya mbere rirakenewe' : 'Student first name is required';
            if (!studentForm.student_last_name.trim()) newErrors.student_last_name = lang === 'rw' ? 'Izina rya kabiri rirakenewe' : 'Student last name is required';
            if (!studentForm.student_gender) newErrors.student_gender = lang === 'rw' ? 'Hitamo igitsina' : 'Please select gender';
            if (!studentForm.student_dob) newErrors.student_dob = lang === 'rw' ? 'Itariki y\'amavuko irakenewe' : 'Date of birth is required';
            if (!studentForm.trade) newErrors.trade = lang === 'rw' ? 'Hitamo ishami' : 'Please select a trade';
            if (!studentForm.level) newErrors.level = lang === 'rw' ? 'Hitamo icyiciro' : 'Please select a level';
        }

        if (currentStep === 3) {
            if (!additionalForm.terms_accepted) newErrors.terms_accepted = lang === 'rw' ? 'Ugomba kwemeza amasezerano' : 'You must accept the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, totalSteps));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        setLoading(true);
        try {
            const formData = {
                parent_name: parentForm.parent_name,
                phone: parentForm.parent_phone,
                email: parentForm.parent_email || null,
                province: parentForm.province,
                district: parentForm.district || null,
                sector: parentForm.sector || null,
                first_name: studentForm.student_first_name,
                last_name: studentForm.student_last_name,
                gender: studentForm.student_gender,
                date_of_birth: studentForm.student_dob,
                trade: studentForm.trade,
                level: studentForm.level,
                previous_school: additionalForm.previous_school || null,
                has_laptop: additionalForm.has_laptop || null,
                motivation: additionalForm.motivation || null
            };

            const response = await axios.post(`${API_URL}/api/applications`, formData);
            setApplicationId(response.data.id || response.data.application_id);
            setSubmitted(true);
            toast.success(lang === 'rw' ? 'Byagenze neza! Urasubizwa mu butumwa bugufi (SMS).' : 'Application submitted successfully! You will receive an SMS confirmation.');
        } catch (err) {
            toast.error(err.response?.data?.message || (lang === 'rw' ? 'Ntibikunze. Ongera ugerageze.' : 'Submission failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return lang === 'rw' ? 'Amakuru y\'Umubyeyi' : 'Parent/Guardian Information';
            case 2: return lang === 'rw' ? 'Amakuru y\'Umwana' : 'Student Information';
            case 3: return lang === 'rw' ? 'Ibindi bisobanuro' : 'Additional Information';
            default: return '';
        }
    };

    useEffect(() => {
        if (studentForm.trade) {
            const trade = TRADE_OPTIONS.find(t => t.id === studentForm.trade);
            setSelectedTrade(trade);
        }
    }, [studentForm.trade]);

    // Calculate student age from DOB
    const calculateAge = (dob) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const studentAge = calculateAge(studentForm.student_dob);

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center px-4 py-8">
                <div className="max-w-lg w-full text-center bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">{lang === 'rw' ? 'Ubusabe bwakiriwe!' : 'Application Submitted!'}</h2>
                    <p className="text-gray-500 mb-4">
                        {lang === 'rw' 
                            ? <span>Urakoze kwiyandikisha muri Garden TVET! Urahabwa ubutumwa bugufi (SMS) kwemeza kuri <strong>{parentForm.parent_phone}</strong> mbere y'amasaha 24.</span>
                            : <span>Thank you for applying to Garden TVET! You will receive an SMS confirmation at <strong>{parentForm.parent_phone}</strong> within 24 hours.</span>}
                    </p>
                    {applicationId && (
                        <p className="text-sm text-primary-600 font-mono bg-primary-50 p-3 rounded-lg mb-6">
                            {lang === 'rw' ? 'Nomero y\'ubusabe:' : 'Application ID:'} {applicationId}
                        </p>
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="text-yellow-800 text-sm">
                            <AlertCircle size={16} className="inline mr-2" />
                            {lang === 'rw' ? 'Tugusabye kugumana nomero yawe iri k\'umurongo kugirango uhabwe amakuru.' : 'Please keep your phone number active for SMS updates about your application status.'}
                        </p>
                    </div>
                    <button onClick={() => window.location.href = '/home'}
                        className="w-full md:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                        {lang === 'rw' ? 'Subira Ahatangirirwa' : 'Return to Home'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-green-900 py-12 md:py-20 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <Heart size={32} className="text-accent-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-3">{lang === 'rw' ? 'Iyandikishe nk\'Umubyeyi' : 'Iyandikishe nk\'Umubyeyi'}</h1>
                    <p className="text-primary-200 text-base md:text-lg max-w-xl mx-auto">{lang === 'rw' ? 'Andikisha umwana wawe mu masomo y\'imyuga muri Garden TVET' : 'Register your child for vocational training at Garden TVET'}</p>
                </div>
            </div>

            {/* Mobile-Friendly Step Indicator */}
            <div className="bg-white shadow-lg sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <button
                                    onClick={() => step > s && setStep(s)}
                                    disabled={step < s}
                                    className={`flex items-center gap-2 ${step >= s ? 'text-primary-600' : 'text-gray-300'} ${step > s ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                >
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step > s ? 'bg-green-500 text-white' :
                                            step === s ? 'bg-primary-600 text-white' :
                                                'bg-gray-200 text-gray-400'
                                        }`}>
                                        {step > s ? <CheckCircle size={18} /> : s}
                                    </div>
                                    <span className="hidden md:inline font-medium text-sm">
                                        {lang === 'rw' 
                                            ? (s === 1 ? 'Umubyeyi' : s === 2 ? 'Umwana' : 'Ibindi') 
                                            : (s === 1 ? 'Parent' : s === 2 ? 'Student' : 'Additional')}
                                    </span>
                                </button>
                                {s < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-primary-500 transition-all duration-500"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Step Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-green-600 px-6 md:px-8 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    {step === 1 && <User size={20} />}
                                    {step === 2 && <Baby size={20} />}
                                    {step === 3 && <FileText size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white">{getStepTitle()}</h2>
                                    <p className="text-white/70 text-xs">{lang === 'rw' ? `Intambwe ya ${step} kuri ${totalSteps}` : `Step ${step} of ${totalSteps}`}</p>
                                </div>
                            </div>
                            <div className="text-white/60 text-sm font-medium">
                                {Math.round((step / totalSteps) * 100)}% {lang === 'rw' ? 'Yuzuye' : 'Complete'}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* Step 1: Parent Info */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-2xl p-5 mb-6">
                                    <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                                        <Shield size={20} /> {lang === 'rw' ? 'Amakuru Mumbashyashya' : 'Parent/Guardian Details'}
                                    </h3>
                                    <p className="text-blue-600 text-sm">{lang === 'rw' ? 'Saba utange amakuru yawe y\'umubyeyi cyangwa umugari w\'umwana.' : 'Please provide your information as the parent or guardian of the applicant.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {lang === 'rw' ? 'Izina ry\'Umubyeyi cyangwa Umugari *' : 'Parent/Guardian Name *'}
                                        </label>
                                        <input
                                            required
                                            name="parent_name"
                                            value={parentForm.parent_name}
                                            onChange={handleParentChange}
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.parent_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            placeholder={lang === 'rw' ? 'Urugero: Jean Pierre Mutabazi' : 'Ex: Jean Pierre Mutabazi'}
                                        />
                                        {errors.parent_name && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Izina ry\'umubyeyi rirakenewe' : errors.parent_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Relationship to Student *
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="relationship"
                                                value={parentForm.relationship}
                                                onChange={handleParentChange}
                                                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white pr-10 ${errors.relationship ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            >
                                                <option value="">-- Select --</option>
                                                {RELATIONSHIPS.map(r => (
                                                    <option key={r.value} value={r.value}>{lang === 'rw' ? r.label_rw : r.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                        {errors.relationship && <p className="text-red-500 text-xs mt-1">{errors.relationship}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <Phone size={14} className="inline mr-1" /> {lang === 'rw' ? 'Telefone *' : 'Phone Number *'}
                                        </label>
                                        <input
                                            required
                                            name="parent_phone"
                                            value={parentForm.parent_phone}
                                            onChange={handleParentChange}
                                            type="tel"
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.parent_phone ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            placeholder={lang === 'rw' ? 'Urugero: 0780000000' : 'Ex: 0780000000'}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{lang === 'rw' ? 'Ubutumwa bugufi buzohererezwa kuri iyi nomero' : 'SMS updates will be sent to this number'}</p>
                                        {errors.parent_phone && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Telefone irakenewe' : errors.parent_phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <Mail size={14} className="inline mr-1" /> {lang === 'rw' ? 'Imeri (Sikambibi)' : 'Email (Optional)'}
                                        </label>
                                        <input
                                            name="parent_email"
                                            value={parentForm.parent_email}
                                            onChange={handleParentChange}
                                            type="email"
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder={lang === 'rw' ? 'Urugero: umubyeyi@email.com' : 'Ex: parent@email.com'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <MapPin size={14} className="inline mr-1" /> {lang === 'rw' ? 'Intara *' : 'Province *'}
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="province"
                                                value={parentForm.province}
                                                onChange={handleParentChange}
                                                className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white pr-10 ${errors.province ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            >
                                                <option value="">{lang === 'rw' ? '-- Hitamo Intara --' : '-- Select Province --'}</option>
                                                {PROVINCES.map((p, i) => (
                                                    <option key={p} value={p}>{lang === 'rw' ? PROVINCES_RW[i] : p}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                        {errors.province && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Intara irakenewe' : errors.province}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {lang === 'rw' ? 'Akarere' : 'District'}
                                        </label>
                                        <input
                                            name="district"
                                            value={parentForm.district}
                                            onChange={handleParentChange}
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder={lang === 'rw' ? 'Urugero: Gasabo' : 'Ex: Gasabo'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Student Info */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">
                                    <h3 className="font-bold text-green-800 flex items-center gap-2 mb-2">
                                        <GraduationCap size={20} /> {lang === 'rw' ? 'Amakuru y\'Umwana' : 'Student Information'}
                                    </h3>
                                    <p className="text-green-600 text-sm">{lang === 'rw' ? 'Saba utange ibisobanuro by\'umwana wiyandikishijwe.' : 'Please provide details about the student you are registering.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {lang === 'rw' ? 'Izina rya Mbere ry\'Umwana *' : 'Student First Name *'}
                                        </label>
                                        <input
                                            required
                                            name="student_first_name"
                                            value={studentForm.student_first_name}
                                            onChange={handleStudentChange}
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.student_first_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            placeholder={lang === 'rw' ? 'Urugero: Emmanuel' : 'Ex: Emmanuel'}
                                        />
                                        {errors.student_first_name && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Izina rya mbere rirakenewe' : errors.student_first_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {lang === 'rw' ? 'Izina rya Kabiri ry\'Umwana *' : 'Student Last Name *'}
                                        </label>
                                        <input
                                            required
                                            name="student_last_name"
                                            value={studentForm.student_last_name}
                                            onChange={handleStudentChange}
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.student_last_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            placeholder={lang === 'rw' ? 'Urugero: Mugisha' : 'Ex: Mugisha'}
                                        />
                                        {errors.student_last_name && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Izina rya kabiri rirakenewe' : errors.student_last_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{lang === 'rw' ? 'Igitsina *' : 'Gender *'}</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${studentForm.student_gender === 'Male' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                                                <input type="radio" name="student_gender" value="Male" checked={studentForm.student_gender === 'Male'} onChange={handleStudentChange} className="hidden" />
                                                <Smile size={22} className={studentForm.student_gender === 'Male' ? 'text-green-600' : 'text-gray-400'} />
                                                <span className={`font-medium ${studentForm.student_gender === 'Male' ? 'text-green-600' : 'text-gray-600'}`}>{lang === 'rw' ? 'Gabo' : 'Male'}</span>
                                            </label>
                                            <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${studentForm.student_gender === 'Female' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300'}`}>
                                                <input type="radio" name="student_gender" value="Female" checked={studentForm.student_gender === 'Female'} onChange={handleStudentChange} className="hidden" />
                                                <Frown size={22} className={studentForm.student_gender === 'Female' ? 'text-pink-600' : 'text-gray-400'} />
                                                <span className={`font-medium ${studentForm.student_gender === 'Female' ? 'text-pink-600' : 'text-gray-600'}`}>{lang === 'rw' ? 'Gore' : 'Female'}</span>
                                            </label>
                                        </div>
                                        {errors.student_gender && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Igitsina kirakenewe' : errors.student_gender}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <Calendar size={14} className="inline mr-1" /> {lang === 'rw' ? 'Itariki y\'Amavuko *' : 'Date of Birth *'}
                                        </label>
                                        <input
                                            required
                                            name="student_dob"
                                            value={studentForm.student_dob}
                                            onChange={handleStudentChange}
                                            type="date"
                                            max="2015-01-01"
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm ${errors.student_dob ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        />
                                        {studentAge && (
                                            <p className="text-xs text-green-600 mt-1 font-medium">{lang === 'rw' ? `Umwana afite imyaka ${studentAge}` : `Student will be ${studentAge} years old`}</p>
                                        )}
                                        {errors.student_dob && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Itariki y\'amavuko irakenewe' : errors.student_dob}</p>}
                                    </div>
                                </div>

                                {/* Trade Selection with Images */}
                                <div className="mt-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-4">
                                        {lang === 'rw' ? 'Hitamo Ishami *' : 'Select Trade/Program *'}
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {TRADE_OPTIONS.map((trade) => (
                                            <label
                                                key={trade.id}
                                                className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all group ${studentForm.trade === trade.id ? 'ring-4 ring-green-500 ring-offset-2' : 'hover:shadow-xl'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="trade"
                                                    value={trade.id}
                                                    checked={studentForm.trade === trade.id}
                                                    onChange={handleStudentChange}
                                                    className="hidden"
                                                />
                                                <div className="h-40 md:h-48 relative">
                                                    <img
                                                        src={trade.image}
                                                        alt={trade.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className={`absolute inset-0 bg-gradient-to-t ${trade.color} opacity-80`} />
                                                    <div className="absolute bottom-3 left-3 right-3">
                                                        <h3 className="text-white font-black text-lg">{lang === 'rw' ? trade.name_rw : trade.name}</h3>
                                                        <p className="text-white/70 text-xs flex items-center gap-1">
                                                            <Clock size={12} /> {trade.duration}
                                                        </p>
                                                    </div>
                                                    {studentForm.trade === trade.id && (
                                                        <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                            <CheckCircle size={20} className="text-green-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.trade && <p className="text-red-500 text-xs mt-2">{errors.trade}</p>}
                                </div>

                                {/* Selected Trade Details */}
                                {selectedTrade && (
                                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <BookOpen size={18} /> {lang === 'rw' ? 'Ibyerekeye' : 'About'} {lang === 'rw' ? selectedTrade.name_rw : selectedTrade.name}
                                        </h4>
                                        <p className="text-gray-600 text-sm mb-4">{lang === 'rw' ? selectedTrade.description_rw : selectedTrade.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{lang === 'rw' ? 'Ibyiciro bihari' : 'Available Levels'}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(lang === 'rw' ? LEVELS_RW[selectedTrade.id] : selectedTrade.levels).map((level, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-medium">
                                                            {level}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{lang === 'rw' ? 'Amahiriwe y\'Akazi' : 'Career Opportunities'}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(showAllCareers ? selectedTrade.career_paths : selectedTrade.career_paths.slice(0, 3)).map((career, i) => (
                                                        <span key={i} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            {career}
                                                        </span>
                                                    ))}
                                                    {selectedTrade.career_paths.length > 3 && (
                                                        <button
                                                            onClick={() => setShowAllCareers(!showAllCareers)}
                                                            className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:underline"
                                                        >
                                                            {showAllCareers ? (lang === 'rw' ? 'Erekana bike' : 'Show less') : `+${selectedTrade.career_paths.length - 3} ${lang === 'rw' ? 'ibindi' : 'more'}`}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Level Selection */}
                                <div className="mt-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {lang === 'rw' ? 'Hitamo Icyiciro *' : 'Select Level *'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="level"
                                            value={studentForm.level}
                                            onChange={handleStudentChange}
                                            disabled={!studentForm.trade}
                                            className={`w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-white pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${errors.level ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            <option value="">{lang === 'rw' ? '-- Hitamo Icyiciro --' : '-- Select Level --'}</option>
                                            {(LEVELS[studentForm.trade] || []).map((lv, i) => (
                                                <option key={lv} value={lv}>{lang === 'rw' ? LEVELS_RW[studentForm.trade][i] : lv}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {errors.level && <p className="text-red-500 text-xs mt-1">{lang === 'rw' ? 'Icyiciro kirakenewe' : errors.level}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Additional Info */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
                                    <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                                        <FileText size={20} /> {lang === 'rw' ? 'Ibindi Bisobanuro' : 'Additional Information'}
                                    </h3>
                                    <p className="text-amber-600 text-sm">{lang === 'rw' ? 'Dufashe kumenya byinshi ku mwana wiyandikishijwe.' : 'Help us know more about the student\'s background.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <Building2 size={14} className="inline mr-1" /> {lang === 'rw' ? 'Ishuri Yigagaho Mbere' : 'Previous School'}
                                        </label>
                                        <input
                                            name="previous_school"
                                            value={additionalForm.previous_school}
                                            onChange={handleAdditionalChange}
                                            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder={lang === 'rw' ? 'Urugero: GS Kigali' : 'Ex: GS Kigali'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            <Wallet size={14} className="inline mr-1" /> {lang === 'rw' ? 'Umwana afite mudasobwa (Laptop)?' : 'Does the student have a laptop?'}
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${additionalForm.has_laptop === 'yes' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                                                <input type="radio" name="has_laptop" value="yes" checked={additionalForm.has_laptop === 'yes'} onChange={handleAdditionalChange} className="hidden" />
                                                <span className={`font-medium ${additionalForm.has_laptop === 'yes' ? 'text-green-600' : 'text-gray-600'}`}>{lang === 'rw' ? 'Yego' : 'Yes'}</span>
                                            </label>
                                            <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${additionalForm.has_laptop === 'no' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                                                <input type="radio" name="has_laptop" value="no" checked={additionalForm.has_laptop === 'no'} onChange={handleAdditionalChange} className="hidden" />
                                                <span className={`font-medium ${additionalForm.has_laptop === 'no' ? 'text-amber-600' : 'text-gray-600'}`}>{lang === 'rw' ? 'Oya' : 'No'}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        <Target size={14} className="inline mr-1" /> {lang === 'rw' ? 'Ni iyihe mpamvu ushaka kwiga muri Garden TVET?' : 'Why do you want to join Garden TVET? (Motivation)'}
                                    </label>
                                    <textarea
                                        name="motivation"
                                        value={additionalForm.motivation}
                                        onChange={handleAdditionalChange}
                                        rows={4}
                                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                        placeholder={lang === 'rw' ? 'Tubwire impamvu zawe zo kwiga iri shami...' : 'Tell us about your motivation to join this program...'}
                                    />
                                </div>

                                {/* Terms and Conditions */}
                                <div className="bg-gray-50 rounded-2xl p-5">
                                    <label className={`flex items-start gap-3 cursor-pointer ${errors.terms_accepted ? 'text-red-600' : ''}`}>
                                        <input
                                            type="checkbox"
                                            name="terms_accepted"
                                            checked={additionalForm.terms_accepted}
                                            onChange={handleAdditionalChange}
                                            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <p className="font-bold text-gray-800">{lang === 'rw' ? 'Amasezerano *' : 'Terms and Conditions *'}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {lang === 'rw' ? 'Ndemeza ko amakuru yose natanze ari ukuri:' : 'I confirm that all information provided is accurate:'}
                                            </p>
                                            <ul className="text-sm text-gray-500 mt-2 space-y-1.5">
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                                    {lang === 'rw' ? 'Umwana agomba kwitabira amasomo nkuko biteganijwe' : 'The student must attend regular classes'}
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                                    {lang === 'rw' ? 'Kwishyura amafaranga y\'ishuri ku gihe' : 'Fees must be paid on time each term'}
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                                    {lang === 'rw' ? 'Kwimenyereza umwuga (Internship) ni itegeko' : 'Practical internship is required'}
                                                </li>
                                            </ul>
                                        </div>
                                    </label>
                                    {errors.terms_accepted && <p className="text-red-500 text-xs mt-2">{lang === 'rw' ? 'Ugomba kwemeza amasezerano' : errors.terms_accepted}</p>}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col-reverse md:flex-row gap-3 mt-8 pt-6 border-t border-gray-100">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 md:flex-none px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={18} /> {lang === 'rw' ? 'Subira inyuma' : 'Back'}
                                </button>
                            )}
                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-green-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {lang === 'rw' ? 'Komeza' : 'Continue'} <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> {lang === 'rw' ? 'Biratunganywa...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        <>{lang === 'rw' ? 'Ohereza Ubusabe' : 'Submit Application'} <Send size={18} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        {lang === 'rw' ? 'Ukeneye ubufasha?' : 'Need help?'} <a href="/contact" className="text-primary-600 font-medium hover:underline">{lang === 'rw' ? 'Twandikire' : 'Contact us'}</a> {lang === 'rw' ? 'cyangwa uhamagare' : 'or call'} +250 780 000 000
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ParentApplyPage;

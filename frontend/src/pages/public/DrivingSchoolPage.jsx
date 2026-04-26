import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Car, BookOpen, GraduationCap, CheckCircle, XCircle,
    ArrowRight, ArrowLeft, RotateCcw, Award, ChevronRight,
    StopCircle, AlertTriangle, Shield, Users, Eye, EyeOff,
    Phone, User, CreditCard, Lock, Mail, LogIn, UserPlus,
    Play, Clock, DollarSign, Calendar, MapPin, Star,
    Image, Video, FileText, Upload, Plus, Trash2, Edit,
    Bookmark, Target, TrendingUp, CheckSquare, Square
} from 'lucide-react';
import axios from 'axios';

const API_URL = '/api/driving-school';

// Sample data in pure Kinyarwanda
const sampleCourses = [
    {
        id: 1,
        title: "Amategeko y'Umuhanda",
        title_kinya: "Amategeko y'Umuhanda",
        description: "Funda amategeko yose y'umuhanda mu Rwanda",
        description_kinya: "Funda amategeko yose y'umuhanda mu Rwanda. Wizereye byose kugira ngo ubashe gutwara neza kandi ufate imodoka.",
        category: "ibitekerezo",
        level: "ntug的主题",
        duration_hours: 20,
        price: 0,
        thumbnail: null,
        lessons_count: 15,
        enrolled_count: 1250
    },
    {
        id: 2,
        title: "Ibirwanisho by'Imodoka",
        title_kinya: "Ibirwanisho by'Imodoka",
        description: "Funda ibirwanisho byose by'imodoka",
        description_kinya: "Funda ibirwanisho byose by'imodoka: engine, brakes, steering, lights, nibindi. Uzabona ubumenyi bujyanye n'imitako y'imodoka.",
        category: "ibitekerezo",
        level: "rusange",
        duration_hours: 30,
        price: 25000,
        thumbnail: null,
        lessons_count: 20,
        enrolled_count: 890
    },
    {
        id: 3,
        title: "Uko wifashisha Imodoka",
        title_kinya: "Uko wifashisha Imodoka",
        description: "Funda uko utwara imodoka neza",
        description_kinya: "Funda uko wifashisha imodoka: gutangira, guhindura, guhagarara, gufungura, nibindi. Fata ingendo nzGUZE.",
        category: "ibikoresho",
        level: "从小",
        duration_hours: 40,
        price: 35000,
        thumbnail: null,
        lessons_count: 25,
        enrolled_count: 1560
    },
    {
        id: 4,
        title: "Imyitozo y'Umuhanda",
        title_kinya: "Imyitozo y'Umuhanda",
        description: "Fata myitozo yuzuye yo gutwara",
        description_kinya: "Fata myitozo yuzuye: parking, reversing, hill start, roundabout, nibindi. Fata ingendo nz GUZE.",
        category: "ibikoresho",
        level: "inzavuja",
        duration_hours: 50,
        price: 50000,
        thumbnail: null,
        lessons_count: 30,
        enrolled_count: 2100
    },
    {
        id: 5,
        title: "Umutekano w'Umuhanda",
        title_kinya: "Umutekano w'Umuhanda",
        description: "Funda uko witanga umutekano",
        description_kinya: "Funda uko witanga umutekano wifuza: intwaro, seatbelt, speed, weather conditions. Fata umutekano.",
        category: "umutekano",
        level: "rusange",
        duration_hours: 15,
        price: 0,
        thumbnail: null,
        lessons_count: 10,
        enrolled_count: 3200
    },
    {
        id: 6,
        title: "Ikiganiro cy'Imodoka",
        title_kinya: "Ikiganiro cy'Imodoka",
        description: "Fata ikiganiro cy'umuhanda",
        description_kinya: "Fata ikiganiro cy'umuhanda kugira ngo wemewe gutwara. Fata ibibanza byose.",
        category: "ikiganiro",
        level: "ntug的主题",
        duration_hours: 25,
        price: 30000,
        thumbnail: null,
        lessons_count: 100,
        enrolled_count: 4500
    }
];

const sampleInstructors = [
    {
        id: 1,
        first_name: "Jean",
        last_name: "Mukamana",
        phone: "0781234567",
        email: "jean.mukamana@example.com",
        specialization: "Amategeko y'Umuhanda",
        experience_years: 10,
        photo: null,
        bio: "Inzobere mu mategeko y'umuhanda, ifite uburambe bw'imyaka 10"
    },
    {
        id: 2,
        first_name: "Marie",
        last_name: "UmuGRAPHIE",
        phone: "0782345678",
        email: "marie.umugrafi@example.com",
        specialization: "Ibirwanisho by'Imodoka",
        experience_years: 8,
        photo: null,
        bio: "Ifite uburambe mu gukora ibirwanisho by'imodoka"
    },
    {
        id: 3,
        first_name: "Pierre",
        last_name: "Niyonkuru",
        phone: "0783456789",
        email: "pierre.niyonkuru@example.com",
        specialization: "Uko wifashisha Imodoka",
        experience_years: 15,
        photo: null,
        bio: "Inzobere mu gutanga myitozo y'umuhanda"
    }
];

// Auth Modal Component
const AuthModal = ({ isOpen, onClose, mode, setMode, onLogin, role }) => {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nationalId: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        specialization: '',
        experienceYears: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'register') {
            if (formData.password !== formData.confirmPassword) {
                setError('Ijambobanga ntiryiboho');
                return;
            }
            if (formData.nationalId.length < 16) {
                setError('Nomero y igitabo igomba kuba inguzu');
                return;
            }
        }

        setLoading(true);

        try {
            const endpoint = role === 'instructor'
                ? (mode === 'register' ? '/instructor/register' : '/instructor/login')
                : (mode === 'register' ? '/learner/register' : '/learner/login');

            const payload = mode === 'register'
                ? formData
                : { nationalId: formData.nationalId, password: formData.password };

            // For demo, use localStorage
            const userData = {
                ...formData,
                role,
                id: Date.now()
            };
            localStorage.setItem('drivingUser', JSON.stringify(userData));
            localStorage.setItem('drivingRole', role);
            onLogin(userData);
            onClose();
        } catch (err) {
            setError('Ikibazo cyabaye. Ongerageze.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Car className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-black text-primary-800">
                        {role === 'instructor'
                            ? (mode === 'login' ? 'Injira nka Muduto' : 'Fata Konti ya Muduto')
                            : (mode === 'login' ? 'Injira nka Muwigishwa' : 'Fata Konti ya Muwigishwa')
                        }
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        {role === 'instructor'
                            ? (mode === 'login' ? 'Injira kugira ngo ufite uburenganzira bw igana' : 'Fata konti kugira ngo ufeza impumu')
                            : (mode === 'login' ? 'Injira kwigisha amategeko y umuhanda' : 'Fata konti kugira ngo wige')
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Izina ry'Ibanze</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Izina Ryanyuma</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nomero y'Igikomete</label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                required
                                minLength={16}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nimero ya Telefone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Imeli (Si ngombwa)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    )}

                    {role === 'instructor' && mode === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nomero y'Inzobere</label>
                                <input
                                    type="text"
                                    name="licenseNumber"
                                    value={formData.licenseNumber}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ikiganiro</label>
                                <select
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Hitamo ikiganiro</option>
                                    <option value="amategeko">Amategeko y'Umuhanda</option>
                                    <option value="ibirwanisho">Ibirwanisho by'Imodoka</option>
                                    <option value="ibikoresho">Ibikoresho by'Imodoka</option>
                                    <option value="imyitozo">Imyitozo y'Umuhanda</option>
                                    <option value="umutekano">Umutekano w'Umuhanda</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Imyaka y'Uburambe</label>
                                <input
                                    type="number"
                                    name="experienceYears"
                                    value={formData.experienceYears}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Ijambobanga</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Emeza Ijambobanga</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Bitegereza...' : (mode === 'login' ? 'Injira' : 'Fata Konti')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-primary-600 hover:text-primary-700 font-bold"
                    >
                        {mode === 'login' ? 'Nta konti? Fata konti' : 'Ufite konti? Injira'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Course Card Component
const CourseCard = ({ course, onSelect, isEnrolled }) => {
    return (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center relative">
                {course.thumbnail ? (
                    <img src={`/uploads/driving-courses/${course.thumbnail}`} alt={course.title_kinya} className="w-full h-full object-cover" />
                ) : (
                    <Car className="w-16 h-16 text-white/50" />
                )}
                <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-primary-700">
                    {course.duration_hours} saa
                </div>
            </div>
            <div className="p-6">
                <h3 className="font-black text-lg text-primary-800 mb-2">{course.title_kinya}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description_kinya}</p>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <BookOpen size={16} />
                        <span>{course.lessons_count} ibice</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users size={16} />
                        <span>{course.enrolled_count} bifite</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-primary-600">
                        {course.price === 0 ? 'Kubuntu' : `${course.price.toLocaleString()} Rwf`}
                    </div>
                    <button
                        onClick={() => onSelect(course)}
                        className="px-6 py-2 bg-accent-500 text-primary-900 font-bold rounded-xl hover:bg-accent-400 transition-colors"
                    >
                        {isEnrolled ? 'Fata ibindi' : 'Fata'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const DrivingSchoolPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    // Set default to Kinyarwanda
    useEffect(() => {
        if (i18n.language !== 'rw') {
            i18n.changeLanguage('rw');
        }
    }, []);

    const [user, setUser] = useState(null);
    const [role, setRole] = useState('learner');
    const [activeTab, setActiveTab] = useState('courses');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [courses] = useState(sampleCourses);
    const [instructors] = useState(sampleInstructors);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCourseDetail, setShowCourseDetail] = useState(false);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    const [realLessons, setRealLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [pdfViewer, setPdfViewer] = useState(null);

    useEffect(() => {
        if (!showCourseDetail || !selectedCourse?.id) {
            setRealLessons([]);
            return;
        }
        setLoadingLessons(true);
        fetch(`/api/driving-school/courses/${selectedCourse.id}/lessons`)
            .then(r => r.json())
            .then(d => setRealLessons(d?.data || []))
            .catch(() => setRealLessons([]))
            .finally(() => setLoadingLessons(false));
    }, [showCourseDetail, selectedCourse?.id]);

    useEffect(() => {
        const savedUser = localStorage.getItem('drivingUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setRole(localStorage.getItem('drivingRole') || 'learner');
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('drivingUser');
        localStorage.removeItem('drivingRole');
        setUser(null);
    };

    const handleSelectCourse = (course) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        setSelectedCourse(course);
        setShowCourseDetail(true);
        if (!enrolledCourses.includes(course.id)) {
            setEnrolledCourses([...enrolledCourses, course.id]);
        }
    };

    const handleLessonClick = (lesson) => {
        setCurrentLesson(lesson);
    };

    const quizQuestions = [
        {
            question: "Ikimenyestso cy'umwaka ugaciro gishika iki?",
            options: ["Urahagira", "Uguherera", "Uhagarara burundu", "Ufungura"],
            correct: 2,
            explanation: "Ikimenyestso cy'umwaka ugaciro gishika ko ugomba guhagarara burundu."
        },
        {
            question: "Mu Rwanda, imodoka zifashishwa mu buryo bwanganda?",
            options: ["Iburyo bw'umuhanda", "Ibumoso bw'umuhanda", "Haruguru", "Hasi"],
            correct: 0,
            explanation: "Mu Rwanda, imodoka zifashishwa iburyo bw'umuhanda."
        },
        {
            question: "Umuntu wese ufite iki kibanza ku muhanda?",
            options: ["Imodoka", "Umuntu ku maguru", "Inkende", "Nta kibanza"],
            correct: 1,
            explanation: "Abantu bari ku maguru bafite ibibanza ku muhanda."
        },
        {
            question: "Ikimenyestso cy'umwaka ugahagarara gishika iki?",
            options: ["Ugaciro", "Uhagarara", "Ugahinduka", "Ugasohoka"],
            correct: 1,
            explanation: "Ikimenyestso cy'umwaka ugahagarara gishika ko ugomba guhagarara burundu."
        },
        {
            question: "Ni ibihe bimenyetso bishika umuhanda utaha?",
            options: ["Umuhanda ufunganye", "Umuhanda utaha", "Umuhanda munini", "Umuhanda ufunguze"],
            correct: 1,
            explanation: "Ikimenyestso cy'umuhanda utaha gishika ko umuhanda ufunze."
        }
    ];

    const handleQuizSubmit = () => {
        let score = 0;
        quizQuestions.forEach((q, index) => {
            if (quizAnswers[index] === q.correct) {
                score++;
            }
        });
        const percentage = Math.round((score / quizQuestions.length) * 100);
        setQuizResult({
            score,
            total: quizQuestions.length,
            percentage,
            passed: percentage >= 70
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black flex items-center gap-3">
                                <Car className="w-10 h-10" />
                                Ishuri ry'Imodoka
                            </h1>
                            <p className="text-primary-200 mt-2 text-lg">
                                Funda amategeko y'umuhanda mu Rwanda kandi ufite ibisobanuro byuzuye
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {user ? (
                                <div className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-2xl">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold">{user.firstName} {user.lastName}</p>
                                        <p className="text-sm text-primary-200">{user.role === 'instructor' ? 'Muduto' : 'Muwigishwa'}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-sm font-bold"
                                    >
                                        Soka
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => { setRole('learner'); setShowAuthModal(true); }}
                                        className="px-8 py-3 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                                    >
                                        <LogIn className="inline-block w-5 h-5 mr-2" />
                                        Injira / Fata Konti
                                    </button>
                                    <button
                                        onClick={() => { setRole('instructor'); setShowAuthModal(true); }}
                                        className="px-8 py-3 bg-accent-500 text-primary-900 font-bold rounded-2xl hover:bg-accent-400 transition-all"
                                    >
                                        <UserPlus className="inline-block w-5 h-5 mr-2" />
                                        Muduto
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-2 overflow-x-auto py-2">
                        {[
                            { id: 'courses', label: 'Amashuri', icon: BookOpen },
                            { id: 'instructors', label: 'Abaduto', icon: Users },
                            { id: 'about', label: 'Ibyerekeye', icon: Info }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-primary-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'courses' && (
                    <div>
                        <h2 className="text-2xl font-black text-primary-800 mb-6 flex items-center gap-3">
                            <GraduationCap className="w-8 h-8" />
                            Amashuri y'Imodoka
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(course => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    onSelect={handleSelectCourse}
                                    isEnrolled={enrolledCourses.includes(course.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'instructors' && (
                    <div>
                        <h2 className="text-2xl font-black text-primary-800 mb-6 flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Ababaduto
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructors.map(instructor => (
                                <div key={instructor.id} className="bg-white rounded-3xl p-6 shadow-lg">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary-800">
                                                {instructor.first_name} {instructor.last_name}
                                            </h3>
                                            <p className="text-primary-600 font-medium">{instructor.specialization}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">{instructor.bio}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Star className="w-5 h-5 text-yellow-500" />
                                            <span className="font-bold">{instructor.experience_years} myaka</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Phone className="w-4 h-4" />
                                            <span>{instructor.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="bg-white rounded-3xl p-8 shadow-lg">
                        <h2 className="text-2xl font-black text-primary-800 mb-6">Ibyerekeye Ishuri ry'Imodoka</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4 p-4 bg-primary-50 rounded-2xl">
                                <Target className="w-12 h-12 text-primary-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg text-primary-800 mb-2">Intego</h3>
                                    <p className="text-gray-600">Gutanga uburezi bujyanye n'amategeko y'umuhanda mu Rwanda kugira ngo abantu bagire ubumenyi bujyanye no gutwara imodoka neza kandi bishingire umutekano.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-primary-50 rounded-2xl">
                                <TrendingUp className="w-12 h-12 text-primary-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg text-primary-800 mb-2">Ibikorwa</h3>
                                    <p className="text-gray-600">Dufite amashuri menshi, abaduto inzobere, nibindi. Abantu bafite igihembo gifite ibitekerezo byuzuye kugira ngo bemewe gutwara mu Rwanda.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-primary-50 rounded-2xl">
                                <Award className="w-12 h-12 text-primary-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-lg text-primary-800 mb-2">Ibibanza</h3>
                                    <p className="text-gray-600">Abantu bazagumaho kandi bagashira ibigempengerwa mu mategeko y'umuhanda. Bazagira icyifuzo cyo gutwara neza kandi bifite umutekano.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Course Detail Modal */}
            {showCourseDetail && selectedCourse && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowCourseDetail(false)} className="absolute top-4 right-4 text-gray-400">
                            <XCircle size={24} />
                        </button>

                        <h2 className="text-2xl font-black text-primary-800 mb-4">{selectedCourse.title_kinya}</h2>
                        <p className="text-gray-600 mb-6">{selectedCourse.description_kinya}</p>

                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl">
                                <Clock className="w-5 h-5 text-primary-600" />
                                <span className="font-bold">{selectedCourse.duration_hours} saa</span>
                            </div>
                            <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl">
                                <BookOpen className="w-5 h-5 text-primary-600" />
                                <span className="font-bold">{selectedCourse.lessons_count} ibice</span>
                            </div>
                            <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-xl">
                                <Users className="w-5 h-5 text-primary-600" />
                                <span className="font-bold">{selectedCourse.enrolled_count} bifite</span>
                            </div>
                        </div>

                        {/* Lessons List — real uploaded lessons */}
                        <div className="space-y-3 mb-6">
                            <h3 className="font-bold text-lg text-primary-800">Ibice by'ishuri</h3>
                            {loadingLessons ? (
                                <p className="text-center text-gray-400 py-6">Birapakurura...</p>
                            ) : realLessons.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 italic">Nta isomo rikiri muri iri shuri kugeza ubu.</p>
                            ) : (
                                realLessons.map((lesson, i) => (
                                    <div
                                        key={lesson.id}
                                        className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors"
                                    >
                                        {lesson.image_url ? (
                                            <img src={lesson.image_url} alt="" className="w-full sm:w-32 h-24 object-cover rounded-lg flex-shrink-0" />
                                        ) : (
                                            <div className="w-full sm:w-32 h-24 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-black text-2xl flex-shrink-0">
                                                {i + 1}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800">{lesson.title_kinya || lesson.title}</h4>
                                            {lesson.description && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{lesson.description}</p>}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {lesson.duration_minutes > 0 && (
                                                    <span className="text-xs bg-white px-2 py-1 rounded-full border text-gray-600">
                                                        <Clock className="w-3 h-3 inline mr-1" />{lesson.duration_minutes} min
                                                    </span>
                                                )}
                                                {lesson.pdf_url && (
                                                    <button
                                                        onClick={() => setPdfViewer({ url: lesson.pdf_url, title: lesson.title_kinya || lesson.title })}
                                                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1"
                                                    >
                                                        <FileText className="w-3 h-3" /> Soma PDF
                                                    </button>
                                                )}
                                                {lesson.video_url && (
                                                    <a
                                                        href={lesson.video_url} target="_blank" rel="noreferrer"
                                                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1"
                                                    >
                                                        <Play className="w-3 h-3" /> Video
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setShowQuiz(true)}
                            className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-400 text-primary-900 font-bold rounded-xl hover:from-accent-400 hover:to-accent-500 transition-all"
                        >
                            <GraduationCap className="inline-block w-5 h-5 mr-2" />
                            Fata Ikiganiro
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showQuiz && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => { setShowQuiz(false); setQuizResult(null); setQuizAnswers({}); }} className="absolute top-4 right-4 text-gray-400">
                            <XCircle size={24} />
                        </button>

                        <h2 className="text-2xl font-black text-primary-800 mb-6 flex items-center gap-3">
                            <GraduationCap className="w-8 h-8" />
                            Ikiganiro cy'Imodoka
                        </h2>

                        {!quizResult ? (
                            <div className="space-y-6">
                                {quizQuestions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="font-bold text-gray-800 mb-4">{qIndex + 1}. {q.question}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt, oIndex) => (
                                                <button
                                                    key={oIndex}
                                                    onClick={() => setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex })}
                                                    className={`w-full p-3 rounded-xl text-left font-medium transition-all ${quizAnswers[qIndex] === oIndex
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-white text-gray-700 hover:bg-primary-50 border border-gray-200'
                                                        }`}
                                                >
                                                    <span className="inline-block w-8 h-8 rounded-full bg-white/20 text-center leading-8 mr-2">
                                                        {String.fromCharCode(65 + oIndex)}
                                                    </span>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={handleQuizSubmit}
                                    disabled={Object.keys(quizAnswers).length !== quizQuestions.length}
                                    className="w-full py-4 bg-accent-500 text-primary-900 font-bold rounded-xl disabled:opacity-50"
                                >
                                    Ohereza Igibango
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${quizResult.passed ? 'bg-green-100' : 'bg-yellow-100'
                                    }`}>
                                    <Award className={`w-12 h-12 ${quizResult.passed ? 'text-green-600' : 'text-yellow-600'}`} />
                                </div>
                                <h3 className="text-2xl font-black text-primary-800 mb-2">
                                    Ibibanza: {quizResult.score} / {quizResult.total}
                                </h3>
                                <p className="text-xl text-gray-600 mb-6">
                                    {quizResult.percentage}%
                                </p>
                                <p className={`text-lg font-bold mb-6 ${quizResult.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {quizResult.passed ? 'Wagize akajagajaga!' : 'Ongera ugerageze'}
                                </p>
                                <button
                                    onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                                    className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl"
                                >
                                    <RotateCcw className="inline-block w-5 h-5 mr-2" />
                                    Ongera ugerageze
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                mode={authMode}
                setMode={setAuthMode}
                onLogin={handleLogin}
                role={role}
            />

            {/* Lesson PDF Viewer Modal */}
            {pdfViewer && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col">
                    <div className="bg-primary-800 text-white px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-5 h-5 flex-shrink-0" />
                            <h3 className="font-bold truncate">{pdfViewer.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={pdfViewer.url} download
                                className="text-xs sm:text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-bold flex items-center gap-1">
                                <Image className="w-4 h-4" /> Pakurura
                            </a>
                            <button onClick={() => setPdfViewer(null)}
                                className="p-2 hover:bg-white/20 rounded-lg">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <iframe
                        src={pdfViewer.url}
                        title={pdfViewer.title}
                        className="flex-1 w-full bg-gray-900"
                    />
                </div>
            )}
        </div>
    );
};

// Add Info icon import
import { Info } from 'lucide-react';

export default DrivingSchoolPage;

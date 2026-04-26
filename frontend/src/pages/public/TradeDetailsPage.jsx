import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import {
    ArrowLeft, ArrowRight, Award, BookOpen, Code, Wrench, Hammer, Briefcase,
    Users, Calendar, Clock, MapPin, Phone, Mail, ChevronRight, Play, Image,
    Star, CheckCircle, GraduationCap, Settings, Zap, Gauge, Disc, Battery,
    Building, Ruler, Layers, Brush, Download, Share2, Heart, Eye, ChevronDown,
    X, Info, Target, TrendingUp, Bookmark, Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// Real trade images mapping
const TRADE_IMAGES = {
    'Software Development': `${API_URL}/uploads/trade card image/sod.jpg`,
    'Automobile Technology': `${API_URL}/uploads/trade card image/auto.jpg`,
    'Building and Construction': `${API_URL}/uploads/trade card image/bdc.jpg`,
};

// Trade data with real info from API
const TRADE_DATA = {
    'Software Development': {
        name: 'Software Development',
        icon: Code,
        description: 'Master the art of software development with cutting-edge technologies and industry-recognized certifications.',
        highlights: ['Web Development', 'Mobile Apps', 'Database Management', 'Cloud Computing', 'DevOps'],
        careers: ['Software Developer', 'Web Developer', 'Mobile App Developer', 'Database Administrator', 'DevOps Engineer'],
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker'],
        duration: '3 Years (Levels 3-5)',
        certification: 'National Certificate TVET',
        modules: [
            { name: 'Programming Fundamentals', level: 'Level 3', hours: 120, description: 'Learn basic programming concepts and logic' },
            { name: 'Web Development', level: 'Level 3', hours: 150, description: 'HTML, CSS, JavaScript and modern frameworks' },
            { name: 'Database Systems', level: 'Level 4', hours: 130, description: 'SQL, NoSQL and database design' },
            { name: 'Mobile Development', level: 'Level 4', hours: 140, description: 'iOS and Android app development' },
            { name: 'Cloud Computing', level: 'Level 5', hours: 160, description: 'AWS, Azure and cloud architecture' },
            { name: 'Software Engineering', level: 'Level 5', hours: 180, description: 'Agile, testing and deployment' },
        ],
    },
    'Automobile Technology': {
        name: 'Automobile Technology',
        icon: Wrench,
        description: 'Become a skilled automotive technician with hands-on training on modern vehicles and diagnostic equipment.',
        highlights: ['Engine Repair', 'Electrical Systems', 'Transmission', 'Brake Systems', 'Diagnostics'],
        careers: ['Automotive Technician', 'Mechanic', 'Service Advisor', 'Diagnostic Specialist', 'Fleet Manager'],
        skills: ['Engine Repair', 'Electrical Systems', 'Brake Service', 'Transmission', 'Computer Diagnostics'],
        duration: '3 Years (Levels 3-5)',
        certification: 'National Certificate TVET',
        modules: [
            { name: 'Automotive Basics', level: 'Level 3', hours: 140, description: 'Fundamentals of automotive systems' },
            { name: 'Engine Repair', level: 'Level 3', hours: 160, description: 'Engine overhaul and maintenance' },
            { name: 'Electrical Systems', level: 'Level 4', hours: 150, description: 'Vehicle wiring and electronics' },
            { name: 'Transmission & Drive Train', level: 'Level 4', hours: 140, description: 'Gearboxes and drive systems' },
            { name: 'Advanced Diagnostics', level: 'Level 5', hours: 170, description: 'Computer diagnostics and troubleshooting' },
            { name: 'Hybrid & Electric Vehicles', level: 'Level 5', hours: 120, description: 'EV technology and safety' },
        ],
    },
    'Building and Construction': {
        name: 'Building and Construction',
        icon: Hammer,
        description: 'Learn essential construction skills from blueprint reading to hands-on building techniques.',
        highlights: ['Blueprint Reading', 'Masonry', 'Carpentry', 'Plumbing', 'Electrical'],
        careers: ['Construction Technician', 'Mason', 'Carpenter', 'Site Supervisor', 'Building Inspector'],
        skills: ['Blueprint Reading', 'Masonry', 'Carpentry', 'Surveying', 'Safety Procedures'],
        duration: '3 Years (SOD Levels 3-5)',
        certification: 'National Certificate TVET',
        modules: [
            { name: 'Construction Basics', level: 'SOD Level 3', hours: 150, description: 'Introduction to construction' },
            { name: 'Masonry & Concrete', level: 'SOD Level 3', hours: 170, description: 'Brickwork and concrete technology' },
            { name: 'Carpentry & Joinery', level: 'SOD Level 4', hours: 160, description: 'Woodwork and structural frames' },
            { name: 'Building Systems', level: 'SOD Level 4', hours: 140, description: 'Plumbing and electrical basics' },
            { name: 'Advanced Construction', level: 'SOD Level 5', hours: 180, description: 'Complex construction projects' },
            { name: 'Project Management', level: 'SOD Level 5', hours: 120, description: 'Site management and planning' },
        ],
    },
};

const TradeDetailsPage = () => {
    const { tradeName } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [activeTab, setActiveTab] = useState('overview');
    const [gallery, setGallery] = useState([]);
    const [tradeInfo, setTradeInfo] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState(null);

    // Fetch gallery and trade info from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Try to fetch trade info from API
                const tradesRes = await axios.get(`${API_URL}/api/trades`, { headers });
                const foundTrade = tradesRes.data?.find(t => t.name === tradeName || t.name_en === tradeName);

                if (foundTrade) {
                    setTradeInfo(foundTrade);
                }

                // Fetch gallery
                try {
                    const [galleryRes] = await Promise.all([
                        axios.get(`${API_URL}/api/content/galleries?trade_name=${tradeName}`, { headers }),
                    ]);
                    setGallery(galleryRes.data || []);
                } catch (e) {
                    console.log('Gallery not available');
                }
            } catch (err) {
                console.log('Using fallback data');
            }
            setLoading(false);
        };
        fetchData();
    }, [tradeName, token]);

    const trade = TRADE_DATA[tradeName];

    if (!trade) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Trade Not Found</h2>
                    <button onClick={() => navigate('/')} className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const IconComponent = trade.icon;
    const tradeImage = TRADE_IMAGES[tradeName] || TRADE_IMAGES[trade.name];
    const categories = ['all', ...new Set(gallery.map(g => g.category).filter(Boolean))];

    // Generate gallery from real images if available
    const displayGallery = gallery.length > 0 ? gallery : [];
    const filteredGallery = filterCategory === 'all'
        ? displayGallery
        : displayGallery.filter(g => g.category === filterCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header Banner with Real Image */}
            <div className="relative h-72 md:h-96 bg-gray-900 overflow-hidden">
                <img
                    src={tradeImage}
                    alt={tradeName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-4 left-4 md:top-6 md:left-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back
                    </button>
                </div>

                {/* Trade Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                                TVET Program
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{tradeName}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-white/80">
                            <span className="flex items-center gap-2">
                                <Clock size={18} /> {trade.duration}
                            </span>
                            <span className="flex items-center gap-2">
                                <Award size={18} /> {trade.certification}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={18} /> East, Ngoma
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Quick Action Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-20 relative z-10">
                    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-800">450+</p>
                        <p className="text-gray-500 text-sm">Students Enrolled</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-800">92%</p>
                        <p className="text-gray-500 text-sm">Job Placement</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-800">60%</p>
                        <p className="text-gray-500 text-sm">Practical Training</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3">
                            <Star className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-800">25+</p>
                        <p className="text-gray-500 text-sm">Industry Partners</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs Navigation */}
                        <div className="bg-white rounded-2xl p-2 shadow-sm flex overflow-x-auto gap-1">
                            {[
                                { id: 'overview', label: 'Overview', icon: Info },
                                { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
                                { id: 'gallery', label: 'Gallery', icon: Image },
                                { id: 'careers', label: 'Careers', icon: Briefcase },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Description */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">About This Program</h2>
                                    <p className="text-gray-600 leading-relaxed">{trade.description}</p>
                                </div>

                                {/* What You'll Learn */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">What You'll Learn</h2>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {trade.highlights.map((highlight, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="font-semibold text-gray-700">{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills You'll Gain */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Skills You'll Gain</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {trade.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">Ready to Start?</h3>
                                            <p className="text-green-100">Join Garden TVET and build your future</p>
                                        </div>
                                        <Link
                                            to="/apply"
                                            className="px-8 py-3 bg-white text-green-700 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                                        >
                                            Apply Now <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Curriculum Tab */}
                        {activeTab === 'curriculum' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Course Modules</h2>
                                    <p className="text-gray-500 mb-6">Comprehensive curriculum designed for industry readiness</p>

                                    <div className="space-y-3">
                                        {trade.modules.map((module, idx) => (
                                            <div
                                                key={idx}
                                                className={`border-2 rounded-xl overflow-hidden transition-all ${expandedModule === idx ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedModule(expandedModule === idx ? null : idx)}
                                                    className="w-full flex items-center justify-between p-4 text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-800">{module.name}</h3>
                                                            <p className="text-sm text-gray-500">{module.level} • {module.hours} hours</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedModule === idx ? 'rotate-180' : ''}`} />
                                                </button>
                                                {expandedModule === idx && (
                                                    <div className="px-4 pb-4 pt-0">
                                                        <p className="text-gray-600 pl-14">{module.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gallery Tab */}
                        {activeTab === 'gallery' && (
                            <div className="animate-fade-in">
                                {displayGallery.length > 0 ? (
                                    <>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setFilterCategory(cat)}
                                                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${filterCategory === cat
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {filteredGallery.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg"
                                                    onClick={() => setSelectedImage(item)}
                                                >
                                                    <img
                                                        src={item.image_url || item.url}
                                                        alt={item.title}
                                                        className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                                            <p className="text-white font-bold">{item.title}</p>
                                                            <p className="text-white/70 text-sm capitalize">{item.category || 'Gallery'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                        <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-600 mb-2">Gallery Coming Soon</h3>
                                        <p className="text-gray-400">Check back later for photos and videos</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Careers Tab */}
                        {activeTab === 'careers' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Career Opportunities</h2>
                                    <p className="text-gray-500 mb-6">Graduates can pursue these rewarding careers</p>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        {trade.careers.map((career, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                                                    <Briefcase className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="font-semibold text-gray-700">{career}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Employment Stats */}
                                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold mb-1">Graduate Employment Rate</h3>
                                            <p className="text-green-100">Our graduates are highly sought after</p>
                                        </div>
                                        <div className="relative w-24 h-24">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                                                <circle cx="48" cy="48" r="40" stroke="white" strokeWidth="8" fill="none"
                                                    strokeDasharray="251" strokeDashoffset="20" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-black">92%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Apply for This Program</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 rounded-xl">
                                    <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} /> Entry Requirements
                                    </h4>
                                    <ul className="text-sm text-green-700 space-y-1">
                                        <li>• Completed O-Level (S.3/S.4)</li>
                                        <li>• Minimum age: 16 years</li>
                                        <li>• Pass entrance exam</li>
                                    </ul>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                        <Clock size={18} /> Duration
                                    </h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• {trade.duration}</li>
                                        <li>• Theory & Practical</li>
                                        <li>• Industry Internship</li>
                                    </ul>
                                </div>

                                <Link
                                    to={`/apply?trade=${encodeURIComponent(tradeName)}`}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <GraduationCap size={20} />
                                    Start Application
                                </Link>

                                <Link
                                    to="/contact"
                                    className="w-full py-3 border-2 border-green-600 text-green-700 rounded-xl font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone size={18} />
                                    Contact Us
                                </Link>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h4 className="font-bold text-gray-800 mb-4">Quick Info</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Level</span>
                                    <span className="font-semibold">Certificate</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-semibold">3 Years</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Certification</span>
                                    <span className="font-semibold">TVET National</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-500">Location</span>
                                    <span className="font-semibold">East, Ngoma</span>
                                </div>
                            </div>
                        </div>

                        {/* Related Trades */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h4 className="font-bold text-gray-800 mb-4">Other Programs</h4>
                            <div className="space-y-3">
                                {Object.keys(TRADE_DATA).filter(t => t !== tradeName).map(otherTrade => (
                                    <Link
                                        key={otherTrade}
                                        to={`/services/${otherTrade}`}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <img
                                            src={TRADE_IMAGES[otherTrade]}
                                            alt={otherTrade}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <span className="font-medium text-gray-700">{otherTrade}</span>
                                        <ArrowRight size={16} className="ml-auto text-gray-400" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImage.image_url || selectedImage.url}
                        alt={selectedImage.title}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                        <p className="text-white font-bold text-lg">{selectedImage.title}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeDetailsPage;

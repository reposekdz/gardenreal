import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { heroAPI, tradesAPI } from '../../utils/api';
import {
    GraduationCap, Users, BookOpen, Award, ChevronRight,
    ArrowRight, Star, CheckCircle, Play, Calendar, Clock,
    MapPin, Phone, Mail, Shield, TrendingUp, Briefcase,
    Wrench, Code, Car, HardHat, Zap, Utensils, Heart,
    Award as Trophy, Brain, Handshake, Laptop, Cog, Palmtree,
    Clock3, Target, TrendingUp as Chart, BookMarked, GraduationCap as Cert, X, ZoomIn, ExternalLink,
    HelpCircle, MessageCircle, Quote
} from 'lucide-react';

// Trade card images from backend
const API_URL = import.meta.env.VITE_API_URL || '';
const tradeCardImages = {
    'auto': `${API_URL}/uploads/trade card image/auto.jpg`,
    'bdc': `${API_URL}/uploads/trade card image/bdc.jpg`,
    'sod': `${API_URL}/uploads/trade card image/sod.jpg`,
};

// Default hero images as fallback (from local uploads)
// These are used when API fails or returns empty
const defaultHeroImages = [
    '/uploads/school%20view/IMG-20250222-WA0013.jpg',
    '/uploads/school%20view/IMG-20250222-WA0015.jpg',
    '/uploads/school%20view/IMG-20250222-WA0017.jpg'
];

// Keep old heroImages for backward compatibility
const heroImages = defaultHeroImages;

const whyImages = [
    `${API_URL}/uploads/school view/IMG-20250222-WA0015.jpg`, // Practical Training
    `${API_URL}/uploads/school view/IMG-20250222-WA0017.jpg`, // Expert Teachers
    `${API_URL}/uploads/school view/IMG-20250222-WA0018.jpg`  // Certificates
];

// School View gallery images from backend
const schoolViewImages = [
    { src: `${API_URL}/uploads/school view/IMG-20250222-WA0013.jpg`, alt: 'School Building' },
    { src: `${API_URL}/uploads/school view/IMG-20250222-WA0015.jpg`, alt: 'Classroom' },
    { src: `${API_URL}/uploads/school view/IMG-20250222-WA0017.jpg`, alt: 'Workshop' },
    { src: `${API_URL}/uploads/school view/IMG-20250222-WA0018.jpg`, alt: 'Campus' },
    { src: `${API_URL}/uploads/school view/IMG-20260126-WA0053.jpg`, alt: 'Library' },
    { src: `${API_URL}/uploads/school view/IMG-20260126-WA0060.jpg`, alt: 'Computer Lab' },
    { src: `${API_URL}/uploads/school view/IMG-20260126-WA0076.jpg`, alt: 'Sports Ground' },
];

const stats = [
    { value: '1,200+', key: 'pub.home.stats_students', icon: Users },
    { value: '45+', key: 'pub.home.stats_teachers', icon: GraduationCap },
    { value: '3', key: 'pub.home.stats_trades', icon: BookOpen },
    { value: '15+', key: 'pub.home.stats_years', icon: Award },
];

const tradeIcons = {
    'Software Development': Code,
    'Automobile Technology': Car,
    'Building and Construction': HardHat,
    'Electrical Engineering': Zap,
    'Hospitality Management': Utensils,
    'Business Management': Briefcase,
};

const whyReasons = [
    {
        key: 'pub.home.why_1_title',
        descKey: 'pub.home.why_1_desc',
        icon: Shield,
        image: whyImages[0]
    },
    {
        key: 'pub.home.why_2_title',
        descKey: 'pub.home.why_2_desc',
        icon: Brain,
        image: whyImages[1]
    },
    {
        key: 'pub.home.why_3_title',
        descKey: 'pub.home.why_3_desc',
        icon: Trophy,
        image: whyImages[2]
    },
];

const faqItems = [
    {
        question: 'How do I apply to Garden TVET School?',
        question_rw: 'Nigute nshaka gusaba muri Garden TVET?',
        answer: 'You can apply online by clicking the "Apply Now" button on our homepage. Fill out the application form with your personal details, choose your preferred trade and level, and submit. Our admissions team will review your application and contact you.',
        answer_rw: 'Urashobora gusaba online ukanda buto "Apply Now" ufite page yacu. Uzuza form yubusabe hamwe nibikenewe, hitamo ikiganiro nik level uyishaka, wohereze. Itsinda ryabakiriya rizagenzura ubusabe bwawe rigakubwirira.'
    },
    {
        question: 'What are the admission requirements?',
        question_rw: 'Ni ibiki bikenewe mu kwiyandikisha?',
        answer: 'Minimum requirements include completion of primary education, being of appropriate age (usually 14-25 years), and meeting any specific trade requirements. Some trades may have additional requirements.',
        answer_rw: 'Ibibikenewe ni ukurangiza amashuri abanza, kugira imyaka yifashishijwe (kujya ari 14-25), niku gukunda ibikenewe bijyanye nikiganiro. Ibi birashobora gutera ibindi bikenewe.'
    },
    {
        question: 'How much are the school fees?',
        question_rw: 'Amashuri yagura ate?',
        answer: 'School fees vary by program and level. Contact our admissions office for detailed information about tuition costs and payment plans.',
        answer_rw: 'Amashuri agaragara ukurikije programm niklevel. Hamagara ikigo cyacu cyabakiriya kugira ibisobanuro birambuye kuri school fees.'
    },
    {
        question: 'Do you provide accommodation?',
        question_rw: 'Mubafite aho batsindira?',
        answer: 'Yes, we have hostels available for students. Limited spaces are available and allocation is based on need and availability.',
        answer_rw: 'Yego, dufite hosteli zivuye abanyeshuri. Ibice bitoya bihari kandi bihabwa abakeneye.'
    },
    {
        question: 'What trades do you offer?',
        question_rw: 'Ni ibihe bikaganiro mubihari?',
        answer: 'We offer three main trades: Software Development, Automobile Technology, and Building & Construction. Each trade has multiple levels from Foundation to Advanced.',
        answer_rw: 'Tugira ibikiganiro bitatu: Ikigoziro software, Ikigoziro ibinyabiziga, nikigoziro uguhinga. Burikiganiro birebana na level nyinshi ukusukira Hejuru.'
    },
];

const testimonials = [
    {
        name: 'Jean Claude',
        role: 'Software Developer',
        company: 'Tech Rwanda',
        image: null,
        quote: 'Garden TVET gave me practical skills that helped me land my dream job. The hands-on training was excellent!',
        quote_rw: 'Garden TVET yahawe ubumenyi bushingiye ku gikoni nkaba nshobora kubona akazi nkaganiriye. Uburezi bwikoreye ni bwohebuje!'
    },
    {
        name: 'Marie Anne',
        role: 'Automotive Technician',
        company: 'Car Service Center',
        image: null,
        quote: 'The instructors were very knowledgeable and supportive. I graduated and started working immediately.',
        quote_rw: 'Abato bari bafite ubumenyi kandi baraga. Narangije noneho ntahari ngira akazi.'
    },
    {
        name: 'Patrick',
        role: 'Construction Engineer',
        company: 'Build Rwanda Ltd',
        image: null,
        quote: 'The practical experience I gained here was invaluable. Now I run my own construction company!',
        quote_rw: 'Ubugeni nabonye hano bwarangiye. None nkora na company yanjye yuguhinga!'
    },
];

// Default trades as fallback - used when API fails or loads
const defaultTrades = [
    { id: 1, name: 'Software Development', description: 'Learn programming and software development skills', icon: 'code', image_url: '/uploads/trade card image/sod.jpg' },
    { id: 2, name: 'Automobile Technology', description: 'Master automotive repair and maintenance', icon: 'car', image_url: '/uploads/trade card image/auto.jpg' },
    { id: 3, name: 'Building and Construction', description: 'Civil engineering and construction skills', icon: 'hard-hat', image_url: '/uploads/trade card image/bdc.jpg' },
];

const HomePage = () => {
    const { t, i18n } = useTranslation();
    const [news, setNews] = useState([]);
    const [trades, setTrades] = useState(defaultTrades);
    const [cmsContent, setCmsContent] = useState({});
    const [heroSlides, setHeroSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);
    const lang = i18n.language || 'rw';

    // Use a ref to track hero slides for interval
    const heroSlidesRef = React.useRef([]);
    heroSlidesRef.current = heroSlides;

    // Default hero slides as fallback (using local uploaded images)
    const defaultSlides = [
        { title: 'Fungunura Igikoni', subtitle: 'Amasomo yibitekerezo nibikorwa', image_url: '/uploads/school%20view/IMG-20250222-WA0013.jpg', button_text: 'Fungunura', button_link: '/apply' },
        { title: 'Vuga mu Baganga', subtitle: 'Inama zifite uruhushya rwindustry', image_url: '/uploads/school%20view/IMG-20250222-WA0015.jpg', button_text: 'Ibyifuzo', button_link: '/about' },
        { title: 'Fatanaho Umwanya', subtitle: 'Ibikoresho bikenewe mu kazi', image_url: '/uploads/school%20view/IMG-20250222-WA0017.jpg', button_text: 'Serivisi', button_link: '/services' }
    ];

    useEffect(() => {
        // Fetch hero slides from API
        const fetchHeroSlides = async () => {
            try {
                const response = await heroAPI.getSlides();
                if (response.data.length > 0) {
                    setHeroSlides(response.data);
                } else {
                    setHeroSlides(defaultSlides);
                }
            } catch (error) {
                console.error('Error fetching hero slides:', error);
                setHeroSlides(defaultSlides);
            }
        };

        fetchHeroSlides();

        // Auto-rotate slides
        const interval = setInterval(() => {
            const slides = heroSlidesRef.current.length > 0 ? heroSlidesRef.current : defaultSlides;
            setCurrentSlide(prev => {
                const totalSlides = slides.length || 3;
                return (prev + 1) % totalSlides;
            });
            setCurrentImage((prev) => {
                const images = slides.map(s => s.image_url);
                return (prev + 1) % (images.length || heroImages.length);
            });
        }, 5000);

        return () => clearInterval(interval);
        axios.get(`${API_URL}/api/news`).then(res => setNews(res.data.slice(0, 3))).catch(() => { });

        // Fetch trades - automatically creates default trades if none exist
        tradesAPI.getAll()
            .then(res => {
                console.log('Trades API response:', res);
                // Handle both direct response and wrapped response
                const tradesData = res.data?.data || res.data;
                if (tradesData && Array.isArray(tradesData) && tradesData.length > 0) {
                    setTrades(tradesData);
                } else {
                    // Use fallback trades
                    setTrades([
                        { id: 1, name: 'Software Development', description: 'Learn programming and software development skills', icon: 'code', image_url: '/uploads/trade card image/sod.jpg' },
                        { id: 2, name: 'Automobile Technology', description: 'Master automotive repair and maintenance', icon: 'car', image_url: '/uploads/trade card image/auto.jpg' },
                        { id: 3, name: 'Building and Construction', description: 'Civil engineering and construction skills', icon: 'hard-hat', image_url: '/uploads/trade card image/bdc.jpg' },
                    ]);
                }
            })
            .catch(err => {
                console.error('Trades API error:', err);
                // Use fallback trades on error
                setTrades([
                    { id: 1, name: 'Software Development', description: 'Learn programming and software development skills', icon: 'code', image_url: '/uploads/trade card image/sod.jpg' },
                    { id: 2, name: 'Automobile Technology', description: 'Master automotive repair and maintenance', icon: 'car', image_url: '/uploads/trade card image/auto.jpg' },
                    { id: 3, name: 'Building and Construction', description: 'Civil engineering and construction skills', icon: 'hard-hat', image_url: '/uploads/trade card image/bdc.jpg' },
                ]);
            });

        // Fetch CMS content for hero
        axios.get(`${API_URL}/api/content/home`).then(res => {
            if (res.data) setCmsContent(res.data);
        }).catch(() => { });

        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20,
                y: (e.clientY / window.innerHeight) * 20
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const getNewsTitle = (article) => article[`title_${lang}`] || article.title_rw || article.title_en;
    const getNewsContent = (article) => article[`content_${lang}`] || article.content_rw || article.content_en;

    const getTradeIcon = (tradeName) => {
        const Icon = tradeIcons[tradeName] || BookOpen;
        return <Icon size={32} />;
    };

    // Get translated trade name based on language
    const getTranslatedTradeName = (tradeName) => {
        // Map trade names to translation keys
        const tradeKeys = {
            'Software Development': 'pub.home.trades.software',
            'Automobile Technology': 'pub.home.trades.automobile',
            'Building and Construction': 'pub.home.trades.construction',
        };
        const key = tradeKeys[tradeName];
        return key ? t(key) : tradeName;
    };

    // Use heroSlides from API or fallback to default images
    const activeSlides = heroSlides.length > 0 ? heroSlides : defaultSlides;
    const activeImages = activeSlides.map(slide => slide.image_url);

    // Combine database images with fallback for dots and gallery
    const displayImages = activeImages.length > 0 ? activeImages : heroImages;

    return (
        <div>
            {/* Hero Section - Dynamic Images - Reduced Size */}
            <section className="relative h-[60vh] md:h-[70vh] lg:h-[80vh] max-h-[650px] flex items-center overflow-hidden bg-primary-900">
                {/* Dynamic Background from Database or Fallback */}
                {(displayImages).map((img, i) => (
                    <div
                        key={i}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === currentImage ? 'opacity-60 scale-100' : 'opacity-0 scale-110'}`}
                        style={{
                            backgroundImage: `url(${img})`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) scale(${i === currentImage ? 1 : 1.1})`
                        }}
                    />
                ))}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 via-primary-900/30 to-primary-900/20" />

                {/* Animated Elements */}
                <div className="absolute top-20 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Image Dots */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {(displayImages).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentImage ? 'bg-accent-500 w-12' : 'bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>

                <div className="max-w-7xl mx-auto px-6 py-32 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-white">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-8 animate-fade-in-up">
                                <Star size={18} className="text-accent-400 fill-accent-400" />
                                <span className="text-sm font-bold tracking-widest uppercase">{cmsContent.subtitle || 'Excellence in Technical Education'}</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                {activeSlides[currentImage]?.title || cmsContent.hero_title || 'Shape Your'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-500">Future Today</span>
                            </h1>

                            <p className="text-base md:text-lg text-white/80 font-medium leading-relaxed mb-8 max-w-xl drop-shadow-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                {cmsContent.hero_subtitle || t('pub.home.hero_subtitle')}
                            </p>

                            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                                <Link to={activeSlides[currentImage]?.button_link || '/apply'} className="group px-8 py-4 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-300 hover:to-accent-400 text-black font-black uppercase tracking-wider rounded-2xl text-lg transition-all transform hover:scale-105 hover:shadow-2xl shadow-accent-500/30 flex items-center gap-3">
                                    {activeSlides[currentImage]?.button_text || 'Apply Now'}
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/about" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-2xl text-lg transition-all flex items-center gap-3">
                                    <Play size={20} className="fill-white" />
                                    Learn More
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center gap-6 mt-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-accent-400" />
                                    <span className="text-sm font-medium text-white/80">Government Certified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-accent-400" />
                                    <span className="text-sm font-medium text-white/80">Industry Partners</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-accent-400" />
                                    <span className="text-sm font-medium text-white/80">Job Placement</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="hidden lg:grid grid-cols-2 gap-6">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={i}
                                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center hover:bg-white/20 hover:-translate-y-2 transition-all duration-300 shadow-2xl group"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                            <Icon className="text-primary-900" size={32} />
                                        </div>
                                        <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                                        <div className="text-sm font-bold tracking-wide text-white/70 uppercase">{t(stat.key)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
                    <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
                        <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>

            {/* Mobile Stats */}
            <section className="lg:hidden bg-gradient-to-r from-primary-700 to-primary-900 py-8 px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                <Icon size={24} className="mx-auto mb-2 text-accent-400" />
                                <div className="text-2xl font-black text-white">{stat.value}</div>
                                <div className="text-xs text-white/70">{t(stat.key)}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Programs Section - With Images */}
            <section className="py-24 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-accent-100 text-accent-600 font-bold text-sm uppercase tracking-widest rounded-full mb-4">{t('pub.home.our_programs') || 'Our Programs'}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t('pub.home.choose_path') || 'Choose Your Path'}</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            {t('pub.home.programs_desc') || 'Explore our diverse range of vocational programs designed to equip you with practical skills for the modern workforce.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trades.map((trade, i) => {
                            const TradeIcon = tradeIcons[trade.name] || BookOpen;
                            // Use image_url from database if available, otherwise fall back to hardcoded mapping
                            // Handle both absolute URLs (production) and relative paths (development)
                            const getImageUrl = (url) => {
                                if (!url) return null;
                                if (url.startsWith('http')) return url;
                                // For development, use proxy; for production, use relative path
                                return url;
                            };
                            const cardImage = trade.image_url ? getImageUrl(trade.image_url) : null;

                            return (
                                <Link
                                    to={`/trade/${encodeURIComponent(trade.name)}`}
                                    key={i}
                                    className="group relative bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                                >
                                    {/* Trade Card Image with Overlay */}
                                    <div className="h-56 relative overflow-hidden">
                                        {cardImage ? (
                                            <img
                                                src={cardImage}
                                                alt={trade.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${i === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                                                i === 1 ? 'bg-gradient-to-br from-green-500 to-green-700' :
                                                    i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                                                        'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                                                <TradeIcon size={56} className="text-white/80" />
                                            </div>
                                        )}
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                            <span className="px-3 py-1.5 bg-accent-500 text-primary-900 font-bold text-xs rounded-full flex items-center gap-1">
                                                <Star size={12} className="fill-primary-900" />
                                                {t('pub.home.popular') || 'Popular'}
                                            </span>
                                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-700 font-bold text-xs rounded-full flex items-center gap-1">
                                                <Clock3 size={12} />
                                                {t('pub.home.years_3') || '3 Years'}
                                            </span>
                                        </div>

                                        {/* Trade Title */}
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-2xl font-black text-white mb-1">
                                                {getTranslatedTradeName(trade.name)}
                                            </h3>
                                            <p className="text-white/70 text-sm flex items-center gap-2">
                                                <Target size={14} />
                                                {t('pub.home.job_ready') || 'Job Ready in 3 Years'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Icon and Description */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-blue-100 text-blue-600' :
                                                i === 1 ? 'bg-green-100 text-green-600' :
                                                    i === 2 ? 'bg-amber-100 text-amber-600' :
                                                        'bg-purple-100 text-purple-600'}`}>
                                                <TradeIcon size={28} />
                                            </div>
                                            <p className="text-gray-500 leading-relaxed line-clamp-2">
                                                {trade.description || 'Learn practical skills in this comprehensive program designed for the modern workplace.'}
                                            </p>
                                        </div>

                                        {/* Program Details */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                                                <BookMarked size={16} className="text-primary-600" />
                                                <span className="font-medium">{t('pub.home.levels_3') || '3 Levels'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-xl">
                                                <Cert size={16} className="text-green-600" />
                                                <span className="font-medium">{t('pub.home.certificate') || 'Certificate'}</span>
                                            </div>
                                        </div>

                                        {/* What You'll Learn */}
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('pub.home.what_learn') || "What You'll Learn"}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    t('pub.home.practical_skills') || 'Practical Skills',
                                                    t('pub.home.theory') || 'Theory',
                                                    t('pub.home.internship') || 'Internship'
                                                ].slice(0, 3).map((skill, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-lg">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <span className="text-primary-600 font-bold text-sm group-hover:gap-3 transition-all flex items-center gap-2">
                                                {t('pub.home.view_details') || 'View Details'} <ChevronRight size={16} />
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <Users size={12} /> {Math.floor(Math.random() * 100 + 50)} enrolled
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* School View Gallery Section */}
            <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-600 font-bold text-sm uppercase tracking-widest rounded-full mb-4">School Facilities</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Explore Our Campus</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Take a visual tour of our modern facilities and learning environment.
                        </p>
                    </div>

                    {/* Masonry-style Gallery Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {schoolViewImages.map((img, idx) => (
                            <div
                                key={idx}
                                className={`relative group overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl ${idx === 0 ? 'md:row-span-2 md:col-span-2' : ''
                                    }`}
                                onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${idx === 0 ? 'md:h-full' : 'h-48 md:h-64'
                                        }`}
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <div className="flex items-center gap-2 text-white">
                                        <ZoomIn size={20} />
                                        <span className="font-medium">View</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Gallery Stats */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-black text-primary-600">4</div>
                            <div className="text-gray-500 text-sm">Modern Buildings</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-black text-primary-600">12</div>
                            <div className="text-gray-500 text-sm">Classrooms</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-black text-primary-600">3</div>
                            <div className="text-gray-500 text-sm">Workshops</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                            <div className="text-3xl font-black text-primary-600">2</div>
                            <div className="text-gray-500 text-sm">Computer Labs</div>
                        </div>
                    </div>
                </div>

                {/* Lightbox Modal */}
                {lightboxOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setLightboxOpen(false)}>
                        <button
                            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 transition-colors"
                            onClick={() => setLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                            <img
                                src={schoolViewImages[lightboxIndex].src}
                                alt={schoolViewImages[lightboxIndex].alt}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                            />
                            <div className="mt-4 flex items-center justify-between text-white">
                                <span className="text-lg font-medium">{schoolViewImages[lightboxIndex].alt}</span>
                                <div className="flex items-center gap-2">
                                    <span>{lightboxIndex + 1} / {schoolViewImages.length}</span>
                                </div>
                            </div>
                            {/* Navigation Arrows */}
                            {lightboxIndex > 0 && (
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                                >
                                    ←
                                </button>
                            )}
                            {lightboxIndex < schoolViewImages.length - 1 && (
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                                >
                                    →
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* Why Choose Us - Image Cards */}
            <section className="py-24 bg-primary-900 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-white/10 text-accent-400 font-bold text-sm uppercase tracking-widest rounded-full mb-4">{t('pub.home.why_title')}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{t('pub.home.why_1_title')}</h2>
                        <p className="text-lg text-primary-200 max-w-2xl mx-auto">
                            {t('pub.home.why_1_desc')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {whyReasons.map((r, i) => {
                            const Icon = r.icon;
                            return (
                                <div
                                    key={i}
                                    className="group relative rounded-3xl overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-2xl"
                                >
                                    {/* Image Background */}
                                    <div className="h-80 relative">
                                        <img
                                            src={r.image}
                                            alt={t(r.key)}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary-900 via-primary-900/60 to-transparent" />

                                        {/* Icon Badge */}
                                        <div className="absolute top-6 left-6 w-14 h-14 rounded-2xl bg-accent-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Icon size={28} className="text-primary-900" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <h3 className="text-xl font-black text-white mb-2">{t(r.key)}</h3>
                                        <p className="text-primary-200 text-sm leading-relaxed">{t(r.descKey)}</p>

                                        <div className="mt-4 flex items-center gap-2 text-accent-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            {t('pub.home.learn_more')} <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Stats Counter Section */}
            <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '98%', label: t('pub.home.stats_placement'), icon: Briefcase },
                            { value: '50+', label: t('pub.home.stats_partners'), icon: Handshake },
                            { value: '100%', label: t('pub.home.stats_practical'), icon: Wrench },
                            { value: '24/7', label: t('pub.home.stats_support'), icon: Shield },
                        ].map((item, i) => (
                            <div key={i} className="text-white">
                                <item.icon size={32} className="mx-auto mb-4 text-accent-400" />
                                <div className="text-4xl font-black mb-2">{item.value}</div>
                                <div className="text-primary-100 text-sm font-medium">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-12">
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-600 font-bold text-sm uppercase tracking-widest rounded-full mb-4">Latest News</span>
                            <h2 className="text-4xl font-black text-gray-900">Stay Updated</h2>
                        </div>
                        <Link to="/news" className="flex items-center gap-2 text-primary-600 font-bold hover:gap-3 transition-all mt-4 md:mt-0">
                            {t('pub.home.news_title')} <ArrowRight size={18} />
                        </Link>
                    </div>

                    {news.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-3xl">
                            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-xl font-bold text-gray-400">No news articles yet</p>
                            <p className="text-gray-400">Check back soon for updates!</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            {news.map((article, i) => (
                                <article
                                    key={article.id}
                                    className="group rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer"
                                >
                                    <Link to={`/news/${article.id}`}>
                                        <div className="h-56 overflow-hidden relative">
                                            {article.images && article.images.length > 0 ? (
                                                <>
                                                    <img
                                                        src={`${API_URL}${article.images[0].image_url}`}
                                                        alt={getNewsTitle(article)}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    {article.images.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                                            {article.images.slice(0, 3).map((img, idx) => (
                                                                <div key={idx} className={`w-6 h-6 rounded-full border-2 border-white overflow-hidden ${idx === 0 ? 'ring-2 ring-primary-500' : ''}`}>
                                                                    <img
                                                                        src={`${API_URL}${img.image_url}`}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {article.images.length > 3 && (
                                                                <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                                                                    +{article.images.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : article.image_url ? (
                                                <img
                                                    src={`${API_URL}${article.image_url}`}
                                                    alt={getNewsTitle(article)}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                                    <GraduationCap size={48} className="text-primary-300" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-primary-700 flex items-center gap-1">
                                                {article.category || 'News'}
                                                {article.images && article.images.length > 1 && (
                                                    <span className="ml-1 text-gray-500">• {article.images.length} photos</span>
                                                )}
                                            </div>
                                            {article.is_featured && (
                                                <div className="absolute top-4 right-4 px-2 py-1 bg-accent-500 rounded-full text-xs font-bold text-primary-900">
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(article.created_at).toLocaleDateString()}
                                                </span>
                                                {article.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {article.location}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                                {getNewsTitle(article)}
                                            </h3>
                                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                                                {getNewsContent(article)}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-primary-600 font-bold text-sm hover:gap-2 transition-all">
                                                Read More <ChevronRight size={14} />
                                            </span>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to Start Your Journey?</h2>
                    <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                        Join hundreds of students who have transformed their careers through our quality vocational education programs.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/apply" className="px-10 py-5 bg-accent-500 hover:bg-accent-400 text-primary-900 font-black text-xl rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-accent-500/40 flex items-center gap-3">
                            Apply Now <ArrowRight size={24} />
                        </Link>
                        <Link to="/parent-apply" className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 text-white font-bold text-xl rounded-2xl transition-all flex items-center gap-3">
                            <Heart size={24} /> Parent Apply
                        </Link>
                        <Link to="/contact" className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 text-white font-bold text-xl rounded-2xl transition-all flex items-center gap-3">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-600 font-bold text-sm uppercase tracking-widest rounded-full mb-4">FAQ</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Find answers to common questions about admissions, programs, and student life.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqItems.map((faq, i) => (
                            <div key={i} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-bold text-gray-800 text-lg pr-4">
                                        {lang === 'rw' ? faq.question_rw : faq.question}
                                    </span>
                                    <ChevronRight size={24} className={`text-primary-600 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-6">
                                        <p className="text-gray-600 leading-relaxed">
                                            {lang === 'rw' ? faq.answer_rw : faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gradient-to-b from-gray-50 to-primary-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-accent-100 text-accent-600 font-bold text-sm uppercase tracking-widest rounded-full mb-4">Success Stories</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">What Our Graduates Say</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Hear from our alumni about their experience at Garden TVET School.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, i) => (
                            <div key={i} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <Quote size={40} className="text-accent-400 mb-4" />
                                <p className="text-gray-600 mb-6 leading-relaxed italic">
                                    "{lang === 'rw' ? testimonial.quote_rw : testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;

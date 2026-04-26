import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    Monitor, Car, Building2, BookOpen, Users, HeartHandshake,
    Trophy, ArrowRight, CheckCircle, Clock, Award, GraduationCap,
    MapPin, Phone, Mail, Calendar, Star, ChevronRight, Play,
    Wifi, Database, Code, Wrench, Hammer, Cpu, Zap, Settings,
    Activity, Briefcase, Target, TrendingUp, Leaf, Recycle, Shield
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const ServicesPage = () => {
    const { t } = useTranslation();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/trades`);
                if (res.data && res.data.length > 0) {
                    setTrades(res.data);
                }
            } catch (error) {
                console.log('Using default trades');
            } finally {
                setLoading(false);
            }
        };
        fetchTrades();
    }, []);

    // Modern green color scheme
    const greenGradients = [
        'from-green-600 via-emerald-600 to-teal-700',
        'from-emerald-500 via-green-600 to-teal-600',
        'from-teal-500 via-emerald-600 to-green-700'
    ];

    const cardGradients = [
        'from-green-50 to-emerald-50 border-green-200',
        'from-teal-50 to-green-50 border-teal-200',
        'from-emerald-50 to-teal-50 border-emerald-200'
    ];

    const features = [
        { icon: GraduationCap, title: t('pub.services.features.certifiedPrograms'), desc: t('pub.services.features.certifiedProgramsDesc'), color: 'bg-green-100 text-green-600' },
        { icon: Briefcase, title: t('pub.services.features.practicalTraining'), desc: t('pub.services.features.practicalTrainingDesc'), color: 'bg-emerald-100 text-emerald-600' },
        { icon: TrendingUp, title: t('pub.services.features.careerSupport'), desc: t('pub.services.features.careerSupportDesc'), color: 'bg-teal-100 text-teal-600' },
        { icon: Users, title: t('pub.services.features.expertInstructors'), desc: t('pub.services.features.expertInstructorsDesc'), color: 'bg-green-100 text-green-600' },
    ];

    const stats = [
        { value: '1,200+', label: t('pub.services.stats.studentsEnrolled') },
        { value: '45+', label: t('pub.services.stats.qualifiedTeachers') },
        { value: '95%', label: t('pub.services.stats.jobPlacement') },
        { value: '15+', label: t('pub.services.stats.yearsExperience') },
    ];

    const process = [
        { step: '01', title: t('pub.services.process.chooseTrade'), desc: t('pub.services.process.chooseTradeDesc') },
        { step: '02', title: t('pub.services.process.applyOnline'), desc: t('pub.services.process.applyOnlineDesc') },
        { step: '03', title: t('pub.services.process.getAdmitted'), desc: t('pub.services.process.getAdmittedDesc') },
        { step: '04', title: t('pub.services.process.startLearning'), desc: t('pub.services.process.startLearningDesc') },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 py-24 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                    <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                        <Leaf className="w-4 h-4 text-green-200" />
                        <span className="text-green-100 text-sm font-medium">{t('pub.services.heroSchool')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                        {t('pub.services.heroTitle')}
                        <span className="block text-green-300">{t('pub.services.heroTitle2')}</span>
                    </h1>
                    <p className="text-xl text-green-100 max-w-3xl mx-auto mb-10 leading-relaxed">
                        {t('pub.services.heroDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/apply"
                            className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all hover:scale-105 shadow-xl"
                        >
                            {t('pub.services.applyNow')} <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/about"
                            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20"
                        >
                            {t('pub.services.learnMore')}
                        </Link>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="relative z-10 max-w-6xl mx-auto px-6 mt-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                                <div className="text-green-200 text-sm font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trades Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                            {t('pub.services.ourPrograms')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            {t('pub.services.chooseYourTrade')} <span className="text-green-600">{t('pub.services.trade')}</span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Select from our diverse range of vocational programs designed to prepare you for the workforce
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-3xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            {(trades.length > 0 ? trades : [
                                { id: 1, name: 'Software Development', description: 'Master programming and IT skills', icon: 'Monitor' },
                                { id: 2, name: 'Automobile Technology', description: 'Learn vehicle maintenance and repair', icon: 'Car' },
                                { id: 3, name: 'Building & Construction', description: 'Build skills in construction trades', icon: 'Building2' }
                            ]).map((trade, i) => {
                                const icons = { Monitor, Car, Building2 };
                                const Icon = icons[trade.icon] || Monitor;
                                return (
                                    <div
                                        key={trade.id || i}
                                        className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-green-100"
                                    >
                                        {/* Card Header */}
                                        <div className={`bg-gradient-to-br ${greenGradients[i % 3]} p-8 text-white relative overflow-hidden`}>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                            <div className="relative z-10">
                                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Icon size={32} />
                                                </div>
                                                <h3 className="text-2xl font-black mb-2">{trade.name}</h3>
                                                <p className="text-green-100 text-sm">{trade.description}</p>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-8">
                                            <div className="space-y-4 mb-8">
                                                {[
                                                    'Industry-recognized certification',
                                                    'Hands-on practical training',
                                                    'Expert instructors',
                                                    'Job placement support'
                                                ].map((feature, j) => (
                                                    <div key={j} className="flex items-center gap-3">
                                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <span className="text-gray-600 text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <span className="text-2xl font-black text-green-600">3 Years</span>
                                                <Link
                                                    to={`/trade/${encodeURIComponent(trade.name)}`}
                                                    className="inline-flex items-center gap-2 text-green-600 font-bold hover:gap-3 transition-all"
                                                >
                                                    View Details <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-36 -mt-36"></div>
                    <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-36 -mb-36"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            {t('pub.services.whyChoose')}
                        </h2>
                        <p className="text-green-100 max-w-2xl mx-auto">
                            We provide comprehensive vocational training that prepares you for success
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={i}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all group"
                                >
                                    <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                                    <p className="text-green-100 text-sm">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                            Simple Process
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            How to <span className="text-green-600">Enroll</span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Follow these simple steps to start your vocational journey
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {process.map((step, i) => (
                            <div key={i} className="relative text-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                    <span className="text-2xl font-black text-white">{step.step}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-500 text-sm">{step.desc}</p>
                                {i < process.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-green-300 to-emerald-300"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            to="/apply"
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all hover:scale-105 shadow-lg"
                        >
                            Start Your Application <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        {t('pub.services.readyFuture')}
                    </h2>
                    <p className="text-xl text-green-100 mb-10">
                        Join thousands of successful graduates who have transformed their careers through our vocational programs
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/apply"
                            className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all hover:scale-105 shadow-xl"
                        >
                            Apply Today <GraduationCap className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/30"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;

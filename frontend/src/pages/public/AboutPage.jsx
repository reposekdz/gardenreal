import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GraduationCap, Award, Users, BookOpen, ArrowRight, Trophy, Handshake, Clock, Mail, Phone, User } from 'lucide-react';
import { contentAPI } from '../../utils/api';

const AboutPage = () => {
    const { t, i18n } = useTranslation();
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leadership, setLeadership] = useState([]);
    const [leadershipLoading, setLeadershipLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [infoRes, statsRes, leadershipRes] = await Promise.all([
                    contentAPI.getSchoolInfo('about'),
                    contentAPI.getSchoolStats(),
                    contentAPI.getLeadershipTeam()
                ]);
                setSchoolInfo(infoRes.data);
                setStats(statsRes.data);
                setLeadership(leadershipRes.data || []);
            } catch (error) {
                console.error('Failed to fetch school info');
            } finally {
                setLoading(false);
                setLeadershipLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatIcon = (iconName) => {
        const icons = {
            Users, GraduationCap, BookOpen, Award, Trophy, Handshake
        };
        return icons[iconName] || Users;
    };

    const getRoleLabel = (role) => {
        const labels = {
            director: i18n.language === 'rw' ? 'Director' : i18n.language === 'fr' ? 'Directeur' : 'Director',
            admin: i18n.language === 'rw' ? 'Admin' : i18n.language === 'fr' ? 'Administrateur' : 'Administrator',
            director_of_discipline: i18n.language === 'rw' ? 'Dir. Discipline' : i18n.language === 'fr' ? 'Dir. Discipline' : 'Discipline Director',
            dod: i18n.language === 'rw' ? 'DOD' : i18n.language === 'fr' ? 'DOD' : 'DOD',
            accountant: i18n.language === 'rw' ? 'Accounting' : i18n.language === 'fr' ? 'Comptable' : 'Accountant',
            registrar: i18n.language === 'rw' ? 'Registrar' : i18n.language === 'fr' ? 'Secrétaire' : 'Registrar',
            librarian: i18n.language === 'rw' ? 'Librarian' : i18n.language === 'fr' ? 'Bibliothécaire' : 'Librarian',
            stock_manager: i18n.language === 'rw' ? 'Stok Manager' : i18n.language === 'fr' ? 'Gestionnaire' : 'Stock Manager',
            teacher: i18n.language === 'rw' ? 'Teacher' : i18n.language === 'fr' ? 'Enseignant' : 'Teacher'
        };
        return labels[role] || role;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
            {/* Hero Section */}
            <section className="py-16 md:py-20 px-4 md:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-6">
                        {loading ? t('pub.about.title') : (schoolInfo?.title || t('pub.about.title'))}
                    </h1>
                    <p className="text-lg md:text-xl text-primary-100 leading-relaxed px-2">
                        {loading ? t('pub.about.subtitle') : (schoolInfo?.subtitle || t('pub.about.subtitle'))}
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
                            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
                                <Award className="text-white" size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">{t('pub.about.mission_title')}</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {t('pub.about.mission_desc')}
                            </p>
                        </div>
                        <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
                            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
                                <GraduationCap className="text-white" size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-4">{t('pub.about.vision_title')}</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {t('pub.about.vision_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-black text-primary-600 mb-2">1,200+</div>
                            <div className="text-gray-600 font-medium">{t('pub.about.students')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-primary-600 mb-2">45+</div>
                            <div className="text-gray-600 font-medium">{t('pub.about.teachers')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-primary-600 mb-2">3</div>
                            <div className="text-gray-600 font-medium">{t('pub.about.trades')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-primary-600 mb-2">10+</div>
                            <div className="text-gray-600 font-medium">{t('pub.about.years')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-black text-gray-900 text-center mb-12">{t('pub.about.values_title')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{t('pub.about.value1_title')}</h3>
                            <p className="text-gray-600">{t('pub.about.value1_desc')}</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{t('pub.about.value2_title')}</h3>
                            <p className="text-gray-600">{t('pub.about.value2_desc')}</p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{t('pub.about.value3_title')}</h3>
                            <p className="text-gray-600">{t('pub.about.value3_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Leadership Team */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-gray-900 mb-4">{t('pub.about.leadership_title')}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">{t('pub.about.leadership_desc')}</p>
                    </div>
                    {leadershipLoading ? (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    ) : leadership.length > 0 ? (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {leadership.map((member) => (
                                <div key={member.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                    <div className="relative">
                                        {member.photo ? (
                                            <img
                                                src={`${API_URL}${member.photo}`}
                                                alt={`${member.first_name} ${member.last_name}`}
                                                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary-100"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center border-4 border-primary-100">
                                                <User className="text-white" size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center mt-4">
                                        <h3 className="text-lg font-black text-gray-900">{member.first_name} {member.last_name}</h3>
                                        <p className="text-primary-600 font-semibold text-sm">{getRoleLabel(member.role)}</p>
                                        {member.position && (
                                            <p className="text-gray-500 text-xs mt-1">{member.position}</p>
                                        )}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            {member.phone && (
                                                <a href={`tel:${member.phone}`} className="flex items-center justify-center gap-2 text-gray-500 hover:text-primary-600 text-sm">
                                                    <Phone size={14} /> {member.phone}
                                                </a>
                                            )}
                                            {member.email && (
                                                <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 text-gray-500 hover:text-primary-600 text-sm mt-2">
                                                    <Mail size={14} /> {member.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No leadership team members found</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gradient-to-r from-primary-700 to-primary-900">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h2 className="text-3xl font-black text-white mb-4">{t('pub.about.cta_title')}</h2>
                    <p className="text-primary-200 mb-8">{t('pub.about.cta_subtitle')}</p>
                    <Link
                        to="/apply"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-primary-900 font-black rounded-xl text-lg transition-all transform hover:scale-105"
                    >
                        {t('pub.home.apply_btn')} <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { newsAPI } from '../../utils/api';
import {
    Calendar, ArrowRight, GraduationCap, BookOpen, Eye, Heart,
    MessageCircle, Search, Filter, Clock, TrendingUp,
    Share2, Bookmark, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const NewsPage = () => {
    const { t, i18n } = useTranslation();
    const [news, setNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [featuredExpanded, setFeaturedExpanded] = useState(false);

    const lang = i18n.language || 'rw';
    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        newsAPI.getPublished()
            .then(res => {
                setNews(res.data);
                setFilteredNews(res.data);
                // Extract unique categories
                const cats = [...new Set(res.data.map(n => n.category).filter(Boolean))];
                setCategories(cats);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Filter news based on search and category
    useEffect(() => {
        let filtered = [...news];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(n => n.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                T(n, 'title').toLowerCase().includes(query) ||
                T(n, 'content').toLowerCase().includes(query)
            );
        }

        setFilteredNews(filtered);
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, news]);

    const T = (article, field) => article[`${field}_${lang}`] || article[`${field}_rw`] || article[`${field}_en`] || '';

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredNews.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getReadingTime = (content) => {
        const words = content.split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    };

    const handleShare = async (article) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: T(article, 'title'),
                    text: T(article, 'content').substring(0, 100),
                    url: `/news/${article.id}`
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Page Hero */}
            <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 py-20 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                    backgroundSize: "30px 30px"
                }} />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 relative z-10 tracking-tight">
                    {t('pub.news.title')}
                </h1>
                <p className="text-primary-200 text-lg md:text-xl relative z-10 max-w-2xl mx-auto">
                    Amakuru mashya yose ya Garden TVET School
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8 -mt-10 relative z-20">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search news..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Filter size={20} className="text-gray-400 flex-shrink-0" />
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${selectedCategory === 'all'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-500">
                        Showing <span className="font-bold text-primary-600">{filteredNews.length}</span> articles
                    </p>
                    {selectedCategory !== 'all' && (
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                        >
                            Clear filter <X size={14} />
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={48} className="text-gray-300" />
                        </div>
                        <p className="text-xl font-bold text-gray-400 mb-2">No news found</p>
                        <p className="text-gray-300">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <>
                        {/* Featured article */}
                        {currentPage === 1 && filteredNews[0] && (
                            <div className="mb-12 group">
                                <Link
                                    to={`/news/${filteredNews[0].id}`}
                                    className="block rounded-3xl overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                                >
                                    <div className="grid lg:grid-cols-2 gap-0">
                                        <div className="relative h-64 lg:h-auto overflow-hidden">
                                            {filteredNews[0].image_url ? (
                                                <>
                                                    <img
                                                        src={`${API_URL}${filteredNews[0].image_url}`}
                                                        alt={T(filteredNews[0], 'title')}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full min-h-80 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                                    <GraduationCap size={80} className="text-primary-300" />
                                                </div>
                                            )}

                                            {/* Category Badge */}
                                            {filteredNews[0].category && (
                                                <span className="absolute top-4 left-4 px-3 py-1 bg-primary-600 text-white text-sm font-bold rounded-full">
                                                    {filteredNews[0].category}
                                                </span>
                                            )}

                                            {/* Featured Badge */}
                                            <span className="absolute top-4 right-4 px-3 py-1 bg-accent-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
                                                <TrendingUp size={14} /> Featured
                                            </span>
                                        </div>

                                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                                            {/* Meta */}
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {formatDate(filteredNews[0].created_at)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary-500" />
                                                    {getReadingTime(T(filteredNews[0], 'content'))} min read
                                                </span>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="flex items-center gap-1.5 text-gray-400 text-sm bg-gray-50 px-3 py-1 rounded-full">
                                                    <Eye size={14} /> {filteredNews[0].views_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-gray-400 text-sm bg-gray-50 px-3 py-1 rounded-full">
                                                    <Heart size={14} /> {filteredNews[0].likes_count || 0}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-gray-400 text-sm bg-gray-50 px-3 py-1 rounded-full">
                                                    <MessageCircle size={14} /> {filteredNews[0].comments_count || 0}
                                                </span>
                                            </div>

                                            <h2 className="text-2xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight group-hover:text-primary-600 transition-colors">
                                                {T(filteredNews[0], 'title')}
                                            </h2>

                                            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3 lg:line-clamp-4">
                                                {T(filteredNews[0], 'content')}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="inline-flex items-center gap-2 text-primary-600 font-bold group-hover:gap-3 transition-all">
                                                    Read Article <ArrowRight size={18} />
                                                </span>

                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleShare(filteredNews[0]);
                                                    }}
                                                    className="p-2 rounded-full bg-gray-100 hover:bg-primary-100 text-gray-400 hover:text-primary-600 transition-all"
                                                >
                                                    <Share2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Remaining articles Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(currentPage === 1 ? currentItems.slice(1) : currentItems).map((article, index) => (
                                <article
                                    key={article.id}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <Link to={`/news/${article.id}`} className="flex flex-col h-full">
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden">
                                            {article.image_url ? (
                                                <>
                                                    <img
                                                        src={`${API_URL}${article.image_url}`}
                                                        alt={T(article, 'title')}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                                                    <GraduationCap size={48} className="text-primary-200" />
                                                </div>
                                            )}

                                            {/* Category */}
                                            {article.category && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600/90 text-white text-xs font-bold rounded-full">
                                                    {article.category}
                                                </span>
                                            )}

                                            {/* Share Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleShare(article);
                                                }}
                                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-primary-600 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Meta */}
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {formatDate(article.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {getReadingTime(T(article, 'content'))} min
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                                {T(article, 'title')}
                                            </h3>

                                            {/* Excerpt */}
                                            <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                                {T(article, 'content')}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3 text-gray-400 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={12} /> {article.views_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart size={12} /> {article.likes_count || 0}
                                                    </span>
                                                </div>
                                                <span className="text-primary-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Read <ArrowRight size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} className="text-gray-600" />
                                </button>

                                {[...Array(totalPages)].map((_, idx) => (
                                    <button
                                        key={idx + 1}
                                        onClick={() => setCurrentPage(idx + 1)}
                                        className={`w-10 h-10 rounded-full font-bold transition-all ${currentPage === idx + 1
                                                ? 'bg-primary-600 text-white shadow-lg'
                                                : 'bg-white shadow-md hover:shadow-lg text-gray-600'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} className="text-gray-600" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NewsPage;

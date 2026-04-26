import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    ArrowLeft, Calendar, User, Eye, Share2, Heart,
    MessageCircle, ChevronLeft, ChevronRight, X, Image,
    MapPin, Video, Clock, Send, ThumbsUp, Trash2, Facebook, Twitter, Linkedin, Link as LinkIcon,
    Bookmark, Printer, ArrowUp, ArrowDown, MoreHorizontal
} from 'lucide-react';

const NewsDetailPage = () => {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [readingProgress, setReadingProgress] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showStickyShare, setShowStickyShare] = useState(false);
    const [relatedNews, setRelatedNews] = useState([]);
    const contentRef = useRef(null);

    // Engagement states
    const [views, setViews] = useState(0);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // User info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchNews();
        fetchEngagement();
        incrementViews();
        checkBookmark();

        // Reading progress listener
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrollTop = window.scrollY;
            const progress = (scrollTop / documentHeight) * 100;
            setReadingProgress(Math.min(100, Math.max(0, progress)));

            // Show sticky share after scrolling past hero
            setShowStickyShare(scrollTop > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [id]);

    const fetchNews = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/news/${id}`);
            setNews(res.data);
        } catch (err) {
            toast.error('Habaye ikibazo mu gufungura ikiganiro');
        } finally {
            setLoading(false);
        }
    };

    const fetchEngagement = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/news-engagement/${id}`);
            if (res.data) {
                setViews(res.data.views || 0);
                setLikes(res.data.likes || 0);
                setIsLiked(res.data.isLiked || false);
            }
        } catch (err) {
            console.log('Engagement fetch error:', err);
        }
    };

    const fetchRelatedNews = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/news?category=${news.category}&exclude=${id}&limit=3`);
            setRelatedNews(res.data || []);
        } catch (err) {
            console.log('Related news fetch error:', err);
        }
    };

    useEffect(() => {
        if (news && !loading) {
            fetchRelatedNews();
        }
    }, [news, loading]);

    const incrementViews = async () => {
        try {
            await axios.post(`${API_URL}/api/news-engagement/${id}/view`);
        } catch (err) {
            console.log('View increment error:', err);
        }
    };

    const handleLike = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/news-engagement/${id}/like`);
            setIsLiked(res.data.liked);
            setLikes(res.data.likes);
        } catch (err) {
            toast.error('Habaye ikibazo mu gutanga likes');
        }
    };

    const checkBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        setIsBookmarked(bookmarks.includes(id));
    };

    const handleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        let newBookmarks;

        if (isBookmarked) {
            newBookmarks = bookmarks.filter(b => b !== id);
            toast.success('Bookmark removed');
        } else {
            newBookmarks = [...bookmarks, id];
            toast.success('Article bookmarked!');
        }

        localStorage.setItem('newsBookmarks', JSON.stringify(newBookmarks));
        setIsBookmarked(!isBookmarked);
    };

    const handlePrint = () => {
        window.print();
    };

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/news-engagement/${id}/comments`);
            setComments(res.data);
        } catch (err) {
            console.log('Comments fetch error:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchComments();
        }
    }, [loading, id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await axios.post(`${API_URL}/api/news-engagement/${id}/comments`, {
                content: newComment,
                authorName: userInfo.name || 'Umunyamakuru'
            });
            setComments([res.data, ...comments]);
            setNewComment('');
            toast.success('Comment yongewe');
        } catch (err) {
            toast.error('Habaye ikibazo mu gutanga comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Urashaka gusiba aka comment?')) return;

        try {
            await axios.delete(`${API_URL}/api/news-engagement/${commentId}/comment`);
            setComments(comments.filter(c => c.id !== commentId));
            toast.success('Comment sibitswe');
        } catch (err) {
            toast.error('Habaye ikibazo mu gusiba comment');
        }
    };

    const shareToSocial = (platform) => {
        const url = window.location.href;
        const title = getTitle();
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            default:
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link yagutse!');
        setShowShareMenu(false);
    };

    const getTitle = () => {
        if (!news) return '';
        return news.title_en || news.title_rw || news.title_fr || 'News';
    };

    const getContent = () => {
        if (!news) return '';
        return news.content_en || news.content_rw || news.content_fr || '';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCommentDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'None';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours} h`;
        if (diffDays < 7) return `${diffDays} days`;
        return formatDate(date);
    };

    const getReadingTime = (content) => {
        const words = content.split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    };

    const images = news?.images || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!news) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Ikiganiro ntikibonetse</p>
                    <Link to="/" className="text-primary-600 hover:underline">Subira kuri home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-100"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Sticky Share Bar */}
            {showStickyShare && (
                <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
                    <button
                        onClick={handleLike}
                        className={`p-3 rounded-full shadow-lg transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50'}`}
                        title={isLiked ? 'Unlike' : 'Like'}
                    >
                        <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleBookmark}
                        className={`p-3 rounded-full shadow-lg transition-all ${isBookmarked ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-primary-50'}`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    >
                        <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-3 rounded-full bg-white shadow-lg text-gray-600 hover:bg-gray-50 transition-all"
                        title="Print"
                    >
                        <Printer size={20} />
                    </button>
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="p-3 rounded-full bg-primary-600 shadow-lg text-white hover:bg-primary-700 transition-all"
                        title="Share"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            )}

            {/* Hero Image Section */}
            {images.length > 0 && (
                <div className="relative h-72 md:h-[500px] bg-gray-900 overflow-hidden">
                    <img
                        src={`${API_URL}${images[0].image_url}`}
                        alt={getTitle()}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Image Gallery Navigation */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-3 h-3 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-8' : 'bg-white/50'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link
                    to="/news"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to News
                </Link>

                {/* Category Badge */}
                {news.category && (
                    <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full mb-4">
                        {news.category}
                    </span>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                    {getTitle()}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-500 mb-8 pb-8 border-b">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>{formatDate(news.created_at)}</span>
                    </div>
                    {news.author_id && (
                        <div className="flex items-center gap-2">
                            <User size={18} />
                            <span>Admin</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Eye size={18} />
                        <span>{views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span>{getReadingTime(getContent())} min read</span>
                    </div>
                    {news.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={18} />
                            <span>{news.location}</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${isLiked
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-500'
                            }`}
                    >
                        <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                        {isLiked ? 'Liked' : 'Like'} ({likes})
                    </button>
                    <button
                        onClick={handleBookmark}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${isBookmarked
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-600'
                            }`}
                    >
                        <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                    >
                        <Printer size={20} /> Print
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
                        >
                            <Share2 size={20} /> Share
                        </button>

                        {/* Share Dropdown */}
                        {showShareMenu && (
                            <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border py-2 z-50">
                                <button
                                    onClick={() => shareToSocial('facebook')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-gray-700"
                                >
                                    <Facebook size={20} className="text-blue-600" /> Facebook
                                </button>
                                <button
                                    onClick={() => shareToSocial('twitter')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 text-gray-700"
                                >
                                    <Twitter size={20} className="text-sky-500" /> Twitter
                                </button>
                                <button
                                    onClick={() => shareToSocial('whatsapp')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 text-gray-700"
                                >
                                    <span className="text-green-500 font-bold">W</span> WhatsApp
                                </button>
                                <button
                                    onClick={() => shareToSocial('linkedin')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-gray-700"
                                >
                                    <Linkedin size={20} className="text-blue-700" /> LinkedIn
                                </button>
                                <hr className="my-2" />
                                <button
                                    onClick={copyLink}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-gray-700"
                                >
                                    <LinkIcon size={20} /> Copy Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Thumbnail Gallery (if not hero) */}
                {images.length > 1 && (
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-3">Gallery ({images.length} photos)</p>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {images.map((img, idx) => (
                                <button
                                    key={img.id}
                                    onClick={() => {
                                        setCurrentImageIndex(idx);
                                        setSelectedImage(img.image_url);
                                    }}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={`${API_URL}${img.image_url}`}
                                        alt={img.caption || `Photo ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video Embed */}
                {news.video_url && (
                    <div className="mb-8">
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                            <iframe
                                src={news.video_url}
                                title="Video"
                                className="w-full h-full"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

                {/* Summary */}
                {news.summary && (
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-l-4 border-primary-500 p-6 rounded-r-xl mb-8">
                        <p className="text-lg text-primary-800 font-medium">{news.summary}</p>
                    </div>
                )}

                {/* Main Content */}
                <div ref={contentRef} className="prose prose-lg max-w-none text-gray-700">
                    {getContent().split('\n').map((paragraph, idx) => (
                        paragraph.trim() ? (
                            <p key={idx} className="mb-6 leading-relaxed text-lg">
                                {paragraph}
                            </p>
                        ) : <br key={idx} />
                    ))}
                </div>

                {/* Engagement Section */}
                <div className="mt-12 pt-8 border-t">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500">{comments.length} Comments</span>
                            <span className="text-gray-500">{views} Views</span>
                            <span className="text-gray-500">{likes} Likes</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-12 bg-white rounded-2xl shadow-sm p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MessageCircle size={24} className="text-primary-600" />
                        Comments ({comments.length})
                    </h3>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="mb-8">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write your comment..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    rows={3}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="self-end px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    {commentsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                                {comment.author_name?.charAt(0).toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900">{comment.author_name || 'Anonymous'}</span>
                                                    <span className="text-xs text-gray-400">{formatCommentDate(comment.created_at)}</span>
                                                </div>
                                                <p className="text-gray-700">{comment.content}</p>
                                            </div>
                                        </div>
                                        {(userInfo.id === comment.author_id || userInfo.role === 'admin') && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Related Articles */}
                {relatedNews.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Related News</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {relatedNews.map(article => (
                                <Link
                                    key={article.id}
                                    to={`/news/${article.id}`}
                                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
                                >
                                    <div className="h-32 overflow-hidden">
                                        {article.image_url ? (
                                            <img
                                                src={`${API_URL}${article.image_url}`}
                                                alt={article.title_en || article.title_rw}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                                <Image size={32} className="text-primary-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                            {article.title_en || article.title_rw}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Navigation Buttons */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-40">
                <button
                    onClick={scrollToTop}
                    className="p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all"
                    title="Back to top"
                >
                    <ArrowUp size={20} />
                </button>
            </div>

            {/* Full Screen Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={`${API_URL}${selectedImage}`}
                        alt="Full screen"
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default NewsDetailPage;

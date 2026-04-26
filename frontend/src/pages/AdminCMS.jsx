import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2, Eye, EyeOff, Newspaper, FileText, CheckCircle, XCircle, Clock, Image, Globe, Edit2, Save, Phone, Mail, MapPin, Facebook, Youtube, Building, MessageSquare, Award, BarChart3, ThumbsUp, Users, TrendingUp } from 'lucide-react';
import HeroSlidesManager from '../components/HeroSlidesManager';
import SMSTemplatesManager from '../components/SMSTemplatesManager';
import GradesManager from '../components/GradesManager';

const AdminCMS = () => {
    const { token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [activeTab, setActiveTab] = useState('news');
    const [news, setNews] = useState([]);
    const [applications, setApplications] = useState([]);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showTradeForm, setShowTradeForm] = useState(false);
    const [form, setForm] = useState({ title_rw: '', title_en: '', content_rw: '', content_en: '', is_published: 'true' });
    const [newsImages, setNewsImages] = useState([]);
    const [tradeForm, setTradeForm] = useState({ name: '', description: '', image_url: '' });

    const headers = { Authorization: `Bearer ${token}` };

    // Website/School Info management state
    const [schoolInfo, setSchoolInfo] = useState({});
    const [editingSection, setEditingSection] = useState(null);
    const [sectionForm, setSectionForm] = useState({});
    const [savingSection, setSavingSection] = useState(false);
    const [contactMessages, setContactMessages] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [newsRes, appRes, tradesRes] = await Promise.all([
                axios.get(`${API_URL}/api/news/all`, { headers }),
                axios.get(`${API_URL}/api/applications`, { headers }),
                axios.get(`${API_URL}/api/trades`, { headers })
            ]);
            setNews(newsRes.data);
            setApplications(appRes.data);
            setTrades(tradesRes.data);

            // Fetch school info sections
            const sections = ['about', 'contact', 'services'];
            const infoResults = await Promise.allSettled(
                sections.map(s => axios.get(`${API_URL}/api/content/school-info/${s}`, { headers }))
            );
            const infoMap = {};
            infoResults.forEach((r, i) => {
                if (r.status === 'fulfilled') infoMap[sections[i]] = r.value.data;
            });
            setSchoolInfo(infoMap);

            // Fetch contact messages
            try {
                const msgRes = await axios.get(`${API_URL}/api/content/contact-messages`, { headers });
                setContactMessages(msgRes.data || []);
            } catch (e) { setContactMessages([]); }
        } catch (err) {
            console.error('CMS Load Error:', err.response?.data || err.message);
            toast.error(err.response?.data?.message || 'Failed to load CMS data');
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const createNews = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title_rw', form.title_rw);
            formData.append('title_en', form.title_en);
            formData.append('content_rw', form.content_rw);
            formData.append('content_en', form.content_en);
            formData.append('is_published', form.is_published);
            formData.append('category', form.category || 'News');
            formData.append('summary', form.summary || '');
            formData.append('location', form.location || '');
            formData.append('video_url', form.video_url || '');
            formData.append('is_featured', form.is_featured || 'false');

            // Append multiple images
            for (let i = 0; i < newsImages.length; i++) {
                formData.append('images', newsImages[i]);
            }

            await axios.post(`${API_URL}/api/news`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Amakuru ashyizweho!');
            setShowForm(false);
            setForm({ title_rw: '', title_en: '', content_rw: '', content_en: '', is_published: 'true', category: '', summary: '', location: '', video_url: '', is_featured: 'false' });
            setNewsImages([]);
            fetchData();
        } catch { toast.error('Failed to create news'); }
    };

    const deleteNews = async (id) => {
        if (!window.confirm('Ushaka gusiba iyi makuru?')) return;
        try {
            await axios.delete(`${API_URL}/api/news/${id}`, { headers });
            toast.success('Amakuru asibwe!');
            fetchData();
        } catch { toast.error('Failed to delete'); }
    };

    const togglePublish = async (article) => {
        try {
            await axios.put(`${API_URL}/api/news/${article.id}`, {
                ...article, is_published: !article.is_published
            }, { headers });
            fetchData();
        } catch { toast.error('Failed to update'); }
    };

    const updateAppStatus = async (id, status) => {
        try {
            await axios.put(`${API_URL}/api/applications/${id}`, { status }, { headers });
            toast.success(`Ubusabe ${status === 'approved' ? 'bwemejwe' : 'bwanzwe'}! SMS yoherejwe.`);
            fetchData();
        } catch { toast.error('Failed to update application'); }
    };

    const handleTradeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (tradeForm.id) {
                await axios.put(`${API_URL}/api/trades/${tradeForm.id}`, tradeForm, { headers });
                toast.success('Ishami ryavuguruwe!');
            } else {
                await axios.post(`${API_URL}/api/trades`, tradeForm, { headers });
                toast.success('Ishami rishya ryangeweho!');
            }
            setShowTradeForm(false);
            setTradeForm({ name: '', description: '', image_url: '' });
            fetchData();
        } catch { toast.error('Ikibazo cyabaye mu kubika ishami'); }
    };

    const deleteTrade = async (id) => {
        if (!window.confirm('Ushaka gusiba iri shami burundu?')) return;
        try {
            await axios.delete(`${API_URL}/api/trades/${id}`, { headers });
            toast.success('Ishami ryasibwe!');
            fetchData();
        } catch { toast.error('Ntabwo ishami ryasibwe'); }
    };

    const saveSchoolInfo = async (section) => {
        setSavingSection(true);
        try {
            await axios.put(`${API_URL}/api/content/school-info/${section}`, sectionForm, { headers });
            toast.success('School info updated!');
            setEditingSection(null);
            fetchData();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setSavingSection(false); }
    };

    const markMessageRead = async (id) => {
        try {
            await axios.put(`${API_URL}/api/content/contact-messages/${id}/read`, {}, { headers });
            setContactMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
        } catch (e) { }
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const icons = { pending: Clock, approved: CheckCircle, rejected: XCircle };
        const Icon = icons[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                <Icon size={12} /> {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gucunga Ibiri kuri Site</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage news, content, and student applications</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-1 w-fit">
                <button onClick={() => setActiveTab('news')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'news' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Newspaper size={16} /> Amakuru
                </button>
                <button onClick={() => setActiveTab('applications')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'applications' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText size={16} /> Ubusabe ({applications.filter(a => a.status === 'pending').length})
                </button>
                <button onClick={() => setActiveTab('trades')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'trades' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Newspaper size={16} /> Amashami (Trades)
                </button>
                <button onClick={() => setActiveTab('hero')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'hero' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Image size={16} /> Hero Slides
                </button>
                <button onClick={() => setActiveTab('website')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'website' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Globe size={16} /> Website Info
                </button>
                <button onClick={() => setActiveTab('messages')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'messages' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Mail size={16} /> Messages ({contactMessages.filter(m => !m.is_read).length})
                </button>
                <button onClick={() => setActiveTab('sms_templates')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'sms_templates' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <MessageSquare size={16} /> SMS Templates
                </button>
                <button onClick={() => setActiveTab('grades')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'grades' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Award size={16} /> Grades
                </button>
                <button onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <BarChart3 size={16} /> News Analytics
                </button>
                <button onClick={() => setActiveTab('parent_messages')}
                    className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'parent_messages' ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <MessageSquare size={16} /> Parent Messages
                </button>
            </div>

            {activeTab === 'analytics' && <NewsAnalyticsPanel token={token} API_URL={API_URL} />}
            {activeTab === 'parent_messages' && <AdminParentMessagesPanel token={token} API_URL={API_URL} />}

            {/* News Management */}
            {activeTab === 'news' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => setShowForm(!showForm)}
                            className="btn-primary flex items-center gap-2">
                            <PlusCircle size={18} /> {showForm ? 'Reka' : 'Shyiraho Amakuru Mashya'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="card border-t-4 border-t-primary-500">
                            <h3 className="font-bold text-lg mb-4">Amakuru Mashya</h3>
                            <form onSubmit={createNews} className="space-y-4">
                                {/* Titles Row */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Umutwe (RW) *</label>
                                        <input required value={form.title_rw} onChange={e => setForm(p => ({ ...p, title_rw: e.target.value }))}
                                            className="input-field" placeholder="Umutwe mu Kinyarwanda" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Title (EN)</label>
                                        <input value={form.title_en} onChange={e => setForm(p => ({ ...p, title_en: e.target.value }))}
                                            className="input-field" placeholder="Title in English" />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Summary (Ikisobanuro)</label>
                                    <input value={form.summary || ''} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
                                        className="input-field" placeholder="Short summary for news cards" />
                                </div>

                                {/* Content Row */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Ubusobanuro (RW) *</label>
                                        <textarea required rows={4} value={form.content_rw} onChange={e => setForm(p => ({ ...p, content_rw: e.target.value }))}
                                            className="input-field resize-none" placeholder="Andika ubutumwa mu Kinyarwanda..." />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Content (EN)</label>
                                        <textarea rows={4} value={form.content_en} onChange={e => setForm(p => ({ ...p, content_en: e.target.value }))}
                                            className="input-field resize-none" placeholder="Write content in English..." />
                                    </div>
                                </div>

                                {/* Category, Location, Video Row */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Category</label>
                                        <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                                            <option value="">Select Category</option>
                                            <option value="News">News</option>
                                            <option value="Event">Event</option>
                                            <option value="Announcement">Announcement</option>
                                            <option value="Achievement">Achievement</option>
                                            <option value="Sports">Sports</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Location</label>
                                        <input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                            className="input-field" placeholder="e.g. Kigali, Rwanda" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-1 block">Video URL</label>
                                        <input value={form.video_url || ''} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                                            className="input-field" placeholder="YouTube embed URL" />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">
                                        <Image size={16} className="inline mr-1" />
                                        Upload Images (Max 10)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={e => setNewsImages(Array.from(e.target.files))}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary-50 file:text-primary-700
                                                hover:file:bg-primary-100
                                            "
                                        />
                                        {newsImages.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {newsImages.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-sm">
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            alt="Preview"
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                        <span className="truncate max-w-[100px]">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewsImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">You can select multiple images at once</p>
                                </div>

                                {/* Options Row */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-bold text-gray-700">Tangaza Vuba?</label>
                                        <select value={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.value }))} className="input-field w-auto">
                                            <option value="true">Yego — Tangaza</option>
                                            <option value="false">Oya — Bika Gusa</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-bold text-gray-700">Featured?</label>
                                        <select value={form.is_featured || 'false'} onChange={e => setForm(p => ({ ...p, is_featured: e.target.value }))} className="input-field w-auto">
                                            <option value="false">No</option>
                                            <option value="true">Yes - Show on Home</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end items-end gap-3">
                                        <button type="button" onClick={() => { setShowForm(false); setNewsImages([]); }} className="btn-secondary">Reka</button>
                                        <button type="submit" className="btn-primary">Shyiraho</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4">Umutwe</th>
                                    <th className="px-6 py-4">Sitati</th>
                                    <th className="px-6 py-4">Itariki</th>
                                    <th className="px-6 py-4">Ibikorwa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="py-10 text-center text-gray-400">Loading...</td></tr>
                                ) : news.length === 0 ? (
                                    <tr><td colSpan={4} className="py-10 text-center text-gray-400">Nta makuru arahari.</td></tr>
                                ) : news.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{a.title_rw}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {a.is_published ? 'Yatangarijwe' : 'Bitswe'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => togglePublish(a)}
                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Toggle publish">
                                                    {a.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button onClick={() => deleteNews(a.id)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Applications Management */}
            {activeTab === 'applications' && (
                <div className="card overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4">Amazina</th>
                                <th className="px-6 py-4">Telefone</th>
                                <th className="px-6 py-4">Ishami / Urwego</th>
                                <th className="px-6 py-4">Sitati</th>
                                <th className="px-6 py-4">Ibikorwa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Nta busabe arahari.</td></tr>
                            ) : applications.map(app => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{app.first_name} {app.last_name}</td>
                                    <td className="px-6 py-4 text-sm">{app.phone}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="font-medium">{app.trade}</span>
                                        <span className="text-gray-400 block text-xs">{app.level}</span>
                                    </td>
                                    <td className="px-6 py-4">{statusBadge(app.status)}</td>
                                    <td className="px-6 py-4">
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => updateAppStatus(app.id, 'approved')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors">
                                                    <CheckCircle size={14} /> Emeza
                                                </button>
                                                <button onClick={() => updateAppStatus(app.id, 'rejected')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                                                    <XCircle size={14} /> Nyura
                                                </button>
                                            </div>
                                        )}
                                        {app.status !== 'pending' && (
                                            <span className="text-xs text-gray-400 italic">Byarangiye</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Trades Management */}
            {activeTab === 'trades' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button onClick={() => { setShowTradeForm(!showTradeForm); setTradeForm({ name: '', description: '', image_url: '' }); }}
                            className="btn-primary flex items-center gap-2">
                            <PlusCircle size={18} /> {showTradeForm ? 'Reka' : 'Ongeramo Ishami'}
                        </button>
                    </div>

                    {showTradeForm && (
                        <div className="card border-t-4 border-t-accent-500">
                            <h3 className="font-bold text-lg mb-4">{tradeForm.id ? 'Vugurura Ishami' : 'Ishami Rishya'}</h3>
                            <form onSubmit={handleTradeSubmit} className="grid md:grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Izina ry'ishami *</label>
                                    <input required value={tradeForm.name} onChange={e => setTradeForm(p => ({ ...p, name: e.target.value }))}
                                        className="input-field" placeholder="Urugero: Software Development" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Ifoto y'ishami (Upload)</label>
                                    <input type="file" accept="image/*" onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            try {
                                                const res = await axios.post(`${API_URL}/api/media/upload`, formData, {
                                                    headers: { ...headers, 'Content-Type': 'multipart/form-data' }
                                                });
                                                setTradeForm(p => ({ ...p, image_url: res.data.url }));
                                                toast.success('Ifoto yapakishije!');
                                            } catch { toast.error('Ikibazo mu pakisha ifoto'); }
                                        }
                                    }}
                                        className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                                    <p className="text-xs text-gray-500 mt-1">Cyangwa andika URL hejuru</p>
                                    <input value={tradeForm.image_url} onChange={e => setTradeForm(p => ({ ...p, image_url: e.target.value }))}
                                        className="input-field mt-2" placeholder="https://... (URL iriho)" />
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        <button type="button" onClick={() => setTradeForm(p => ({ ...p, image_url: '/uploads/trade card image/sod.jpg' }))}
                                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Software</button>
                                        <button type="button" onClick={() => setTradeForm(p => ({ ...p, image_url: '/uploads/trade card image/auto.jpg' }))}
                                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Automobile</button>
                                        <button type="button" onClick={() => setTradeForm(p => ({ ...p, image_url: '/uploads/trade card image/bdc.jpg' }))}
                                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Construction</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-1 block">Ubusobanuro *</label>
                                    <textarea required rows={3} value={tradeForm.description} onChange={e => setTradeForm(p => ({ ...p, description: e.target.value }))}
                                        className="input-field resize-none" placeholder="Sobanura ibyo biziga..." />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setShowTradeForm(false)} className="btn-secondary">Reka</button>
                                    <button type="submit" className="btn-primary">Bika</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trades.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-gray-400">Nta mashami arahari.</div>
                        ) : trades.map((trade) => (
                            <div key={trade.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
                                <div className="h-32 bg-gray-200 relative">
                                    {trade.image_url ? (
                                        <img src={trade.image_url.startsWith('http') ? trade.image_url : `${API_URL}${trade.image_url}`} alt={trade.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-primary-500 to-accent-500" />
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setShowTradeForm(true); setTradeForm(trade); window.scrollTo(0, 0); }}
                                            className="px-2 py-1 bg-white/90 text-primary-600 font-bold text-xs rounded shadow hover:bg-white">Edit</button>
                                        <button onClick={() => deleteTrade(trade.id)}
                                            className="px-2 py-1 bg-red-500 text-white font-bold text-xs rounded shadow hover:bg-red-600">Delete</button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">{trade.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{trade.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Hero Slides Management */}
            {activeTab === 'hero' && (
                <div className="space-y-4">
                    <HeroSlidesManager />
                </div>
            )}

            {/* Website Info Management */}
            {activeTab === 'website' && (
                <div className="space-y-6">
                    {['about', 'contact', 'services'].map(section => {
                        const info = schoolInfo[section] || {};
                        const isEditing = editingSection === section;
                        return (
                            <div key={section} className="card border-t-4 border-t-primary-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                                        <Building size={20} className="text-primary-600" />
                                        {section === 'about' ? 'About Page' : section === 'contact' ? 'Contact Page' : 'Services Page'}
                                    </h3>
                                    {!isEditing ? (
                                        <button onClick={() => { setEditingSection(section); setSectionForm({ ...info }); }}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl font-bold text-sm">
                                            <Edit2 size={16} /> Edit
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingSection(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm">Cancel</button>
                                            <button onClick={() => saveSchoolInfo(section)} disabled={savingSection}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm disabled:opacity-60">
                                                <Save size={16} /> {savingSection ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-500">Title:</span> <span className="font-medium">{info.title || '—'}</span></div>
                                        <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{info.phone || '—'}</span></div>
                                        <div><span className="text-gray-500">Email:</span> <span className="font-medium">{info.email || '—'}</span></div>
                                        <div><span className="text-gray-500">Address:</span> <span className="font-medium">{info.address || '—'}</span></div>
                                        <div className="md:col-span-2"><span className="text-gray-500">Description:</span> <span className="font-medium">{info.description?.slice(0, 120) || '—'}...</span></div>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Title</label>
                                            <input value={sectionForm.title || ''} onChange={e => setSectionForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Subtitle</label>
                                            <input value={sectionForm.subtitle || ''} onChange={e => setSectionForm(p => ({ ...p, subtitle: e.target.value }))} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Phone</label>
                                            <input value={sectionForm.phone || ''} onChange={e => setSectionForm(p => ({ ...p, phone: e.target.value }))} className="input-field" placeholder="+250 780 000 000" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Email</label>
                                            <input value={sectionForm.email || ''} onChange={e => setSectionForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="info@gardentvet.rw" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Address</label>
                                            <input value={sectionForm.address || ''} onChange={e => setSectionForm(p => ({ ...p, address: e.target.value }))} className="input-field" placeholder="Kigali, Rwanda" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Opening Hours</label>
                                            <input value={sectionForm.opening_hours || ''} onChange={e => setSectionForm(p => ({ ...p, opening_hours: e.target.value }))} className="input-field" placeholder="Mon-Fri: 7:00 AM - 5:00 PM" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Description</label>
                                            <textarea rows={3} value={sectionForm.description || ''} onChange={e => setSectionForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">Facebook URL</label>
                                            <input value={sectionForm.facebook_url || ''} onChange={e => setSectionForm(p => ({ ...p, facebook_url: e.target.value }))} className="input-field" placeholder="https://facebook.com/..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 mb-1 block">YouTube URL</label>
                                            <input value={sectionForm.youtube_url || ''} onChange={e => setSectionForm(p => ({ ...p, youtube_url: e.target.value }))} className="input-field" placeholder="https://youtube.com/..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Contact Messages */}
            {activeTab === 'messages' && (
                <div className="card overflow-x-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Contact Messages ({contactMessages.length})</h3>
                        <span className="text-sm text-gray-500">{contactMessages.filter(m => !m.is_read).length} unread</span>
                    </div>
                    {contactMessages.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <Mail size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No messages yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contactMessages.map(msg => (
                                <div key={msg.id} className={`p-4 rounded-xl border ${msg.is_read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-gray-900">{msg.name}</span>
                                                {!msg.is_read && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">New</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                                                <span className="flex items-center gap-1"><Mail size={12} /> {msg.email}</span>
                                                {msg.phone && <span className="flex items-center gap-1"><Phone size={12} /> {msg.phone}</span>}
                                                <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="font-semibold text-gray-700 mb-1">{msg.subject}</p>
                                            <p className="text-gray-600 text-sm">{msg.message}</p>
                                        </div>
                                        {!msg.is_read && (
                                            <button onClick={() => markMessageRead(msg.id)}
                                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg whitespace-nowrap">
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SMS Templates */}
            {activeTab === 'sms_templates' && (
                <div className="card overflow-x-auto">
                    <SMSTemplatesManager />
                </div>
            )}

            {/* Grades */}
            {activeTab === 'grades' && (
                <div className="card overflow-x-auto">
                    <GradesManager />
                </div>
            )}
        </div>
    );
};

// ─── News Analytics Panel ──────────────────────────────────────────────────────
const NewsAnalyticsPanel = ({ token, API_URL }) => {
    const [data, setData] = useState({ totals: {}, articles: [], trend: [] });
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [viewerCache, setViewerCache] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/news/analytics/summary`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data || { totals: {}, articles: [], trend: [] });
            } catch (err) {
                toast.error('Could not load news analytics');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token, API_URL]);

    const toggleExpand = async (id) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (!viewerCache[id]) {
            try {
                const res = await axios.get(`${API_URL}/api/news/analytics/${id}/views`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setViewerCache(prev => ({ ...prev, [id]: res.data }));
            } catch (err) {
                toast.error('Could not load viewers');
            }
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500">Loading analytics…</div>;

    const t = data.totals || {};
    const stat = (label, value, Icon, color) => (
        <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{(value ?? 0).toLocaleString()}</p>
                </div>
                <Icon size={28} className="text-gray-300" />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stat('Total Articles', t.total_news, Newspaper, 'border-blue-500')}
                {stat('Published', t.published_count, CheckCircle, 'border-green-500')}
                {stat('Total Views', t.total_views, Eye, 'border-purple-500')}
                {stat('Total Likes', t.total_likes, ThumbsUp, 'border-pink-500')}
                {stat('Comments', t.total_comments, MessageSquare, 'border-amber-500')}
                {stat('Shares', t.total_shares, TrendingUp, 'border-teal-500')}
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary-600" />
                    <h3 className="font-bold text-gray-900">Per-Article Breakdown</h3>
                    <span className="text-xs text-gray-500 ml-auto">Click a row to see who viewed it</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Title</th>
                                <th className="px-4 py-2 text-left">Category</th>
                                <th className="px-4 py-2 text-center">Views</th>
                                <th className="px-4 py-2 text-center">Unique Users</th>
                                <th className="px-4 py-2 text-center">Guests</th>
                                <th className="px-4 py-2 text-center">Likes</th>
                                <th className="px-4 py-2 text-center">Comments</th>
                                <th className="px-4 py-2 text-center">Shares</th>
                                <th className="px-4 py-2 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.articles.length === 0 ? (
                                <tr><td colSpan="9" className="text-center py-8 text-gray-400">No articles yet</td></tr>
                            ) : data.articles.map(a => (
                                <React.Fragment key={a.id}>
                                    <tr onClick={() => toggleExpand(a.id)} className="hover:bg-primary-50 cursor-pointer">
                                        <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate">
                                            {a.title_en || a.title_rw || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 capitalize">{a.category || '—'}</td>
                                        <td className="px-4 py-2 text-center font-bold text-purple-600">{a.views_count || 0}</td>
                                        <td className="px-4 py-2 text-center text-blue-600">{a.unique_user_views || 0}</td>
                                        <td className="px-4 py-2 text-center text-gray-500">{a.unique_guest_views || 0}</td>
                                        <td className="px-4 py-2 text-center text-pink-600">{a.likes_count || 0}</td>
                                        <td className="px-4 py-2 text-center text-amber-600">{a.comments_count || 0}</td>
                                        <td className="px-4 py-2 text-center text-teal-600">{a.shares_count || 0}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {a.is_published ? 'Live' : 'Draft'}
                                            </span>
                                        </td>
                                    </tr>
                                    {expandedId === a.id && (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-4 bg-gray-50">
                                                <ViewerList data={viewerCache[a.id]} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {data.trend && data.trend.length > 0 && (
                <div className="bg-white rounded-xl shadow p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={18} className="text-primary-600" />
                        <h3 className="font-bold text-gray-900">Last 30 Days Engagement</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-7 lg:grid-cols-10 gap-2">
                        {data.trend.map(d => (
                            <div key={d.day} className="text-center bg-gray-50 rounded p-2">
                                <p className="text-xs text-gray-500">{new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                <p className="text-lg font-bold text-purple-600">{d.views || 0}</p>
                                <p className="text-xs text-gray-400">{d.likes || 0}♥ {d.shares || 0}↗</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ViewerList = ({ data }) => {
    if (!data) return <div className="text-sm text-gray-400">Loading viewers…</div>;
    const counts = (data.counts || []).reduce((acc, c) => { acc[c.engagement_type] = c.count; return acc; }, {});
    const viewers = data.viewers || [];
    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-3 text-xs">
                {Object.entries(counts).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 bg-white rounded border font-semibold text-gray-700 capitalize">{k}: {v}</span>
                ))}
            </div>
            {viewers.length === 0 ? (
                <p className="text-sm text-gray-400">No engagement events recorded yet.</p>
            ) : (
                <div className="max-h-72 overflow-y-auto bg-white rounded border">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 text-left">When</th>
                                <th className="px-3 py-2 text-left">Type</th>
                                <th className="px-3 py-2 text-left">Who</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Platform</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {viewers.map(v => (
                                <tr key={v.id}>
                                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{new Date(v.created_at).toLocaleString()}</td>
                                    <td className="px-3 py-1.5 capitalize font-semibold">{v.engagement_type}</td>
                                    <td className="px-3 py-1.5">
                                        {v.first_name ? `${v.first_name} ${v.last_name || ''}`.trim() : <span className="text-gray-400">Guest ({(v.guest_session_id || '').slice(0, 8)}…)</span>}
                                    </td>
                                    <td className="px-3 py-1.5 text-gray-500">{v.role || '—'}</td>
                                    <td className="px-3 py-1.5 text-gray-500">{v.platform || 'web'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── Admin Parent Messages Panel ──────────────────────────────────────────────
const AdminParentMessagesPanel = ({ token, API_URL }) => {
    const [threads, setThreads] = useState([]);
    const [active, setActive] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [sendSms, setSendSms] = useState(true);
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState('all');
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);

    const loadThreads = async () => {
        try {
            const params = filter === 'all' ? '' : `?status=${filter}`;
            const [tRes, cRes] = await Promise.all([
                axios.get(`${API_URL}/api/parent-messages/admin/threads${params}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/parent-messages/admin/counts`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setThreads(tRes.data || []);
            setCounts(cRes.data || {});
        } catch (err) {
            toast.error('Could not load messages');
        } finally {
            setLoading(false);
        }
    };

    const openThread = async (t) => {
        setActive(t);
        try {
            const res = await axios.get(`${API_URL}/api/parent-messages/threads/${t.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages || []);
            loadThreads();
        } catch (err) {
            toast.error('Could not open thread');
        }
    };

    const handleReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            const res = await axios.post(`${API_URL}/api/parent-messages/threads/${active.id}/reply`,
                { body: reply.trim(), send_sms: sendSms },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.sms_sent ? 'Reply sent + SMS delivered' : 'Reply sent');
            setReply('');
            openThread(active);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally {
            setSending(false);
        }
    };

    const closeThread = async () => {
        if (!window.confirm('Close this conversation?')) return;
        try {
            await axios.put(`${API_URL}/api/parent-messages/threads/${active.id}/close`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Thread closed');
            setActive(null);
            loadThreads();
        } catch (err) {
            toast.error('Failed to close');
        }
    };

    useEffect(() => { loadThreads(); /* eslint-disable-next-line */ }, [filter]);

    if (loading) return <div className="text-center py-12 text-gray-500">Loading messages…</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Thread list */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow overflow-hidden">
                <div className="p-3 border-b bg-gray-50">
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                        <div className="bg-blue-50 rounded p-2">
                            <p className="text-lg font-bold text-blue-700">{counts.open_threads || 0}</p>
                            <p className="text-blue-600">Open</p>
                        </div>
                        <div className="bg-red-50 rounded p-2">
                            <p className="text-lg font-bold text-red-700">{counts.unread_threads || 0}</p>
                            <p className="text-red-600">Unread</p>
                        </div>
                        <div className="bg-gray-100 rounded p-2">
                            <p className="text-lg font-bold text-gray-700">{counts.total_threads || 0}</p>
                            <p className="text-gray-600">Total</p>
                        </div>
                    </div>
                    <div className="flex gap-1 text-xs">
                        {['all', 'open', 'closed'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`flex-1 py-1.5 rounded font-bold capitalize ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto divide-y">
                    {threads.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">No messages yet</p>
                    ) : threads.map(t => (
                        <button key={t.id} onClick={() => openThread(t)}
                            className={`w-full text-left p-3 hover:bg-primary-50 ${active?.id === t.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="font-bold text-gray-900 text-sm truncate">{t.subject}</p>
                                        {t.unread_by_staff > 0 && (
                                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                {t.unread_by_staff}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {t.parent_first} {t.parent_last}
                                        {t.student_first && ` → ${t.student_first}`}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mt-1">
                                        {t.last_sender_role === 'parent' ? '← ' : '→ '}{t.last_body}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(t.last_message_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {t.status}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Thread detail */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-hidden">
                {!active ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <MessageSquare size={48} className="mb-3 text-gray-200" />
                        <p>Select a conversation to view</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b bg-gradient-to-r from-primary-50 to-blue-50 flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h3 className="font-black text-gray-900">{active.subject}</h3>
                                <p className="text-xs text-gray-600">
                                    {active.parent_first} {active.parent_last} • {active.parent_phone}
                                    {active.student_first && ` • Student: ${active.student_first} ${active.student_last} (${active.reg_number})`}
                                </p>
                            </div>
                            {active.status === 'open' && (
                                <button onClick={closeThread} className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold">
                                    Close Thread
                                </button>
                            )}
                        </div>
                        <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto bg-gray-50">
                            {messages.map(m => {
                                const fromStaff = m.sender_role === 'staff';
                                return (
                                    <div key={m.id} className={`flex ${fromStaff ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${fromStaff ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border rounded-bl-sm'}`}>
                                            <p className={`text-[11px] font-bold mb-1 ${fromStaff ? 'text-primary-100' : 'text-gray-500'}`}>
                                                {fromStaff ? `${m.sender_first || 'Staff'} ${m.sender_last || ''}` : 'Parent'}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                                            <p className={`text-[10px] mt-1 ${fromStaff ? 'text-primary-100' : 'text-gray-400'}`}>
                                                {new Date(m.created_at).toLocaleString()}
                                                {m.sms_sent ? ' • SMS sent' : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {active.status === 'open' && (
                            <div className="p-3 border-t bg-white">
                                <textarea value={reply} onChange={e => setReply(e.target.value)}
                                    rows={3} placeholder="Type your reply..."
                                    className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 mb-2" />
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                        <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} />
                                        Also send SMS to parent ({active.parent_phone})
                                    </label>
                                    <button onClick={handleReply} disabled={sending || !reply.trim()}
                                        className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-lg font-bold flex items-center gap-2">
                                        <Send size={16} /> {sending ? 'Sending...' : 'Reply'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminCMS;

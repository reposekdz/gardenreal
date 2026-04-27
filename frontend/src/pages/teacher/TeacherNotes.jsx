import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { extractPdfCover } from '../../utils/pdfCover';
import {
    Upload, FileText, Trash2, Loader2, BookOpen, Plus, Calendar,
    Eye, Download, Sparkles
} from 'lucide-react';

const TeacherNotes = () => {
    const { user, token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const headers = { Authorization: `Bearer ${token}` };

    const [trades, setTrades] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ trade_code: '', level: '', title: '', description: '' });
    const [file, setFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverAuto, setCoverAuto] = useState(false);
    const [extractingCover, setExtractingCover] = useState(false);

    const selectedTrade = trades.find(t => t.code === form.trade_code);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [tRes, nRes] = await Promise.all([
                axios.get(`${API_URL}/api/course-notes/trades`),
                axios.get(`${API_URL}/api/course-notes`)
            ]);
            setTrades(tRes.data);
            setNotes(nRes.data);
        } catch { toast.error('Failed to load notes'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchAll(); }, []);

    const resetForm = () => {
        setForm({ trade_code: '', level: '', title: '', description: '' });
        setFile(null); setCoverFile(null);
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null); setCoverAuto(false);
    };

    const handlePickPdf = async (e) => {
        const f = e.target.files?.[0] || null;
        setFile(f); if (!f) return;
        if (!coverFile || coverAuto) {
            try {
                setExtractingCover(true);
                const blob = await extractPdfCover(f, { maxWidth: 800, quality: 0.8 });
                const autoFile = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
                if (coverPreview) URL.revokeObjectURL(coverPreview);
                setCoverFile(autoFile); setCoverPreview(URL.createObjectURL(blob)); setCoverAuto(true);
            } catch (err) { console.warn(err); }
            finally { setExtractingCover(false); }
        }
    };

    const handlePickCover = (e) => {
        const f = e.target.files?.[0] || null; if (!f) return;
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); setCoverAuto(false);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Hitamo PDF file');
        if (!form.trade_code || !form.level || !form.title.trim()) return toast.error('Uzuza amakuru yose');
        setSubmitting(true);
        const fd = new FormData();
        fd.append('trade_code', form.trade_code);
        fd.append('level', form.level);
        fd.append('title', form.title.trim());
        fd.append('description', form.description || '');
        fd.append('file', file);
        if (coverFile) fd.append('cover', coverFile);
        try {
            await axios.post(`${API_URL}/api/course-notes`, fd, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Note yashyizweho!');
            resetForm(); setShowForm(false); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Siba "${title}"?`)) return;
        try {
            await axios.delete(`${API_URL}/api/course-notes/${id}`, { headers });
            toast.success('Note yasibwe'); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    const myNotes = notes.filter(n => user.role === 'admin' || n.uploaded_by_name === user.username);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Inyandiko z'amasomo</h1>
                    <p className="text-gray-500 text-sm">Shyiraho PDF zawe, ushyireho cover image, kandi reba uko zikoreshwa.</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="px-5 py-3 bg-primary-700 hover:bg-primary-800 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg">
                    <Plus size={18} /> Shyiramo Note
                </button>
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <FileText size={20} className="text-primary-600" />
                        {user.role === 'admin' ? 'Inyandiko zose' : 'Inyandiko zanjye'}
                    </h2>
                    <span className="text-xs font-bold text-gray-500">{myNotes.length} total</span>
                </div>
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
                ) : myNotes.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="font-bold">Nta nyandiko ziraboneka</p>
                        <p className="text-sm">Kanda «Shyiramo Note» utangire.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-4 py-3 text-left">Cover</th>
                                    <th className="px-4 py-3 text-left">Title</th>
                                    <th className="px-4 py-3 text-left">Trade</th>
                                    <th className="px-4 py-3 text-left">Level</th>
                                    <th className="px-4 py-3 text-left">Stats</th>
                                    <th className="px-4 py-3 text-left">Uploaded</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {myNotes.map(n => (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            {n.cover_image ? (
                                                <img src={`${API_URL}/api/course-notes/${n.id}/cover`} alt=""
                                                    className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <FileText size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-gray-900">{n.title}</p>
                                            {n.description && <p className="text-xs text-gray-500 truncate max-w-xs">{n.description}</p>}
                                        </td>
                                        <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase">{n.trade_code}</span></td>
                                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{n.level}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 mr-2"><Eye size={12} /> {n.view_count || 0}</span>
                                            <span className="inline-flex items-center gap-1"><Download size={12} /> {n.download_count || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1"><Calendar size={12} />{new Date(n.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`${API_URL}/api/course-notes/${n.id}/view`} target="_blank" rel="noreferrer"
                                                    className="p-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100" title="View">
                                                    <BookOpen size={15} />
                                                </a>
                                                <button onClick={() => handleDelete(n.id, n.title)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-white text-lg">Shyiramo inyandiko (PDF)</h3>
                                <p className="text-primary-200 text-sm">Hitamo umwuga, urwego, n'inyandiko</p>
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Umwuga *</label>
                                    <select required value={form.trade_code}
                                        onChange={e => setForm(p => ({ ...p, trade_code: e.target.value, level: '' }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none">
                                        <option value="">-- Hitamo --</option>
                                        {trades.map(t => <option key={t.code} value={t.code}>{t.name_rw}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Urwego (Level) *</label>
                                    <select required value={form.level}
                                        onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                                        disabled={!selectedTrade}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none disabled:bg-gray-100">
                                        <option value="">-- Hitamo --</option>
                                        {selectedTrade?.levels.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Izina ry'isomo *</label>
                                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" maxLength={200} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Ubusobanuro (optional)</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" rows={2} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">PDF File * (max 25 MB)</label>
                                <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50">
                                    <Upload size={20} className="text-primary-600" />
                                    <span className="text-sm font-semibold text-gray-700">{file ? file.name : 'Hitamo PDF file'}</span>
                                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={handlePickPdf} />
                                </label>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-gray-700">Cover image</label>
                                    {coverAuto && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><Sparkles size={10} /> AUTO</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {extractingCover ? (
                                        <div className="w-32 h-24 rounded-xl bg-gray-100 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={20} /></div>
                                    ) : coverPreview ? (
                                        <img src={coverPreview} alt="" className="w-32 h-24 object-cover rounded-xl border border-gray-200" />
                                    ) : null}
                                    <label className="px-4 py-2 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-500 text-sm font-semibold">
                                        Hitamo image
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePickCover} />
                                    </label>
                                </div>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white font-black rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                Shyiramo
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherNotes;

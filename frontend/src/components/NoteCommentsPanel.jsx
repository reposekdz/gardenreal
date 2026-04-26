import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    MessageSquare, Heart, Send, Loader2, Reply, Trash2, Bookmark,
    ThumbsUp, HelpCircle, Sparkles, Star
} from 'lucide-react';

const visitorId = (() => {
    if (typeof window === 'undefined') return '';
    try {
        let v = localStorage.getItem('gtvet_visitor_id');
        if (!v) {
            v = 'v' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
            localStorage.setItem('gtvet_visitor_id', v);
        }
        return v;
    } catch { return ''; }
})();
const headers = (token) => ({
    'X-Visitor-Id': visitorId,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const REACTIONS = [
    { key: 'like', icon: ThumbsUp, label: 'Birakwiye', color: 'emerald' },
    { key: 'love', icon: Heart, label: 'Nakunze', color: 'rose' },
    { key: 'helpful', icon: Star, label: 'Bimfasha', color: 'amber' },
    { key: 'question', icon: HelpCircle, label: 'Mfite ikibazo', color: 'blue' }
];

const NoteCommentsPanel = ({ noteId, apiUrl = '', token = null, currentUser = null, defaultName = '' }) => {
    const [comments, setComments] = useState([]);
    const [stats, setStats] = useState({ bookmark_count: 0, is_bookmarked: false, comment_count: 0, reactions: {}, my_reactions: [] });
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [name, setName] = useState(currentUser?.name || defaultName || '');
    const [replyTo, setReplyTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            const [cRes, sRes] = await Promise.all([
                axios.get(`${apiUrl}/api/learning/notes/${noteId}/comments`, { headers: headers(token) }),
                axios.get(`${apiUrl}/api/learning/notes/${noteId}/stats`, { headers: headers(token) })
            ]);
            setComments(cRes.data || []);
            setStats(sRes.data || stats);
        } catch (e) { /* silent */ } finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUrl, noteId, token]);

    useEffect(() => { if (noteId) load(); }, [noteId, load]);

    const submit = async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        if (!token && !name.trim()) {
            toast.error('Andika izina ryawe');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${apiUrl}/api/learning/notes/${noteId}/comments`, {
                body: body.trim(),
                commenter_name: name.trim(),
                parent_comment_id: replyTo
            }, { headers: headers(token) });
            setBody('');
            setReplyTo(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Ntibyagenze');
        } finally {
            setSubmitting(false);
        }
    };

    const like = async (cid) => {
        try {
            const res = await axios.post(`${apiUrl}/api/learning/comments/${cid}/like`, {}, { headers: headers(token) });
            setComments(c => c.map(x => x.id === cid ? { ...x, likes: res.data.likes, has_liked: res.data.liked ? 1 : 0 } : x));
        } catch {}
    };

    const remove = async (cid) => {
        if (!window.confirm('Siba?')) return;
        try {
            await axios.delete(`${apiUrl}/api/learning/comments/${cid}`, { headers: headers(token) });
            load();
        } catch (e) { toast.error('Ntibyemewe'); }
    };

    const bookmark = async () => {
        try {
            const res = await axios.post(`${apiUrl}/api/learning/notes/${noteId}/bookmark`, {
                owner_name: name || null
            }, { headers: headers(token) });
            toast.success(res.data.bookmarked ? 'Yarabitswe' : 'Yakuwemo');
            load();
        } catch (e) { toast.error('Ntibyagenze'); }
    };

    const react = async (reaction) => {
        try {
            await axios.post(`${apiUrl}/api/learning/notes/${noteId}/react`, {
                reaction, user_name: name || null
            }, { headers: headers(token) });
            load();
        } catch {}
    };

    const isStaff = currentUser?.role && ['teacher', 'admin', 'dod', 'hod'].includes(currentUser.role);

    // Build threaded structure
    const topLevel = comments.filter(c => !c.parent_comment_id);
    const repliesOf = (id) => comments.filter(c => c.parent_comment_id === id);

    const roleBadge = (role) => {
        if (role === 'teacher') return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-300">MWARIMU</span>;
        if (role === 'admin') return <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black border border-rose-300">ADMIN</span>;
        return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-300">UMUNYESHURI</span>;
    };

    const CommentNode = ({ c, depth = 0 }) => (
        <div className={`${depth > 0 ? 'ml-8 sm:ml-12 mt-3 border-l-2 border-emerald-100 pl-3' : 'mb-3'}`}>
            <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    c.commenter_role === 'teacher' ? 'bg-amber-100 text-amber-700' :
                    c.commenter_role === 'admin' ? 'bg-rose-100 text-rose-700' :
                    'bg-emerald-100 text-emerald-700'
                }`}>
                    {c.commenter_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-2xl px-3 py-2 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-xs font-black text-gray-900">{c.commenter_name}</p>
                            {roleBadge(c.commenter_role)}
                            <span className="text-[10px] text-gray-400">
                                {new Date(c.created_at).toLocaleString('fr-RW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{c.body}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 ml-1">
                        <button onClick={() => like(c.id)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                                c.has_liked ? 'text-rose-600' : 'text-gray-500 hover:text-rose-600'
                            }`}>
                            <Heart size={11} fill={c.has_liked ? 'currentColor' : 'none'} /> {c.likes || 0}
                        </button>
                        {depth === 0 && (
                            <button onClick={() => { setReplyTo(c.id); setBody(`@${c.commenter_name} `); }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-500 hover:text-emerald-600">
                                <Reply size={11} /> Subiza
                            </button>
                        )}
                        {(isStaff || (currentUser?.id && c.commenter_user_id === currentUser.id)) && (
                            <button onClick={() => remove(c.id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-400 hover:text-red-600">
                                <Trash2 size={11} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {repliesOf(c.id).map(r => <CommentNode key={r.id} c={r} depth={depth + 1} />)}
        </div>
    );

    return (
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-5">
            {/* Reactions strip */}
            <div className="flex items-center gap-2 flex-wrap mb-4 pb-4 border-b border-gray-200">
                {REACTIONS.map(r => {
                    const Icon = r.icon;
                    const active = stats.my_reactions?.includes(r.key);
                    const count = stats.reactions?.[r.key] || 0;
                    return (
                        <button key={r.key} onClick={() => react(r.key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                active
                                    ? `bg-${r.color}-500 text-white border-${r.color}-500`
                                    : `bg-white text-gray-700 border-gray-200 hover:border-${r.color}-300 hover:text-${r.color}-700`
                            }`}>
                            <Icon size={13} fill={active ? 'currentColor' : 'none'} />
                            <span>{r.label}</span>
                            {count > 0 && <span className={`text-[10px] ${active ? 'text-white/80' : 'text-gray-400'}`}>· {count}</span>}
                        </button>
                    );
                })}
                <button onClick={bookmark}
                    className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        stats.is_bookmarked ? 'bg-primary-700 text-white border-primary-700' : 'bg-white border-gray-200 hover:border-primary-300'
                    }`}>
                    <Bookmark size={13} fill={stats.is_bookmarked ? 'currentColor' : 'none'} />
                    {stats.is_bookmarked ? 'Yarabitswe' : 'Bika'}
                    {stats.bookmark_count > 0 && <span className="text-[10px] opacity-80">· {stats.bookmark_count}</span>}
                </button>
            </div>

            <h4 className="font-black text-gray-900 flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-primary-700" />
                Ibitekerezo {stats.comment_count > 0 && <span className="text-xs font-bold text-gray-500">· {stats.comment_count}</span>}
            </h4>

            {/* Comment list */}
            {loading ? (
                <div className="text-center py-6 text-gray-400">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                </div>
            ) : topLevel.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200 mb-3">
                    <Sparkles size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-700 text-sm">Nta gitekerezo gihari</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tangiza ikiganiro kuri iyi nyandiko</p>
                </div>
            ) : (
                <div className="space-y-1 mb-4">
                    {topLevel.map(c => <CommentNode key={c.id} c={c} depth={0} />)}
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} className="bg-white rounded-2xl p-3 border border-gray-100 space-y-2">
                {replyTo && (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <span className="text-emerald-700 font-bold">Subiza...</span>
                        <button type="button" onClick={() => { setReplyTo(null); setBody(''); }} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
                    </div>
                )}
                {!token && (
                    <input value={name} onChange={e => setName(e.target.value)} maxLength={150}
                        placeholder="Izina ryawe..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none" />
                )}
                <div className="flex gap-2">
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} maxLength={4000}
                        placeholder="Andika igitekerezo cyawe..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none" />
                    <button type="submit" disabled={submitting || !body.trim()}
                        className="px-4 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white rounded-xl font-bold">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NoteCommentsPanel;

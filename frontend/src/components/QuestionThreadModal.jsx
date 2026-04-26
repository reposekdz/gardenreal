import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    X, Send, Loader2, ThumbsUp, CheckCircle2, MessageCircleQuestion,
    User, GraduationCap, Eye, Trash2, Award, Sparkles
} from 'lucide-react';

// Get/persist a stable visitor ID for vote/like tracking
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

const QuestionThreadModal = ({ open, onClose, question, apiUrl = '', token = null, currentUser = null }) => {
    const [data, setData] = useState({ question: null, replies: [], view_count: 0 });
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [name, setName] = useState(currentUser?.name || '');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!question?.id) return;
        try {
            const res = await axios.get(`${apiUrl}/api/learning/questions/${question.id}/replies`, {
                headers: headers(token)
            });
            setData(res.data);
        } catch (e) {
            toast.error('Ntibyashobotse gufata ibisubizo');
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token, question?.id]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            load();
        }
    }, [open, load]);

    // Auto-refresh every 20s while open
    useEffect(() => {
        if (!open) return;
        const t = setInterval(load, 20000);
        return () => clearInterval(t);
    }, [open, load]);

    const submit = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        if (!token && !name.trim()) {
            toast.error('Andika izina ryawe');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${apiUrl}/api/learning/questions/${question.id}/replies`, {
                body: reply.trim(),
                replier_name: name.trim()
            }, { headers: headers(token) });
            setReply('');
            toast.success('Igisubizo cyawe cyoherejwe!');
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ntibyagenze');
        } finally {
            setSubmitting(false);
        }
    };

    const upvote = async (rid) => {
        try {
            const res = await axios.post(`${apiUrl}/api/learning/replies/${rid}/upvote`, {}, {
                headers: headers(token)
            });
            setData(d => ({
                ...d,
                replies: d.replies.map(r => r.id === rid ? { ...r, upvotes: res.data.upvotes, has_voted: res.data.voted ? 1 : 0 } : r)
            }));
        } catch (e) { /* silent */ }
    };

    const accept = async (rid) => {
        try {
            await axios.post(`${apiUrl}/api/learning/replies/${rid}/accept`, {}, {
                headers: headers(token)
            });
            toast.success('Cyemejwe nk\'igisubizo nyacyo');
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Ntibyagenze');
        }
    };

    const remove = async (rid) => {
        if (!window.confirm('Siba iki gisubizo?')) return;
        try {
            await axios.delete(`${apiUrl}/api/learning/replies/${rid}`, {
                headers: headers(token)
            });
            toast.success('Cyasibwe');
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Ntibyemewe');
        }
    };

    if (!open) return null;

    const isStaff = currentUser?.role && ['teacher', 'admin', 'dod', 'hod'].includes(currentUser.role);
    const q = data.question || question;

    const roleBadge = (role) => {
        const map = {
            teacher: { label: 'MWARIMU', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
            admin: { label: 'UBUYOBOZI', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
            dod: { label: 'DOD', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
            hod: { label: 'HOD', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
            student: { label: 'UMUNYESHURI', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
            staff: { label: 'STAFF', cls: 'bg-blue-100 text-blue-800 border-blue-300' }
        };
        const b = map[role] || map.student;
        return <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${b.cls}`}>{b.label}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-5 py-4 flex items-start justify-between flex-shrink-0">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MessageCircleQuestion className="text-accent-400" size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-primary-200 font-bold">
                                {q?.trade_name || q?.trade_code} · {q?.level}
                            </p>
                            <h3 className="font-black text-white text-base sm:text-lg leading-tight">Ikibazo cy'umunyeshuri</h3>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-primary-100">
                                <span className="flex items-center gap-1"><Eye size={11} /> {data.view_count} bareba</span>
                                <span className="flex items-center gap-1"><MessageCircleQuestion size={11} /> {data.replies.length} ibisubizo</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mt-1 -mr-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Question + replies */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                    {/* Original question */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0">
                                {q?.student_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-black text-gray-900 text-sm">{q?.student_name}</p>
                                    {roleBadge('student')}
                                    <span className="text-[10px] text-gray-400">
                                        {q?.created_at && new Date(q.created_at).toLocaleString('fr-RW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-line leading-relaxed">{q?.question}</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            Birapakirwa...
                        </div>
                    ) : data.replies.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                            <Sparkles size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="font-bold text-gray-700">Nta gisubizo girahari</p>
                            <p className="text-xs text-gray-500 mt-1">Ba uwa mbere wa subiza iki kibazo!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">
                                {data.replies.length} {data.replies.length === 1 ? 'igisubizo' : 'ibisubizo'}
                            </p>
                            {data.replies.map(r => {
                                const isStaffReply = ['teacher', 'admin', 'dod', 'hod'].includes(r.replier_role);
                                return (
                                    <div key={r.id}
                                        className={`rounded-2xl p-4 border shadow-sm ${
                                            r.is_accepted ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' :
                                            isStaffReply ? 'bg-white border-amber-200' :
                                            'bg-white border-gray-100'
                                        }`}>
                                        {r.is_accepted && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 uppercase mb-2">
                                                <Award size={12} /> Igisubizo cyemejwe
                                            </div>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                                                isStaffReply ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {r.replier_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-gray-900 text-sm">{r.replier_name}</p>
                                                    {roleBadge(r.replier_role)}
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(r.created_at).toLocaleString('fr-RW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800 mt-1.5 whitespace-pre-line leading-relaxed">{r.body}</p>
                                                <div className="flex items-center gap-2 mt-2.5">
                                                    <button onClick={() => upvote(r.id)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                            r.has_voted
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700'
                                                        }`}>
                                                        <ThumbsUp size={11} /> {r.upvotes || 0}
                                                    </button>
                                                    {isStaff && !r.is_accepted && (
                                                        <button onClick={() => accept(r.id)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-800 transition-colors">
                                                            <CheckCircle2 size={11} /> Emeza
                                                        </button>
                                                    )}
                                                    {(isStaff || (currentUser?.id && r.replier_user_id === currentUser.id)) && (
                                                        <button onClick={() => remove(r.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50">
                                                            <Trash2 size={11} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Reply form */}
                <form onSubmit={submit} className="border-t border-gray-100 p-4 bg-white space-y-2 flex-shrink-0">
                    {!token && (
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={150}
                            placeholder="Izina ryawe..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />
                    )}
                    <div className="flex gap-2">
                        <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            rows={2}
                            maxLength={4000}
                            placeholder={isStaff ? 'Andika igisubizo nk\'umwarimu...' : 'Tanga ibyo uzi cyangwa baza ibindi...'}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e); }}
                        />
                        <button type="submit" disabled={submitting || !reply.trim()}
                            className="px-4 bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400">
                        Ctrl+Enter kohereza · Ibisubizo birabonwa n'abandi banyeshuri kandi mwarimu ashobora kwemeza igisubizo nyacyo
                    </p>
                </form>
            </div>
        </div>
    );
};

export default QuestionThreadModal;

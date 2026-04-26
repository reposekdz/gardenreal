import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    MessageCircleQuestion, Send, CheckCircle2, Loader2, Trash2, Clock, Search,
    Filter, RefreshCcw, User, Phone, GraduationCap, Inbox, X, Sparkles
} from 'lucide-react';

const StatusPill = ({ status }) => {
    const config = {
        pending: { label: 'Itegereje', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        answered: { label: 'Yarasubije', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        closed: { label: 'Yafunzwe', cls: 'bg-gray-100 text-gray-600 border-gray-200' }
    }[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${config.cls}`}>
            {config.label}
        </span>
    );
};

const StudentQuestionsPanel = ({ apiUrl = '', token, onCountChange, trades = [] }) => {
    const headers = { Authorization: `Bearer ${token}` };

    const [items, setItems] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, answered: 0, closed: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [filterTrade, setFilterTrade] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [search, setSearch] = useState('');

    const [answering, setAnswering] = useState(null); // question id being answered
    const [answerText, setAnswerText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedTrade = trades.find(t => t.code === filterTrade);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterTrade) params.trade_code = filterTrade;
            if (filterLevel) params.level = filterLevel;
            if (search.trim()) params.q = search.trim();
            const res = await axios.get(`${apiUrl}/api/student-questions`, { headers, params });
            setItems(res.data.items || []);
            setCounts(res.data.counts || { pending: 0, answered: 0, closed: 0, total: 0 });
            onCountChange && onCountChange(Number(res.data.counts?.pending || 0));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Kureba ibibazo byanze');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUrl, token, filterStatus, filterTrade, filterLevel, search]);

    useEffect(() => { fetch(); }, [fetch]);

    const startAnswer = (q) => {
        setAnswering(q.id);
        setAnswerText(q.answer || '');
    };
    const cancelAnswer = () => {
        setAnswering(null);
        setAnswerText('');
    };

    const submitAnswer = async (q) => {
        if (!answerText.trim() || answerText.trim().length < 2) {
            return toast.error('Igisubizo ni gito cyane');
        }
        setSubmitting(true);
        try {
            await axios.patch(`${apiUrl}/api/student-questions/${q.id}/answer`,
                { answer: answerText.trim() }, { headers });
            toast.success('Igisubizo cyoherejwe!');
            cancelAnswer();
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Byaranze');
        } finally {
            setSubmitting(false);
        }
    };

    const setStatus = async (q, status) => {
        try {
            await axios.patch(`${apiUrl}/api/student-questions/${q.id}/status`, { status }, { headers });
            toast.success('Byahinduwe');
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Byaranze');
        }
    };

    const remove = async (q) => {
        if (!window.confirm(`Siba ikibazo cya "${q.student_name}"?`)) return;
        try {
            await axios.delete(`${apiUrl}/api/student-questions/${q.id}`, { headers });
            toast.success('Byasibwe');
            fetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Byaranze');
        }
    };

    return (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header + filters */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="font-black text-lg text-gray-900 flex items-center gap-2">
                        <MessageCircleQuestion size={20} className="text-primary-600" />
                        Ibibazo by'Abanyeshuri
                    </h2>
                    <button onClick={fetch} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600" title="Refresh">
                        <RefreshCcw size={14} />
                    </button>
                </div>

                {/* Status pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                        { v: 'pending', l: `Itegereje (${counts.pending || 0})`, c: 'amber' },
                        { v: 'answered', l: `Yarasubije (${counts.answered || 0})`, c: 'emerald' },
                        { v: 'closed', l: `Yafunzwe (${counts.closed || 0})`, c: 'gray' },
                        { v: 'all', l: `Byose (${counts.total || 0})`, c: 'primary' },
                    ].map(p => (
                        <button key={p.v} onClick={() => setFilterStatus(p.v)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors ${filterStatus === p.v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                            {p.l}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="relative sm:col-span-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Shakisha izina cyangwa ikibazo..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                    </div>
                    <select value={filterTrade} onChange={e => { setFilterTrade(e.target.value); setFilterLevel(''); }}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20">
                        <option value="">Imyuga yose</option>
                        {trades.map(t => <option key={t.code} value={t.code}>{t.name_rw || t.name}</option>)}
                    </select>
                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                        disabled={!selectedTrade}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-gray-400">
                        <option value="">Inzego zose</option>
                        {selectedTrade?.levels?.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
            ) : items.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                    <Inbox size={44} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold">Nta bibazo bihari</p>
                    <p className="text-sm">Abanyeshuri bashobora kubaza ibibazo binyuze ku rupapuro rwa Kwiga.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {items.map(q => (
                        <div key={q.id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-black flex-shrink-0">
                                    {q.student_name?.[0]?.toUpperCase() || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900">{q.student_name}</span>
                                        <StatusPill status={q.status} />
                                        <span className="text-[10px] text-gray-500 font-mono ml-auto inline-flex items-center gap-1">
                                            <Clock size={10} /> {new Date(q.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-semibold mb-2">
                                        <span className="inline-flex items-center gap-1">
                                            <GraduationCap size={12} className="text-primary-600" />
                                            {q.trade_name || q.trade_code} &middot; {q.level}
                                        </span>
                                        {q.contact && (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone size={12} className="text-emerald-600" />
                                                {q.contact}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-line bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        {q.question}
                                    </p>

                                    {/* Existing answer */}
                                    {q.answer && answering !== q.id && (
                                        <div className="mt-3 pl-4 border-l-4 border-emerald-400 bg-emerald-50/40 rounded-r-xl p-3">
                                            <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                                                <Sparkles size={10} /> Igisubizo cya {q.answered_by_name || 'mwarimu'}
                                                {q.answered_at && <span className="text-emerald-500/70 font-mono ml-2">{new Date(q.answered_at).toLocaleString()}</span>}
                                            </p>
                                            <p className="text-sm text-gray-800 whitespace-pre-line mt-1">{q.answer}</p>
                                        </div>
                                    )}

                                    {/* Answer composer */}
                                    {answering === q.id && (
                                        <div className="mt-3 bg-primary-50/50 rounded-xl p-3 border border-primary-100">
                                            <textarea value={answerText} onChange={e => setAnswerText(e.target.value)}
                                                rows={4} maxLength={4000}
                                                placeholder="Andika igisubizo gisobanutse hano..."
                                                className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none bg-white" />
                                            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                                                <span className="text-[10px] text-gray-500 font-mono">{answerText.length}/4000</span>
                                                <div className="flex gap-2">
                                                    <button onClick={cancelAnswer}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white">
                                                        Hagarika
                                                    </button>
                                                    <button onClick={() => submitAnswer(q)} disabled={submitting}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-black bg-primary-700 hover:bg-primary-800 text-white inline-flex items-center gap-1.5 disabled:opacity-60">
                                                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                                        Ohereza Igisubizo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {answering !== q.id && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button onClick={() => startAnswer(q)}
                                                className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold inline-flex items-center gap-1.5">
                                                <Send size={12} /> {q.answer ? 'Hindura igisubizo' : 'Subiza'}
                                            </button>
                                            {q.status !== 'closed' && (
                                                <button onClick={() => setStatus(q, 'closed')}
                                                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold inline-flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Funga
                                                </button>
                                            )}
                                            {q.status === 'closed' && (
                                                <button onClick={() => setStatus(q, q.answer ? 'answered' : 'pending')}
                                                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold inline-flex items-center gap-1.5">
                                                    <RefreshCcw size={12} /> Funguruka
                                                </button>
                                            )}
                                            <button onClick={() => remove(q)}
                                                className="ml-auto px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1.5">
                                                <Trash2 size={12} /> Siba
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default StudentQuestionsPanel;

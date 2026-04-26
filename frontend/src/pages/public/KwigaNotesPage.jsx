import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowLeft, BookOpen, Inbox, Search, SortAsc, FileText, MessageCircleQuestion, Sparkles } from 'lucide-react';
import NoteCard from '../../components/NoteCard';
import PdfReaderModal from '../../components/PdfReaderModal';
import AskTeacherModal from '../../components/AskTeacherModal';
import QuestionThreadModal from '../../components/QuestionThreadModal';
import useAuthStore from '../../store/authStore';

const KwigaNotesPage = () => {
    const { token, user } = useAuthStore();
    const { tradeCode, level } = useParams();
    const decodedLevel = decodeURIComponent(level);
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [trade, setTrade] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [reading, setReading] = useState(null);
    const [askOpen, setAskOpen] = useState(false);
    const [answeredQs, setAnsweredQs] = useState([]);
    const [activeQ, setActiveQ] = useState(null);

    const currentUser = user ? {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        role: user.role
    } : null;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const [tRes, listRes, qsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/course-notes/trades/${tradeCode}`),
                    axios.get(`${API_URL}/api/course-notes`, {
                        params: { trade_code: tradeCode, level: decodedLevel }
                    }),
                    axios.get(`${API_URL}/api/student-questions/public`, {
                        params: { trade_code: tradeCode, level: decodedLevel }
                    }).catch(() => ({ data: [] }))
                ]);
                if (cancelled) return;
                setTrade(tRes.data);
                setNotes(listRes.data);
                setAnsweredQs(qsRes.data || []);
            } catch (e) {
                if (!cancelled) setError(e.response?.status === 404 ? 'Umwuga ntubonetse' : 'Habayemo ikibazo');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [API_URL, tradeCode, decodedLevel]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let arr = !q ? [...notes] : notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            (n.description || '').toLowerCase().includes(q) ||
            (n.uploaded_by_name || '').toLowerCase().includes(q)
        );
        if (sortBy === 'newest') arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        else if (sortBy === 'oldest') arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        else if (sortBy === 'title') arr.sort((a, b) => a.title.localeCompare(b.title));
        else if (sortBy === 'popular') arr.sort((a, b) => (b.view_count || 0) + (b.download_count || 0) - ((a.view_count || 0) + (a.download_count || 0)));
        return arr;
    }, [notes, search, sortBy]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
    }
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <p className="text-red-600 font-semibold mb-4">{error}</p>
                <Link to="/kwiga" className="text-primary-700 font-bold underline">Subira ku rutonde</Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <section className={`bg-gradient-to-br ${trade.color} text-white py-10 lg:py-14 relative overflow-hidden`}>
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <Link to={`/kwiga/${trade.code}`} className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 font-semibold">
                        <ArrowLeft size={18} /> Subira ku rwego
                    </Link>
                    <p className="text-white/80 font-bold tracking-widest text-xs uppercase mb-2">{trade.name_rw} &middot; {trade.name}</p>
                    <h1 className="text-3xl lg:text-4xl font-black flex items-center gap-3">
                        <BookOpen size={32} /> {decodedLevel}
                    </h1>
                    <p className="text-white/80 mt-2">{notes.length} {notes.length === 1 ? 'note' : 'notes'} ziboneka kuri uru rwego</p>
                    <button onClick={() => setAskOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-400 text-primary-900 font-black rounded-2xl shadow-lg">
                        <MessageCircleQuestion size={18} /> Baza Mwarimu Ikibazo
                    </button>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-8">
                {/* Toolbar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Shakisha izina, ubusobanuro, cyangwa umwarimu..."
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <SortAsc size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none">
                            <option value="newest">Bishya</option>
                            <option value="oldest">Bya kera</option>
                            <option value="title">Title (A-Z)</option>
                            <option value="popular">Bikundwa</option>
                        </select>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                        <Inbox size={48} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-700 font-bold text-lg">
                            {notes.length === 0 ? `Nta nyandiko zihari ku rwego rwa ${decodedLevel}` : 'Nta gisubizo gihari'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            {notes.length === 0 ? 'Mwarimu agiye kuzizana mu gihe gito.' : 'Gerageza shakisha ikindi.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map(note => (
                            <NoteCard key={note.id} note={note} apiUrl={API_URL} onRead={setReading} />
                        ))}
                    </div>
                )}
            </section>

            {/* Answered Q&A from teachers */}
            {answeredQs.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 pb-10">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-black text-gray-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-accent-500" />
                                Ibibazo n&rsquo;Ibisubizo by&rsquo;Abanyeshuri
                            </h2>
                            <span className="text-xs font-bold text-gray-500">{answeredQs.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {answeredQs.slice(0, 8).map(q => (
                                <button
                                    key={q.id}
                                    onClick={() => setActiveQ(q)}
                                    className="w-full text-left px-6 py-4 hover:bg-primary-50/50 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                                            {q.student_name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500 font-semibold">
                                                <span className="text-gray-900 font-bold">{q.student_name}</span> &middot; {q.level}
                                            </p>
                                            <p className="text-sm text-gray-800 mt-1 group-hover:text-primary-700">{q.question}</p>
                                            <div className="mt-2 pl-3 border-l-2 border-accent-400 bg-accent-50/40 rounded-r-lg p-2">
                                                <p className="text-[10px] uppercase font-bold text-accent-700 tracking-wider">
                                                    Mwarimu {q.answered_by_name || ''}
                                                </p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-3">{q.answer}</p>
                                            </div>
                                            <p className="mt-2 text-[11px] font-bold text-primary-600 group-hover:underline">
                                                Funguza ibiganiro byose &rarr;
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {reading && (
                <PdfReaderModal
                    note={reading}
                    apiUrl={API_URL}
                    token={token}
                    currentUser={currentUser}
                    onClose={() => setReading(null)}
                />
            )}
            <AskTeacherModal
                open={askOpen}
                onClose={() => setAskOpen(false)}
                tradeCode={tradeCode}
                tradeName={trade?.name_rw || trade?.name}
                level={decodedLevel}
                levels={trade?.levels || []}
                apiUrl={API_URL}
            />
            <QuestionThreadModal
                open={!!activeQ}
                onClose={() => setActiveQ(null)}
                question={activeQ}
                apiUrl={API_URL}
                token={token}
                currentUser={currentUser}
            />
        </div>
    );
};

export default KwigaNotesPage;

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, FileText, ChevronRight, Loader2, ArrowLeft, GraduationCap, Layers } from 'lucide-react';

const KwigaTradePage = () => {
    const { tradeCode } = useParams();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [trade, setTrade] = useState(null);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [tRes, listRes] = await Promise.all([
                    axios.get(`${API_URL}/api/course-notes/trades/${tradeCode}`),
                    axios.get(`${API_URL}/api/course-notes`, { params: { trade_code: tradeCode } })
                ]);
                if (cancelled) return;
                setTrade(tRes.data);
                const c = {};
                listRes.data.forEach(n => { c[n.level] = (c[n.level] || 0) + 1; });
                setCounts(c);
            } catch (e) {
                if (!cancelled) setError(e.response?.status === 404 ? 'Umwuga ntubonetse' : 'Habayemo ikibazo');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [API_URL, tradeCode]);

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
            <section className={`bg-gradient-to-br ${trade.color} text-white py-12 lg:py-16 relative overflow-hidden`}>
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <Link to="/kwiga" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 font-semibold">
                        <ArrowLeft size={18} /> Subira ku myuga
                    </Link>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <GraduationCap size={26} />
                        </div>
                        <span className="text-white/90 font-bold tracking-widest text-sm uppercase">{trade.code.toUpperCase()}</span>
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black mb-2">{trade.name_rw}</h1>
                    <p className="text-lg text-white/90">{trade.name}</p>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex items-center gap-2 mb-6 text-gray-700">
                    <Layers size={20} className="text-primary-600" />
                    <h2 className="text-xl font-black">Hitamo urwego</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trade.levels.map(level => (
                        <Link
                            key={level}
                            to={`/kwiga/${trade.code}/${encodeURIComponent(level)}`}
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 flex items-center justify-between transition-all hover:-translate-y-0.5"
                        >
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Level</p>
                                <h3 className="text-2xl font-black text-gray-900">{level}</h3>
                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                                    <FileText size={14} className="text-accent-500" />
                                    {counts[level] || 0} {counts[level] === 1 ? 'note' : 'notes'}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                                <ChevronRight className="text-primary-700 group-hover:translate-x-0.5 transition-transform" size={22} />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default KwigaTradePage;

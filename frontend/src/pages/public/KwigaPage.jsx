import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, FileText, ChevronRight, Loader2, Car, HardHat, Code2, GraduationCap } from 'lucide-react';

const ICONS = { auto: Car, bdc: HardHat, sod: Code2, driving: Car };

const KwigaPage = () => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/api/course-notes/trades`);
                if (!cancelled) setTrades(res.data);
            } catch (e) {
                if (!cancelled) setError('Habayemo ikibazo. Ongera ugerageze.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [API_URL]);

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white py-16 lg:py-24 relative overflow-hidden">
                <div className="absolute top-10 right-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-500 flex items-center justify-center">
                            <GraduationCap className="text-primary-900" size={26} />
                        </div>
                        <span className="text-accent-400 font-bold tracking-widest text-sm uppercase">Kwiga</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black mb-4">
                        Igisomwa cyose ku <span className="text-accent-400">myuga yose</span>
                    </h1>
                    <p className="text-lg lg:text-xl text-primary-200 max-w-2xl">
                        Hitamo umwuga ushaka kwigamo, urebe amasomo n&rsquo;inyandiko (PDF) abarimu ba Garden TVET bashyizeho ku rwego rwawe.
                    </p>
                </div>
            </section>

            {/* Trades grid */}
            <section className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary-600" size={40} />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-600 font-semibold">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trades.map(trade => {
                            const Icon = ICONS[trade.code] || BookOpen;
                            return (
                                <Link
                                    key={trade.code}
                                    to={`/kwiga/${trade.code}`}
                                    className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
                                >
                                    <div className={`bg-gradient-to-br ${trade.color} p-8 text-white relative overflow-hidden`}>
                                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
                                        <Icon size={48} className="relative z-10" />
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-black text-2xl text-gray-900 mb-1">{trade.name_rw}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{trade.name}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen size={16} className="text-primary-600" />
                                                {trade.levels.length} levels
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <FileText size={16} className="text-accent-500" />
                                                {trade.notes_count} {trade.notes_count === 1 ? 'note' : 'notes'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                            <span className="text-primary-700 font-bold group-hover:text-primary-900">Reba amasomo</span>
                                            <ChevronRight className="text-primary-700 group-hover:translate-x-1 transition-transform" size={20} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default KwigaPage;

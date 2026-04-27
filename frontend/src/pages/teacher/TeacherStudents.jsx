import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { Loader2, Search, Users, EyeOff, Lock } from 'lucide-react';

const TeacherStudents = () => {
    const { token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trades, setTrades] = useState([]);
    const [filter, setFilter] = useState({ trade: '', level: '', q: '', status: '' });

    useEffect(() => { axios.get(`${API_URL}/api/course-notes/trades`).then(r => setTrades(r.data)).catch(() => {}); }, [API_URL]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params = {};
                if (filter.trade)  params.trade  = filter.trade;
                if (filter.level)  params.level  = filter.level;
                if (filter.status) params.status = filter.status;
                if (filter.q)      params.q      = filter.q;
                const res = await axios.get(`${API_URL}/api/teacher/students`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                });
                setStudents(res.data);
            } catch (e) { toast.error(e.response?.data?.message || 'Failed to load'); }
            finally { setLoading(false); }
        };
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [API_URL, token, filter]);

    const selectedTrade = trades.find(t => t.name_rw === filter.trade || t.code === filter.trade);

    const grouped = useMemo(() => {
        const g = {};
        students.forEach(s => {
            const k = `${s.trade} · ${s.level}`;
            (g[k] = g[k] || []).push(s);
        });
        return g;
    }, [students]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        Abanyeshuri
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1">
                            <Lock size={12} /> Read only
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm">Reba urutonde rw'abanyeshuri. Ntibyemewe kongeraho cyangwa guhindura.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={filter.q}
                        onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
                        placeholder="Shakisha izina cyangwa kode"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <select value={filter.trade} onChange={e => setFilter(f => ({ ...f, trade: e.target.value, level: '' }))}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none">
                    <option value="">Imyuga yose</option>
                    {trades.map(t => <option key={t.code} value={t.name_rw}>{t.name_rw}</option>)}
                </select>
                <select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}
                    disabled={!selectedTrade}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none disabled:bg-gray-100">
                    <option value="">Inzego zose</option>
                    {selectedTrade?.levels?.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
            ) : students.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                    <Users size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Nta munyeshuri uboneka.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([key, list]) => (
                        <section key={key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <p className="font-bold text-gray-800">{key}</p>
                                <span className="text-xs font-bold text-gray-500">{list.length}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase">
                                            <th className="px-3 py-2 text-left">Reg #</th>
                                            <th className="px-3 py-2 text-left">Izina</th>
                                            <th className="px-3 py-2 text-left">Igitsina</th>
                                            <th className="px-3 py-2 text-left">Telefoni</th>
                                            <th className="px-3 py-2 text-right">Conduct</th>
                                            <th className="px-3 py-2 text-right">GPA</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {list.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 font-mono text-xs">{s.reg_number}</td>
                                                <td className="px-3 py-2 font-bold">{s.first_name} {s.last_name}</td>
                                                <td className="px-3 py-2">{s.gender}</td>
                                                <td className="px-3 py-2 text-xs text-gray-600 flex items-center gap-1">
                                                    <EyeOff size={10} className="text-gray-400" />
                                                    {s.contact_phone ? s.contact_phone.replace(/(\d{4})\d{4}/, '$1****') : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold">
                                                    <span className={`${s.conduct_points >= 80 ? 'text-emerald-600' : s.conduct_points >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {s.conduct_points ?? 100}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right">{s.gpa ? Number(s.gpa).toFixed(2) : '—'}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${s.current_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {s.current_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;

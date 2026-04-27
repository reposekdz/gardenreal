import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import { Loader2, ShieldAlert, Plus, Calendar, X, Search } from 'lucide-react';

const ACTION_TYPES = [
    { value: 'warning',         label: 'Iburira (Warning)' },
    { value: 'conduct_removal', label: 'Gukuraho amanota y\'imyitwarire' },
    { value: 'conduct_good',    label: 'Imyitwarire myiza' },
    { value: 'punish',          label: 'Igihano' },
    { value: 'suspension',      label: 'Guhagarikwa by\'agateganyo' },
    { value: 'praise',          label: 'Gushimirwa' }
];

const TeacherConduct = () => {
    const { token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const headers = { Authorization: `Bearer ${token}` };

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Student picker
    const [students, setStudents] = useState([]);
    const [studentQ, setStudentQ] = useState('');
    const [picked, setPicked] = useState(null);

    const [form, setForm] = useState({
        action_type: 'warning',
        description: '',
        severity: 'low',
        location: '',
        points_deducted: 0
    });

    const loadRecords = async () => {
        setLoading(true);
        try {
            const r = await axios.get(`${API_URL}/api/teacher/conduct`, { headers });
            setRecords(r.data);
        } catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };
    useEffect(() => { loadRecords(); }, []);

    useEffect(() => {
        if (!studentQ.trim()) { setStudents([]); return; }
        const t = setTimeout(async () => {
            try {
                const r = await axios.get(`${API_URL}/api/teacher/students`, { headers, params: { q: studentQ.trim() } });
                setStudents(r.data.slice(0, 8));
            } catch {}
        }, 250);
        return () => clearTimeout(t);
    }, [studentQ]);

    const submit = async (e) => {
        e.preventDefault();
        if (!picked) return toast.error('Hitamo umunyeshuri');
        if (!form.description.trim()) return toast.error('Andika ibisobanuro');
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/teacher/conduct`, {
                student_id: picked.id,
                action_type: form.action_type,
                description: form.description.trim(),
                severity: form.severity,
                location: form.location || null,
                points_deducted: Number(form.points_deducted) || 0,
                incident_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }, { headers });
            toast.success('Imyitwarire yanditswe');
            setShowForm(false);
            setPicked(null); setStudentQ('');
            setForm({ action_type: 'warning', description: '', severity: 'low', location: '', points_deducted: 0 });
            loadRecords();
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB') : '—';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Imyitwarire y'abanyeshuri</h1>
                    <p className="text-gray-500 text-sm">Andika imyitwarire mibi cyangwa myiza, kandi ureba inkuru zawe.</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg">
                    <Plus size={18} /> Andika imyitwarire
                </button>
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-red-600" />
                    <h2 className="font-black text-lg text-gray-900">Inkuru natanze ({records.length})</h2>
                </div>
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-red-600" size={32} /></div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <ShieldAlert size={40} className="mx-auto mb-2 opacity-30" />
                        <p>Nta nkuru z'imyitwarire urashyizeho.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-4 py-3 text-left">Itariki</th>
                                    <th className="px-4 py-3 text-left">Umunyeshuri</th>
                                    <th className="px-4 py-3 text-left">Trade / Level</th>
                                    <th className="px-4 py-3 text-left">Ubwoko</th>
                                    <th className="px-4 py-3 text-left">Ibisobanuro</th>
                                    <th className="px-4 py-3 text-right">- Points</th>
                                    <th className="px-4 py-3 text-center">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(r.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold">{r.first_name} {r.last_name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{r.reg_number}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{r.trade} · {r.level}</td>
                                        <td className="px-4 py-3 capitalize text-xs">{r.action_type?.replace(/_/g, ' ')}</td>
                                        <td className="px-4 py-3 max-w-xs truncate text-gray-700">{r.description}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">{r.points_deducted || 0}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                r.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                r.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>{r.severity}</span>
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[92vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-black text-white text-lg">Andika imyitwarire</h3>
                            <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white"><X size={22} /></button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Umunyeshuri *</label>
                                {picked ? (
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <div>
                                            <p className="font-bold text-emerald-900">{picked.first_name} {picked.last_name}</p>
                                            <p className="text-xs text-emerald-700 font-mono">{picked.reg_number} · {picked.trade} · {picked.level}</p>
                                        </div>
                                        <button type="button" onClick={() => { setPicked(null); setStudentQ(''); }}
                                            className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input value={studentQ} onChange={e => setStudentQ(e.target.value)}
                                            placeholder="Shakisha izina / kode"
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20" />
                                        {students.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                                                {students.map(s => (
                                                    <button type="button" key={s.id} onClick={() => { setPicked(s); setStudentQ(''); setStudents([]); }}
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                        <p className="font-bold text-sm">{s.first_name} {s.last_name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{s.reg_number} · {s.trade}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Ubwoko *</label>
                                    <select value={form.action_type} onChange={e => setForm(p => ({ ...p, action_type: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none">
                                        {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Severity</label>
                                    <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none">
                                        <option value="low">low</option>
                                        <option value="medium">medium</option>
                                        <option value="high">high</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Ibisobanuro *</label>
                                <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Aho byabereye</label>
                                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Amanota agukurwaho</label>
                                    <input type="number" min="0" max="100" value={form.points_deducted}
                                        onChange={e => setForm(p => ({ ...p, points_deducted: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none" />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                                Bika
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherConduct;

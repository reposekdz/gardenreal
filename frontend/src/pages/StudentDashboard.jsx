import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
    Loader2, GraduationCap, BookOpen, DollarSign, Calendar, ShieldAlert,
    Bell, Settings, CheckCircle2, XCircle, Clock, AlertTriangle, Award,
    Phone, Mail, MapPin, User, KeyRound, TrendingUp
} from 'lucide-react';

const Stat = ({ icon: Icon, label, value, color = 'emerald', sub }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-black text-${color}-700 mt-1`}>{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center`}>
                <Icon size={22} className={`text-${color}-600`} />
            </div>
        </div>
    </div>
);

const Section = ({ id, icon: Icon, title, children, color = 'emerald' }) => (
    <section id={id} className="scroll-mt-24 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-${color}-50`}>
            <Icon size={20} className={`text-${color}-700`} />
            <h2 className={`font-black text-lg text-${color}-900`}>{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </section>
);

const StudentDashboard = () => {
    const { user, token, login } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Password change form
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [savingPw, setSavingPw] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/student-auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (e) {
                toast.error(e.response?.data?.message || 'Kureba amakuru byanze');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [API_URL, token]);

    useEffect(() => {
        if (location.hash) {
            const el = document.querySelector(location.hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash, data]);

    const submitPw = async (e) => {
        e.preventDefault();
        if (pw.next !== pw.confirm) return toast.error('Ijambobanga rishya ntirihuje');
        if (pw.next.length < 4)     return toast.error('Andika nibura inyuguti 4');
        setSavingPw(true);
        try {
            await axios.post(`${API_URL}/api/student-auth/change-password`,
                { current_password: pw.current, new_password: pw.next },
                { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Ijambobanga rihinduwe neza');
            setPw({ current: '', next: '', confirm: '' });
            login({ ...user, must_change_password: false }, token);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Bitagenze neza');
        } finally {
            setSavingPw(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
        );
    }
    if (!data) return null;

    const { profile, grades, exam_results, attendance, fees, conduct_records, notifications } = data;
    const totalAttendance = (attendance?.present || 0) + (attendance?.absent || 0) + (attendance?.late || 0) + (attendance?.excused || 0);
    const presentRate = totalAttendance ? Math.round(((attendance.present + attendance.late + attendance.excused) / totalAttendance) * 100) : 0;
    const totalFees = (fees || []).reduce((s, f) => s + Number(f.amount || 0), 0);
    const paid = profile.fees_paid || 0;
    const owed = profile.fees_owed || Math.max(0, totalFees - paid);
    const conductPts = profile.conduct_points ?? 100;

    const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US') + ' RWF';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {profile.must_change_password && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-amber-900">Hindura ijambobanga</p>
                        <p className="text-sm text-amber-800">Wakoresheje ijambobanga rya mbere. Jya kuri <a href="#settings" className="underline font-bold">Hindura ijambobanga</a> uhindure ryawe bwite.</p>
                    </div>
                </div>
            )}

            {/* Profile hero */}
            <section id="overview" className="scroll-mt-24 bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <GraduationCap size={36} className="text-accent-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black">{profile.first_name} {profile.last_name}</h1>
                            <p className="text-emerald-200 font-mono mt-1">{profile.reg_number}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">{profile.trade}</span>
                                <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">{profile.level}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${profile.current_status === 'active' ? 'bg-accent-500 text-emerald-900' : 'bg-red-500'}`}>
                                    {profile.current_status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat icon={Award} label="Conduct" value={`${conductPts} / 100`} color="emerald" sub={conductPts >= 80 ? 'Wonyine!' : conductPts >= 60 ? 'Komeza' : 'Witondere'} />
                <Stat icon={TrendingUp} label="GPA" value={profile.gpa ? Number(profile.gpa).toFixed(2) : '—'} color="blue" />
                <Stat icon={Calendar} label="Kwitabira" value={`${presentRate}%`} color="purple" sub={`${attendance.present || 0} / ${totalAttendance || 0}`} />
                <Stat icon={DollarSign} label="Asigaye" value={fmtMoney(owed)} color={owed > 0 ? 'red' : 'emerald'} sub={fmtMoney(paid) + ' yatanzwe'} />
            </div>

            {/* Grades */}
            <Section id="grades" icon={BookOpen} title="Amanota yanjye" color="blue">
                {(grades?.length === 0 && exam_results?.length === 0) ? (
                    <p className="text-center text-gray-500 py-8">Nta manota arabonetse.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-3 py-2 text-left">Isomo</th>
                                    <th className="px-3 py-2 text-left">Trimester / Year</th>
                                    <th className="px-3 py-2 text-left">Ubwoko</th>
                                    <th className="px-3 py-2 text-right">Amanota</th>
                                    <th className="px-3 py-2 text-right">%</th>
                                    <th className="px-3 py-2 text-center">Inyuguti</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(grades || []).map(g => (
                                    <tr key={`g${g.id}`} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-bold">{g.subject}</td>
                                        <td className="px-3 py-2">{g.term} {g.academic_year}</td>
                                        <td className="px-3 py-2 capitalize">{g.grade_type}</td>
                                        <td className="px-3 py-2 text-right font-mono">{g.score} / {g.max_score}</td>
                                        <td className="px-3 py-2 text-right font-bold">{Number(g.percentage || 0).toFixed(1)}%</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-black text-xs">{g.grade_letter || '—'}</span>
                                        </td>
                                    </tr>
                                ))}
                                {(exam_results || []).map(e => (
                                    <tr key={`e${e.id}`} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-bold">{e.subject}</td>
                                        <td className="px-3 py-2">{e.term} {e.year}</td>
                                        <td className="px-3 py-2 capitalize">{e.exam_type}</td>
                                        <td className="px-3 py-2 text-right font-mono">{e.score} / {e.max_score}</td>
                                        <td className="px-3 py-2 text-right font-bold">{((e.score / (e.max_score || 100)) * 100).toFixed(1)}%</td>
                                        <td className="px-3 py-2 text-center">—</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* Fees */}
            <Section id="fees" icon={DollarSign} title="Amafaranga (school fees)" color="emerald">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase">Yose</p>
                        <p className="text-xl font-black text-emerald-900">{fmtMoney(totalFees)}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4">
                        <p className="text-xs font-bold text-blue-700 uppercase">Yatanzwe</p>
                        <p className="text-xl font-black text-blue-900">{fmtMoney(paid)}</p>
                    </div>
                    <div className={`rounded-xl ${owed > 0 ? 'bg-red-50' : 'bg-emerald-50'} p-4`}>
                        <p className={`text-xs font-bold uppercase ${owed > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Asigaye</p>
                        <p className={`text-xl font-black ${owed > 0 ? 'text-red-900' : 'text-emerald-900'}`}>{fmtMoney(owed)}</p>
                    </div>
                </div>
                {fees && fees.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-3 py-2 text-left">Trimester</th>
                                    <th className="px-3 py-2 text-right">Amafaranga</th>
                                    <th className="px-3 py-2 text-left">Itariki ntarengwa</th>
                                    <th className="px-3 py-2 text-left">Yatanzwe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {fees.map(f => {
                                    const fpaid = (f.payments || []).reduce((s, p) => s + Number(p.amount_paid || 0), 0);
                                    return (
                                        <tr key={f.id}>
                                            <td className="px-3 py-2 font-bold">{f.term}</td>
                                            <td className="px-3 py-2 text-right font-mono">{fmtMoney(f.amount)}</td>
                                            <td className="px-3 py-2">{fmtDate(f.due_date)}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${fpaid >= Number(f.amount) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {fpaid >= Number(f.amount) ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                    {fmtMoney(fpaid)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Nta mafaranga arateganyijwe muri uru rwego.</p>
                )}
                {profile.payments && profile.payments.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-bold text-gray-800 mb-2">Recent receipts</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                        <th className="px-3 py-2 text-left">Itariki</th>
                                        <th className="px-3 py-2 text-right">Amafaranga</th>
                                        <th className="px-3 py-2 text-left">Uburyo</th>
                                        <th className="px-3 py-2 text-left">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {profile.payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-3 py-2">{fmtDate(p.payment_date)}</td>
                                            <td className="px-3 py-2 text-right font-mono">{fmtMoney(p.amount_paid)}</td>
                                            <td className="px-3 py-2">{p.payment_method}</td>
                                            <td className="px-3 py-2 text-xs text-gray-500 font-mono">{p.receipt_number || p.transaction_ref || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Section>

            {/* Attendance */}
            <Section id="attendance" icon={Calendar} title="Kwitabira (iminsi 90 ishize)" color="purple">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                        { label: 'Yaje', value: attendance.present || 0, color: 'emerald' },
                        { label: 'Yataye', value: attendance.absent  || 0, color: 'red' },
                        { label: 'Yatinze', value: attendance.late    || 0, color: 'amber' },
                        { label: 'Yashize', value: attendance.excused || 0, color: 'blue' }
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl bg-${s.color}-50 p-3 text-center`}>
                            <p className={`text-xs font-bold text-${s.color}-700 uppercase`}>{s.label}</p>
                            <p className={`text-2xl font-black text-${s.color}-900`}>{s.value}</p>
                        </div>
                    ))}
                </div>
                {attendance.recent && attendance.recent.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-3 py-2 text-left">Itariki</th>
                                    <th className="px-3 py-2 text-left">Aho biri</th>
                                    <th className="px-3 py-2 text-left">Inyandiko</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.recent.map((r, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2">{fmtDate(r.date)}</td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                                r.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                r.status === 'absent'  ? 'bg-red-100 text-red-700' :
                                                r.status === 'late'    ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>{r.status}</span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">{r.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Nta inyandiko z'ukwitabira ziraboneka.</p>
                )}
            </Section>

            {/* Conduct */}
            <Section id="conduct" icon={ShieldAlert} title="Imyitwarire" color="red">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${conductPts >= 80 ? 'bg-emerald-500' : conductPts >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, conductPts)}%` }} />
                    </div>
                    <span className="font-black text-gray-900">{conductPts} / 100</span>
                </div>
                {conduct_records && conduct_records.length > 0 ? (
                    <div className="space-y-2">
                        {conduct_records.map(c => (
                            <div key={c.id} className="border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${c.severity === 'high' ? 'bg-red-500' : c.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="font-bold text-gray-900 capitalize">{c.action_type?.replace(/_/g, ' ')}</p>
                                        <span className="text-xs text-gray-500">{fmtDate(c.incident_date || c.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{c.description}</p>
                                    {c.points_deducted > 0 && (
                                        <p className="text-xs text-red-600 font-bold mt-1">- {c.points_deducted} amanota</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Nta nkuru z'imyitwarire ziraboneka. Komeza wonyine!</p>
                )}
            </Section>

            {/* Notifications */}
            <Section id="notifications" icon={Bell} title="Ubutumwa" color="amber">
                {notifications && notifications.length > 0 ? (
                    <div className="space-y-2">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-3 rounded-xl border ${n.is_read ? 'border-gray-200 bg-white' : 'border-amber-300 bg-amber-50'}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">{n.title}</p>
                                        <p className="text-sm text-gray-600">{n.message}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('en-GB')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Nta butumwa bushya.</p>
                )}
            </Section>

            {/* Profile details */}
            <Section id="profile" icon={User} title="Amakuru yawe" color="blue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Field icon={Phone} label="Telefoni" value={profile.contact_phone} />
                    <Field icon={Mail}  label="Email"    value={profile.contact_email} />
                    <Field icon={User}  label="Umurera" value={`${profile.guardian_name || '—'} (${profile.guardian_relation || '—'})`} />
                    <Field icon={Phone} label="Tel. y'umurera" value={profile.guardian_phone} />
                    <Field icon={MapPin} label="Aho atuye" value={[profile.address_district, profile.address_sector, profile.address_cell].filter(Boolean).join(', ')} />
                    <Field icon={Calendar} label="Yatangiriye" value={profile.year_enrolled} />
                </div>
            </Section>

            {/* Settings - Change password */}
            <Section id="settings" icon={Settings} title="Hindura ijambobanga" color="emerald">
                <form onSubmit={submitPw} className="space-y-3 max-w-md">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Ijambobanga rya kera</label>
                        <input type="password" required value={pw.current}
                            onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Ijambobanga rishya</label>
                        <input type="password" required value={pw.next} minLength={4}
                            onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Ongera wandike ijambobanga rishya</label>
                        <input type="password" required value={pw.confirm} minLength={4}
                            onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <button type="submit" disabled={savingPw}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-60">
                        {savingPw ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Bika ijambobanga
                    </button>
                </form>
            </Section>
        </div>
    );
};

const Field = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
        <Icon size={16} className="text-gray-500 mt-0.5" />
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
            <p className="text-sm text-gray-800">{value || '—'}</p>
        </div>
    </div>
);

export default StudentDashboard;

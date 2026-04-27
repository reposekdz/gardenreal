import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Building2, Plus, Search, Filter, Mail, Phone, MapPin, Globe,
    Edit3, Trash2, X, Loader2, RefreshCcw, Send, History, AlertTriangle,
    CheckCircle2, XCircle, Eye, Lock, Briefcase
} from 'lucide-react';
import SendRosterModal from '../components/SendRosterModal';

const STATUS_BADGE = {
    active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-gray-100   text-gray-600    border-gray-200',
    archived: 'bg-rose-100   text-rose-700    border-rose-200',
};

const TRADE_OPTIONS = [
    'Software Development',
    'Building and Construction',
    'Automobile Technology',
];

const blankForm = {
    company_name: '', contact_person: '', email: '', phone: '',
    sector: '', address: '', website: '',
    preferred_trades: [], notes: '', status: 'active',
};

const fmt = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleString('en-GB', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return d; }
};

const Employers = () => {
    const { user } = useAuthStore();
    const canRead  = ['admin', 'director', 'registrar', 'dod', 'director_of_discipline', 'accountant'].includes(user?.role);
    const canWrite = ['admin', 'director', 'registrar'].includes(user?.role);

    const [loading, setLoading]   = useState(true);
    const [items, setItems]       = useState([]);
    const [sectors, setSectors]   = useState([]);
    const [emailOk, setEmailOk]   = useState(false);
    const [search, setSearch]     = useState('');
    const [sector, setSector]     = useState('');
    const [status, setStatus]     = useState('active');

    const [editing, setEditing]     = useState(null);   // employer object | 'new' | null
    const [form, setForm]           = useState(blankForm);
    const [saving, setSaving]       = useState(false);

    const [detail, setDetail]       = useState(null);   // detail panel { employer, history }
    const [showSend, setShowSend]   = useState(false);
    const [sendFilters, setSendFilters] = useState({ yearId: '', trade: '', search: '' });

    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory]         = useState([]);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (sector) params.set('sector', sector);
            if (status) params.set('status', status);
            const r = await api.get(`/employers?${params.toString()}`);
            setItems(r.data?.employers || []);
            setSectors(r.data?.filters?.sectors || []);
            setEmailOk(!!r.data?.email_configured);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo gusoma employers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (canRead) load(); /* eslint-disable-next-line */ }, []);
    useEffect(() => {
        if (!canRead) return;
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [search, sector, status]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter(i => i.status === 'active').length,
        outreach: items.reduce((s, i) => s + (i.outreach_count || 0), 0),
        emailable: items.filter(i => i.email).length,
    }), [items]);

    const openCreate = () => { setEditing('new'); setForm(blankForm); };
    const openEdit = (e) => {
        setEditing(e);
        setForm({
            company_name: e.company_name || '',
            contact_person: e.contact_person || '',
            email: e.email || '',
            phone: e.phone || '',
            sector: e.sector || '',
            address: e.address || '',
            website: e.website || '',
            preferred_trades: (e.preferred_trades || '').split(',').map(s => s.trim()).filter(Boolean),
            notes: e.notes || '',
            status: e.status || 'active',
        });
    };

    const submit = async (ev) => {
        ev.preventDefault();
        if (!form.company_name.trim()) {
            toast.warn('Izina rya sosiyete ni ngombwa.');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editing === 'new') {
                await api.post('/employers', payload);
                toast.success('Employer yongewe.');
            } else {
                await api.put(`/employers/${editing.id}`, payload);
                toast.success('Employer yahinduwe.');
            }
            setEditing(null); setForm(blankForm);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo bika.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (e) => {
        if (!window.confirm(`Siba ${e.company_name}? Outreach history nayo izasibwa.`)) return;
        try {
            await api.delete(`/employers/${e.id}`);
            toast.success('Yasibwe.');
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bidashobotse.');
        }
    };

    const openDetail = async (e) => {
        try {
            const r = await api.get(`/employers/${e.id}`);
            setDetail(r.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bidashobotse.');
        }
    };

    const loadHistory = async () => {
        try {
            const r = await api.get('/employers/outreach?limit=200');
            setHistory(r.data?.outreach || []);
            setShowHistory(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bidashobotse.');
        }
    };

    if (!canRead) {
        return (
            <div className="text-center py-20 text-gray-400">
                <Lock size={48} className="mx-auto mb-3 opacity-30" />
                <p>Iri page riri ku bayobozi gusa.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2">
                            <Building2 size={26} /> Employer Directory
                        </h1>
                        <p className="text-indigo-100 text-sm">
                            Sosiyete na compagnies bafata abasoje. Kanda <strong>Send Roster</strong> kugira ngo wohereze PDF roster ku ma-employers wahisemo.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={loadHistory}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 text-sm">
                            <History size={16} /> Outreach Log
                        </button>
                        <button onClick={() => { setSendFilters({ yearId: '', trade: '', search: '' }); setShowSend(true); }}
                            className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50">
                            <Send size={18} /> Send Roster
                        </button>
                        {canWrite && (
                            <button onClick={openCreate}
                                className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600">
                                <Plus size={18} /> Yongera Employer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!emailOk && (
                <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-sm text-amber-800">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Email ntiratunganywa.</strong> Wifuza kohereza roster, admin agomba gushyiraho
                        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS na SMTP_FROM mu environment variables hanyuma asubukure server.
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                <Stat icon={Building2} label="Employers" value={stats.total}    color="bg-indigo-50 text-indigo-700" />
                <Stat icon={CheckCircle2} label="Active" value={stats.active}   color="bg-emerald-50 text-emerald-700" />
                <Stat icon={Mail}      label="With Email" value={stats.emailable} color="bg-blue-50 text-blue-700" />
                <Stat icon={Send}      label="Total Outreach" value={stats.outreach} color="bg-amber-50 text-amber-700" />
            </div>

            {/* Filters */}
            <div className="px-6 mb-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[220px] relative">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Shakisha izina, contact, email, sector..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm" />
                    </div>
                    <Filter size={16} className="text-gray-500" />
                    <select value={sector} onChange={e => setSector(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                        <option value="">Sectors zose</option>
                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={status} onChange={e => setStatus(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                        <option value="">Status zose</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </select>
                    <button onClick={load}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center gap-1">
                        <RefreshCcw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="px-6 pb-12">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center"><Loader2 className="mx-auto animate-spin text-indigo-500" size={32} /></div>
                    ) : !items.length ? (
                        <div className="p-16 text-center text-gray-400">
                            <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-bold text-gray-600">Nta employer yongewe.</p>
                            {canWrite && <p className="text-xs">Kanda "Yongera Employer" ushyireho iya mbere.</p>}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Sosiyete</th>
                                        <th className="px-4 py-3 text-left">Contact</th>
                                        <th className="px-4 py-3 text-left">Sector / Trades</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Last Sent</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map(e => (
                                        <tr key={e.id} className="hover:bg-indigo-50/30">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-800">{e.company_name}</div>
                                                {e.address && <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} />{e.address}</div>}
                                                {e.website && <div className="text-xs text-blue-600 flex items-center gap-1"><Globe size={11} /><a href={e.website} target="_blank" rel="noreferrer" className="truncate max-w-[200px]">{e.website}</a></div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-gray-800">{e.contact_person || '—'}</div>
                                                {e.email && <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={11} />{e.email}</div>}
                                                {e.phone && <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} />{e.phone}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-gray-700">{e.sector || '—'}</div>
                                                {e.preferred_trades && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {e.preferred_trades.split(',').filter(Boolean).map(t => (
                                                            <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">{t.trim()}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[e.status] || ''}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {e.last_contacted_at ? fmt(e.last_contacted_at) : <span className="text-gray-400">—</span>}
                                                {e.outreach_count > 0 && (
                                                    <div className="text-[10px] text-gray-400">{e.outreach_count} send(s)</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex gap-1">
                                                    <button onClick={() => openDetail(e)}
                                                        title="Reba" className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600">
                                                        <Eye size={14} />
                                                    </button>
                                                    {canWrite && (
                                                        <>
                                                            <button onClick={() => openEdit(e)}
                                                                title="Hindura" className="p-2 rounded-lg hover:bg-amber-100 text-amber-600">
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button onClick={() => remove(e)}
                                                                title="Siba" className="p-2 rounded-lg hover:bg-rose-100 text-rose-600">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit modal */}
            {editing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={submit} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-black text-gray-800">
                                {editing === 'new' ? 'Yongera Employer' : `Hindura ${editing.company_name}`}
                            </h3>
                            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Izina rya sosiyete *" full>
                                <input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Contact Person">
                                <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Email">
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Telefone">
                                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Sector (e.g. Construction, IT)">
                                <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Status">
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </Field>
                            <Field label="Aderesi" full>
                                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Website" full>
                                <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                            <Field label="Trades zikenewe" full>
                                <div className="flex flex-wrap gap-2">
                                    {TRADE_OPTIONS.map(t => {
                                        const checked = form.preferred_trades.includes(t);
                                        return (
                                            <button type="button" key={t}
                                                onClick={() => {
                                                    setForm(f => ({
                                                        ...f,
                                                        preferred_trades: checked
                                                            ? f.preferred_trades.filter(x => x !== t)
                                                            : [...f.preferred_trades, t],
                                                    }));
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs border ${checked
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-700 border-gray-200'}`}>
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                            <Field label="Notes" full>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                            </Field>
                        </div>
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-3xl">
                            <button type="button" onClick={() => setEditing(null)}
                                className="px-4 py-2 rounded-xl bg-gray-200 text-sm font-bold">Reka</button>
                            <button type="submit" disabled={saving}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />} Bika
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Detail panel */}
            {detail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-black text-gray-800 flex items-center gap-2">
                                <Building2 size={20} className="text-indigo-600" /> {detail.employer.company_name}
                            </h3>
                            <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <Row label="Contact">{detail.employer.contact_person || '—'}</Row>
                            <Row label="Email">{detail.employer.email || '—'}</Row>
                            <Row label="Phone">{detail.employer.phone || '—'}</Row>
                            <Row label="Sector">{detail.employer.sector || '—'}</Row>
                            <Row label="Address">{detail.employer.address || '—'}</Row>
                            <Row label="Website">{detail.employer.website || '—'}</Row>
                            <Row label="Trades">{detail.employer.preferred_trades || '—'}</Row>
                            <Row label="Status">{detail.employer.status}</Row>
                            <Row label="Notes">{detail.employer.notes || '—'}</Row>

                            <h4 className="font-bold text-gray-800 mt-6 mb-2 flex items-center gap-2">
                                <History size={16} /> Outreach History ({detail.outreach_history.length})
                            </h4>
                            {detail.outreach_history.length === 0 ? (
                                <p className="text-xs text-gray-400">Nta roster yarohereje.</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {detail.outreach_history.map(o => (
                                        <div key={o.id} className="border border-gray-100 rounded-xl p-3 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="font-bold text-gray-800 truncate">{o.subject}</div>
                                                {o.status === 'sent'
                                                    ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={10} /> SENT</span>
                                                    : <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1"><XCircle size={10} /> {o.status.toUpperCase()}</span>}
                                            </div>
                                            <div className="text-gray-500 mt-1">
                                                {fmt(o.sent_at)} · {o.graduate_count} graduates · {o.attached_pdf ? 'PDF attached' : 'no PDF'}
                                            </div>
                                            {o.error && <div className="text-rose-600 text-[11px] mt-1">{o.error}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Outreach log */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-black text-gray-800 flex items-center gap-2"><History size={20} /> Outreach Log</h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                        </div>
                        <div className="p-6">
                            {history.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">Nta outreach yarakorwa.</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-600 uppercase">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Itariki</th>
                                            <th className="px-2 py-2 text-left">Sosiyete</th>
                                            <th className="px-2 py-2 text-left">Subject</th>
                                            <th className="px-2 py-2 text-left">Grads</th>
                                            <th className="px-2 py-2 text-left">By</th>
                                            <th className="px-2 py-2 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {history.map(o => (
                                            <tr key={o.id}>
                                                <td className="px-2 py-2 text-gray-600">{fmt(o.sent_at)}</td>
                                                <td className="px-2 py-2 font-bold">{o.company_name || '—'}</td>
                                                <td className="px-2 py-2 truncate max-w-[200px]">{o.subject}</td>
                                                <td className="px-2 py-2">{o.graduate_count}</td>
                                                <td className="px-2 py-2 text-gray-600">{o.sent_by_name || '—'}</td>
                                                <td className="px-2 py-2">
                                                    {o.status === 'sent'
                                                        ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">SENT</span>
                                                        : <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold" title={o.error}>{o.status.toUpperCase()}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Send modal */}
            <SendRosterModal open={showSend} onClose={() => { setShowSend(false); load(); }}
                filters={sendFilters} graduateCount={null} />
        </div>
    );
};

const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
        </div>
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="font-black text-lg text-gray-900">{value}</p>
        </div>
    </div>
);

const Field = ({ label, full, children }) => (
    <div className={full ? 'md:col-span-2' : ''}>
        <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const Row = ({ label, children }) => (
    <div className="grid grid-cols-3 gap-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className="col-span-2 text-gray-800">{children}</div>
    </div>
);

export default Employers;

import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import {
    X, Send, Search, Mail, AlertTriangle, Loader2, CheckCircle2,
    Building2, FileText, Filter, Paperclip
} from 'lucide-react';

/**
 * Modal for sending the graduate roster to selected partner employers.
 * Props:
 *  - open (bool)
 *  - onClose ()
 *  - filters: { yearId, trade, search }   (carried over from Graduates page)
 *  - graduateCount: number                (informational)
 */
const SendRosterModal = ({ open, onClose, filters, graduateCount }) => {
    const [loading, setLoading]       = useState(true);
    const [sending, setSending]       = useState(false);
    const [employers, setEmployers]   = useState([]);
    const [emailReady, setEmailReady] = useState(false);
    const [search, setSearch]         = useState('');
    const [sectorFilter, setSector]   = useState('');
    const [sectors, setSectors]       = useState([]);
    const [selected, setSelected]     = useState(new Set());
    const [subject, setSubject]       = useState('');
    const [message, setMessage]       = useState('');
    const [attachPdf, setAttachPdf]   = useState(true);
    const [results, setResults]       = useState(null);

    useEffect(() => {
        if (!open) return;
        setResults(null);
        setSelected(new Set());
        setSearch(''); setSector('');
        setSubject(`Garden TVET — Graduate Roster${graduateCount ? ` (${graduateCount} graduates)` : ''}`);
        setMessage('');
        (async () => {
            setLoading(true);
            try {
                const r = await api.get('/employers?status=active');
                setEmployers(r.data?.employers || []);
                setSectors(r.data?.filters?.sectors || []);
                setEmailReady(!!r.data?.email_configured);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Habaye ikibazo gusoma employers.');
            } finally {
                setLoading(false);
            }
        })();
    }, [open, graduateCount]);

    const filtered = useMemo(() => {
        return employers.filter(e => {
            if (!e.email) return false;
            if (sectorFilter && e.sector !== sectorFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                if (!`${e.company_name} ${e.contact_person || ''} ${e.email} ${e.sector || ''}`
                    .toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [employers, search, sectorFilter]);

    const allSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id));
    const toggleAll = () => {
        const ns = new Set(selected);
        if (allSelected) filtered.forEach(e => ns.delete(e.id));
        else filtered.forEach(e => ns.add(e.id));
        setSelected(ns);
    };
    const toggleOne = (id) => {
        const ns = new Set(selected);
        if (ns.has(id)) ns.delete(id); else ns.add(id);
        setSelected(ns);
    };

    const submit = async (e) => {
        e?.preventDefault?.();
        if (!selected.size) {
            toast.warn('Hitamo nibura employer imwe.');
            return;
        }
        if (!emailReady) {
            toast.error('Email service ntiritunganywa. Saba admin ashyireho SMTP env vars.');
            return;
        }
        setSending(true); setResults(null);
        try {
            const r = await api.post('/employers/send-roster', {
                employer_ids: [...selected],
                subject: subject.trim() || undefined,
                message: message.trim() || undefined,
                attach_pdf: attachPdf,
                year_id: filters?.yearId || undefined,
                trade:   filters?.trade  || undefined,
                search:  filters?.search || undefined,
            });
            setResults(r.data);
            if (r.data?.failed) {
                toast.warn(`Bohereje ${r.data.sent}, byanze ${r.data.failed}.`);
            } else {
                toast.success(`Bohereje neza ku ma-employer ${r.data.sent}.`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo wohereza.');
        } finally {
            setSending(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                        <Send size={20} className="text-amber-600" /> Ohereza Roster ku Employers
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
                </div>

                {!emailReady && (
                    <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-sm text-amber-800">
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Email service ntiratunganywa.</p>
                            <p>Admin agomba gushyiraho <code className="px-1 bg-white rounded">SMTP_HOST</code>, <code className="px-1 bg-white rounded">SMTP_PORT</code>, <code className="px-1 bg-white rounded">SMTP_USER</code>, <code className="px-1 bg-white rounded">SMTP_PASS</code>, na <code className="px-1 bg-white rounded">SMTP_FROM</code> mu environment variables, hanyuma asubukure server.</p>
                        </div>
                    </div>
                )}

                {results ? (
                    <div className="p-6 overflow-y-auto">
                        <div className="text-center mb-4">
                            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                            <h4 className="font-black text-lg text-gray-900 mt-2">{results.message}</h4>
                            <p className="text-sm text-gray-500">Sent {results.sent} · Failed {results.failed}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 divide-y max-h-72 overflow-y-auto">
                            {results.results.map(r => (
                                <div key={r.employer_id} className="px-4 py-2 flex items-center justify-between text-sm">
                                    <div>
                                        <div className="font-bold text-gray-800">{r.company_name}</div>
                                        <div className="text-xs text-gray-500">{r.email}</div>
                                    </div>
                                    {r.success ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">SENT</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold" title={r.error}>FAILED</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-right">
                            <button onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-bold">Funga</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={submit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto">
                            {/* Filter info banner */}
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                                <Filter size={14} className="mt-0.5" />
                                <div>
                                    <strong>Roster filters carried over:</strong>{' '}
                                    {filters?.yearId ? `year=${filters.yearId} ` : 'all years '}
                                    {filters?.trade ? `· trade=${filters.trade} ` : ''}
                                    {filters?.search ? `· search="${filters.search}"` : ''}
                                    {graduateCount ? ` · ${graduateCount} graduates` : ''}
                                </div>
                            </div>

                            {/* Subject + message */}
                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-xs font-bold text-gray-700">Subject ya email</label>
                                <input value={subject} onChange={e => setSubject(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                                <label className="text-xs font-bold text-gray-700 mt-1">Ubutumwa (optional)</label>
                                <textarea value={message} onChange={e => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Default body izakoreshwa niba uretse ubu kabari ubusa."
                                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                                <label className="flex items-center gap-2 text-xs text-gray-700">
                                    <input type="checkbox" checked={attachPdf} onChange={e => setAttachPdf(e.target.checked)} />
                                    <Paperclip size={14} /> Ohamiriza PDF roster (recommended)
                                </label>
                            </div>

                            {/* Employer picker */}
                            <div className="border border-gray-100 rounded-2xl">
                                <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                        <input value={search} onChange={e => setSearch(e.target.value)}
                                            placeholder="Shakisha employer..."
                                            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-gray-200" />
                                    </div>
                                    <select value={sectorFilter} onChange={e => setSector(e.target.value)}
                                        className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white">
                                        <option value="">Sectors zose</option>
                                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <button type="button" onClick={toggleAll}
                                        className="px-2 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-bold">
                                        {allSelected ? 'Siba byose' : 'Hitamo byose'}
                                    </button>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                    {loading ? (
                                        <div className="text-center py-10 text-gray-400">
                                            <Loader2 className="mx-auto animate-spin" />
                                        </div>
                                    ) : !filtered.length ? (
                                        <div className="text-center py-10 text-gray-400 text-sm">
                                            <Building2 size={28} className="mx-auto mb-1 opacity-30" />
                                            Nta employer ifite email yemewe. Yongeraho mu Employers page mbere.
                                        </div>
                                    ) : (
                                        filtered.map(e => (
                                            <label key={e.id}
                                                className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer text-sm hover:bg-amber-50 ${selected.has(e.id) ? 'bg-amber-50' : ''}`}>
                                                <input type="checkbox"
                                                    checked={selected.has(e.id)}
                                                    onChange={() => toggleOne(e.id)} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-800 truncate">{e.company_name}</div>
                                                    <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                                                        <Mail size={11} /> {e.email}
                                                        {e.sector && <span>· {e.sector}</span>}
                                                    </div>
                                                </div>
                                                {e.outreach_count > 0 && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        {e.outreach_count} sent
                                                    </span>
                                                )}
                                            </label>
                                        ))
                                    )}
                                </div>
                                <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                                    <span>Hitamo: <strong>{selected.size}</strong> employer(s)</span>
                                    <span className="flex items-center gap-1"><FileText size={12} /> Buri email izaba ifite ifoto y'ubutumwa + PDF</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between rounded-b-3xl">
                            <p className="text-xs text-gray-500">
                                Buri kohereza biri muri audit log ya <code>employer_outreach</code>.
                            </p>
                            <div className="flex gap-2">
                                <button type="button" onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-gray-200 text-sm font-bold">Reka</button>
                                <button type="submit" disabled={sending || !selected.size || !emailReady}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                                    {sending
                                        ? <><Loader2 size={16} className="animate-spin" /> Birohereza...</>
                                        : <><Send size={16} /> Ohereza ({selected.size})</>}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SendRosterModal;

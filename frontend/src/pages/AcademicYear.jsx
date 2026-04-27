import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Calendar, Plus, Loader2, CheckCircle, Clock, Lock, ChevronRight,
    Award, GraduationCap, Users, RefreshCcw, AlertTriangle, X,
    PlayCircle, FileText, History, Sparkles
} from 'lucide-react';

const STATUS_BADGE = {
    active:   'bg-green-100 text-green-700  border-green-200',
    planning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    closed:   'bg-gray-200  text-gray-700   border-gray-300',
    upcoming: 'bg-gray-100  text-gray-600   border-gray-200',
    ended:    'bg-blue-100  text-blue-700   border-blue-200',
};

const todayISO = () => new Date().toISOString().split('T')[0];

function emptyYearForm() {
    const year = new Date().getFullYear();
    return {
        name: `${year}-${year + 1}`,
        start_date: `${year}-09-01`,
        end_date: `${year + 1}-07-15`,
        set_current: true,
        terms: [
            { name: 'Term 1', start_date: `${year}-09-01`,    end_date: `${year}-12-15` },
            { name: 'Term 2', start_date: `${year + 1}-01-10`, end_date: `${year + 1}-03-30` },
            { name: 'Term 3', start_date: `${year + 1}-04-15`, end_date: `${year + 1}-07-15` },
        ],
    };
}

const AcademicYear = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin' || user?.role === 'director';

    const [loading, setLoading]       = useState(true);
    const [years, setYears]           = useState([]);
    const [currentYear, setCurrent]   = useState(null);
    const [activeYearId, setActiveId] = useState(null); // tab
    const [yearDetail, setYearDetail] = useState(null);
    const [busy, setBusy]             = useState(false);

    const [showCreate, setShowCreate]    = useState(false);
    const [createForm, setCreateForm]    = useState(emptyYearForm());

    const [closeOpen, setCloseOpen]      = useState(false);
    const [closePreview, setClosePreview]= useState(null);
    const [createNextYear, setCreateNextYear] = useState(true);
    const [nextYearForm, setNextYearForm]= useState(emptyYearForm());

    const [promotionsCount, setPromCount]= useState({ promoted: 0, graduated: 0, retained: 0 });
    const [history, setHistory]          = useState([]);

    /* ─── data loaders ────────────────────────────────────────── */
    const loadAll = async () => {
        setLoading(true);
        try {
            const [yearsRes, currentRes] = await Promise.all([
                api.get('/academic-years'),
                api.get('/academic-years/current'),
            ]);
            setYears(yearsRes.data || []);
            setCurrent(currentRes.data || null);

            const targetId = activeYearId
                || currentRes.data?.id
                || (yearsRes.data?.[0]?.id ?? null);
            if (targetId) {
                setActiveId(targetId);
                const detail = await api.get(`/academic-years/${targetId}`);
                setYearDetail(detail.data);
            } else {
                setYearDetail(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo gufungura imyaka.');
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const r = await api.get('/academic-years/promotions?limit=200');
            setHistory(r.data || []);
        } catch (_) { /* silent */ }
    };

    useEffect(() => { loadAll(); loadHistory(); /* eslint-disable-next-line */ }, []);

    const switchYear = async (id) => {
        setActiveId(id);
        try {
            setLoading(true);
            const detail = await api.get(`/academic-years/${id}`);
            setYearDetail(detail.data);
        } finally {
            setLoading(false);
        }
    };

    /* ─── actions ─────────────────────────────────────────────── */
    const submitCreate = async () => {
        if (!createForm.name) return toast.error('Andika izina ry\'umwaka.');
        setBusy(true);
        try {
            const r = await api.post('/academic-years', createForm);
            toast.success(r.data?.message || 'Umwaka wandikishijwe.');
            setShowCreate(false);
            setCreateForm(emptyYearForm());
            await loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setBusy(false);
        }
    };

    const setCurrentApi = async (id) => {
        setBusy(true);
        try {
            await api.post(`/academic-years/${id}/set-current`);
            toast.success('Umwaka watoranyijwe.');
            await loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setBusy(false);
        }
    };

    const endTerm = async (yearId, termId) => {
        if (!window.confirm('Wemeza gufunga iyi term?')) return;
        setBusy(true);
        try {
            const r = await api.post(`/academic-years/${yearId}/terms/${termId}/end`);
            toast.success(`Term yarangiye (${r.data.ended}/${r.data.total}).`);
            await switchYear(yearId);
            await loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setBusy(false);
        }
    };

    const openCloseDialog = async () => {
        if (!yearDetail) return;
        setBusy(true);
        try {
            const r = await api.get(`/academic-years/${yearDetail.id}/preview-close`);
            setClosePreview(r.data);
            setPromCount(r.data.summary);
            // Pre-fill nextYearForm based on current year +1
            const m = (yearDetail.name || '').match(/(\d{4})/);
            const start = m ? parseInt(m[1], 10) + 1 : new Date().getFullYear() + 1;
            setNextYearForm({
                name: `${start}-${start + 1}`,
                start_date: `${start}-09-01`,
                end_date: `${start + 1}-07-15`,
                set_current: true,
                terms: [
                    { name: 'Term 1', start_date: `${start}-09-01`,    end_date: `${start}-12-15` },
                    { name: 'Term 2', start_date: `${start + 1}-01-10`, end_date: `${start + 1}-03-30` },
                    { name: 'Term 3', start_date: `${start + 1}-04-15`, end_date: `${start + 1}-07-15` },
                ],
            });
            setCloseOpen(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setBusy(false);
        }
    };

    const submitClose = async () => {
        if (!closePreview?.ready_to_close) {
            const ok = window.confirm('Hari terms zitarangiye. Wemeza gukomeza gufunga umwaka?');
            if (!ok) return;
        }
        setBusy(true);
        try {
            const payload = {};
            if (createNextYear) payload.next_year = nextYearForm;
            const r = await api.post(`/academic-years/${yearDetail.id}/close`, payload);
            toast.success(
                `Umwaka warangiye. Promoted=${r.data.promoted}, Graduated=${r.data.graduated}, Retained=${r.data.retained}`
            );
            setCloseOpen(false);
            setClosePreview(null);
            await loadAll();
            await loadHistory();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setBusy(false);
        }
    };

    /* ─── derived ─────────────────────────────────────────────── */
    const allTermsEnded = useMemo(
        () => yearDetail?.terms?.length === 3 && yearDetail.terms.every(t => t.status === 'ended'),
        [yearDetail]
    );

    if (!isAdmin) {
        return (
            <div className="text-center py-20 text-gray-400">
                <Lock size={48} className="mx-auto mb-3 opacity-30" />
                <p>Iri page ni ry'admin gusa.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2">
                            <Calendar size={26} /> Imyaka y'Amashuri
                        </h1>
                        <p className="text-primary-200 text-sm">
                            Genzura imyaka, terms, promotions n'ibyifuzo by'abana bashya.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadAll}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2"
                        >
                            <RefreshCcw size={16} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 bg-white text-primary-700 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-50"
                        >
                            <Plus size={18} /> Umwaka mushya
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                <StatCard icon={Calendar} label="Total Years" value={years.length} color="bg-primary-50 text-primary-700" />
                <StatCard icon={PlayCircle} label="Current Year" value={currentYear?.name || '—'} color="bg-green-50 text-green-700" />
                <StatCard icon={GraduationCap} label="Graduated (history)"
                    value={history.filter(h => h.action === 'graduated').length}
                    color="bg-amber-50 text-amber-700" />
                <StatCard icon={Sparkles} label="Promoted (history)"
                    value={history.filter(h => h.action === 'promoted').length}
                    color="bg-blue-50 text-blue-700" />
            </div>

            {/* Year tabs */}
            <div className="px-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {years.map(y => (
                        <button
                            key={y.id}
                            onClick={() => switchYear(y.id)}
                            className={`px-4 py-2 rounded-xl whitespace-nowrap border transition ${
                                activeYearId === y.id
                                    ? 'bg-primary-600 text-white border-primary-600 shadow'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                            }`}
                        >
                            <span className="font-bold">{y.name}</span>
                            <span className="ml-2 text-xs">
                                {y.is_current ? '★' : ''} ({y.status})
                            </span>
                        </button>
                    ))}
                    {years.length === 0 && (
                        <p className="text-gray-500 text-sm">Nta myaka yandikishijwe.</p>
                    )}
                </div>
            </div>

            {/* Year Detail */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="bg-white rounded-3xl p-12 text-center">
                            <Loader2 className="mx-auto animate-spin text-primary-500" size={36} />
                        </div>
                    ) : !yearDetail ? (
                        <div className="bg-white rounded-3xl p-12 text-center text-gray-400">
                            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Tangira ufungure umwaka mushya hejuru.</p>
                        </div>
                    ) : (
                        <>
                            {/* Year card */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">
                                            {yearDetail.name}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {yearDetail.start_date?.slice(0,10)} → {yearDetail.end_date?.slice(0,10)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[yearDetail.status]}`}>
                                            {yearDetail.status}
                                        </span>
                                        {yearDetail.is_current ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                                                Umwaka w'ubu
                                            </span>
                                        ) : yearDetail.status !== 'closed' && (
                                            <button
                                                onClick={() => setCurrentApi(yearDetail.id)}
                                                disabled={busy}
                                                className="px-3 py-1 rounded-full text-xs font-bold bg-primary-600 text-white hover:bg-primary-700"
                                            >
                                                Toranya
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Terms timeline */}
                                <div className="mt-6 space-y-3">
                                    {yearDetail.terms?.map(t => (
                                        <div
                                            key={t.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 hover:border-primary-200 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                                    t.status === 'ended'  ? 'bg-blue-100 text-blue-600'
                                                  : t.status === 'active' ? 'bg-green-100 text-green-600'
                                                  : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {t.term_number}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{t.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {t.start_date?.slice(0,10)} → {t.end_date?.slice(0,10)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[t.status]}`}>
                                                    {t.status}
                                                </span>
                                                {t.status !== 'ended' && yearDetail.status !== 'closed' && (
                                                    <button
                                                        onClick={() => endTerm(yearDetail.id, t.id)}
                                                        disabled={busy}
                                                        className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={14} /> Funga
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Year close action */}
                                {yearDetail.status !== 'closed' && (
                                    <div className="mt-6 p-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="text-amber-600 mt-1" size={22} />
                                            <div>
                                                <p className="font-bold text-amber-900">Funga umwaka & promote abana</p>
                                                <p className="text-xs text-amber-800/80">
                                                    {allTermsEnded
                                                        ? 'Terms zose zarangiye — wahindura igihe gifunga.'
                                                        : 'Genzura ko terms zose zarangiye mbere yo gufunga.'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={openCloseDialog}
                                            disabled={busy}
                                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2"
                                        >
                                            <Lock size={16} /> Funga umwaka
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Promotions for this year */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-black text-gray-800 flex items-center gap-2 mb-4">
                                    <History size={20} /> Promotions Log
                                </h3>
                                <PromotionTable rows={yearDetail.promotions || []} />
                            </div>
                        </>
                    )}
                </div>

                {/* Side: history + tips */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-800 flex items-center gap-2 mb-3">
                            <FileText size={18} /> Recent History (all years)
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {history.slice(0, 30).map(h => (
                                <div key={h.id} className="text-xs border border-gray-100 rounded-xl p-2 flex justify-between">
                                    <div>
                                        <span className="font-bold">{h.first_name} {h.last_name}</span>{' '}
                                        <span className="text-gray-500">{h.reg_number}</span>
                                        <div className="text-gray-500">
                                            {h.from_level || '—'} → {h.to_level || 'graduated'} · {h.from_trade}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full self-start font-bold ${
                                        h.action === 'graduated' ? 'bg-amber-100 text-amber-700'
                                      : h.action === 'promoted'  ? 'bg-green-100 text-green-700'
                                      : h.action === 'enrolled'  ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                    }`}>{h.action}</span>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <p className="text-xs text-gray-400">Nta promotions zaranditswe.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Create Year Modal ─────────────────────────────── */}
            {showCreate && (
                <Modal title="Andika umwaka mushya" onClose={() => setShowCreate(false)}>
                    <YearForm form={createForm} setForm={setCreateForm} showSetCurrent />
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold">Funga</button>
                        <button onClick={submitCreate} disabled={busy} className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold flex items-center justify-center gap-2">
                            {busy && <Loader2 className="animate-spin" size={16} />} Andika
                        </button>
                    </div>
                </Modal>
            )}

            {/* ─── Close Year Modal ──────────────────────────────── */}
            {closeOpen && closePreview && (
                <Modal title={`Funga ${yearDetail.name}`} onClose={() => setCloseOpen(false)} size="xl">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <SummaryPill label="Promoted"  value={promotionsCount.promoted}  color="bg-green-100 text-green-700" />
                        <SummaryPill label="Graduated" value={promotionsCount.graduated} color="bg-amber-100 text-amber-700" />
                        <SummaryPill label="Retained"  value={promotionsCount.retained}  color="bg-gray-100 text-gray-700" />
                    </div>

                    {!closePreview.ready_to_close && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2 mb-4">
                            <AlertTriangle size={18} className="mt-0.5" />
                            Hari terms zitarangiye. Niba ukomeza, terms zose zizafungwa.
                        </div>
                    )}

                    <div className="border rounded-xl max-h-64 overflow-y-auto mb-4">
                        <PromotionTable rows={closePreview.plan?.map(p => ({
                            id: p.student_id, ...p, first_name: p.name.split(' ')[0], last_name: p.name.split(' ').slice(1).join(' ')
                        })) || []} compact />
                    </div>

                    <label className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                        <input type="checkbox"
                            checked={createNextYear}
                            onChange={e => setCreateNextYear(e.target.checked)}
                        />
                        Tangira umwaka mushya nyuma yo gufunga (
                        <strong>{closePreview.pending_intake}</strong> applicants emejwe bategereje)
                    </label>

                    {createNextYear && (
                        <div className="p-4 bg-primary-50 rounded-2xl mb-3">
                            <YearForm form={nextYearForm} setForm={setNextYearForm} />
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setCloseOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold">Reka</button>
                        <button onClick={submitClose} disabled={busy} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2">
                            {busy && <Loader2 className="animate-spin" size={16} />} <Lock size={16} /> Funga umwaka
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

/* ─── small components ───────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
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

const SummaryPill = ({ label, value, color }) => (
    <div className={`rounded-xl p-3 font-bold text-center ${color}`}>
        <div className="text-2xl">{value}</div>
        <div className="text-xs">{label}</div>
    </div>
);

const Modal = ({ title, onClose, children, size = 'md' }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`bg-white rounded-3xl shadow-2xl w-full ${size === 'xl' ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                <h3 className="font-black text-gray-800">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

const Field = ({ label, children }) => (
    <label className="block">
        <span className="block text-xs font-bold uppercase text-gray-600 mb-1">{label}</span>
        {children}
    </label>
);

const YearForm = ({ form, setForm, showSetCurrent }) => {
    const update = (k, v) => setForm({ ...form, [k]: v });
    const updateTerm = (i, k, v) => {
        const terms = [...form.terms];
        terms[i] = { ...terms[i], [k]: v };
        setForm({ ...form, terms });
    };
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Izina">
                    <input className="w-full px-3 py-2 rounded-xl border" value={form.name}
                        onChange={e => update('name', e.target.value)} />
                </Field>
                <Field label="Itariki itangira">
                    <input type="date" className="w-full px-3 py-2 rounded-xl border" value={form.start_date || ''}
                        onChange={e => update('start_date', e.target.value)} />
                </Field>
                <Field label="Itariki irangira">
                    <input type="date" className="w-full px-3 py-2 rounded-xl border" value={form.end_date || ''}
                        onChange={e => update('end_date', e.target.value)} />
                </Field>
            </div>

            <div className="border-t pt-3">
                <p className="text-xs font-bold uppercase text-gray-600 mb-2">3 Terms</p>
                <div className="space-y-2">
                    {form.terms.map((t, i) => (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                            <Field label={`Term ${i + 1} izina`}>
                                <input className="w-full px-3 py-2 rounded-xl border" value={t.name}
                                    onChange={e => updateTerm(i, 'name', e.target.value)} />
                            </Field>
                            <Field label="Itangira">
                                <input type="date" className="w-full px-3 py-2 rounded-xl border" value={t.start_date}
                                    onChange={e => updateTerm(i, 'start_date', e.target.value)} />
                            </Field>
                            <Field label="Irangira">
                                <input type="date" className="w-full px-3 py-2 rounded-xl border" value={t.end_date}
                                    onChange={e => updateTerm(i, 'end_date', e.target.value)} />
                            </Field>
                        </div>
                    ))}
                </div>
            </div>

            {showSetCurrent && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={!!form.set_current}
                        onChange={e => update('set_current', e.target.checked)} />
                    Toranya nk'umwaka w'ubu (current)
                </label>
            )}
        </div>
    );
};

const PromotionTable = ({ rows, compact }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                    <th className="px-3 py-2 text-left">Umunyeshuri</th>
                    {!compact && <th className="px-3 py-2 text-left">Reg</th>}
                    <th className="px-3 py-2 text-left">Trade</th>
                    <th className="px-3 py-2 text-left">From</th>
                    <th className="px-3 py-2 text-left">To</th>
                    <th className="px-3 py-2 text-left">Action</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 && (
                    <tr><td colSpan={compact ? 5 : 6} className="text-center py-6 text-gray-400">Nta byanditse.</td></tr>
                )}
                {rows.map(r => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{r.first_name} {r.last_name}</td>
                        {!compact && <td className="px-3 py-2 text-xs text-gray-500">{r.reg_number}</td>}
                        <td className="px-3 py-2">{r.from_trade || r.trade}</td>
                        <td className="px-3 py-2">{r.from_level || '—'}</td>
                        <td className="px-3 py-2">{r.to_level || 'graduated'}</td>
                        <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.action === 'graduated' ? 'bg-amber-100 text-amber-700'
                              : r.action === 'promoted'  ? 'bg-green-100 text-green-700'
                              : r.action === 'enrolled'  ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>{r.action}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AcademicYear;

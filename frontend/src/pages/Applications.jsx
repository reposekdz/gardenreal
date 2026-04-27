import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
    FileText, CheckCircle, XCircle, Clock, Search, Filter,
    User, Mail, Phone, MapPin, GraduationCap, Calendar, ChevronDown,
    Check, X, Loader2, Send, Eye, Download, Plus, UserPlus, Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const TRADES = ['Software Development', 'Automobile Technology', 'Building and Construction'];
const LEVELS = {
    'Software Development': ['Level 3', 'Level 4', 'Level 5'],
    'Automobile Technology': ['Level 3', 'Level 4a', 'Level 4b', 'Level 5a', 'Level 5b'],
    'Building and Construction': ['Level 3', 'Level 4', 'Level 5']
};

const Applications = () => {
    const { t } = useTranslation();
    const { token, user } = useAuthStore();
    const headers = { Authorization: `Bearer ${token}` };
    const isAdmin = user.role === 'admin';
    const isDod = user.role === 'dod' || user.role === 'director_of_discipline';
    const isAccountant = user.role === 'accountant';
    const isStockManager = user.role === 'stock_manager';
    const isStaff = ['admin', 'dod', 'director_of_discipline', 'accountant', 'stock_manager', 'teacher', 'librarian', 'director', 'registrar'].includes(user.role);

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    // Enrollment modal (advanced)
    const [enrollOpen, setEnrollOpen]     = useState(false);
    const [enrollApp, setEnrollApp]       = useState(null);
    const [enrollForm, setEnrollForm]     = useState({});
    const [academicYears, setAcademicYears] = useState([]);
    const [currentYear, setCurrentYear]   = useState(null);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/applications`, { headers });
            setApplications(res.data || []);
        } catch (err) {
            toast.error('Habaye ikibazo mu gufungura amakuru');
        } finally {
            setLoading(false);
        }
    };

    const fetchYears = async () => {
        try {
            const [allRes, curRes] = await Promise.all([
                axios.get(`${API_URL}/api/academic-years`, { headers }),
                axios.get(`${API_URL}/api/academic-years/current`, { headers }),
            ]);
            setAcademicYears(allRes.data || []);
            setCurrentYear(curRes.data || null);
        } catch (_) { /* admin-only API; ignore for non-admins */ }
    };

    useEffect(() => {
        fetchApplications();
        fetchYears();
    }, []);

    const filteredApps = applications.filter(app => {
        const matchesFilter = filter === 'all' || app.status === filter;
        const matchesSearch = !searchTerm ||
            app.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.phone?.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const updateStatus = async (id, status) => {
        if (!reviewNotes.trim()) {
            toast.error('Andika ikibutse (review notes)');
            return;
        }
        setProcessing(true);
        try {
            await axios.put(`${API_URL}/api/applications/${id}`,
                { status, review_notes: reviewNotes },
                { headers }
            );
            toast.success(status === 'approved' ? 'Application approved! SMS yoherejwe.' : 'Application rejected');
            setShowModal(false);
            setReviewNotes('');
            fetchApplications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo');
        } finally {
            setProcessing(false);
        }
    };

    const openEnrollModal = (app) => {
        setEnrollApp(app);
        setEnrollForm({
            trade: app.trade || '',
            level: app.level || '',
            academic_year_id: currentYear?.id || '',
            student_type: 'private',
            reg_number: '',
            first_name: app.first_name || '',
            last_name:  app.last_name || '',
            gender:     app.gender || 'Male',
            date_of_birth: app.date_of_birth ? String(app.date_of_birth).slice(0, 10) : '',
            contact_phone: app.phone || '',
            contact_email: app.email || '',
            guardian_name: '',
            guardian_phone: app.parent_phone || '',
            guardian_relation: '',
            address_province: app.province || '',
            address_district: app.district || '',
            address_sector:   app.sector || '',
            review_notes: 'Enrolled by admin from application',
        });
        setEnrollOpen(true);
    };

    const submitEnroll = async () => {
        if (!enrollApp) return;
        if (!enrollForm.trade || !enrollForm.level) {
            return toast.error('Toranya trade na level.');
        }
        setProcessing(true);
        try {
            const payload = { ...enrollForm };
            if (!payload.academic_year_id) delete payload.academic_year_id;
            if (!payload.reg_number)       delete payload.reg_number;

            const res = await axios.post(
                `${API_URL}/api/applications/${enrollApp.id}/enroll`,
                payload,
                { headers }
            );
            toast.success(`Umunyeshuri yandikishijwe — Reg ${res.data.reg_number}.`);
            setEnrollOpen(false);
            setEnrollApp(null);
            fetchApplications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo.');
        } finally {
            setProcessing(false);
        }
    };

    const updateEnrollField = (key, value) =>
        setEnrollForm(prev => ({ ...prev, [key]: value }));

    const tradeLevels = enrollForm.trade && LEVELS[enrollForm.trade]
        ? LEVELS[enrollForm.trade]
        : ['Level 3', 'Level 4', 'Level 5'];

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            waitlisted: 'bg-blue-100 text-blue-700'
        };
        const labels = {
            pending: 'Ibiribwa',
            approved: 'Byemejwe',
            rejected: 'Byanzwe',
            waitlisted: 'Ku rutonde'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (!isAdmin && !isDod && !isAccountant && !isStockManager) {
        return (
            <div className="text-center py-20 text-gray-400">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p>Urupapuro rwawe ntabwo ruboneka.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black">Ibyifuzo byAbana</h1>
                        <p className="text-primary-200">Reba kandi uhe imyirondoro y'ibyifuzo</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white/10 rounded-xl px-4 py-2">
                            <span className="text-sm">Byose: </span>
                            <span className="font-bold">{applications.length}</span>
                        </div>
                        <div className="bg-white/10 rounded-xl px-4 py-2">
                            <span className="text-sm">Ibiribwa: </span>
                            <span className="font-bold text-yellow-300">{applications.filter(a => a.status === 'pending').length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Shakisha... (izina, email, telephone)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    {/* Filter */}
                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'Byose' : status === 'pending' ? 'Ibiribwa' : status === 'approved' ? 'Byemejwe' : 'Byanzwe'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Applications List */}
            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-primary-600" />
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl">
                        <FileText size={64} className="mx-auto mb-4 text-gray-200" />
                        <h3 className="text-xl font-bold text-gray-700">Nta Byifuzo</h3>
                        <p className="text-gray-400">nta byifuzo bifite iryo rubyiniro</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredApps.map(app => (
                            <div key={app.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                                                {app.first_name?.charAt(0)}{app.last_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{app.first_name} {app.last_name}</h3>
                                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1"><Phone size={14} /> {app.phone}</span>
                                                    <span className="flex items-center gap-1"><Mail size={14} /> {app.email || 'N/A'}</span>
                                                    <span className="flex items-center gap-1"><MapPin size={14} /> {app.province}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-primary-600 font-bold">
                                                <GraduationCap size={18} />
                                                {app.trade}
                                            </div>
                                            <div className="text-sm text-gray-500">{app.level}</div>
                                        </div>

                                        {getStatusBadge(app.status)}

                                        <div className="flex gap-2">
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedApp(app); setShowModal(true); }}
                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center gap-2"
                                                    >
                                                        <Check size={18} /> Emeza
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedApp({ ...app, status: 'rejected' }); setShowModal(true); }}
                                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center gap-2"
                                                    >
                                                        <X size={18} /> Anena
                                                    </button>
                                                </>
                                            )}
                                            {app.status === 'approved' && !app.enrolled_student_id && (
                                                <button
                                                    onClick={() => openEnrollModal(app)}
                                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center gap-2"
                                                >
                                                    <UserPlus size={18} /> Andika nk'umunyeshuri
                                                </button>
                                            )}
                                            {app.enrolled_student_id && (
                                                <span className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle size={14} /> Yanditse
                                                    {app.enrolled_trade && ` · ${app.enrolled_trade}`}
                                                    {app.enrolled_level && ` · ${app.enrolled_level}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {app.review_notes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                                        <strong>Note:</strong> {app.review_notes}
                                    </div>
                                )}

                                <div className="mt-4 text-xs text-gray-400">
                                    Applied: {new Date(app.applied_at).toLocaleDateString()} | Previous School: {app.previous_school || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showModal && selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        <div className={`px-6 py-5 rounded-t-3xl ${selectedApp.status === 'approved' ? 'bg-green-500' :
                            selectedApp.status === 'rejected' ? 'bg-red-500' : 'bg-primary-600'
                            }`}>
                            <h3 className="font-black text-white text-lg">
                                {selectedApp.status === 'approved' ? 'Emeza Application' :
                                    selectedApp.status === 'rejected' ? 'Anena Application' : 'Review Application'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <p className="font-bold text-gray-800">{selectedApp.first_name} {selectedApp.last_name}</p>
                                <p className="text-sm text-gray-500">{selectedApp.trade} - {selectedApp.level}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Andika ibibutse / Review Notes *
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    rows="4"
                                    placeholder="Impindure (izakoreshwa mu SMS)"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowModal(false); setReviewNotes(''); }}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedApp.id, selectedApp.status)}
                                    disabled={processing}
                                    className={`flex-1 px-4 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 ${selectedApp.status === 'approved'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                >
                                    {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {selectedApp.status === 'approved' ? 'Emeza' : 'Anena'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enroll Modal */}
            {enrollOpen && enrollApp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <Sparkles size={20} /> Enroll Applicant
                                </h3>
                                <p className="text-xs text-primary-100">
                                    {enrollApp.first_name} {enrollApp.last_name} — yasabye {enrollApp.trade} ({enrollApp.level})
                                </p>
                            </div>
                            <button onClick={() => setEnrollOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Academic context */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Academic Year">
                                    <select className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.academic_year_id || ''}
                                        onChange={e => updateEnrollField('academic_year_id', e.target.value)}>
                                        <option value="">— current —</option>
                                        {academicYears.map(y => (
                                            <option key={y.id} value={y.id}>
                                                {y.name} {y.is_current ? '★' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Trade">
                                    <select className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.trade}
                                        onChange={e => updateEnrollField('trade', e.target.value)}>
                                        <option value="">— hitamo —</option>
                                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </Field>
                                <Field label="Level">
                                    <select className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.level}
                                        onChange={e => updateEnrollField('level', e.target.value)}>
                                        <option value="">— hitamo —</option>
                                        {tradeLevels.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </Field>
                            </div>

                            {(enrollForm.trade !== enrollApp.trade || enrollForm.level !== enrollApp.level) && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                    Uri guhindura uko yasabye: <strong>{enrollApp.trade} / {enrollApp.level}</strong> →{' '}
                                    <strong>{enrollForm.trade} / {enrollForm.level}</strong>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="Reg No (option)">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        placeholder="Auto-generate niba ureka ubusa"
                                        value={enrollForm.reg_number || ''}
                                        onChange={e => updateEnrollField('reg_number', e.target.value)} />
                                </Field>
                                <Field label="Student Type">
                                    <select className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.student_type}
                                        onChange={e => updateEnrollField('student_type', e.target.value)}>
                                        <option value="private">Private</option>
                                        <option value="government">Government</option>
                                        <option value="bursary">Bursary</option>
                                    </select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="First Name">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.first_name}
                                        onChange={e => updateEnrollField('first_name', e.target.value)} />
                                </Field>
                                <Field label="Last Name">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.last_name}
                                        onChange={e => updateEnrollField('last_name', e.target.value)} />
                                </Field>
                                <Field label="Gender">
                                    <select className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.gender}
                                        onChange={e => updateEnrollField('gender', e.target.value)}>
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </Field>
                                <Field label="DOB">
                                    <input type="date" className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.date_of_birth || ''}
                                        onChange={e => updateEnrollField('date_of_birth', e.target.value)} />
                                </Field>
                                <Field label="Phone">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.contact_phone}
                                        onChange={e => updateEnrollField('contact_phone', e.target.value)} />
                                </Field>
                                <Field label="Email">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.contact_email || ''}
                                        onChange={e => updateEnrollField('contact_email', e.target.value)} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Province">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.address_province || ''}
                                        onChange={e => updateEnrollField('address_province', e.target.value)} />
                                </Field>
                                <Field label="District">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.address_district || ''}
                                        onChange={e => updateEnrollField('address_district', e.target.value)} />
                                </Field>
                                <Field label="Sector">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.address_sector || ''}
                                        onChange={e => updateEnrollField('address_sector', e.target.value)} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Guardian Name">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.guardian_name || ''}
                                        onChange={e => updateEnrollField('guardian_name', e.target.value)} />
                                </Field>
                                <Field label="Guardian Phone">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        value={enrollForm.guardian_phone || ''}
                                        onChange={e => updateEnrollField('guardian_phone', e.target.value)} />
                                </Field>
                                <Field label="Relation">
                                    <input className="w-full px-3 py-2 rounded-xl border"
                                        placeholder="Father / Mother / Guardian"
                                        value={enrollForm.guardian_relation || ''}
                                        onChange={e => updateEnrollField('guardian_relation', e.target.value)} />
                                </Field>
                            </div>

                            <Field label="Notes (SMS)">
                                <textarea className="w-full px-3 py-2 rounded-xl border" rows="2"
                                    value={enrollForm.review_notes || ''}
                                    onChange={e => updateEnrollField('review_notes', e.target.value)} />
                            </Field>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEnrollOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold">
                                    Reka
                                </button>
                                <button onClick={submitEnroll} disabled={processing}
                                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    {processing ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                    Andika
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Field = ({ label, children }) => (
    <label className="block">
        <span className="block text-xs font-bold uppercase text-gray-600 mb-1">{label}</span>
        {children}
    </label>
);

export default Applications;

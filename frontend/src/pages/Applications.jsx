import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
    FileText, CheckCircle, XCircle, Clock, Search, Filter,
    User, Mail, Phone, MapPin, GraduationCap, Calendar, ChevronDown,
    Check, X, Loader2, Send, Eye, Download, Plus
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

    // Add student form
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [studentForm, setStudentForm] = useState({
        first_name: '', last_name: '', gender: '', date_of_birth: '',
        phone: '', email: '', province: '', district: '', sector: '',
        trade: '', level: '', current_status: 'active'
    });

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

    useEffect(() => {
        fetchApplications();
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

    const addStudentFromApplication = async (app) => {
        setProcessing(true);
        try {
            // Handle both full application and simplified parent application
            const nameParts = app.student_name ? app.student_name.trim().split(' ') : [app.first_name || '', app.last_name || ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const studentData = {
                first_name: app.first_name || firstName,
                last_name: app.last_name || lastName,
                gender: app.gender,
                date_of_birth: app.date_of_birth,
                phone: app.phone,
                email: app.email,
                province: app.province,
                district: app.district,
                sector: app.sector,
                trade: app.trade,
                level: app.level,
                current_status: 'active',
                enrollment_date: new Date().toISOString().split('T')[0]
            };

            const studentRes = await axios.post(`${API_URL}/api/students`, studentData, { headers });
            const studentId = studentRes.data.studentId;

            // If there's a parent linked to this application, link them
            if (app.parent_phone) {
                try {
                    // Find parent by phone
                    const parentRes = await axios.get(`${API_URL}/api/parents?phone=${app.parent_phone}`, { headers });
                    if (parentRes.data && parentRes.data.length > 0) {
                        const parentId = parentRes.data[0].id;
                        await axios.post(`${API_URL}/api/parents/link`,
                            { student_id: studentId, parent_id: parentId, relationship: 'parent' },
                            { headers }
                        );
                    }
                } catch (e) {
                    console.log('Could not link parent:', e.message);
                }
            }

            // Update application status
            await axios.put(`${API_URL}/api/applications/${app.id}`,
                { status: 'approved', review_notes: 'Student added to system' },
                { headers }
            );

            toast.success('Umwana yashyizwe mu mucyo! SMS yoherejwe.');
            fetchApplications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habaye ikibazo');
        } finally {
            setProcessing(false);
        }
    };

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
                                            {app.status === 'approved' && (
                                                <button
                                                    onClick={() => addStudentFromApplication(app)}
                                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium flex items-center gap-2"
                                                >
                                                    <Plus size={18} /> Fata Umwana
                                                </button>
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
        </div>
    );
};

export default Applications;

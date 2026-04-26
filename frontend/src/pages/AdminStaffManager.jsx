import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, Edit2, X, RefreshCw, Shield, Eye, EyeOff, Save, Users } from 'lucide-react';

const ROLES = [
    { value: 'admin', label: 'Administrator (Umuyobozi Mukuru)' },
    { value: 'dod', label: 'Director of Discipline (DoD)' },
    { value: 'accountant', label: 'Accountant (Ushinzwe Imari)' },
    { value: 'stock_manager', label: 'Stock Manager (Ushinzwe Ububiko)' },
    { value: 'teacher', label: 'Teacher (Umwarimu)' },
];

const ROLE_COLORS = {
    admin: 'bg-purple-100 text-purple-800',
    dod: 'bg-red-100 text-red-800',
    accountant: 'bg-green-100 text-green-800',
    stock_manager: 'bg-amber-100 text-amber-800',
    teacher: 'bg-sky-100 text-sky-800',
};

const ROLE_LABELS = {
    admin: 'Administrator',
    dod: 'DoD',
    accountant: 'Accountant',
    stock_manager: 'Stock Manager',
    teacher: 'Teacher',
};

const emptyForm = { first_name: '', last_name: '', phone: '', username: '', password: '', role: '' };

const AdminStaffManager = () => {
    const { token, user: currentUser } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const headers = { Authorization: `Bearer ${token}` };

    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/auth/users`, { headers });
            setStaff(res.data);
        } catch { toast.error('Failed to load staff'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStaff(); }, []);

    const openCreate = () => {
        setEditingStaff(null);
        setForm(emptyForm);
        setShowPassword(false);
        setShowForm(true);
    };

    const openEdit = (s) => {
        setEditingStaff(s);
        setForm({
            first_name: s.first_name || '',
            last_name: s.last_name || '',
            phone: s.phone || '',
            username: s.username || '',
            password: '',
            role: s.role || '',
        });
        setShowPassword(false);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingStaff) {
                const payload = {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    phone: form.phone,
                    role: form.role,
                };
                if (form.password) payload.password = form.password;
                await axios.put(`${API_URL}/api/auth/users/${editingStaff.id}`, payload, { headers });
                toast.success(`${form.first_name}'s profile updated!`);
            } else {
                await axios.post(`${API_URL}/api/auth/users`, form, { headers });
                toast.success(`Account for ${form.first_name} created! SMS sent.`);
            }
            setShowForm(false);
            setEditingStaff(null);
            setForm(emptyForm);
            fetchStaff();
        } catch (err) { toast.error(err.response?.data?.message || 'An error occurred'); }
        finally { setSubmitting(false); }
    };

    const deleteStaff = async (id, name) => {
        if (id === currentUser.id) return toast.error("You can't delete your own account");
        if (!window.confirm(`Delete account for ${name}? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API_URL}/api/auth/users/${id}`, { headers });
            toast.success('Account deleted');
            fetchStaff();
        } catch { toast.error('Failed to delete'); }
    };

    const filtered = staff.filter(s => {
        const matchSearch = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = !filterRole || s.role === filterRole;
        return matchSearch && matchRole;
    });

    const roleCounts = ROLES.reduce((acc, r) => {
        acc[r.value] = staff.filter(s => s.role === r.value).length;
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Shield className="text-indigo-300" size={28} /> Staff Management
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">Manage all staff accounts and roles</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchStaff} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold flex items-center gap-2">
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button onClick={openCreate} className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2">
                            <UserPlus size={16} /> Add Staff
                        </button>
                    </div>
                </div>

                {/* Role Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                    {ROLES.map(r => (
                        <div key={r.value} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-indigo-200 text-xs">{ROLE_LABELS[r.value]}</p>
                            <p className="text-2xl font-bold mt-1">{roleCounts[r.value] || 0}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-white text-lg">
                                    {editingStaff ? `Edit: ${editingStaff.first_name} ${editingStaff.last_name}` : 'New Staff Account'}
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    {editingStaff ? 'Update staff information' : 'Credentials will be sent via SMS'}
                                </p>
                            </div>
                            <button onClick={() => { setShowForm(false); setEditingStaff(null); }}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">First Name *</label>
                                    <input required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Jean" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Last Name *</label>
                                    <input required value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Mugisha" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone * <span className="font-normal text-gray-400">(receives SMS credentials)</span></label>
                                <input required={!editingStaff} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="0780000000" type="tel" />
                            </div>
                            {!editingStaff && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Username * <span className="font-normal text-gray-400">(for login)</span></label>
                                    <input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="jean.mugisha" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    {editingStaff ? 'New Password (leave blank to keep current)' : 'Password *'}
                                </label>
                                <div className="relative">
                                    <input
                                        required={!editingStaff}
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none pr-10"
                                        placeholder={editingStaff ? 'Leave blank to keep current' : 'Min 6 characters'}
                                        minLength={editingStaff ? 0 : 6}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Role *</label>
                                <select required value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                    <option value="">-- Select role --</option>
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingStaff(null); }}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                                        editingStaff ? <><Save size={16} /> Update</> : <><UserPlus size={16} /> Create & Send SMS</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                        />
                    </div>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm">
                        <option value="">All Roles</option>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{ROLE_LABELS[r.value]}</option>)}
                    </select>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" /> All Staff ({filtered.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-12 text-center">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                                    <Shield size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No staff found</p>
                                </td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className={`hover:bg-gray-50 ${s.id === currentUser.id ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-black">
                                                {s.first_name?.[0]}{s.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{s.first_name} {s.last_name}</p>
                                                {s.id === currentUser.id && <p className="text-xs text-indigo-500 font-semibold">You</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{s.username}</td>
                                    <td className="px-6 py-4 text-sm">{s.phone || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[s.role] || 'bg-gray-100 text-gray-700'}`}>
                                            {ROLE_LABELS[s.role] || s.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(s)}
                                                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Edit">
                                                <Edit2 size={15} />
                                            </button>
                                            {s.id !== currentUser.id && (
                                                <button onClick={() => deleteStaff(s.id, `${s.first_name} ${s.last_name}`)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminStaffManager;

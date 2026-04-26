import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Bell, Send, Users, Settings, Clock, AlertTriangle,
    CheckCircle, XCircle, MessageSquare, Phone, Mail,
    Calendar, Filter, RefreshCw, Play, Pause, Plus,
    Trash2, Edit, ChevronDown, Search
} from 'lucide-react';

const PaymentReminders = ({ token }) => {
    const [activeTab, setActiveTab] = useState('debtors');
    const [loading, setLoading] = useState(false);
    const [debtors, setDebtors] = useState([]);
    const [selectedDebtors, setSelectedDebtors] = useState([]);
    const [autoSettings, setAutoSettings] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ trade: 'all', level: 'all' });

    const API_URL = '/api/payment-reminders';

    // Fetch data
    const fetchDebtors = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/debtors`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { trade: filters.trade, level: filters.level }
            });
            setDebtors(res.data);
        } catch (error) {
            toast.error('Failed to load debtors');
        } finally {
            setLoading(false);
        }
    };

    const fetchAutoSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/auto-settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAutoSettings(res.data);
        } catch (error) {
            console.error('Failed to load auto settings');
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_URL}/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
        } catch (error) {
            console.error('Failed to load templates');
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error('Failed to load history');
        }
    };

    const fetchStatistics = async () => {
        try {
            const res = await axios.get(`${API_URL}/statistics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatistics(res.data);
        } catch (error) {
            console.error('Failed to load statistics');
        }
    };

    useEffect(() => {
        fetchDebtors();
        fetchAutoSettings();
        fetchTemplates();
        fetchHistory();
        fetchStatistics();
    }, []);

    useEffect(() => {
        fetchDebtors();
    }, [filters]);

    // Send single reminder
    const sendSingleReminder = async (debtor) => {
        try {
            const res = await axios.post(`${API_URL}/send`,
                { student_id: debtor.student_id, parent_id: debtor.parent_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            fetchHistory();
            fetchStatistics();
        } catch (error) {
            toast.error('Failed to send reminder');
        }
    };

    // Send bulk reminders
    const sendBulkReminders = async () => {
        if (selectedDebtors.length === 0) {
            toast.warning('Select at least one debtor');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/send-bulk`,
                { student_ids: selectedDebtors },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            setSelectedDebtors([]);
            fetchHistory();
            fetchStatistics();
        } catch (error) {
            toast.error('Failed to send bulk reminders');
        } finally {
            setLoading(false);
        }
    };

    // Remind all debtors
    const remindAllDebtors = async () => {
        if (debtors.length === 0) {
            toast.warning('No debtors to remind');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/remind-all`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            fetchHistory();
            fetchStatistics();
        } catch (error) {
            toast.error('Failed to remind all debtors');
        } finally {
            setLoading(false);
        }
    };

    // Trigger auto-reminder
    const triggerAutoReminder = async () => {
        try {
            const res = await axios.post(`${API_URL}/trigger-auto`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message);
            fetchHistory();
            fetchStatistics();
        } catch (error) {
            toast.error('Failed to trigger auto-reminder');
        }
    };

    // Update auto-settings
    const updateAutoSettings = async (data) => {
        try {
            await axios.put(`${API_URL}/auto-settings`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Settings updated');
            fetchAutoSettings();
            setShowSettingsModal(false);
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    // Create template
    const createTemplate = async (data) => {
        try {
            await axios.post(`${API_URL}/templates`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Template created');
            fetchTemplates();
            setShowTemplateModal(false);
        } catch (error) {
            toast.error('Failed to create template');
        }
    };

    // Toggle debtor selection
    const toggleDebtor = (id) => {
        setSelectedDebtors(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    // Toggle all
    const toggleAll = () => {
        if (selectedDebtors.length === filteredDebtors.length) {
            setSelectedDebtors([]);
        } else {
            setSelectedDebtors(filteredDebtors.map(d => d.student_id));
        }
    };

    const filteredDebtors = debtors.filter(d => {
        const searchMatch = searchTerm === '' ||
            `${d.student_first_name} ${d.student_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.reg_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.parent_phone?.includes(searchTerm);
        return searchMatch;
    });

    // Render Dashboard
    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-orange-100 text-sm">Total Debtors</p>
                            <p className="text-2xl font-black">{debtors.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Send size={24} />
                        </div>
                        <div>
                            <p className="text-green-100 text-sm">Sent This Month</p>
                            <p className="text-2xl font-black">{statistics?.totals?.total_sent || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-blue-100 text-sm">Successful</p>
                            <p className="text-2xl font-black">{statistics?.totals?.total_delivered || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-red-100 text-sm">Failed</p>
                            <p className="text-2xl font-black">{statistics?.totals?.total_failed || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Bell size={20} className="text-orange-600" /> Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={remindAllDebtors}
                        disabled={loading || debtors.length === 0}
                        className="px-4 py-2 bg-orange-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-orange-700 disabled:opacity-50"
                    >
                        <Send size={16} /> Remind All Debtors
                    </button>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Settings size={16} /> Auto-Reminder Settings
                    </button>
                    <button
                        onClick={triggerAutoReminder}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-purple-700"
                    >
                        <Play size={16} /> Trigger Auto-Reminder
                    </button>
                    <button
                        onClick={() => { fetchDebtors(); fetchHistory(); fetchStatistics(); }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-200"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Auto-Reminder Status */}
            {autoSettings && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                {autoSettings.is_enabled ? <CheckCircle size={20} className="text-green-600" /> : <XCircle size={20} className="text-gray-400" />}
                                Auto-Reminder Status
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {autoSettings.is_enabled
                                    ? `Running ${autoSettings.reminder_type} at ${autoSettings.schedule_time} on ${autoSettings.schedule_day}`
                                    : 'Auto-reminder is disabled'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="text-orange-600 hover:underline text-sm font-medium"
                        >
                            Configure
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // Render Debtors Tab
    const renderDebtors = () => (
        <div className="space-y-4">
            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search debtors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <select
                        value={filters.trade}
                        onChange={(e) => setFilters({ ...filters, trade: e.target.value })}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">All Trades</option>
                        <option value="Software Development">Software Development</option>
                        <option value="Automobile Technology">Automobile Technology</option>
                        <option value="Building and Construction">Building and Construction</option>
                    </select>
                    <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">All Levels</option>
                        <option value="Level 3">Level 3</option>
                        <option value="Level 4">Level 4</option>
                        <option value="Level 5">Level 5</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={sendBulkReminders}
                        disabled={selectedDebtors.length === 0 || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send size={16} /> Send Selected ({selectedDebtors.length})
                    </button>
                </div>
            </div>

            {/* Select All */}
            {filteredDebtors.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                        type="checkbox"
                        checked={selectedDebtors.length === filteredDebtors.length && filteredDebtors.length > 0}
                        onChange={toggleAll}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        Select all ({filteredDebtors.length} debtors)
                    </span>
                </div>
            )}

            {/* Debtors Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parent</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDebtors.map((debtor) => (
                            <tr key={`${debtor.student_id}-${debtor.parent_id}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDebtors.includes(debtor.student_id)}
                                        onChange={() => toggleDebtor(debtor.student_id)}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{debtor.student_first_name} {debtor.student_last_name}</p>
                                        <p className="text-xs text-gray-500">{debtor.reg_number} | {debtor.trade} - {debtor.level}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="text-sm text-gray-900">{debtor.parent_first_name} {debtor.parent_last_name || '-'}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm text-gray-600">{debtor.parent_phone || debtor.guardian_phone || '-'}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="font-bold text-red-600">{Number(debtor.balance || 0).toLocaleString()} RWF</span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => sendSingleReminder(debtor)}
                                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200"
                                    >
                                        <Bell size={14} className="inline mr-1" /> Remind
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredDebtors.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    No debtors found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Render History Tab
    const renderHistory = () => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parent</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {history.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {item.sent_at ? new Date(item.sent_at).toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">{item.student_first_name} {item.student_last_name}</p>
                                <p className="text-xs text-gray-500">{item.reg_number}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                                {item.parent_first_name} {item.parent_last_name}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.reminder_type === 'manual' ? 'bg-blue-100 text-blue-700' :
                                        item.reminder_type === 'auto' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {item.reminder_type}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                {item.message_content}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.sms_status === 'sent' || item.sms_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        item.sms_status === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {item.sms_status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                No reminder history
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // Render Templates Tab
    const renderTemplates = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-orange-700"
                >
                    <Plus size={16} /> Add Template
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800">{template.template_name}</h4>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{template.template_content}</p>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                        No templates available
                    </div>
                )}
            </div>
        </div>
    );

    // Main render
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Bell size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Payment Reminders</h2>
                        <p className="text-orange-200 text-sm">Manage automatic and manual payment reminders to parents</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: Bell },
                    { id: 'debtors', label: 'Debtors', count: debtors.length, icon: Users },
                    { id: 'history', label: 'History', icon: Clock },
                    { id: 'templates', label: 'Templates', icon: MessageSquare }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 font-semibold text-sm transition-all rounded-xl flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-orange-100 text-orange-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-orange-200 rounded-full">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'debtors' && renderDebtors()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'templates' && renderTemplates()}

            {/* Settings Modal */}
            {showSettingsModal && (
                <AutoSettingsModal
                    settings={autoSettings}
                    onSave={updateAutoSettings}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <TemplateModal
                    onSave={createTemplate}
                    onClose={() => setShowTemplateModal(false)}
                />
            )}
        </div>
    );
};

// Auto Settings Modal Component
const AutoSettingsModal = ({ settings, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        is_enabled: settings?.is_enabled || false,
        reminder_type: settings?.reminder_type || 'weekly',
        schedule_day: settings?.schedule_day || 'monday',
        schedule_time: settings?.schedule_time || '08:00:00',
        min_balance_threshold: settings?.min_balance_threshold || 0,
        message_template: settings?.message_template || 'Muraho mwiriwe, umwana {{student_name}} afite ikibanza ya {{balance}} RWF. Mwakifashishamo kwishyura vuba. Murakoze!'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Auto-Reminder Settings</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-800">Enable Auto-Reminders</p>
                            <p className="text-sm text-gray-500">Automatically send reminders on schedule</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_enabled}
                                onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                            value={formData.reminder_type}
                            onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    {formData.reminder_type === 'weekly' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                            <select
                                value={formData.schedule_day}
                                onChange={(e) => setFormData({ ...formData, schedule_day: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="monday">Monday</option>
                                <option value="tuesday">Tuesday</option>
                                <option value="wednesday">Wednesday</option>
                                <option value="thursday">Thursday</option>
                                <option value="friday">Friday</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <input
                            type="time"
                            value={formData.schedule_time}
                            onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Balance (RWF)</label>
                        <input
                            type="number"
                            value={formData.min_balance_threshold}
                            onChange={(e) => setFormData({ ...formData, min_balance_threshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
                        <p className="text-xs text-gray-500 mb-2">Use {{ student_name }}, {{ reg_number }}, {{ balance }}, {{ trade }}, {{ level }}</p>
                        <textarea
                            value={formData.message_template}
                            onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Template Modal Component
const TemplateModal = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
        template_name: '',
        template_content: '',
        is_active: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Create Template</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                        <input
                            type="text"
                            value={formData.template_name}
                            onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <p className="text-xs text-gray-500 mb-2">Use {{ student_name }}, {{ reg_number }}, {{ balance }}, {{ trade }}, {{ level }}</p>
                        <textarea
                            value={formData.template_content}
                            onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentReminders;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Edit, Trash2, Plus, X, Save, MessageSquare, Send, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const SMSTemplatesManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        template_key: '',
        template_name: '',
        message_rw: '',
        message_en: '',
        message_fr: '',
        is_active: true
    });
    const [showForm, setShowForm] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/sms-templates`, { headers });
            setTemplates(res.data);
        } catch (err) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                await axios.put(`${API_URL}/api/sms-templates/${editingTemplate.id}`, formData, { headers });
                toast.success('Template updated!');
            } else {
                await axios.post(`${API_URL}/api/sms-templates`, formData, { headers });
                toast.success('Template created!');
            }
            fetchTemplates();
            resetForm();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save template');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            template_key: template.template_key,
            template_name: template.template_name,
            message_rw: template.message_rw,
            message_en: template.message_en || '',
            message_fr: template.message_fr || '',
            is_active: template.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await axios.delete(`${API_URL}/api/sms-templates/${id}`, { headers });
                toast.success('Template deleted!');
                fetchTemplates();
            } catch (err) {
                toast.error('Failed to delete template');
            }
        }
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setFormData({
            template_key: '',
            template_name: '',
            message_rw: '',
            message_en: '',
            message_fr: '',
            is_active: true
        });
        setShowForm(false);
    };

    const templateCategories = [
        { key: 'leave', label: 'Leave', color: 'blue' },
        { key: 'sick', label: 'Sick', color: 'red' },
        { key: 'discipline', label: 'Discipline', color: 'orange' },
        { key: 'payment', label: 'Payment', color: 'green' },
        { key: 'grade', label: 'Grades', color: 'purple' },
        { key: 'welcome', label: 'Welcome', color: 'pink' },
        { key: 'link', label: 'Link', color: 'indigo' }
    ];

    const getCategoryColor = (key) => {
        const cat = templateCategories.find(c => key.includes(c.key));
        return cat?.color || 'gray';
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare size={24} className="text-primary-600" />
                        SMS Templates
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage SMS templates for all events</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                >
                    <Plus size={20} /> New Template
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h3 className="font-bold text-lg">
                                {editingTemplate ? 'Edit Template' : 'New SMS Template'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Template Key</label>
                                    <input
                                        value={formData.template_key}
                                        onChange={e => setFormData({ ...formData, template_key: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="e.g., leave_approved"
                                        required
                                        disabled={!!editingTemplate}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Template Name</label>
                                    <input
                                        value={formData.template_name}
                                        onChange={e => setFormData({ ...formData, template_name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="e.g., Leave Approved"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Message (Kinyarwanda) *</label>
                                <textarea
                                    value={formData.message_rw}
                                    onChange={e => setFormData({ ...formData, message_rw: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="Use {{variable}} for dynamic values"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Variables: {{ parent_name }}, {{ student_name }}, {{ reason }}, etc.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Message (English)</label>
                                <textarea
                                    value={formData.message_en}
                                    onChange={e => setFormData({ ...formData, message_en: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="English message"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">Message (Français)</label>
                                <textarea
                                    value={formData.message_fr}
                                    onChange={e => setFormData({ ...formData, message_fr: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="Message en français"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold">Active</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                    <Save size={18} className="inline mr-2" />
                                    Save Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Templates Grid */}
            <div className="grid gap-4">
                {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-xl shadow-sm border p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900">{template.template_name}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-${getCategoryColor(template.template_key)}-100 text-${getCategoryColor(template.template_key)}-700`}>
                                        {template.template_key}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 font-mono">{template.message_rw?.substring(0, 100)}...</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(template)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(template.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No templates found. Create your first template!
                </div>
            )}
        </div>
    );
};

export default SMSTemplatesManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Users, Search, Phone, Mail, Calendar, Trash2,
    MessageSquare, UserPlus, X, Send, RefreshCw,
    Shield, AlertTriangle, CheckCircle, User, ChevronDown
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const ParentManagement = () => {
    const { token, user } = useAuthStore();
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParent, setSelectedParent] = useState(null);
    const [linkedStudents, setLinkedStudents] = useState([]);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    const fetchParents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/parents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParents(res.data);
        } catch (error) {
            console.error('Error fetching parents:', error);
            toast.error('Failed to load parents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParents();
    }, []);

    const handleDeleteParent = async (parentId) => {
        if (!window.confirm('Wakuriye ko ushaka gusiba uyu mubyeyi? Iyi nibirasohoka.')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/api/parents/${parentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Parent deleted successfully');
            fetchParents();
        } catch (error) {
            toast.error('Failed to delete parent');
        }
    };

    const handleViewLinkedStudents = async (parent) => {
        setSelectedParent(parent);
        try {
            const res = await axios.get(`${API_URL}/api/parents/${parent.id}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinkedStudents(res.data);
        } catch (error) {
            console.error('Error fetching linked students:', error);
            setLinkedStudents([]);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedParent) return;
        setSendingMessage(true);
        try {
            await axios.post(`${API_URL}/api/sms/send`, {
                phone: selectedParent.phone,
                message: messageText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Message sent successfully');
            setShowMessageModal(false);
            setMessageText('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const filteredParents = parents.filter(p =>
        p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-6">
                    <div className="flex items-center gap-3">
                        <Users size={32} />
                        <div>
                            <h1 className="text-2xl font-bold">Kug管理 Ababyeyi</h1>
                            <p className="text-blue-200">Manage Parents</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="bg-white/10 rounded-xl px-4 py-2">
                            <span className="text-2xl font-bold">{parents.length}</span>
                            <span className="text-blue-200 ml-2">Total Ababyeyi</span>
                        </div>
                        <button
                            onClick={fetchParents}
                            className="ml-auto bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Reba
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Shakisha ababyeyi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Parents List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading...</p>
                        </div>
                    ) : filteredParents.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Ntababyeyi baragaragara</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Umwana</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Telefoni</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Itariki</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Ibikorwa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredParents.map(parent => (
                                    <tr key={parent.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        {parent.first_name} {parent.last_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-gray-400" />
                                                <span>{parent.phone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-gray-400" />
                                                <span className="text-sm">{parent.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-400" />
                                                <span className="text-sm">
                                                    {parent.created_at ? new Date(parent.created_at).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewLinkedStudents(parent)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="View Linked Children"
                                                >
                                                    <Users size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedParent(parent);
                                                        setShowMessageModal(true);
                                                    }}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Send Message"
                                                >
                                                    <MessageSquare size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteParent(parent.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Linked Students Modal */}
            {selectedParent && !showMessageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">
                                Abana ba {selectedParent.first_name} {selectedParent.last_name}
                            </h3>
                            <button onClick={() => setSelectedParent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {linkedStudents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Ntabana baragaragara</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {linkedStudents.map(link => (
                                        <div key={link.id} className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold">{link.student_name}</p>
                                                    <p className="text-sm text-gray-500">{link.student_trade} - {link.student_level}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${link.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {link.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMessageModal && selectedParent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Ohereza ubutumwa</h3>
                            <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Kuri:</p>
                                <p className="font-bold">{selectedParent.first_name} {selectedParent.last_name}</p>
                                <p className="text-sm text-gray-500">{selectedParent.phone}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ubutumwa</label>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Andika ubutumwa wawe..."
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={sendingMessage || !messageText.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                {sendingMessage ? (
                                    <>...</>
                                ) : (
                                    <>
                                        <Send size={18} /> Ohereza
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentManagement;

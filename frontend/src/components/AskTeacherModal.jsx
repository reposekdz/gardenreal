import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, Send, Loader2, MessageCircleQuestion, User, GraduationCap, Phone } from 'lucide-react';

const AskTeacherModal = ({ open, onClose, tradeCode, tradeName, level, levels = [], apiUrl = '' }) => {
    const [form, setForm] = useState({
        student_name: '',
        trade_code: tradeCode || '',
        level: level || '',
        question: '',
        contact: ''
    });
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        if (open) {
            setForm(f => ({
                ...f,
                trade_code: tradeCode || f.trade_code,
                level: level || f.level,
            }));
        }
    }, [open, tradeCode, level]);

    if (!open) return null;

    const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.student_name.trim() || !form.trade_code || !form.level || !form.question.trim()) {
            return toast.error('Uzuza amakuru yose');
        }
        if (form.question.trim().length < 5) {
            return toast.error('Ikibazo cyawe ni gito cyane');
        }
        setSubmitting(true);
        try {
            await axios.post(`${apiUrl}/api/student-questions`, {
                ...form,
                trade_name: tradeName || null
            });
            toast.success('Ikibazo cyawe cyoherejwe kuri mwarimu!');
            setForm({ student_name: '', trade_code: tradeCode || '', level: level || '', question: '', contact: '' });
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Habayemo ikibazo. Gerageza nanone.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
                            <MessageCircleQuestion className="text-accent-400" size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg">Baza Mwarimu</h3>
                            <p className="text-primary-200 text-xs">Andika ikibazo cyawe — mwarimu azagusubiza.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1" aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            <User size={12} className="inline mr-1 -mt-0.5" /> Amazina yawe *
                        </label>
                        <input
                            required maxLength={150}
                            value={form.student_name}
                            onChange={e => handleChange('student_name', e.target.value)}
                            placeholder="Mukamana Aline"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                <GraduationCap size={12} className="inline mr-1 -mt-0.5" /> Umwuga
                            </label>
                            <input
                                value={tradeName || form.trade_code}
                                disabled
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Urwego *</label>
                            {levels && levels.length > 0 ? (
                                <select
                                    required
                                    value={form.level}
                                    onChange={e => handleChange('level', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                >
                                    <option value="">-- Hitamo --</option>
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            ) : (
                                <input
                                    required maxLength={80}
                                    value={form.level}
                                    onChange={e => handleChange('level', e.target.value)}
                                    placeholder="Level 4"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Ikibazo cyawe *</label>
                        <textarea
                            required
                            rows={5}
                            maxLength={4000}
                            value={form.question}
                            onChange={e => handleChange('question', e.target.value)}
                            placeholder="Andika ikibazo cyawe hano..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.question.length}/4000</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            <Phone size={12} className="inline mr-1 -mt-0.5" /> Telefoni / Email (optional)
                        </label>
                        <input
                            maxLength={120}
                            value={form.contact}
                            onChange={e => handleChange('contact', e.target.value)}
                            placeholder="07XX XXX XXX cyangwa email"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">
                            Hagarika
                        </button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-700 to-primary-900 hover:from-primary-800 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Ohereza ikibazo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AskTeacherModal;

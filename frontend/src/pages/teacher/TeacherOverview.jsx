import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
    FileText, MessageCircleQuestion, Heart, Users, Eye, Download,
    BookOpen, Loader2, ArrowRight, Bookmark, ShieldAlert
} from 'lucide-react';

const Card = ({ icon: Icon, label, value, color = 'blue', to }) => {
    const inner = (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-${color}-300 transition-all`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-black text-${color}-700 mt-1`}>{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center`}>
                    <Icon size={22} className={`text-${color}-600`} />
                </div>
            </div>
        </div>
    );
    return to ? <Link to={to}>{inner}</Link> : inner;
};

const TeacherOverview = () => {
    const { user, token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/teacher/engagement`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch {
                /* ignore */
            } finally { setLoading(false); }
        };
        load();
    }, [API_URL, token]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

    const totals = data?.totals || {};

    return (
        <div className="space-y-6">
            <section className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl">
                <h1 className="text-2xl lg:text-3xl font-black">Murakaza neza, {user.first_name}!</h1>
                <p className="text-primary-200 mt-1">Reba uko abanyeshuri bakoresha inyandiko zawe, subiza ibibazo byabo, kandi wandike imyitwarire.</p>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card icon={FileText}              label="Inyandiko zanjye" value={totals.notes || 0}  color="blue"   to="/teacher/notes" />
                <Card icon={Eye}                   label="Views"            value={totals.views || 0}  color="emerald" />
                <Card icon={Download}              label="Downloads"        value={totals.downloads || 0} color="purple" />
                <Card icon={MessageCircleQuestion} label="Ibitarasubizwa"   value={totals.pending_questions || 0} color="red" to="/teacher/questions" />
                <Card icon={Heart}                 label="Likes"            value={totals.likes || 0}  color="rose" to="/teacher/engagement" />
                <Card icon={BookOpen}              label="Comments"         value={totals.comments || 0} color="amber" to="/teacher/engagement" />
                <Card icon={Bookmark}              label="Bookmarks"        value={totals.bookmarks || 0} color="indigo" to="/teacher/engagement" />
                <Card icon={ShieldAlert}           label="Hands raised"     value={totals.raised_hands || 0} color="orange" to="/teacher/engagement" />
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-black text-lg text-gray-900">Inyandiko zikomeye</h2>
                    <Link to="/teacher/notes" className="text-sm text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
                        Zose <ArrowRight size={14} />
                    </Link>
                </div>
                {data?.notes && data.notes.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-4 py-3 text-left">Note</th>
                                    <th className="px-4 py-3 text-left">Trade / Level</th>
                                    <th className="px-4 py-3 text-right">Views</th>
                                    <th className="px-4 py-3 text-right">Likes</th>
                                    <th className="px-4 py-3 text-right">Comments</th>
                                    <th className="px-4 py-3 text-right">Hands</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.notes.slice(0, 8).map(n => (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900">{n.title}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{n.trade_code} · {n.level}</td>
                                        <td className="px-4 py-3 text-right">{n.view_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-rose-600 font-bold">{n.like_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-amber-600 font-bold">{n.comment_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-orange-600 font-bold">{n.hand_count || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-gray-500">
                        <FileText size={40} className="mx-auto mb-2 opacity-30" />
                        <p>Nta nyandiko ziraboneka. Tangira ushyiremo iya mbere.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherOverview;

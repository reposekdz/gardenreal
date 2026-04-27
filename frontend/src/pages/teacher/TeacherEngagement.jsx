import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import {
    Loader2, Heart, MessageCircle, Bookmark, ThumbsUp, HelpCircle,
    FileText, Eye, Download, BarChart3
} from 'lucide-react';

const TeacherEngagement = () => {
    const { token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const headers = { Authorization: `Bearer ${token}` };

    const [data, setData] = useState(null);
    const [comments, setComments] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('per-note');

    useEffect(() => {
        const load = async () => {
            try {
                const [eng, cmt, bm] = await Promise.all([
                    axios.get(`${API_URL}/api/teacher/engagement`, { headers }),
                    axios.get(`${API_URL}/api/teacher/notes/comments`, { headers }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/teacher/notes/bookmarks`, { headers }).catch(() => ({ data: [] }))
                ]);
                setData(eng.data); setComments(cmt.data); setBookmarks(bm.data);
            } catch (e) { toast.error('Failed to load'); }
            finally { setLoading(false); }
        };
        load();
    }, [API_URL, token]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

    const totals = data?.totals || {};
    const fmtDate = (d) => new Date(d).toLocaleString('en-GB');

    const tabs = [
        { id: 'per-note',  label: 'Per note',  icon: BarChart3 },
        { id: 'comments',  label: `Comments (${comments.length})`, icon: MessageCircle },
        { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})`, icon: Bookmark }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Reactions, Comments & Hands</h1>
                <p className="text-gray-500 text-sm">Reba uburyo abanyeshuri bitabira inyandiko zawe.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Stat icon={ThumbsUp}    label="Likes"     value={totals.likes || 0}        color="rose" />
                <Stat icon={Heart}       label="Love"      value={totals.love || 0}         color="pink" />
                <Stat icon={Heart}       label="Helpful"   value={totals.helpful || 0}      color="emerald" />
                <Stat icon={HelpCircle}  label="Hands raised" value={totals.raised_hands || 0} color="orange" />
                <Stat icon={Bookmark}    label="Bookmarks" value={totals.bookmarks || 0}    color="indigo" />
            </div>

            <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${tab === t.id ? 'bg-primary-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Icon size={15} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'per-note' && (
                <section className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                    <th className="px-4 py-3 text-left">Note</th>
                                    <th className="px-4 py-3 text-left">Trade</th>
                                    <th className="px-4 py-3 text-right">Views</th>
                                    <th className="px-4 py-3 text-right">Downloads</th>
                                    <th className="px-4 py-3 text-right">Likes</th>
                                    <th className="px-4 py-3 text-right">Comments</th>
                                    <th className="px-4 py-3 text-right">Hands</th>
                                    <th className="px-4 py-3 text-right">Bookmarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(data?.notes || []).map(n => (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900">
                                            <a href={`${API_URL}/api/course-notes/${n.id}/view`} target="_blank" rel="noreferrer" className="hover:text-primary-700">
                                                {n.title}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{n.trade_code} · {n.level}</td>
                                        <td className="px-4 py-3 text-right">{n.view_count || 0}</td>
                                        <td className="px-4 py-3 text-right">{n.download_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-rose-600 font-bold">{n.like_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-amber-600 font-bold">{n.comment_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-orange-600 font-bold">{n.hand_count || 0}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{n.bookmark_count || 0}</td>
                                    </tr>
                                ))}
                                {(!data?.notes || data.notes.length === 0) && (
                                    <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Nta nyandiko ziraboneka.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {tab === 'comments' && (
                <section className="bg-white rounded-3xl border border-gray-100 p-4 space-y-3">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Nta bitekerezo bitanzwe.</p>
                    ) : comments.map(c => (
                        <div key={c.id} className="border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="font-bold text-gray-900">
                                    {c.commenter_name || 'Umunyeshuri'}
                                    <span className="ml-2 text-xs text-gray-500 font-normal">on</span>
                                    <span className="ml-1 text-primary-700 text-sm">{c.note_title}</span>
                                </p>
                                <span className="text-xs text-gray-500">{fmtDate(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{c.body}</p>
                            <p className="text-xs text-gray-400 mt-1">{c.likes || 0} likes · {c.trade_code} · {c.level}</p>
                        </div>
                    ))}
                </section>
            )}

            {tab === 'bookmarks' && (
                <section className="bg-white rounded-3xl border border-gray-100 p-4 space-y-2">
                    {bookmarks.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Nta wabitse inyandiko zawe.</p>
                    ) : bookmarks.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                            <div>
                                <p className="font-bold text-gray-900">{b.owner_name || 'Umunyeshuri'}</p>
                                <p className="text-xs text-gray-500">{b.note_title} · {b.trade_code} · {b.level}</p>
                            </div>
                            <span className="text-xs text-gray-500">{fmtDate(b.created_at)}</span>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
};

const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
                <p className={`text-2xl font-black text-${color}-700`}>{value}</p>
            </div>
            <Icon size={24} className={`text-${color}-400`} />
        </div>
    </div>
);

export default TeacherEngagement;

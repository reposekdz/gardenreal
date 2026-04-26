import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Bell, MessageSquare, X, Check } from 'lucide-react';

// Real-time notification bell for parent header.
// Subscribes to SSE /api/realtime/stream?token=…  +  polls fallback every 60s.
// Triggers browser notifications + toast pulse for new replies.

const RealtimeBell = ({ apiUrl, token, onOpenThread, onAnyEvent }) => {
    const [open, setOpen] = useState(false);
    const [feed, setFeed] = useState([]);
    const [counts, setCounts] = useState({ unread_messages: 0, unread_notifications: 0, total_unread: 0 });
    const [pulse, setPulse] = useState(false);
    const esRef = useRef(null);
    const reconnectTimer = useRef(null);
    const containerRef = useRef(null);

    const fetchFeed = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${apiUrl}/api/realtime/parent/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeed(res.data.recent || []);
            setCounts({
                unread_messages: res.data.unread_messages || 0,
                unread_notifications: res.data.unread_notifications || 0,
                total_unread: res.data.total_unread || 0
            });
        } catch (e) { /* silent */ }
    }, [apiUrl, token]);

    // Initial + periodic fallback
    useEffect(() => {
        fetchFeed();
        const t = setInterval(fetchFeed, 60000);
        return () => clearInterval(t);
    }, [fetchFeed]);

    // Browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            try { Notification.requestPermission(); } catch {}
        }
    }, []);

    // SSE connection with auto-reconnect
    useEffect(() => {
        if (!token || typeof window === 'undefined') return;

        const connect = () => {
            try {
                const url = `${apiUrl}/api/realtime/stream?token=${encodeURIComponent(token)}`;
                const es = new EventSource(url);
                esRef.current = es;

                es.addEventListener('connected', () => {
                    if (reconnectTimer.current) {
                        clearTimeout(reconnectTimer.current);
                        reconnectTimer.current = null;
                    }
                });

                es.addEventListener('message_reply', (ev) => {
                    let payload = {};
                    try { payload = JSON.parse(ev.data); } catch {}
                    setPulse(true);
                    setTimeout(() => setPulse(false), 1500);
                    fetchFeed();
                    onAnyEvent?.('message_reply', payload);

                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        try {
                            const n = new Notification(`Garden TVET — ${payload.subject || 'Ubutumwa bushya'}`, {
                                body: payload.body || 'Ufite igisubizo gishya kuva ku ishuri',
                                tag: `thread-${payload.thread_id}`,
                                badge: '/favicon.ico',
                                icon: '/favicon.ico'
                            });
                            n.onclick = () => {
                                window.focus();
                                onOpenThread?.(payload.thread_id);
                                n.close();
                            };
                        } catch {}
                    }
                });

                es.onerror = () => {
                    try { es.close(); } catch {}
                    esRef.current = null;
                    if (!reconnectTimer.current) {
                        reconnectTimer.current = setTimeout(() => {
                            reconnectTimer.current = null;
                            connect();
                        }, 5000);
                    }
                };
            } catch (e) {
                if (!reconnectTimer.current) {
                    reconnectTimer.current = setTimeout(connect, 5000);
                }
            }
        };
        connect();
        return () => {
            if (esRef.current) { try { esRef.current.close(); } catch {} }
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        };
    }, [apiUrl, token, fetchFeed, onAnyEvent, onOpenThread]);

    // Click-outside to close popover
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const markAllRead = async () => {
        try {
            await axios.post(`${apiUrl}/api/realtime/parent/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFeed();
        } catch {}
    };

    const total = counts.total_unread || 0;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all ${pulse ? 'animate-bounce' : ''}`}
                title="Ubutumwa bwawe"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {total > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-emerald-700 animate-pulse">
                        {total > 99 ? '99+' : total}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[360px] sm:w-[400px] max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white flex items-center justify-between">
                        <div>
                            <p className="font-black text-sm">Amakuru</p>
                            <p className="text-[10px] text-emerald-200">
                                {counts.unread_messages} ubutumwa bushya · {counts.unread_notifications} amakuru
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {total > 0 && (
                                <button onClick={markAllRead}
                                    className="p-1.5 rounded-lg hover:bg-white/15 text-[10px] font-bold flex items-center gap-1"
                                    title="Soma byose">
                                    <Check size={12} /> Byose
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/15">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {feed.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <Bell size={36} className="mx-auto mb-2 text-gray-200" />
                                <p className="text-sm font-bold">Nta makuru mashya</p>
                                <p className="text-xs">Wahawe ubutumwa, ushobora kububona hano</p>
                            </div>
                        ) : feed.map((item, i) => {
                            const unread = !!item.unread;
                            const isMsg = item.source === 'message';
                            return (
                                <button
                                    key={`${item.source}-${item.id}-${i}`}
                                    onClick={() => {
                                        setOpen(false);
                                        if (isMsg && item.thread_id) onOpenThread?.(item.thread_id);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors ${unread ? 'bg-emerald-50/40' : ''}`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMsg ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {isMsg ? <MessageSquare size={14} /> : <Bell size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm truncate ${unread ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {item.title || (isMsg ? 'Ubutumwa' : 'Amakuru')}
                                                </p>
                                                {unread && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />}
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{item.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(item.created_at).toLocaleString('fr-RW', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealtimeBell;

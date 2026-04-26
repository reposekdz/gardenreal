import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Clock, CheckCircle, XCircle, RefreshCw, User,
    ArrowLeft, LogOut, Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const WaitConfirmation = () => {
    const { token, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/parents/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);

            // Check if any request is approved or linked - if so, redirect to dashboard
            const approved = res.data.find(r => r.status === 'approved' || r.status === 'linked');
            if (approved) {
                setPolling(false);
                toast.success('Ubusabe bwakiriwe! Ubashije kwihuza n\'umwana wawe!');
                navigate('/parents');
                return;
            }

            // Check if any request is rejected - show message
            const rejected = res.data.find(r => r.status === 'rejected');
            if (rejected) {
                toast.error('Ubusabe bwanze. Shaka kugira nibazwe.');
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        // Poll for updates every 10 seconds
        const interval = setInterval(() => {
            if (polling) {
                fetchRequests();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [polling]);

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
            case 'linked':
                return <CheckCircle className="text-green-500" size={24} />;
            case 'rejected':
                return <XCircle className="text-red-500" size={24} />;
            default:
                return <Clock className="text-yellow-500" size={24} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
            case 'linked':
                return 'bg-green-100 border-green-300 text-green-800';
            case 'rejected':
                return 'bg-red-100 border-red-300 text-red-800';
            default:
                return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved':
            case 'linked':
                return 'Yemerewe';
            case 'rejected':
                return 'Byatakajwe';
            default:
                return 'Biratega';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={handleGoHome}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} className="text-white" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">Kugaba Kwifashishwa</h1>
                            <p className="text-primary-200">Parent Application Status</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                        >
                            <LogOut size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={40} className="text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Ubusabe bwakiriwe
                        </h2>
                        <p className="text-gray-500">
                            Umuyobozi azabusuzuma vuba
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Wasabye kwihuza n'umwana wawe. Tegereza kwemezwa.
                        </p>
                    </div>

                    {/* Refresh indicator */}
                    {polling && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Igihe cyose bigeze</span>
                            <span>Updates automatically</span>
                        </div>
                    )}
                </div>

                {/* Requests List */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-primary-600" />
                        Ibibusabwa byawe
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8">
                            <User size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Ntabusabe</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className={`border-2 rounded-xl p-4 ${getStatusColor(request.status)}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getStatusIcon(request.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold">{request.student_name}</h4>
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/50">
                                                    {getStatusText(request.status)}
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <p>{request.student_trade} - {request.student_level}</p>
                                                <p className="text-gray-500">
                                                    Byakorewe: {new Date(request.requested_at || request.created_at).toLocaleDateString()}
                                                </p>
                                                {request.status === 'rejected' && request.rejection_reason && (
                                                    <p className="text-red-600 mt-2">
                                                        Imp reason: {request.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-white/70 text-sm">
                    <p>Waba ufite ikibazo? <span className="font-bold">Contact: 078XXXXXXX</span></p>
                    <p className="mt-1">Ushaka guhindura ikibazo? Baza kuri school</p>
                </div>
            </div>
        </div>
    );
};

export default WaitConfirmation;

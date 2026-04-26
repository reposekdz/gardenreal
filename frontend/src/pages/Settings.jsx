import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../utils/api';
import useAuthStore from '../store/authStore';
import { User, Lock, Phone, Save, AlertCircle, CheckCircle, Shield, Key } from 'lucide-react';

const Settings = () => {
    const { t } = useTranslation();
    const { user, login, token } = useAuthStore();
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (formData.newPassword && !formData.currentPassword) {
            setMessage({ type: 'error', text: 'Enter current password to change password' });
            return;
        }

        if (formData.newPassword && formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await authAPI.updateProfile({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword || undefined
            });
            // Update local store with new name/phone
            login({
                ...user,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
            }, token);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const roleConfig = {
        admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-700' },
        dod: { label: 'Director of Discipline', color: 'bg-red-100 text-red-700' },
        accountant: { label: 'Accountant', color: 'bg-green-100 text-green-700' },
        stock_manager: { label: 'Stock Manager', color: 'bg-amber-100 text-amber-700' },
        parent: { label: 'Parent', color: 'bg-pink-100 text-pink-700' },
    };
    const roleInfo = roleConfig[user?.role] || { label: user?.role, color: 'bg-gray-100 text-gray-700' };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <User size={28} />
                        {t('settings.title') || 'Settings'}
                    </h1>
                    <p className="text-primary-100 mt-1">
                        {t('settings.subtitle') || 'Manage your account settings'}
                    </p>
                </div>

                {/* Account Info Banner */}
                <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-black text-lg">
                            {user?.first_name?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-gray-500">@{user?.username}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${roleInfo.color}`}>
                        <Shield size={12} className="inline mr-1" />
                        {roleInfo.label}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Message */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </div>
                    )}

                    {/* Personal Information */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-primary-600" />
                            {t('settings.personal_info') || 'Personal Information'}
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('settings.first_name') || 'First Name'}
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('settings.last_name') || 'Last Name'}
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Phone size={20} className="text-primary-600" />
                            {t('settings.contact_info') || 'Contact Information'}
                        </h2>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('settings.phone') || 'Phone Number'}
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0780000000"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-primary-600" />
                            {t('settings.change_password') || 'Change Password'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('settings.current_password') || 'Current Password'}
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('settings.new_password') || 'New Password'}
                                    </label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('settings.confirm_password') || 'Confirm Password'}
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-500 hover:to-primary-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t('settings.saving') || 'Saving...'}
                            </span>
                        ) : (
                            <>
                                <Save size={20} />
                                {t('settings.save_changes') || 'Save Changes'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;

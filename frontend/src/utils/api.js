import axios from 'axios';
import useAuthStore from '../store/authStore';

// Use environment variable for API URL - defaults to relative path for Vercel
const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: API_URL + '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - add JWT token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login if it's a 401 unauthorized error and we have a token
        if (error.response?.status === 401) {
            const token = useAuthStore.getState().token;
            if (token) {
                // Token exists but got 401, so it's expired
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    registerParent: (data) => api.post('/auth/register-parent', data),
    getUsers: () => api.get('/auth/users'),
    createUser: (data) => api.post('/auth/users', data),
    updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
    deleteUser: (id) => api.delete(`/auth/users/${id}`),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// Students API
export const studentsAPI = {
    getAll: () => api.get('/students'),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
    updateStatus: (id, status) => api.put(`/students/${id}/status`, { status }),
    notifyParents: (id) => api.post(`/students/${id}/notify-parents`),
};

// Finance API
export const financeAPI = {
    getFees: () => api.get('/finance/fees'),
    createFee: (data) => api.post('/finance/fees', data),
    updateFee: (id, data) => api.put(`/finance/fees/${id}`, data),
    deleteFee: (id) => api.delete(`/finance/fees/${id}`),
    getPayments: () => api.get('/finance/payments'),
    createPayment: (data) => api.post('/finance/payments', data),
    getSummary: () => api.get('/finance/reports/summary'),
    getDebtors: () => api.get('/finance/reports/debtors'),
    remindParent: (studentId) => api.post('/finance/remind', { student_id: studentId }),
};

// Stock API
export const stockAPI = {
    getAll: () => api.get('/stock'),
    getById: (id) => api.get(`/stock/${id}`),
    create: (data) => api.post('/stock', data),
    update: (id, data) => api.put(`/stock/${id}`, data),
    delete: (id) => api.delete(`/stock/${id}`),
    getTransactions: () => api.get('/stock/transactions'),
    addTransaction: (data) => api.post('/stock/transactions', data),
    getSummary: () => api.get('/stock/reports/summary'),
    getLowStock: () => api.get('/stock/reports/low-stock'),
};

// Parents API
export const parentsAPI = {
    getMyStudents: () => api.get('/parents/students'),
    getMyRequests: () => api.get('/parents/my-requests'),
    submitLinkRequest: (data) => api.post('/parents/link-request', data),
    getLinkRequests: () => api.get('/parents/link-requests'),
    approveLink: (id, studentId) => api.post('/parents/admin-link', { request_id: id, student_id: studentId }),
    rejectLink: (id) => api.put(`/parents/link-requests/${id}/reject`),
};

// Discipline API
export const disciplineAPI = {
    getAll: () => api.get('/discipline'),
    create: (data) => api.post('/discipline', data),
    update: (id, data) => api.put(`/discipline/${id}`, data),
    delete: (id) => api.delete(`/discipline/${id}`),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
};

// News API
export const newsAPI = {
    getAll: () => api.get('/news'),
    getPublished: () => api.get('/news/published'),
    getById: (id) => api.get(`/news/${id}`),
    create: (data) => api.post('/news', data),
    update: (id, data) => api.put(`/news/${id}`, data),
    delete: (id) => api.delete(`/news/${id}`),
};

// Applications API
export const applicationsAPI = {
    getAll: () => api.get('/applications'),
    getPending: () => api.get('/applications/pending'),
    create: (data) => api.post('/applications', data),
    updateStatus: (id, status, notes) => api.put(`/applications/${id}`, { status, review_notes: notes }),
};

// Hero Slides API
export const heroAPI = {
    getSlides: () => api.get('/hero'),
    getAllSlides: () => api.get('/hero/all'),
    createSlide: (data) => api.post('/hero', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateSlide: (id, data) => api.put(`/hero/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteSlide: (id) => api.delete(`/hero/${id}`),
    uploadImage: (formData) => api.post('/hero/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Public Content API (About, Contact, Services)
export const contentAPI = {
    getSchoolInfo: (section) => api.get(`/content/school-info/${section}`),
    getSchoolStats: () => api.get('/content/school-stats'),
    getLeadershipTeam: () => api.get('/content/leadership'),
    submitContact: (data) => api.post('/content/contact', data),
    getContactMessages: () => api.get('/content/contact-messages'),
    markMessageRead: (id) => api.put(`/content/contact-messages/${id}/read`),
    updateSchoolInfo: (section, data) => api.put(`/content/school-info/${section}`, data),
};

// Trades API
export const tradesAPI = {
    getAll: () => api.get('/trades'),
    create: (data) => api.post('/trades', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/trades/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => api.delete(`/trades/${id}`),
    initTrades: () => api.post('/content/init-trades'),
};

// Media API
export const mediaAPI = {
    upload: (formData, folder = 'general') => api.post(`/media/upload?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    uploadMultiple: (formData, folder = 'general') => api.post(`/media/upload-multiple?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    listFiles: (folder) => api.get(`/media/list?folder=${encodeURIComponent(folder)}`),
    listFolders: () => api.get('/media/folders'),
    deleteFile: (folder, filename) => api.delete('/media/delete', { data: { folder, filename } }),
};

// Gallery API
export const galleryAPI = {
    getAll: (category) => api.get('/content/gallery' + (category ? `?category=${category}` : '')),
    getAllAdmin: () => api.get('/content/gallery/all'),
    add: (formData, folder = 'gallery') => api.post(`/content/gallery?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    bulkAdd: (formData, folder = 'gallery') => api.post(`/content/gallery/bulk?folder=${folder}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => api.put(`/content/gallery/${id}`, data),
    delete: (id) => api.delete(`/content/gallery/${id}`),
};

// School Stats API
export const statsAPI = {
    getAll: () => api.get('/content/school-stats'),
    getAllAdmin: () => api.get('/content/school-stats/all'),
    create: (data) => api.post('/content/school-stats', data),
    update: (id, data) => api.put(`/content/school-stats/${id}`, data),
    delete: (id) => api.delete(`/content/school-stats/${id}`),
};

export default api;

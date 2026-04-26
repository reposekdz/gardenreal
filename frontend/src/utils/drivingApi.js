import axios from 'axios';

const API_URL = '/api/driving-school';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Instructor APIs
export const registerInstructor = async (data) => {
    const response = await api.post('/instructor/register', data);
    return response.data;
};

export const loginInstructor = async (nationalId, password) => {
    const response = await api.post('/instructor/login', { nationalId, password });
    if (response.data.success) {
        localStorage.setItem('drivingInstructorToken', response.data.data.token);
        localStorage.setItem('drivingInstructorId', response.data.data.id);
    }
    return response.data;
};

export const getInstructors = async () => {
    const response = await api.get('/instructors');
    return response.data;
};

export const getInstructorById = async (id) => {
    const response = await api.get(`/instructors/${id}`);
    return response.data;
};

// Course APIs
export const createCourse = async (data, token) => {
    const response = await api.post('/courses', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getCourses = async () => {
    const response = await api.get('/courses');
    return response.data;
};

export const getCourseById = async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
};

export const deleteCourse = async (id, token) => {
    const response = await api.delete(`/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Lesson APIs
export const addLesson = async (courseId, data, token) => {
    const response = await api.post(`/courses/${courseId}/lessons`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getLessons = async (courseId) => {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data;
};

// Learner APIs
export const registerLearner = async (data) => {
    const response = await api.post('/learner/register', data);
    return response.data;
};

export const loginLearner = async (nationalId, password) => {
    const response = await api.post('/learner/login', { nationalId, password });
    if (response.data.success) {
        localStorage.setItem('drivingLearnerToken', response.data.data.token);
        localStorage.setItem('drivingLearnerId', response.data.data.id);
    }
    return response.data;
};

export const enrollInCourse = async (learnerId, courseId) => {
    const response = await api.post('/enroll', { learnerId, courseId });
    return response.data;
};

export const updateProgress = async (enrollmentId, progressPercent, completedLessons) => {
    const response = await api.put(`/enroll/${enrollmentId}/progress`, { progressPercent, completedLessons });
    return response.data;
};

export const getInstructorLearners = async (instructorId) => {
    const response = await api.get(`/instructor/${instructorId}/learners`);
    return response.data;
};

export const getAllLearners = async () => {
    const response = await api.get('/learners');
    return response.data;
};

export const updateLearnerStatus = async (id, status) => {
    const response = await api.put(`/learner/${id}/status`, { status });
    return response.data;
};

export const deleteLearner = async (id) => {
    const response = await api.delete(`/learner/${id}`);
    return response.data;
};

// Quiz APIs
export const addQuizQuestion = async (data, token) => {
    const response = await api.post('/quiz/questions', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getQuizQuestions = async (courseId) => {
    const response = await api.get(`/quiz/${courseId}/questions`);
    return response.data;
};

export const getAllQuizQuestions = async () => {
    const response = await api.get('/quiz/questions');
    return response.data;
};

export const submitQuiz = async (learnerId, courseId, answers) => {
    const response = await api.post('/quiz/submit', { learnerId, courseId, answers });
    return response.data;
};

export const getLearnerResults = async (learnerId) => {
    const response = await api.get(`/learner/${learnerId}/results`);
    return response.data;
};

export const deleteQuizQuestion = async (id, token) => {
    const response = await api.delete(`/quiz/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Payment APIs
export const verifyPayment = async (data) => {
    const response = await api.post('/payment/verify', data);
    return response.data;
};

export const checkPaymentStatus = async (nationalId) => {
    const response = await api.get(`/payment/status/${nationalId}`);
    return response.data;
};

// Materials APIs
export const uploadMaterial = async (formData, token) => {
    const response = await api.post('/materials', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getMaterials = async () => {
    const response = await api.get('/materials');
    return response.data;
};

export const deleteMaterial = async (id, token) => {
    const response = await api.delete(`/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Assessments APIs
export const createAssessment = async (data, token) => {
    const response = await api.post('/assessments', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getAssessments = async () => {
    const response = await api.get('/assessments');
    return response.data;
};

export const getAssessmentById = async (id) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
};

export const deleteAssessment = async (id, token) => {
    const response = await api.delete(`/assessments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Stock APIs
export const addStock = async (data, token) => {
    const response = await api.post('/stock', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getStock = async (instructorId) => {
    const response = await api.get(`/stock/${instructorId}`);
    return response.data;
};

export const updateStock = async (id, data, token) => {
    const response = await api.put(`/stock/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const deleteStock = async (id, token) => {
    const response = await api.delete(`/stock/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const addStockTransaction = async (data, token) => {
    const response = await api.post('/stock/transactions', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getItemTransactions = async (itemId, token) => {
    const response = await api.get(`/stock/${itemId}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getStockSummary = async (token) => {
    const response = await api.get('/stock-reports/summary', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get token helper
export const getInstructorToken = () => localStorage.getItem('drivingInstructorToken');
export const getInstructorId = () => localStorage.getItem('drivingInstructorId');
export const getLearnerToken = () => localStorage.getItem('drivingLearnerToken');
export const getLearnerId = () => localStorage.getItem('drivingLearnerId');

export const clearAuth = () => {
    localStorage.removeItem('drivingInstructorToken');
    localStorage.removeItem('drivingInstructorId');
    localStorage.removeItem('drivingLearnerToken');
    localStorage.removeItem('drivingLearnerId');
};

// Road Signs (Ibyapa) APIs
export const getInstructorRoadSigns = async (instructorId) => {
    const response = await api.get(`/instructor/${instructorId}/road-signs`);
    return response.data;
};

export const uploadRoadSign = async (formData, token) => {
    const response = await api.post('/road-signs', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteRoadSign = async (id, token) => {
    const response = await api.delete(`/road-signs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Missing Mock/API functions for Dashboard compatibility
export const getCalendarEvents = async (instructorId) => {
    // Mock data for Instructor Dashboard Calendar
    return {
        success: true,
        data: [
            { id: 1, title: 'Isuzuma ry\'Amategeko', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 90000000).toISOString(), type: 'assessment' },
            { id: 2, title: 'Inama rusange', start_time: new Date(Date.now() + 172800000).toISOString(), end_time: new Date(Date.now() + 176400000).toISOString(), type: 'meeting' }
        ]
    };
};

export const getInstructorNotifications = async (instructorId) => {
    // Mock data for notifications
    return {
        success: true,
        data: [
            { id: 1, message: 'Umunyeshuri mushya yiyandikishije', created_at: new Date().toISOString(), is_read: false },
            { id: 2, message: 'Ibyapa bishya byemewe', created_at: new Date(Date.now() - 86400000).toISOString(), is_read: true }
        ]
    };
};

export const getInstructorReports = async (instructorId) => {
    // Mock data for reports
    return {
        success: true,
        data: {
            totalRevenue: 450000,
            passRate: 85,
            topCourses: [
                { title: 'Amategeko Y\'Umuhanda', students: 45 },
                { title: 'Gutwara Imodoka', students: 30 }
            ]
        }
    };
};

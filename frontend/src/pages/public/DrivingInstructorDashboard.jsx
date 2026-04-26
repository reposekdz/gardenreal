import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Car, BookOpen, GraduationCap, CheckCircle, XCircle,
    ArrowRight, ArrowLeft, RotateCcw, Award, ChevronRight,
    Users, User, Plus, Trash2, Edit, Upload, FileText,
    DollarSign, Package, Bookmark, Target, TrendingUp,
    Play, Clock, Image, Video, File, Settings, LogOut,
    Search, Filter, Download, Eye, CheckSquare, Square,
    Bell, BookText, History, ArrowLeftRight
} from 'lucide-react';
import * as api from '../../utils/drivingApi';

// Dashboard Component
const DrivingInstructorDashboard = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [reports, setReports] = useState({});
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '', description: '', date: '', time: '', type: 'lesson'
    });
    const [eventErrors, setEventErrors] = useState({});
    const [showAddLearner, setShowAddLearner] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [showAddQuiz, setShowAddQuiz] = useState(false);
    const [showAddStock, setShowAddStock] = useState(false);
    const [learners, setLearners] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [quizResults, setQuizResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [learnerForm, setLearnerForm] = useState({
        firstName: '', lastName: '', nationalId: '', phone: '', email: '', dateOfBirth: '', address: ''
    });
    const [learnerErrors, setLearnerErrors] = useState({});
    const [courseForm, setCourseForm] = useState({
        title: '', titleKinya: '', description: '', descriptionKinya: '', category: 'amategeko', level: 'rusange', durationHours: 0, price: 0, isPublished: false
    });
    const [courseErrors, setCourseErrors] = useState({});
    const [quizForm, setQuizForm] = useState({
        courseId: '', question: '', questionKinya: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', explanationKinya: '', points: 1
    });
    const [quizErrors, setQuizErrors] = useState({});

    // Transaction States
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionForm, setTransactionForm] = useState({
        transaction_type: 'usage',
        quantity: 1,
        unit_price: 0,
        reference: '',
        notes: ''
    });
    const [stockForm, setStockForm] = useState({
        id: null, name: '', item_code: '', category: 'equipment', quantity: 0, unit: 'pieces', min_quantity: 5, price: 0, location: '', supplier: '', description: ''
    });
    const [stockErrors, setStockErrors] = useState({});
    const [editingStock, setEditingStock] = useState(false);
    const [stockSummary, setStockSummary] = useState({ totalItems: 0, lowStock: 0, depleted: 0, totalValue: 0 });

    // Lessons (PDF/Image upload) states
    const [lessonsCourseId, setLessonsCourseId] = useState('');
    const [lessons, setLessons] = useState([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        title: '', titleKinya: '', description: '', content: '',
        videoUrl: '', durationMinutes: 0, orderNum: 0, isPublished: true
    });
    const [lessonFiles, setLessonFiles] = useState({ pdf: null, image: null, attachments: [] });
    const [lessonImagePreview, setLessonImagePreview] = useState('');
    const [lessonSaving, setLessonSaving] = useState(false);

    const loadLessons = async (courseId) => {
        if (!courseId) { setLessons([]); return; }
        setLessonsLoading(true);
        try {
            const res = await fetch(`/api/driving-school/courses/${courseId}/lessons`);
            const data = await res.json();
            setLessons(data?.data || []);
        } catch (e) {
            setLessons([]);
        } finally {
            setLessonsLoading(false);
        }
    };

    useEffect(() => { loadLessons(lessonsCourseId); }, [lessonsCourseId]);

    const handleLessonFile = (key, file) => {
        if (!file) return;
        if (key === 'image') setLessonImagePreview(URL.createObjectURL(file));
        if (key === 'attachments') {
            setLessonFiles(p => ({ ...p, attachments: [...p.attachments, ...Array.from(file)] }));
        } else {
            setLessonFiles(p => ({ ...p, [key]: file }));
        }
    };

    const submitLesson = async (e) => {
        e.preventDefault();
        if (!lessonsCourseId) {
            alert('Hitamo ishuri mbere');
            return;
        }
        setLessonSaving(true);
        try {
            const fd = new FormData();
            Object.entries(lessonForm).forEach(([k, v]) => fd.append(k, v ?? ''));
            if (lessonFiles.pdf) fd.append('pdf', lessonFiles.pdf);
            if (lessonFiles.image) fd.append('image', lessonFiles.image);
            (lessonFiles.attachments || []).forEach(f => fd.append('attachments', f));

            const res = await fetch(`/api/driving-school/courses/${lessonsCourseId}/lessons`, {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Failed');

            setLessonForm({
                title: '', titleKinya: '', description: '', content: '',
                videoUrl: '', durationMinutes: 0, orderNum: 0, isPublished: true
            });
            setLessonFiles({ pdf: null, image: null, attachments: [] });
            setLessonImagePreview('');
            await loadLessons(lessonsCourseId);
            alert('Isomo ryongereyemo neza!');
        } catch (err) {
            alert('Habayemo ikibazo: ' + err.message);
        } finally {
            setLessonSaving(false);
        }
    };

    const deleteLesson = async (id) => {
        if (!confirm('Wifuza gusiba iri somo?')) return;
        try {
            const res = await fetch(`/api/driving-school/lessons/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            await loadLessons(lessonsCourseId);
        } catch (e) {
            alert('Gusiba byanze');
        }
    };

    // Road Signs (Ibyapa) States
    const [roadSigns, setRoadSigns] = useState([]);
    const [showAddSign, setShowAddSign] = useState(false);
    const [signForm, setSignForm] = useState({
        title: '', description: '', category: 'danger'
    });
    const [signImage, setSignImage] = useState(null);
    const [signImagePreview, setSignImagePreview] = useState(null);
    const [signErrors, setSignErrors] = useState({});

    useEffect(() => {
        // Check for logged in instructor
        const savedUser = localStorage.getItem('drivingUser');
        const savedRole = localStorage.getItem('drivingRole');
        if (savedUser && savedRole === 'instructor') {
            setUser(JSON.parse(savedUser));
            loadInstructorData();
        }
    }, []);

    const loadInstructorData = async () => {
        if (!user) return;

        setLoading(true);
        setError('');
        try {
            // Get instructor ID from user object or localStorage
            const instructorId = user.id || localStorage.getItem('drivingInstructorId');

            // Fetch learners for this instructor
            const learnersRes = await api.getInstructorLearners(instructorId);
            if (learnersRes.success) {
                setLearners(learnersRes.data.map(learner => ({
                    id: learner.id,
                    first_name: learner.first_name,
                    last_name: learner.last_name,
                    national_id: learner.national_id,
                    phone: learner.phone,
                    email: learner.email,
                    status: learner.status,
                    enrolled_courses: learner.enrolled_courses || ''
                })));
            }

            // Fetch courses for this instructor
            const coursesRes = await api.getCourses();
            if (coursesRes.success) {
                // Filter courses by instructor_id if needed, or get all for now
                setCourses(coursesRes.data.map(course => ({
                    id: course.id,
                    title_kinya: course.title_kinya || course.title,
                    lessons_count: course.lessons_count || 0,
                    enrolled_count: course.enrolled_count || 0,
                    price: course.price || 0,
                    is_published: course.is_published || false
                })));
            }

            // Fetch stock for this instructor
            const stockRes = await api.getStock(instructorId);
            if (stockRes.success) {
                setStockItems(stockRes.data.map(item => ({
                    id: item.id,
                    item_name: item.item_name || item.name,
                    item_code: item.item_code || '',
                    quantity: item.quantity || 0,
                    unit: item.unit || 'pieces',
                    min_quantity: item.min_quantity || 5,
                    purchase_price: item.purchase_price || item.price || 0,
                    category: item.category || 'other',
                    location: item.location || '',
                    supplier: item.supplier || '',
                    description: item.description || '',
                    status: item.status
                })));
            }

            // Fetch quiz results (could be filtered by instructor later)
            const resultsRes = await api.getLearnerResults(user.id);
            if (resultsRes.success) {
                setQuizResults(resultsRes.data.map(result => ({
                    id: result.id,
                    learner_name: `${result.learner_first_name} ${result.learner_last_name}`,
                    course_name: result.course_title_kinya || result.course_title,
                    score: result.score,
                    total: result.total_questions,
                    passed: result.passed,
                    taken_at: result.taken_at
                })));
            }

            // Fetch calendar events
            const eventsRes = await api.getCalendarEvents(instructorId);
            if (eventsRes.success) {
                setCalendarEvents(eventsRes.data.map(event => ({
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    time: event.time,
                    type: event.type
                })));
            }

            // Fetch notifications
            const notificationsRes = await api.getInstructorNotifications(instructorId);
            if (notificationsRes.success) {
                setNotifications(notificationsRes.data.map(notification => ({
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    isRead: notification.is_read,
                    createdAt: notification.created_at
                })));
            }

            // Fetch reports
            const reportsRes = await api.getInstructorReports(instructorId);
            if (reportsRes.success) {
                setReports(reportsRes.data);
            }

            // Fetch road signs uploaded by this instructor
            const signsRes = await api.getInstructorRoadSigns(instructorId);
            if (signsRes.success) {
                setRoadSigns(signsRes.data);
            }
        } catch (err) {
            console.error('Error loading instructor data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLearner = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Validate form
        const errors = {};
        if (!learnerForm.firstName.trim()) errors.firstName = 'Izina ry\'ibanze ritazozwa';
        if (!learnerForm.lastName.trim()) errors.lastName = 'Izina ry\'anyuma ritazozwa';
        if (!learnerForm.nationalId.trim()) errors.nationalId = 'Nomero y\'igikomete ritazozwa';
        if (!learnerForm.phone.trim()) errors.phone = 'Nimero ya telefone ritazozwa';
        if (!learnerForm.email.trim()) errors.email = 'Imeli ritazozwa';
        if (!learnerForm.dateOfBirth) errors.dateOfBirth = 'Itariki y\'avuko ritazozwa';
        if (!learnerForm.address.trim()) errors.address = 'Aderesi ritazozwa';

        if (Object.keys(errors).length > 0) {
            setLearnerErrors(errors);
            return;
        }
        setLearnerErrors({});

        try {
            const result = await api.registerLearner({
                firstName: learnerForm.firstName,
                lastName: learnerForm.lastName,
                nationalId: learnerForm.nationalId,
                phone: learnerForm.phone,
                email: learnerForm.email,
                dateOfBirth: learnerForm.dateOfBirth,
                address: learnerForm.address,
                assignedInstructorId: user.id || localStorage.getItem('drivingInstructorId')
            });

            if (result.success) {
                alert('Umunyeshuri mushya yabonetse!');
                setShowAddLearner(false);
                setLearnerForm({ firstName: '', lastName: '', nationalId: '', phone: '', email: '', dateOfBirth: '', address: '' });
                // Refresh learners list
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding learner:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Validate form
        const errors = {};
        if (!courseForm.titleKinya.trim()) errors.titleKinya = 'Izina ry\'ishuri ritazozwa';
        if (!courseForm.descriptionKinya.trim()) errors.descriptionKinya = 'Ibisobanuro ritazozwa';
        if (courseForm.durationHours <= 0) errors.durationHours = 'Igihe kizotse kuba kuri 0';
        if (courseForm.price < 0) errors.price = 'Igiciro kizotse kuba kuri 0';

        if (Object.keys(errors).length > 0) {
            setCourseErrors(errors);
            return;
        }
        setCourseErrors({});

        try {
            const token = api.getInstructorToken();
            const result = await api.createCourse({
                ...courseForm,
                instructorId: user.id || localStorage.getItem('drivingInstructorId')
            }, token);

            if (result.success) {
                alert('Ishuri ryashya!');
                setShowAddCourse(false);
                setCourseForm({ title: '', titleKinya: '', description: '', descriptionKinya: '', category: 'amategeko', level: 'rusange', durationHours: 0, price: 0, isPublished: false });
                // Refresh courses list
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding course:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const handleAddQuiz = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Validate form
        const errors = {};
        if (!quizForm.courseId) errors.courseId = 'Ishuri ritazozwa';
        if (!quizForm.questionKinya.trim()) errors.questionKinya = 'Ikibazo ritazozwa';
        if (quizForm.options.some(opt => !opt.trim())) errors.options = 'Ampahula zose kizotse zitazozwa';
        if (quizForm.correctAnswer < 0 || quizForm.correctAnswer > 3) errors.correctAnswer = 'Ampahula yigize ritazozwa';
        if (!quizForm.explanationKinya.trim()) errors.explanationKinya = 'Ibisobanuro ritazozwa';

        if (Object.keys(errors).length > 0) {
            setQuizErrors(errors);
            return;
        }
        setQuizErrors({});

        try {
            const token = api.getInstructorToken();
            const result = await api.addQuizQuestion({
                courseId: parseInt(quizForm.courseId),
                questionKinya: quizForm.questionKinya,
                options: quizForm.options,
                correctAnswer: parseInt(quizForm.correctAnswer),
                explanationKinya: quizForm.explanationKinya
            }, token);

            if (result.success) {
                alert('Ikibazo kyamle!');
                setShowAddQuiz(false);
                setQuizForm({ courseId: '', question: '', questionKinya: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', explanationKinya: '', points: 1 });
                // Refresh quiz questions if needed
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding quiz question:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Validate form
        const errors = {};
        if (!stockForm.name.trim()) errors.name = 'Izina ritazozwa';
        if (stockForm.quantity < 0) errors.quantity = 'Ingano kizotse kuba kuri 0';
        if (stockForm.price < 0) errors.price = 'Igiciro kizotse kuba kuri 0';

        if (Object.keys(errors).length > 0) {
            setStockErrors(errors);
            return;
        }
        setStockErrors({});

        try {
            const token = api.getInstructorToken();
            const instructorId = user.id || localStorage.getItem('drivingInstructorId');
            
            let result;
            if (editingStock && stockForm.id) {
                result = await api.updateStock(stockForm.id, {
                    ...stockForm,
                    instructorId
                }, token);
            } else {
                result = await api.addStock({
                    ...stockForm,
                    instructorId
                }, token);
            }

            if (result.success) {
                alert(editingStock ? 'Amakuru y\'ibikoresho yarungutse!' : 'Ikintu gishya cyamle!');
                setShowAddStock(false);
                setEditingStock(false);
                setStockForm({ 
                    id: null, name: '', item_code: '', category: 'equipment', quantity: 0, unit: 'pieces', 
                    min_quantity: 5, price: 0, location: '', supplier: '', description: '' 
                });
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving stock:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const handleEditStock = (item) => {
        setStockForm({
            id: item.id,
            name: item.item_name || item.name,
            item_code: item.item_code || '',
            category: item.category || 'equipment',
            quantity: item.quantity || 0,
            unit: item.unit || 'pieces',
            min_quantity: item.min_quantity || 5,
            price: item.purchase_price || item.price || 0,
            location: item.location || '',
            supplier: item.supplier || '',
            description: item.description || ''
        });
        setEditingStock(true);
        setShowAddStock(true);
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        if (!user || !selectedItem) return;

        try {
            const token = api.getInstructorToken();
            const result = await api.addStockTransaction({
                item_id: selectedItem.id,
                ...transactionForm
            }, token);

            if (result.success) {
                alert('Amakuru y\'ibihererezo yabitswe!');
                setShowTransactionModal(false);
                setTransactionForm({
                    transaction_type: 'usage',
                    quantity: 1,
                    unit_price: selectedItem.purchase_price || 0,
                    reference: '',
                    notes: ''
                });
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const viewHistory = async (item) => {
        setSelectedItem(item);
        try {
            const token = api.getInstructorToken();
            const result = await api.getItemTransactions(item.id, token);
            if (result.success) {
                setTransactions(result.data);
                setShowHistoryModal(true);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('Habaye ikibazo mu gushaka amateka.');
        }
    };

    const deleteLearner = async (id) => {
        if (!window.confirm('Urashaka gusiba uyu munyeshuri?')) return;
        if (!user) return;

        try {
            const result = await api.deleteLearner(id);
            if (result.success) {
                // Refresh learners list
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting learner:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Urashaka gusiba ishuri rishya?')) return;
        if (!user) return;

        try {
            const token = api.getInstructorToken();
            const result = await api.deleteCourse(id, token);
            if (result.success) {
                // Refresh courses list
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    const deleteStock = async (id) => {
        if (!window.confirm('Urashaka gusiba ikintu?')) return;
        if (!user) return;

        try {
            const token = api.getInstructorToken();
            const result = await api.deleteStock(id, token);
            if (result.success) {
                // Refresh stock list
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting stock:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    // Handle Image Preview
    const handleSignImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSignImage(file);
            setSignImagePreview(URL.createObjectURL(file));
        }
    };

    // Add Road Sign
    const handleAddRoadSign = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Validate form
        const errors = {};
        if (!signForm.title.trim()) errors.title = 'Izina ritazozwa';
        if (!signForm.description.trim()) errors.description = 'Ibisobanuro ritazozwa';
        if (!signImage) errors.image = 'Ifoto itazozwa';

        if (Object.keys(errors).length > 0) {
            setSignErrors(errors);
            return;
        }
        setSignErrors({});

        try {
            const token = api.getInstructorToken();
            const formData = new FormData();
            formData.append('title', signForm.title);
            formData.append('description', signForm.description);
            formData.append('category', signForm.category);
            formData.append('instructorId', user.id || localStorage.getItem('drivingInstructorId'));
            formData.append('image', signImage);

            const result = await api.uploadRoadSign(formData, token);

            if (result.success) {
                alert('Icyapa cyamle!');
                setShowAddSign(false);
                setSignForm({ title: '', description: '', category: 'danger' });
                setSignImage(null);
                setSignImagePreview(null);
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading sign:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    // Delete Road Sign
    const deleteRoadSign = async (id) => {
        if (!window.confirm('Urashaka gusiba icyapa?')) return;
        if (!user) return;

        try {
            const token = api.getInstructorToken();
            const result = await api.deleteRoadSign(id, token);
            if (result.success) {
                loadInstructorData();
            } else {
                alert('Habaye ikibazo: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting sign:', error);
            alert('Habaye ikibazo. Ongera ugerageze.');
        }
    };

    // Dashboard Stats
    const stats = {
        totalLearners: learners.length,
        activeLearners: learners.filter(l => l.status === 'active').length,
        completedLearners: learners.filter(l => l.status === 'completed').length,
        totalCourses: courses.length,
        totalStock: stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
        quizResults: quizResults.length,
        totalSigns: roadSigns.length
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Car className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Injira nka Muduto</h2>
                    <p className="text-gray-600">Fata konti yawe ya muduto kugira ngo ufashe</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black">Ishuri ry'Imodoka - Dashboard</h1>
                                <p className="text-primary-200">Muduto: {user.firstName} {user.lastName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('drivingUser');
                                localStorage.removeItem('drivingRole');
                                window.location.href = '/driving-school';
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Soka
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-2 overflow-x-auto py-3">
                        {[
                            { id: 'dashboard', label: 'Ahibanze', icon: Target },
                            { id: 'learners', label: 'Abavyigishwa', icon: Users },
                            { id: 'courses', label: 'Amashuri', icon: BookOpen },
                            { id: 'lessons', label: 'Amasomo (PDF)', icon: FileText },
                            { id: 'quizzes', label: 'Ibiganiro', icon: GraduationCap },
                            { id: 'stock', label: 'Ububiko', icon: Package },
                            { id: 'ibyapa', label: 'Ibyapa (Signs)', icon: Target },
                            { id: 'results', label: 'Ibibanza', icon: Award },
                            { id: 'calendar', label: 'Igitiro', icon: Calendar },
                            { id: 'notifications', label: 'Ibisubizo', icon: Bell },
                            { id: 'reports', label: 'Ibitekerezo', icon: TrendingUp },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-primary-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-lg">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                    <Users className="w-6 h-6 text-primary-600" />
                                </div>
                                <p className="text-3xl font-black text-primary-800">{stats.totalLearners}</p>
                                <p className="text-gray-600 font-medium">Abavyigishwa Bose</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-3xl font-black text-green-600">{stats.activeLearners}</p>
                                <p className="text-gray-600 font-medium">Barimo Kwiga</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-3xl font-black text-blue-600">{stats.totalCourses}</p>
                                <p className="text-gray-600 font-medium">Amashuri</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                                    <Package className="w-6 h-6 text-yellow-600" />
                                </div>
                                <p className="text-3xl font-black text-yellow-600">{stats.totalStock}</p>
                                <p className="text-gray-600 font-medium">Ibikoresho</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Ibyakozwe ubushize</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">Umunyeshuri mushya</p>
                                        <p className="text-sm text-gray-500">Emmanuel Niyonkuri yiyandikishije</p>
                                    </div>
                                    <span className="text-sm text-gray-400">2 saa zashize</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">Ikiganiro cyuzuye</p>
                                        <p className="text-sm text-gray-500">Alice Mukamana yize 80%</p>
                                    </div>
                                    <span className="text-sm text-gray-400">1 umunsi ushize</span>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Award className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">Impamyabumenyi</p>
                                        <p className="text-sm text-gray-500">Marie yemerewe gutwara</p>
                                    </div>
                                    <span className="text-sm text-gray-400">3 iminsi zashize</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Learners Tab */}
                {activeTab === 'learners' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Abavyigishwa</h2>
                            <button
                                onClick={() => setShowAddLearner(true)}
                                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Fata Umunyeshuri
                            </button>
                        </div>

                        {/* Add Learner Form */}
                        {showAddLearner && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Fata Umunyeshuri Mushya</h3>
                                <form onSubmit={handleAddLearner} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Izina ry'Ibanze</label>
                                            <input
                                                type="text"
                                                value={learnerForm.firstName}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, firstName: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.firstName ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.firstName && <p className="text-red-500 text-sm mt-1">{learnerErrors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Izina Ryanyuma</label>
                                            <input
                                                type="text"
                                                value={learnerForm.lastName}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, lastName: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.lastName ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.lastName && <p className="text-red-500 text-sm mt-1">{learnerErrors.lastName}</p>}
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Nomero y'Igikomete</label>
                                            <input
                                                type="text"
                                                value={learnerForm.nationalId}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, nationalId: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.nationalId ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.nationalId && <p className="text-red-500 text-sm mt-1">{learnerErrors.nationalId}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Nimero ya Telefone</label>
                                            <input
                                                type="tel"
                                                value={learnerForm.phone}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, phone: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.phone ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.phone && <p className="text-red-500 text-sm mt-1">{learnerErrors.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Imeli</label>
                                            <input
                                                type="email"
                                                value={learnerForm.email}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, email: e.target.value })}
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.email ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.email && <p className="text-red-500 text-sm mt-1">{learnerErrors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Itariki y'Amavuko</label>
                                            <input
                                                type="date"
                                                value={learnerForm.dateOfBirth}
                                                onChange={(e) => setLearnerForm({ ...learnerForm, dateOfBirth: e.target.value })}
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.dateOfBirth ? 'border-red-500' : ''}`}
                                            />
                                            {learnerErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{learnerErrors.dateOfBirth}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Aderesi</label>
                                        <input
                                            type="text"
                                            value={learnerForm.address}
                                            onChange={(e) => setLearnerForm({ ...learnerForm, address: e.target.value })}
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${learnerErrors.address ? 'border-red-500' : ''}`}
                                        />
                                        {learnerErrors.address && <p className="text-red-500 text-sm mt-1">{learnerErrors.address}</p>}
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">
                                            Bika
                                        </button>
                                        <button type="button" onClick={() => setShowAddLearner(false)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">
                                            Cancela
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Learners Table */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Izina</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Nimero</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Telefone</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Amashuri</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Ibikorwa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {learners.map(learner => (
                                        <tr key={learner.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-800">{learner.first_name} {learner.last_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{learner.national_id}</td>
                                            <td className="px-6 py-4 text-gray-600">{learner.phone}</td>
                                            <td className="px-6 py-4 text-gray-600">{learner.enrolled_courses || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${learner.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    learner.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {learner.status === 'active' ? 'Arimo' : learner.status === 'completed' ? 'Yarize' : 'Ariamari'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => deleteLearner(learner.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="space-y-6">
                        <div class className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Amashuri</h2>
                            <button
                                onClick={() => setShowAddCourse(true)}
                                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Fata Ishuri Rishya
                            </button>
                        </div>

                        {/* Add Course Form */}
                        {showAddCourse && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Fata Ishuri Rishya</h3>
                                <form onSubmit={handleAddCourse} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Izina ry'Ishuri (Ikinyarwanda)</label>
                                            <input
                                                type="text"
                                                value={courseForm.titleKinya}
                                                onChange={(e) => setCourseForm({ ...courseForm, titleKinya: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${courseErrors.titleKinya ? 'border-red-500' : ''}`}
                                            />
                                            {courseErrors.titleKinya && <p className="text-red-500 text-sm mt-1">{courseErrors.titleKinya}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ikiganiro</label>
                                            <select
                                                value={courseForm.category}
                                                onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="amategeko">Amategeko y'Umuhanda</option>
                                                <option value="ibirwanisho">Ibirwanisho by'Imodoka</option>
                                                <option value="ibikoresho">Ibikoresho by'Imodoka</option>
                                                <option value="imyitozo">Imyitozo y'Umuhanda</option>
                                                <option value="umutekano">Umutekano w'Umuhanda</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ibisobanuro</label>
                                        <textarea
                                            value={courseForm.descriptionKinya}
                                            onChange={(e) => setCourseForm({ ...courseForm, descriptionKinya: e.target.value })}
                                            rows={3}
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${courseErrors.descriptionKinya ? 'border-red-500' : ''}`}
                                        />
                                        {courseErrors.descriptionKinya && <p className="text-red-500 text-sm mt-1">{courseErrors.descriptionKinya}</p>}
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Igihe (amasaha)</label>
                                            <input
                                                type="number"
                                                value={courseForm.durationHours}
                                                onChange={(e) => setCourseForm({ ...courseForm, durationHours: parseInt(e.target.value) })}
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${courseErrors.durationHours ? 'border-red-500' : ''}`}
                                            />
                                            {courseErrors.durationHours && <p className="text-red-500 text-sm mt-1">{courseErrors.durationHours}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ibigo</label>
                                            <select
                                                value={courseForm.level}
                                                onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="rusange">Rusange</option>
                                                <option value="inzavuja">Inzavuja</option>
                                                <option value="kuruze">Kuruze</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Igiciro (Rwf)</label>
                                            <input
                                                type="number"
                                                value={courseForm.price}
                                                onChange={(e) => setCourseForm({ ...courseForm, price: parseInt(e.target.value) })}
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${courseErrors.price ? 'border-red-500' : ''}`}
                                            />
                                            {courseErrors.price && <p className="text-red-500 text-sm mt-1">{courseErrors.price}</p>}
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ibisobanuro (Ikinyarwanda)</label>
                                            <textarea
                                                value={courseForm.description}
                                                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={courseForm.isPublished}
                                                    onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                                                />
                                                Ishuri rwerekanje
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ifoto y'Ishuri</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-500">Kanda hano wongeremo ifoto</p>
                                            <input type="file" className="hidden" accept="image/*" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">
                                            Bika Ishuri
                                        </button>
                                        <button type="button" onClick={() => setShowAddCourse(false)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">
                                            Cancela
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Courses Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(course => (
                                <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                        <BookOpen className="w-12 h-12 text-white/50" />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-gray-800 mb-2">{course.title_kinya}</h3>
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1"><BookText className="w-4 h-4" /> {course.lessons_count} ibice</span>
                                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.enrolled_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {course.is_published ? 'Rwerekanwa' : 'Ntirwerekanwa'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => deleteCourse(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lessons Tab — full upload (image / description / PDF / attachments) */}
                {activeTab === 'lessons' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-2xl font-black text-gray-800">Amasomo n'Ibitabo (PDF)</h2>
                            <select
                                value={lessonsCourseId}
                                onChange={(e) => setLessonsCourseId(e.target.value)}
                                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl bg-white font-semibold text-gray-700 focus:border-primary-500 focus:outline-none w-full sm:w-auto"
                            >
                                <option value="">— Hitamo ishuri —</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title_kinya || c.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Upload form */}
                        <form onSubmit={submitLesson} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 space-y-4">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Ongera isomo rishya</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Izina (Ikinyarwanda)</label>
                                    <input type="text" required value={lessonForm.titleKinya}
                                        onChange={e => setLessonForm({ ...lessonForm, titleKinya: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Izina (English)</label>
                                    <input type="text" value={lessonForm.title}
                                        onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ibisobanuro birambuye</label>
                                <textarea rows={4} value={lessonForm.description}
                                    onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                                    placeholder="Andika ibisobanuro by'isomo ku munyeshuri..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Inyandiko (content)</label>
                                <textarea rows={3} value={lessonForm.content}
                                    onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Igihe (iminota)</label>
                                    <input type="number" min="0" value={lessonForm.durationMinutes}
                                        onChange={e => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Urutonde</label>
                                    <input type="number" min="0" value={lessonForm.orderNum}
                                        onChange={e => setLessonForm({ ...lessonForm, orderNum: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">YouTube / Video URL (optional)</label>
                                    <input type="url" value={lessonForm.videoUrl}
                                        onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Image className="w-4 h-4" /> Ifoto</label>
                                    <input type="file" accept="image/*"
                                        onChange={e => handleLessonFile('image', e.target.files?.[0])}
                                        className="block w-full text-sm" />
                                    {lessonImagePreview && (
                                        <img src={lessonImagePreview} alt="" className="mt-3 w-full h-24 object-cover rounded-lg" />
                                    )}
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> PDF y'isomo</label>
                                    <input type="file" accept="application/pdf"
                                        onChange={e => handleLessonFile('pdf', e.target.files?.[0])}
                                        className="block w-full text-sm" />
                                    {lessonFiles.pdf && <p className="text-xs text-green-600 mt-2 truncate">✓ {lessonFiles.pdf.name}</p>}
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><File className="w-4 h-4" /> Ibindi (multiple)</label>
                                    <input type="file" multiple
                                        onChange={e => handleLessonFile('attachments', e.target.files)}
                                        className="block w-full text-sm" />
                                    {lessonFiles.attachments.length > 0 && (
                                        <p className="text-xs text-green-600 mt-2">✓ {lessonFiles.attachments.length} files</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <input type="checkbox" checked={lessonForm.isPublished}
                                        onChange={e => setLessonForm({ ...lessonForm, isPublished: e.target.checked })} />
                                    Rwerekanwa ku banyeshuri
                                </label>
                                <button type="submit" disabled={lessonSaving || !lessonsCourseId}
                                    className="ml-auto px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    {lessonSaving ? 'Birabikwa...' : 'Bika isomo'}
                                </button>
                            </div>
                        </form>

                        {/* Existing lessons list */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Amasomo amaze gushyirwaho ({lessons.length})</h3>
                            {lessonsLoading ? (
                                <p className="text-gray-400 text-center py-8">Birapakurura...</p>
                            ) : lessons.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Nta isomo rikiri muri iri shuri</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {lessons.map(l => (
                                        <div key={l.id} className="border-2 border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition">
                                            {l.image_url ? (
                                                <img src={l.image_url} alt="" className="w-full h-32 object-cover" />
                                            ) : (
                                                <div className="w-full h-32 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                                    <BookOpen className="w-10 h-10 text-white/50" />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{l.title_kinya || l.title}</h4>
                                                {l.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{l.description}</p>}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {l.pdf_url && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">PDF</span>}
                                                    {l.video_url && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">VIDEO</span>}
                                                    {l.image_url && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">IMG</span>}
                                                    {l.duration_minutes > 0 && <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{l.duration_minutes} min</span>}
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${l.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {l.is_published ? 'Rwerekanwa' : 'Rifunze'}
                                                    </span>
                                                    <button onClick={() => deleteLesson(l.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Ibiganiro</h2>
                            <button
                                onClick={() => setShowAddQuiz(true)}
                                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Fata Ikibazo
                            </button>
                        </div>

                        {/* Add Quiz Form */}
                        {showAddQuiz && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Fata Ikibazo Gift</h3>
                                <form onSubmit={handleAddQuiz} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ishuri</label>
                                        <select
                                            value={quizForm.courseId}
                                            onChange={(e) => setQuizForm({ ...quizForm, courseId: e.target.value })}
                                            required
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${quizErrors.courseId ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Hitamo ishuri</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title_kinya}</option>)}
                                        </select>
                                        {quizErrors.courseId && <p className="text-red-500 text-sm mt-1">{quizErrors.courseId}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ikibazo (Ikinyarwanda)</label>
                                        <input
                                            type="text"
                                            value={quizForm.questionKinya}
                                            onChange={(e) => setQuizForm({ ...quizForm, questionKinya: e.target.value })}
                                            required
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${quizErrors.questionKinya ? 'border-red-500' : ''}`}
                                        />
                                        {quizErrors.questionKinya && <p className="text-red-500 text-sm mt-1">{quizErrors.questionKinya}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700">Ampahula</label>
                                        {quizForm.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="correct"
                                                    checked={quizForm.correctAnswer === i}
                                                    onChange={() => setQuizForm({ ...quizForm, correctAnswer: i })}
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOptions = [...quizForm.options];
                                                        newOptions[i] = e.target.value;
                                                        setQuizForm({ ...quizForm, options: newOptions });
                                                    }}
                                                    placeholder={`Ampahula ${i + 1}`}
                                                    className={`flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${quizErrors.options ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        ))}
                                        {quizErrors.options && <p className="text-red-500 text-sm mt-1">{quizErrors.options}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ibisobanuro</label>
                                        <textarea
                                            value={quizForm.explanationKinya}
                                            onChange={(e) => setQuizForm({ ...quizForm, explanationKinya: e.target.value })}
                                            rows={2}
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${quizErrors.explanationKinya ? 'border-red-500' : ''}`}
                                        />
                                        {quizErrors.explanationKinya && <p className="text-red-500 text-sm mt-1">{quizErrors.explanationKinya}</p>}
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="submit" className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700">
                                            Bika Ikibazo
                                        </button>
                                        <button type="button" onClick={() => setShowAddQuiz(false)} className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">
                                            Cancela
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <p className="text-gray-600">Nta bibazo ufite ubu. Kanda "Fata Ikibazo" wongeremo.</p>
                        </div>
                    </div>
                )}

                {/* Stock Tab */}
                {activeTab === 'stock' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Ububiko n'Ibikoresho</h2>
                            <button
                                onClick={() => {
                                    setEditingStock(false);
                                    setStockForm({ 
                                        id: null, name: '', item_code: '', category: 'equipment', quantity: 0, unit: 'pieces', 
                                        min_quantity: 5, price: 0, location: '', supplier: '', description: '' 
                                    });
                                    setShowAddStock(!showAddStock);
                                }}
                                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Ongeramo Igikoresho
                            </button>
                        </div>

                        {/* Stock Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-primary-500">
                                <p className="text-gray-500 text-sm font-bold uppercase">Byose</p>
                                <p className="text-2xl font-black text-gray-800">{stockItems.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-yellow-500">
                                <p className="text-gray-500 text-sm font-bold uppercase">Bike</p>
                                <p className="text-2xl font-black text-gray-800">{stockItems.filter(i => i.quantity > 0 && i.quantity <= (i.min_quantity || 5)).length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-red-500">
                                <p className="text-gray-500 text-sm font-bold uppercase">Byashize</p>
                                <p className="text-2xl font-black text-gray-800">{stockItems.filter(i => i.quantity <= 0).length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500">
                                <p className="text-gray-500 text-sm font-bold uppercase">Agaciro</p>
                                <p className="text-2xl font-black text-gray-800">
                                    {stockItems.reduce((acc, curr) => acc + (curr.quantity * (curr.purchase_price || curr.price || 0)), 0).toLocaleString()} RWF
                                </p>
                            </div>
                        </div>

                        {/* Add/Edit Stock Form */}
                        {showAddStock && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">
                                    {editingStock ? 'Vugurura Igikoresho' : 'Ongeramo Igikoresho Gishya'}
                                </h3>
                                <form onSubmit={handleAddStock} className="grid md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Izina ry'igikoresho</label>
                                        <input
                                            type="text"
                                            value={stockForm.name}
                                            onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${stockErrors.name ? 'border-red-500' : ''}`}
                                            placeholder="Urugero: Imodoka Toyota"
                                        />
                                        {stockErrors.name && <p className="text-red-500 text-sm mt-1">{stockErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Kode (Item Code)</label>
                                        <input
                                            type="text"
                                            value={stockForm.item_code}
                                            onChange={(e) => setStockForm({ ...stockForm, item_code: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            placeholder="ST-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ikiganiro (Category)</label>
                                        <select
                                            value={stockForm.category}
                                            onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        >
                                            <option value="vehicle">Imodoka</option>
                                            <option value="equipment">Ibikoresho</option>
                                            <option value="safety">Umutekano</option>
                                            <option value="signs">Ibimenyetso</option>
                                            <option value="other">Ibindi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ingano (Quantity)</label>
                                        <input
                                            type="number"
                                            value={stockForm.quantity}
                                            onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Igipimo (Unit)</label>
                                        <input
                                            type="text"
                                            value={stockForm.unit}
                                            onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            placeholder="Pieces, Liters, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Igipimo Ntarengwa (Min Qty)</label>
                                        <input
                                            type="number"
                                            value={stockForm.min_quantity}
                                            onChange={(e) => setStockForm({ ...stockForm, min_quantity: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Igiciro (Price/Unit)</label>
                                        <input
                                            type="number"
                                            value={stockForm.price}
                                            onChange={(e) => setStockForm({ ...stockForm, price: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Aho giherereye (Location)</label>
                                        <input
                                            type="text"
                                            value={stockForm.location}
                                            onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            placeholder="Store A, Shelf 2"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Uwagabohoje (Supplier)</label>
                                        <input
                                            type="text"
                                            value={stockForm.supplier}
                                            onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-4 flex gap-4 pt-4 border-t border-gray-100">
                                        <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2">
                                            {editingStock ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            {editingStock ? 'Vugurura' : 'Ongerera'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setShowAddStock(false);
                                                setEditingStock(false);
                                            }} 
                                            className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                                        >
                                            Reka
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Stock Table */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider">Igikoresho</th>
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider text-center">Ingano</th>
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider">Agaciro (Unit)</th>
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-black text-gray-700 text-sm uppercase tracking-wider text-right">Ibikorwa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stockItems.map(item => (
                                            <tr key={item.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{item.item_name || item.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium uppercase">{item.item_code || 'No Code'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold capitalize">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="font-black text-gray-800">{item.quantity}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{item.unit || 'pcs'}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-700">
                                                    {(item.purchase_price || item.price || 0).toLocaleString()} RWF
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight
                                                        ${item.quantity <= 0 ? 'bg-red-100 text-red-700' : 
                                                          item.quantity <= (item.min_quantity || 5) ? 'bg-yellow-100 text-yellow-700' : 
                                                          'bg-green-100 text-green-700'}`}>
                                                        {item.quantity <= 0 ? 'Byashize' : 
                                                         item.quantity <= (item.min_quantity || 5) ? 'Biri Kugabanuka' : 
                                                         'Bihari'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-1">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setTransactionForm({ ...transactionForm, unit_price: item.purchase_price || 0 });
                                                            setShowTransactionModal(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Record Transaction"
                                                    >
                                                        <ArrowLeftRight className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => viewHistory(item)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="View History"
                                                    >
                                                        <History className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditStock(item)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Vugurura"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteStock(item.id)} 
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Siba"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {stockItems.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                                                    Nta bikoresho birashyirwamo mu bubiko.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Tab */}
                {activeTab === 'results' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Ibibanza by'Ibiganiro</h2>

                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Umunyeshuri</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Ishuri</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Ibibanza</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Itariki</th>
                                        <th className="px-6 py-4 text-left font-bold text-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quizResults.map(result => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-800">{result.learner_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{result.course_name}</td>
                                            <td className="px-6 py-4 text-gray-800 font-bold">{result.score}/{result.total}</td>
                                            <td className="px-6 py-4 text-gray-600">{result.taken_at}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {result.passed ? 'Yatsinze' : 'Yagaragijwe'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Road Signs (Ibyapa) Tab */}
                {activeTab === 'ibyapa' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-800">Ibyapa by'Umuhanda</h2>
                            <button
                                onClick={() => setShowAddSign(!showAddSign)}
                                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Ongeramo Icyapa
                            </button>
                        </div>

                        {/* Add Sign Form */}
                        {showAddSign && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Ongeramo Icyapa Kireba Abanyeshuri</h3>
                                <form onSubmit={handleAddRoadSign} className="grid md:grid-cols-2 gap-6">
                                    
                                    {/* Left Column: Form Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Izina ry'Icyapa</label>
                                            <input
                                                type="text"
                                                value={signForm.title}
                                                onChange={(e) => setSignForm({ ...signForm, title: e.target.value })}
                                                required
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${signErrors.title ? 'border-red-500' : ''}`}
                                            />
                                            {signErrors.title && <p className="text-red-500 text-sm mt-1">{signErrors.title}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ibyiciro</label>
                                            <select
                                                value={signForm.category}
                                                onChange={(e) => setSignForm({ ...signForm, category: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                            >
                                                <option value="danger">Iburira (Danger)</option>
                                                <option value="prohibition">Ibuza (Interdiction)</option>
                                                <option value="mandatory">Itegeko (Obligation)</option>
                                                <option value="priority">Priyorite (Priorité)</option>
                                                <option value="indication">Ndanga (Indication)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Ibisobanuro by'Icyapa</label>
                                            <textarea
                                                value={signForm.description}
                                                onChange={(e) => setSignForm({ ...signForm, description: e.target.value })}
                                                required
                                                rows={4}
                                                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none ${signErrors.description ? 'border-red-500' : ''}`}
                                            />
                                            {signErrors.description && <p className="text-red-500 text-sm mt-1">{signErrors.description}</p>}
                                        </div>
                                    </div>

                                    {/* Right Column: Image Upload & Preview */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Ifoto y'Icyapa</label>
                                        
                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                                            {signImagePreview ? (
                                                <div className="relative w-full max-h-48 overflow-hidden rounded-xl flex justify-center">
                                                    <img src={signImagePreview} alt="Preview" className="object-contain max-h-48 rounded-xl border border-gray-200 shadow-sm" />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setSignImage(null); setSignImagePreview(null); }}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500 font-medium mb-1">Kanda hano cyangwa uzane ifoto</p>
                                                    <p className="text-xs text-gray-400">PNG, JPG ingano idakabije (Max 5MB)</p>
                                                </div>
                                            )}
                                            
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleSignImageChange}
                                                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 mt-4 cursor-pointer ${signImagePreview ? 'hidden' : ''}`}
                                            />
                                        </div>
                                        {signErrors.image && <p className="text-red-500 text-sm mt-1">{signErrors.image}</p>}
                                    </div>

                                    <div className="md:col-span-2 pt-4 border-t border-gray-100 flex gap-4">
                                        <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 flex items-center gap-2">
                                            <Upload className="w-5 h-5" />
                                            Bika Icyapa
                                        </button>
                                        <button type="button" onClick={() => setShowAddSign(false)} className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                                            Reka
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Sign Gallery */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {roadSigns.map(sign => (
                                <div key={sign.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group">
                                    <div className="h-48 bg-gray-50 relative p-4 flex items-center justify-center border-b border-gray-100">
                                        <img 
                                            src={sign.image_url ? `/uploads/road-signs/${sign.image_url}` : 'https://placehold.co/150x150?text=Icyapa'} 
                                            alt={sign.title} 
                                            className="max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${sign.category === 'danger' ? 'bg-red-100 text-red-700' : 
                                                  sign.category === 'prohibition' ? 'bg-red-50 border border-red-200 text-red-800' : 
                                                  sign.category === 'mandatory' ? 'bg-blue-100 text-blue-700' : 
                                                  sign.category === 'priority' ? 'bg-yellow-100 text-yellow-700' : 
                                                  'bg-gray-100 text-gray-600'}`}>
                                                {sign.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h4 className="font-bold text-gray-800 text-lg mb-2">{sign.title}</h4>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{sign.description}</p>
                                        
                                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
                                            <button 
                                                onClick={() => deleteRoadSign(sign.id)} 
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold"
                                            >
                                                <Trash2 className="w-4 h-4" /> Siba
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {roadSigns.length === 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-200">
                                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-500 mb-2">Nta byapa birashyirwamo</h3>
                                <p className="text-gray-400 mb-6">Ushobora gushyiramo ibyapa ukanda kuri buto yo hejuru.</p>
                                <button
                                    onClick={() => setShowAddSign(true)}
                                    className="px-6 py-2.5 bg-primary-50 text-primary-600 font-bold rounded-xl hover:bg-primary-100"
                                >
                                    Ongeramo Icyapa
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-primary-50">
                            <div>
                                <h3 className="text-xl font-black text-primary-900">Record Movement</h3>
                                <p className="text-sm text-primary-600 font-bold">{selectedItem.item_name}</p>
                            </div>
                            <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-primary-500">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ubwoko (Type)</label>
                                <select 
                                    value={transactionForm.transaction_type}
                                    onChange={e => setTransactionForm({...transactionForm, transaction_type: e.target.value})}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none font-bold"
                                >
                                    <option value="usage">Gukoresha (Usage)</option>
                                    <option value="purchase">Kugura (Purchase)</option>
                                    <option value="return">Kugarura (Return)</option>
                                    <option value="damage">Kwangirika (Damage)</option>
                                    <option value="disposal">Kujugunya (Disposal)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ingano (Qty)</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={transactionForm.quantity}
                                        onChange={e => setTransactionForm({...transactionForm, quantity: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Igiciro (Price/Unit)</label>
                                    <input 
                                        type="number"
                                        value={transactionForm.unit_price}
                                        onChange={e => setTransactionForm({...transactionForm, unit_price: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Referansi (Reference #)</label>
                                <input 
                                    type="text"
                                    value={transactionForm.reference}
                                    onChange={e => setTransactionForm({...transactionForm, reference: e.target.value})}
                                    placeholder="Invoice, Receipt, or Order #"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ibindi (Notes)</label>
                                <textarea 
                                    value={transactionForm.notes}
                                    onChange={e => setTransactionForm({...transactionForm, notes: e.target.value})}
                                    rows="3"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-[0.98]">
                                    Record Movement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-amber-50">
                            <div>
                                <h3 className="text-xl font-black text-amber-900">Transaction History</h3>
                                <p className="text-sm text-amber-600 font-bold">{selectedItem.item_name} ({selectedItem.item_code})</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-amber-500">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3 text-center">Change</th>
                                        <th className="px-4 py-3 text-center">Balance</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="text-sm">
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(t.transaction_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 font-bold capitalize">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] uppercase
                                                    ${t.transaction_type === 'purchase' || t.transaction_type === 'return' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.transaction_type}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-4 text-center font-black ${t.transaction_type === 'purchase' || t.transaction_type === 'return' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.transaction_type === 'purchase' || t.transaction_type === 'return' ? '+' : '-'}{t.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-gray-800">
                                                {t.quantity_after}
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 italic">
                                                {t.reference || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-gray-500">
                                                {t.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-12 text-center text-gray-400 italic">
                                                Nta mateka y'iki kikoresho arahari.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrivingInstructorDashboard;

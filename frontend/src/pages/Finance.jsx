import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, Plus, FileText, Search, Filter, Download,
    TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone,
    AlertCircle, CheckCircle, Calendar, Receipt, RefreshCw,
    FileSpreadsheet, Printer, X, Image, Eye, Check, XCircle, Users, Pencil, Trash2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const Finance = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [trades, setTrades] = useState([]);
    const [summary, setSummary] = useState(null);
    const [debtors, setDebtors] = useState([]);
    const [feeRangeMin, setFeeRangeMin] = useState('');
    const [feeRangeMax, setFeeRangeMax] = useState('');
    // Debtor trade/level/gender filters
    const [debtorTrade, setDebtorTrade] = useState('');
    const [debtorLevel, setDebtorLevel] = useState('');
    const [debtorGender, setDebtorGender] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Receipt management state
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const [activeTab, setActiveTab] = useState('payments');
    const [showForm, setShowForm] = useState(false);
    const [showDebtorsModal, setShowDebtorsModal] = useState(false);
    const [remindLoading, setRemindLoading] = useState(null);
    const [selectedDebtors, setSelectedDebtors] = useState([]);
    const [bulkRemindLoading, setBulkRemindLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState('all');

    // Trade/Level filtering for payment
    const [filterTrade, setFilterTrade] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [currentTerm, setCurrentTerm] = useState('Term 1 2026');

    const [paymentData, setPaymentData] = useState({
        student_id: '',
        fee_id: '',
        amount_paid: '',
        payment_method: 'cash',
        notes: '',
        send_sms: true
    });

    // Bulk fee state
    const [bulkFeeData, setBulkFeeData] = useState({
        term: 'Term 1 2026',
        description: '',
        due_date: '',
        category: 'both', // public, private, or both
        trades: 'all',
        levels: 'all',
        public_fee_amount: '',
        private_fee_amount: '',
        both_fee_amount: '',
        term_start_date: '',
        term_end_date: ''
    });
    const [bulkFeeLoading, setBulkFeeLoading] = useState(false);
    const [tradesAndLevels, setTradesAndLevels] = useState([]);

    // SMS Balance state
    const [smsBalance, setSmsBalance] = useState(null);
    const [smsLoading, setSmsLoading] = useState(false);

    // Filter students based on trade and level
    const filteredStudents = useMemo(() => {
        let result = students;
        if (filterTrade) {
            result = result.filter(s => s.trade === filterTrade);
        }
        if (filterLevel) {
            result = result.filter(s => s.level === filterLevel);
        }
        return result;
    }, [students, filterTrade, filterLevel]);

    // Filter fees based on selected student's trade, level and type
    const filteredFees = useMemo(() => {
        if (!paymentData.student_id) return fees;
        const student = students.find(s => s.id === parseInt(paymentData.student_id));
        if (!student) return fees;
        const studentType = student.student_type || 'private';
        return fees.filter(f =>
            f.trade === student.trade &&
            f.level === student.level &&
            f.term === currentTerm &&
            (f.student_category === studentType || f.student_category === 'both' || !f.student_category)
        );
    }, [fees, paymentData.student_id, students, currentTerm]);

    // Get levels for selected trade
    const getLevelsForTrade = (tradeName) => {
        const trade = trades.find(t => t.name === tradeName);
        return trade?.levels || [];
    };

    const [feeData, setFeeData] = useState({
        term: 'Term 1 2026',
        trade: 'Software Development',
        level: 'Level 3',
        amount: '',
        description: '',
        due_date: '',
        student_category: 'private'
    });

    // Editing fee state
    const [editingFee, setEditingFee] = useState(null);

    const fetchData = async () => {
        try {
            const [payRes, feeRes, stuRes, sumRes, receiptRes, tradeRes] = await Promise.all([
                axios.get(`${API_URL}/api/finance/payments`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/finance/fees`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/students`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/finance/reports/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/parent-payments/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/trades`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPayments(payRes.data);
            setFees(feeRes.data);
            setStudents(Array.isArray(stuRes.data) ? stuRes.data : (stuRes.data.students || []));
            setSummary(sumRes.data);
            setReceipts(receiptRes.data);
            setTrades(tradeRes.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDebtors = async () => {
        try {
            const params = new URLSearchParams();
            if (feeRangeMin) params.append('min_balance', feeRangeMin);
            if (feeRangeMax) params.append('max_balance', feeRangeMax);
            if (debtorTrade) params.append('trade', debtorTrade);
            if (debtorLevel) params.append('level', debtorLevel);

            const res = await axios.get(`${API_URL}/api/finance/reports/debtors?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDebtors(res.data);
            setShowDebtorsModal(true);
        } catch (error) {
            toast.error('Failed to load debtors');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Data refreshed!');
    };

    // Fetch SMS Balance
    const fetchSMSBalance = async () => {
        setSmsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/finance/sms/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSmsBalance(res.data);
        } catch (error) {
            console.error('Error fetching SMS balance:', error);
            toast.error('Failed to load SMS balance');
        } finally {
            setSmsLoading(false);
        }
    };

    // Fetch trades and levels for bulk fee
    const fetchTradesAndLevels = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/finance/fees/trades-levels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTradesAndLevels(res.data.trades || []);
        } catch (error) {
            console.error('Error fetching trades and levels:', error);
        }
    };

    // Handle bulk fee creation
    const handleBulkFeeSubmit = async (e) => {
        e.preventDefault();
        setBulkFeeLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/finance/fees/bulk`, bulkFeeData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            if (res.data.feesCreated > 0) {
                fetchData();
                setBulkFeeData({
                    term: 'Term 1 2026',
                    description: '',
                    due_date: '',
                    category: 'both',
                    trades: 'all',
                    levels: 'all',
                    public_fee_amount: '',
                    private_fee_amount: '',
                    both_fee_amount: '',
                    term_start_date: '',
                    term_end_date: ''
                });
            }
        } catch (error) {
            toast.error('Failed to create bulk fees');
        } finally {
            setBulkFeeLoading(false);
        }
    };

    // Handle delete all fees
    const handleDeleteAllFees = async () => {
        if (!window.confirm('Are you sure you want to delete all fees? This action cannot be undone!')) {
            return;
        }
        if (!window.confirm('This will permanently delete ALL fee structures. Continue?')) {
            return;
        }
        try {
            const res = await axios.delete(`${API_URL}/api/finance/fees`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { confirm_delete: true, term: bulkFeeData.term, trade: bulkFeeData.trades }
            });
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete fees');
        }
    };

    const handleExportPayments = () => {
        setExporting(true);
        try {
            const filteredPayments = filterMethod === 'all'
                ? payments
                : payments.filter(p => p.payment_method === filterMethod);

            const csvContent = [
                ['Date', 'Student Name', 'Amount', 'Method', 'Receipt'].join(','),
                ...filteredPayments.map(p => [
                    new Date(p.payment_date).toLocaleDateString(),
                    `${p.first_name} ${p.last_name}`,
                    p.amount_paid,
                    p.payment_method,
                    p.receipt_number || ''
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Payments exported successfully!');
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    // Verify receipt
    const verifyReceipt = async (receiptId, status) => {
        try {
            await axios.put(`${API_URL}/api/parent-payments/receipt/verify`,
                { receipt_id: receiptId, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(status === 'verified' ? 'Receipt verified!' : 'Receipt rejected');
            fetchData();
        } catch (error) {
            toast.error('Failed to update receipt');
        }
    };

    // View receipt detail
    const viewReceipt = (receipt) => {
        setSelectedReceipt(receipt);
        setShowReceiptModal(true);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch additional data when tabs change
    useEffect(() => {
        if (activeTab === 'sms') {
            fetchSMSBalance();
        }
        if (activeTab === 'bulk') {
            fetchTradesAndLevels();
        }
    }, [activeTab]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/finance/payments`, paymentData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Show balance info if available
            if (res.data.balance) {
                const { balance } = res.data.balance;
                if (balance.isInsufficient) {
                    toast.info(`Payment recorded! Remaining balance: ${balance.remainingBalance.toLocaleString()} RWF`);
                } else {
                    toast.success(`Payment recorded! Fully paid! 🎉`);
                }
            } else {
                toast.success(`Payment recorded! Receipt: ${res.data.receiptNumber}`);
            }

            setShowForm(false);
            setPaymentData({ student_id: '', fee_id: '', amount_paid: '', payment_method: 'cash', notes: '', send_sms: true });
            setFilterTrade('');
            setFilterLevel('');
            fetchData();
        } catch (error) {
            toast.error('Failed to record payment');
        }
    };

    // Auto-fetch fee when student is selected
    const handleStudentChange = async (studentId) => {
        setPaymentData({ ...paymentData, student_id: studentId, fee_id: '', amount_paid: '' });

        if (!studentId) return;

        const student = students.find(s => s.id === parseInt(studentId));
        if (!student) return;

        const studentType = student.student_type || 'private';

        // Auto-fetch the current term fee for this student's trade and level and type
        try {
            const res = await axios.get(
                `${API_URL}/api/finance/fees/current?trade=${encodeURIComponent(student.trade)}&level=${encodeURIComponent(student.level)}&term=${encodeURIComponent(currentTerm)}&student_type=${studentType}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Auto-fill the fee and amount
            if (res.data) {
                setPaymentData(prev => ({
                    ...prev,
                    student_id: studentId,
                    fee_id: res.data.id,
                    amount_paid: res.data.amount
                }));
                const categoryLabel = res.data.student_category === 'both' ? '(All)' : `(${res.data.student_category})`;
                toast.info(`Fee auto-filled: ${Number(res.data.amount).toLocaleString()} RWF for ${student.trade} - ${student.level} ${categoryLabel}`);
            }
        } catch (err) {
            console.log('No fee found for this trade/level/term/student_type');
            // Try without student_type if not found
            try {
                const res = await axios.get(
                    `${API_URL}/api/finance/fees/current?trade=${encodeURIComponent(student.trade)}&level=${encodeURIComponent(student.level)}&term=${encodeURIComponent(currentTerm)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data) {
                    setPaymentData(prev => ({
                        ...prev,
                        student_id: studentId,
                        fee_id: res.data.id,
                        amount_paid: res.data.amount
                    }));
                    toast.info(`Fee auto-filled: ${Number(res.data.amount).toLocaleString()} RWF for ${student.trade} - ${student.level}`);
                }
            } catch (e) {
                console.log('No fee found for this trade/level/term');
            }
        }
    };

    const handleFeeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFee) {
                // Update existing fee
                await axios.put(`${API_URL}/api/finance/fees/${editingFee.id}`, feeData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Fee structure updated successfully');
                setEditingFee(null);
            } else {
                // Create new fee
                await axios.post(`${API_URL}/api/finance/fees`, feeData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Fee structure added successfully');
            }
            setShowForm(false);
            setFeeData({ ...feeData, amount: '' });
            fetchData();
        } catch (error) {
            toast.error(editingFee ? 'Failed to update fee structure' : 'Failed to add fee structure');
        }
    };

    // Handle edit fee
    const handleEditFee = (fee) => {
        setEditingFee(fee);
        setFeeData({
            term: fee.term || 'Term 1 2026',
            trade: fee.trade || 'Software Development',
            level: fee.level || 'Level 3',
            amount: fee.amount || '',
            description: fee.description || '',
            due_date: fee.due_date || '',
            student_category: fee.student_category || 'private'
        });
        setShowForm(true);
    };

    // Handle delete fee
    const handleDeleteFee = async (feeId) => {
        if (!window.confirm('Are you sure you want to delete this fee structure? This action cannot be undone.')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/api/finance/fees/${feeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Fee structure deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete fee structure');
        }
    };

    const remindParent = async (studentId) => {
        setRemindLoading(studentId);
        try {
            const res = await axios.post(`${API_URL}/api/finance/remind`, { student_id: studentId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reminder');
        } finally {
            setRemindLoading(null);
        }
    };

    // Bulk remind all selected debtors with balance range and trade/level/gender filters
    const bulkRemindParents = async () => {
        if (selectedDebtors.length === 0 && !debtorTrade && !debtorLevel && !debtorGender) return toast.error('Select students or set trade/level/gender filter');
        setBulkRemindLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/finance/remind/broadcast`,
                {
                    student_ids: selectedDebtors.length > 0 ? selectedDebtors : undefined,
                    trade: debtorTrade || undefined,
                    level: debtorLevel || undefined,
                    gender: debtorGender || undefined,
                    min_balance: feeRangeMin || undefined,
                    max_balance: feeRangeMax || undefined
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(res.data.message || `Reminders sent to ${res.data.sent} parents!`);
            setSelectedDebtors([]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send bulk reminders');
        } finally {
            setBulkRemindLoading(false);
        }
    };

    // Toggle debtor selection
    const toggleDebtorSelection = (studentId) => {
        setSelectedDebtors(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Select all debtors
    const selectAllDebtors = () => {
        if (selectedDebtors.length === debtors.length) {
            setSelectedDebtors([]);
        } else {
            setSelectedDebtors(debtors.map(d => d.id));
        }
    };

    const isAccountantOrAdmin = user.role === 'accountant' || user.role === 'admin';

    const getPaymentMethodIcon = (method) => {
        const icons = {
            cash: <Banknote size={14} />,
            bank_transfer: <CreditCard size={14} />,
            mobile_money: <Smartphone size={14} />,
            card: <CreditCard size={14} />
        };
        return icons[method] || <Banknote size={14} />;
    };

    const renderLevelOptions = () => {
        if (feeData.trade === 'Automobile Technology') {
            return (
                <>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4a">Level 4 A</option>
                    <option value="Level 4b">Level 4 B</option>
                    <option value="Level 5a">Level 5 A</option>
                    <option value="Level 5b">Level 5 B</option>
                </>
            );
        } else if (feeData.trade === 'Building and Construction') {
            return (
                <>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                    <option value="Level 5">Level 5</option>
                </>
            );
        } else {
            return (
                <>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                    <option value="Level 5">Level 5</option>
                </>
            );
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.reg_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMethod = filterMethod === 'all' || p.payment_method === filterMethod;
        return matchesSearch && matchesMethod;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Summary */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <DollarSign className="text-green-300" size={28} />
                            Finance Management
                        </h2>
                        <p className="text-green-200 text-sm mt-1">Manage fees, payments, and track revenue</p>
                    </div>
                    {isAccountantOrAdmin && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                                disabled={refreshing}
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
                            </button>
                            <button
                                onClick={() => navigate('/students')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg"
                            >
                                <Users size={16} /> Manage Students
                            </button>
                            <button
                                onClick={fetchDebtors}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <AlertCircle size={16} /> Debtors
                            </button>
                            {activeTab === 'payments' && (
                                <button
                                    onClick={handleExportPayments}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                                    disabled={exporting}
                                >
                                    <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-xl text-sm font-semibold transition-colors shadow-lg flex items-center gap-2"
                            >
                                <Plus size={16} /> {activeTab === 'payments' ? 'Record Payment' : 'New Fee'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-200 text-sm">
                                <TrendingUp size={16} /> Total Collected
                            </div>
                            <p className="text-2xl font-bold mt-1">{Number(summary.total_collected).toLocaleString()} RWF</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-200 text-sm">
                                <Calendar size={16} /> This Month
                            </div>
                            <p className="text-2xl font-bold mt-1">{Number(summary.this_month).toLocaleString()} RWF</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-200 text-sm">
                                <FileText size={16} /> Active Fees
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.active_fees}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-200 text-sm">
                                <DollarSign size={16} /> Active Students
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.active_students}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                {[
                    { id: 'payments', label: 'Payments', count: payments.length },
                    { id: 'fees', label: 'Fee Structures', count: fees.length },
                    { id: 'bulk', label: 'Bulk Fees', icon: '📦' },
                    { id: 'sms', label: 'SMS Balance', icon: '📱' },
                    { id: 'debtors', label: 'Debtors', action: fetchDebtors }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowForm(false);
                            if (tab.action) tab.action();
                        }}
                        className={`px-5 py-2.5 font-semibold text-sm transition-all rounded-xl ${activeTab === tab.id
                            ? 'bg-green-100 text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Payment Form */}
            {showForm && activeTab === 'payments' && isAccountantOrAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-green-600" /> Record Student Payment
                    </h3>

                    {/* Trade/Level Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-green-50 rounded-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Trade</label>
                            <select
                                className="input-field"
                                value={filterTrade}
                                onChange={e => { setFilterTrade(e.target.value); setFilterLevel(''); }}
                            >
                                <option value="">All Trades</option>
                                {trades.map(t => (
                                    <option key={t.id || t.name} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Level</label>
                            <select
                                className="input-field"
                                value={filterLevel}
                                onChange={e => setFilterLevel(e.target.value)}
                                disabled={!filterTrade}
                            >
                                <option value="">All Levels</option>
                                {getLevelsForTrade(filterTrade).map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                            <select
                                className="input-field"
                                value={currentTerm}
                                onChange={e => setCurrentTerm(e.target.value)}
                            >
                                <option value="Term 1 2026">Term 1 2026</option>
                                <option value="Term 2 2026">Term 2 2026</option>
                                <option value="Term 3 2026">Term 3 2026</option>
                                <option value="Term 1 2025">Term 1 2025</option>
                                <option value="Term 2 2025">Term 2 2025</option>
                                <option value="Term 3 2025">Term 3 2025</option>
                                <option value="Term 1 2027">Term 1 2027</option>
                                <option value="Term 2 2027">Term 2 2027</option>
                                <option value="Term 3 2027">Term 3 2027</option>
                                <option value="custom">+ Add Custom Term/Year</option>
                            </select>
                        </div>
                        {currentTerm === 'custom' && (
                            <div className="flex gap-2">
                                <select
                                    className="input-field"
                                    onChange={e => setCurrentTerm(e.target.value + ' ' + new Date().getFullYear())}
                                >
                                    <option value="">Select Term</option>
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                                <input
                                    type="number"
                                    className="input-field w-24"
                                    placeholder="Year"
                                    min="2020"
                                    max="2030"
                                    defaultValue={new Date().getFullYear()}
                                    onChange={e => setCurrentTerm('Term 1 ' + e.target.value)}
                                />
                            </div>
                        )}
                        <div className="flex items-end">
                            <span className="text-sm text-gray-500">
                                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                            <select
                                required
                                className="input-field"
                                value={paymentData.student_id}
                                onChange={e => handleStudentChange(e.target.value)}
                            >
                                <option value="">Select a student...</option>
                                {filteredStudents.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.first_name} {s.last_name} ({s.reg_number}) - {s.trade} {s.level}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure (Auto-filled)</label>
                            <select
                                className="input-field"
                                value={paymentData.fee_id}
                                onChange={e => {
                                    const fee = fees.find(f => f.id === parseInt(e.target.value));
                                    setPaymentData({
                                        ...paymentData,
                                        fee_id: e.target.value,
                                        amount_paid: fee ? fee.amount : paymentData.amount_paid
                                    });
                                }}
                            >
                                <option value="">Select applicable fee...</option>
                                {filteredFees.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.term} - {f.trade} ({f.level}) - {Number(f.amount).toLocaleString()} RWF
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (RWF) *</label>
                            <input
                                required
                                type="number"
                                min="0"
                                className="input-field"
                                value={paymentData.amount_paid}
                                onChange={e => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                className="input-field"
                                value={paymentData.payment_method}
                                onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input
                                type="text"
                                className="input-field"
                                value={paymentData.notes}
                                onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={paymentData.send_sms}
                                    onChange={e => setPaymentData({ ...paymentData, send_sms: e.target.checked })}
                                    className="w-4 h-4 text-green-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Send SMS notification to parent</span>
                            </label>
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFilterTrade('');
                                    setFilterLevel('');
                                    setPaymentData({ student_id: '', fee_id: '', amount_paid: '', payment_method: 'cash', notes: '', send_sms: true });
                                }}
                                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold">Save Payment</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fee Form */}
            {showForm && activeTab === 'fees' && isAccountantOrAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-green-600" />
                        {editingFee ? 'Edit Fee Structure' : 'Define Term Fee'}
                    </h3>
                    <form onSubmit={handleFeeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Term / Year</label>
                            <input required type="text" placeholder="e.g. Term 1 2026" className="input-field" value={feeData.term}
                                onChange={e => setFeeData({ ...feeData, term: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Category *</label>
                            <select required className="input-field" value={feeData.student_category}
                                onChange={e => setFeeData({ ...feeData, student_category: e.target.value })}>
                                <option value="public">Public (Government Sponsored)</option>
                                <option value="private">Private (Self-Sponsored)</option>
                                <option value="both">Both (Same Fee)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                            <select className="input-field" value={feeData.trade}
                                onChange={e => setFeeData({ ...feeData, trade: e.target.value, level: e.target.value === 'Building and Construction' ? 'Level 3' : 'Level 3' })}>
                                <option value="Software Development">Software Development</option>
                                <option value="Automobile Technology">Automobile Technology</option>
                                <option value="Building and Construction">Building and Construction</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                            <select className="input-field" value={feeData.level}
                                onChange={e => setFeeData({ ...feeData, level: e.target.value })}>
                                {renderLevelOptions()}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (RWF)</label>
                            <input required type="number" min="0" className="input-field" value={feeData.amount}
                                onChange={e => setFeeData({ ...feeData, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input type="date" className="input-field" value={feeData.due_date}
                                onChange={e => setFeeData({ ...feeData, due_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input type="text" className="input-field" value={feeData.description}
                                onChange={e => setFeeData({ ...feeData, description: e.target.value })} />
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingFee(null); setFeeData({ term: 'Term 1 2026', trade: 'Software Development', level: 'Level 3', amount: '', description: '', due_date: '', student_category: 'private' }); }}
                                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold">
                                {editingFee ? 'Update Fee' : 'Create Fee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search & Filter */}
            {activeTab === 'payments' && (
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student name or reg number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                    <select
                        value={filterMethod}
                        onChange={(e) => setFilterMethod(e.target.value)}
                        className="input-field w-48"
                    >
                        <option value="all">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="card">Card</option>
                    </select>
                </div>
            )}

            {/* Data Tables */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'payments' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-green-50/80 text-green-800 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Term Info</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-8 text-center"><div className="h-4 bg-gray-200 rounded w-1/4 mx-auto animate-pulse" /></td></tr>
                                    ))
                                ) : filteredPayments.map(p => (
                                    <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                            <div>{new Date(p.payment_date).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">{new Date(p.payment_date).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{p.first_name} {p.last_name}</div>
                                            <div className="text-xs font-mono text-gray-400">{p.reg_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 text-sm">
                                            {p.term || 'N/A'}
                                            {p.receipt_number && <div className="text-xs text-gray-400 font-mono">{p.receipt_number}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 rounded-lg">
                                                {getPaymentMethodIcon(p.payment_method)}
                                                {p.payment_method?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-black text-green-600">{Number(p.amount_paid).toLocaleString()}</span>
                                            <span className="text-xs text-gray-400 ml-1">RWF</span>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredPayments.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">No payment records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === 'fees' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-green-50/80 text-green-800 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Term</th>
                                    <th className="px-6 py-4">Trade</th>
                                    <th className="px-6 py-4">Level</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}><td colSpan={5} className="px-6 py-8 text-center"><div className="h-4 bg-gray-200 rounded w-1/4 mx-auto animate-pulse" /></td></tr>
                                    ))
                                ) : fees.map(f => (
                                    <tr key={f.id} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{f.term}</td>
                                        <td className="px-6 py-4 text-gray-700">{f.trade}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">{f.level}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-lg font-black text-green-700">{Number(f.amount).toLocaleString()}</span>
                                            <span className="text-xs text-gray-400 ml-1">RWF</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditFee(f)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Fee"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFee(f.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Fee"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && fees.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">No fee structures defined</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === 'bulk' ? (
                        <div className="p-6">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    📦 Bulk Fee Creation
                                </h3>
                                <p className="text-blue-200 text-sm mt-1">Create fees for multiple trades and levels at once</p>
                            </div>

                            <form onSubmit={handleBulkFeeSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="input-field flex-1"
                                                value={(bulkFeeData.term.match(/^Term [123]/) || ['Term 1'])[0]}
                                                onChange={e => {
                                                    const yr = (bulkFeeData.term.match(/(\d{4})/) || [new Date().getFullYear()])[0];
                                                    setBulkFeeData({ ...bulkFeeData, term: `${e.target.value} ${yr}` });
                                                }}
                                            >
                                                <option value="Term 1">Term 1</option>
                                                <option value="Term 2">Term 2</option>
                                                <option value="Term 3">Term 3</option>
                                            </select>
                                            <input
                                                type="number"
                                                className="input-field w-24"
                                                value={(bulkFeeData.term.match(/(\d{4})/) || [new Date().getFullYear()])[0]}
                                                onChange={e => {
                                                    const tn = (bulkFeeData.term.match(/^Term [123]/) || ['Term 1'])[0];
                                                    setBulkFeeData({ ...bulkFeeData, term: `${tn} ${e.target.value}` });
                                                }}
                                                placeholder="2026"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={bulkFeeData.due_date}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Term Start Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={bulkFeeData.term_start_date}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, term_start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Term End Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={bulkFeeData.term_end_date}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, term_end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={bulkFeeData.description}
                                        onChange={e => setBulkFeeData({ ...bulkFeeData, description: e.target.value })}
                                        placeholder="e.g., Term 1 Tuition Fees"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Category</label>
                                        <select
                                            className="input-field"
                                            value={bulkFeeData.category}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, category: e.target.value })}
                                        >
                                            <option value="both">Both (Public & Private)</option>
                                            <option value="public">Public Only (Government Sponsored)</option>
                                            <option value="private">Private Only (Self-Sponsored)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Apply To</label>
                                        <select
                                            className="input-field"
                                            value={bulkFeeData.trades}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, trades: e.target.value })}
                                        >
                                            <option value="all">All Trades</option>
                                            {tradesAndLevels.map(t => (
                                                <option key={t.name} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Public Fee (RWF)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bulkFeeData.public_fee_amount}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, public_fee_amount: e.target.value })}
                                            placeholder="For government sponsored"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Private Fee (RWF)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bulkFeeData.private_fee_amount}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, private_fee_amount: e.target.value })}
                                            placeholder="For self-sponsored"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Both (RWF)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={bulkFeeData.both_fee_amount}
                                            onChange={e => setBulkFeeData({ ...bulkFeeData, both_fee_amount: e.target.value })}
                                            placeholder="Same for all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    {isAccountantOrAdmin && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteAllFees}
                                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2"
                                        >
                                            🗑️ Delete All Fees
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setBulkFeeData({
                                            term: 'Term 1 2026', description: '', due_date: '',
                                            category: 'both', trades: 'all', levels: 'all',
                                            public_fee_amount: '', private_fee_amount: '', both_fee_amount: '',
                                            term_start_date: '', term_end_date: ''
                                        })}
                                        className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkFeeLoading}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        {bulkFeeLoading ? 'Creating...' : '📦 Create Bulk Fees'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : activeTab === 'sms' ? (
                        <div className="p-6">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-6 text-white mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    📱 SMS Balance & Usage
                                </h3>
                                <p className="text-purple-200 text-sm mt-1">Track your Africa's Talking SMS credits and usage</p>
                            </div>

                            {smsLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-4">Loading SMS balance...</p>
                                </div>
                            ) : smsBalance ? (
                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                            <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                                                💰 SMS Credit Balance
                                            </div>
                                            <p className="text-3xl font-black text-green-600">{smsBalance.balance || 'N/A'}</p>
                                            <p className="text-xs text-green-600 mt-1">Africa's Talking Account</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                            <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-2">
                                                📊 Total SMS Sent
                                            </div>
                                            <p className="text-3xl font-black text-purple-600">{smsBalance.stats?.total_sms || 0}</p>
                                            <p className="text-xs text-purple-600 mt-1">All time</p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                            <div className="text-green-600 text-sm font-medium">✅ Sent</div>
                                            <p className="text-2xl font-bold text-green-700">{smsBalance.stats?.sent || 0}</p>
                                        </div>
                                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                            <div className="text-yellow-600 text-sm font-medium">⏳ Pending</div>
                                            <p className="text-2xl font-bold text-yellow-700">{smsBalance.stats?.pending || 0}</p>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                            <div className="text-red-600 text-sm font-medium">❌ Failed</div>
                                            <p className="text-2xl font-bold text-red-700">{smsBalance.stats?.failed || 0}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={fetchSMSBalance}
                                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center gap-2"
                                        >
                                            🔄 Refresh Balance
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Smartphone size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>Unable to load SMS balance</p>
                                    <button
                                        onClick={fetchSMSBalance}
                                        className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Debtors Modal */}
            {showDebtorsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <AlertCircle className="text-orange-500" /> Students with Outstanding Balance
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{debtors.length} students with balance</p>
                            </div>
                            {/* Filters Row */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <select
                                    value={debtorTrade}
                                    onChange={(e) => { setDebtorTrade(e.target.value); setDebtorLevel(''); }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">All Trades</option>
                                    {trades.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={debtorLevel}
                                    onChange={(e) => setDebtorLevel(e.target.value)}
                                    disabled={!debtorTrade}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                >
                                    <option value="">All Levels</option>
                                    {debtorTrade && trades.find(t => t.name === debtorTrade)?.levels?.map(lvl => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                                <select
                                    value={debtorGender}
                                    onChange={(e) => setDebtorGender(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    title="Filter by gender"
                                >
                                    <option value="">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Min Balance"
                                    value={feeRangeMin}
                                    onChange={(e) => setFeeRangeMin(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Max Balance"
                                    value={feeRangeMax}
                                    onChange={(e) => setFeeRangeMax(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    onClick={fetchDebtors}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold"
                                >
                                    Filter
                                </button>
                                {(debtorTrade || debtorLevel || debtorGender || feeRangeMin || feeRangeMax) && (
                                    <button
                                        onClick={() => { setDebtorTrade(''); setDebtorLevel(''); setDebtorGender(''); setFeeRangeMin(''); setFeeRangeMax(''); fetchDebtors(); }}
                                        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {(debtorTrade || debtorLevel || debtorGender || feeRangeMin || feeRangeMax) && (
                                    <button
                                        onClick={bulkRemindParents}
                                        disabled={bulkRemindLoading}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        <Smartphone size={16} />
                                        {bulkRemindLoading ? 'Sending...' : 'Remind All Filtered'}
                                    </button>
                                )}
                                {selectedDebtors.length > 0 && (
                                    <button
                                        onClick={bulkRemindParents}
                                        disabled={bulkRemindLoading}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        <Smartphone size={16} />
                                        {bulkRemindLoading ? 'Sending...' : `Remind ${selectedDebtors.length} Selected`}
                                    </button>
                                )}
                                <button onClick={() => { setShowDebtorsModal(false); setSelectedDebtors([]); }} className="p-2 hover:bg-gray-100 rounded-xl">
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[60vh]">
                            <table className="w-full text-left">
                                <thead className="bg-orange-50/80 text-orange-800 text-xs font-bold uppercase sticky top-0">
                                    <tr>
                                        <th className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedDebtors.length === debtors.length && debtors.length > 0}
                                                onChange={selectAllDebtors}
                                                className="w-4 h-4 rounded"
                                            />
                                        </th>
                                        <th className="px-4 py-4">Student</th>
                                        <th className="px-4 py-4">Trade</th>
                                        <th className="px-4 py-4">Total Fee</th>
                                        <th className="px-4 py-4">Paid</th>
                                        <th className="px-4 py-4">Balance</th>
                                        <th className="px-4 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {debtors.map(s => (
                                        <tr key={s.id} className={`hover:bg-orange-50/30 ${selectedDebtors.includes(s.id) ? 'bg-orange-50' : ''}`}>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDebtors.includes(s.id)}
                                                    onChange={() => toggleDebtorSelection(s.id)}
                                                    className="w-4 h-4 rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900">{s.first_name} {s.last_name}</div>
                                                <div className="text-xs text-gray-400">{s.reg_number}</div>
                                                {s.phone && <div className="text-xs text-green-600">{s.phone}</div>}
                                            </td>
                                            <td className="px-4 py-4 text-sm">{s.trade} ({s.level})</td>
                                            <td className="px-4 py-4 font-mono">{Number(s.total_fee || 0).toLocaleString()}</td>
                                            <td className="px-4 py-4 font-mono text-green-600">{Number(s.total_paid || 0).toLocaleString()}</td>
                                            <td className="px-4 py-4 font-black text-red-600">{Number(s.balance || 0).toLocaleString()}</td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => remindParent(s.id)}
                                                    disabled={remindLoading === s.id}
                                                    className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                                >
                                                    {remindLoading === s.id ? '...' : <><Smartphone size={12} /> Remind</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {debtors.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-500">No debtors found</td></tr>
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

export default Finance;

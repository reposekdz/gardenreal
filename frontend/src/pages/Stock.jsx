import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import {
    Package, Plus, CheckCircle, AlertTriangle, RefreshCw, Trash2,
    Edit2, Eye, Search, Filter, Download, TrendingUp, TrendingDown,
    Box, Wrench, Monitor, Utensils, HardHat, Zap, AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const Stock = () => {
    const { token, user } = useAuthStore();
    const [items, setItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('items');
    const [showForm, setShowForm] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const [formData, setFormData] = useState({
        item_name: '',
        category: 'equipment',
        quantity: 0,
        unit: 'pieces',
        min_quantity: 5,
        location: '',
        supplier: '',
        purchase_date: '',
        purchase_price: '',
        description: '',
        image_url: ''
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5 MB');
            return;
        }
        setUploadingImage(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await axios.post(`${API_URL}/api/stock/upload-image`, fd, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setFormData(p => ({ ...p, image_url: res.data.url }));
            toast.success('Image uploaded');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Image upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const [transactionData, setTransactionData] = useState({
        item_id: '',
        transaction_type: 'purchase',
        quantity: 1,
        unit_price: 0,
        reference: '',
        notes: ''
    });

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/stock`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(res.data);
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/stock/reports/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
        } catch (error) {
            console.error('Failed to load summary');
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/stock/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to load transactions');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchItems(), fetchSummary(), fetchTransactions()]);
        setRefreshing(false);
        toast.success('Inventory refreshed!');
    };

    useEffect(() => {
        fetchItems();
        fetchSummary();
    }, []);

    useEffect(() => {
        if (activeTab === 'transactions') {
            fetchTransactions();
        }
    }, [activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const stockData = {
                ...formData,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null
            };
            await axios.post(`${API_URL}/api/stock`, stockData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item added successfully');
            setShowForm(false);
            setFormData({
                item_name: '', category: 'equipment', quantity: 0,
                unit: 'pieces', min_quantity: 5, location: '', supplier: '',
                purchase_date: '', purchase_price: '', description: '', image_url: ''
            });
            fetchItems();
            fetchSummary();
        } catch (error) {
            console.error('Error adding stock item:', error.response || error);
            toast.error(error.response?.data?.message || 'Failed to add item');
        }
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        try {
            const txData = {
                ...transactionData,
                item_id: parseInt(transactionData.item_id),
                quantity: parseInt(transactionData.quantity),
                unit_price: transactionData.unit_price ? parseFloat(transactionData.unit_price) : 0
            };
            await axios.post(`${API_URL}/api/stock/transactions`, txData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Transaction recorded');
            setShowTransactionForm(false);
            setTransactionData({
                item_id: '', transaction_type: 'purchase', quantity: 1,
                unit_price: 0, reference: '', notes: ''
            });
            fetchItems();
            fetchTransactions();
            fetchSummary();
        } catch (error) {
            console.error('Error recording transaction:', error.response || error);
            toast.error(error.response?.data?.message || 'Failed to record transaction');
        }
    };

    const updateQuantity = async (id, change, currentQty, currentMin) => {
        const newQty = Math.max(0, currentQty + change);
        let newStatus = 'available';
        if (newQty <= 0) newStatus = 'depleted';
        else if (newQty < currentMin) newStatus = 'low_stock';

        try {
            await axios.put(`${API_URL}/api/stock/${id}`, {
                quantity: newQty,
                status: newStatus,
                min_quantity: currentMin
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
            fetchSummary();
        } catch (error) {
            console.error('Stock update error:', error.response || error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Failed to update stock: ${msg}`);
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await axios.delete(`${API_URL}/api/stock/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Item deleted');
            fetchItems();
            fetchSummary();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const isStockOrAdmin = user.role === 'stock_manager' || user.role === 'admin';

    const getCategoryIcon = (category) => {
        const icons = {
            equipment: Wrench,
            food: Utensils
        };
        const Icon = icons[category] || Package;
        return <Icon size={18} />;
    };

    const getStatusColor = (status) => {
        const colors = {
            available: 'bg-green-100 text-green-700 border-green-200',
            low_stock: 'bg-amber-100 text-amber-700 border-amber-200',
            depleted: 'bg-red-100 text-red-700 border-red-200',
            under_maintenance: 'bg-blue-100 text-blue-700 border-blue-200',
            damaged: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return colors[status] || colors.available;
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const isLowStock = item.quantity < item.min_quantity;
        const matchesLowStock = !showLowStockOnly || isLowStock;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Package className="text-amber-300" size={28} />
                            Inventory Management
                        </h2>
                        <p className="text-amber-200 text-sm mt-1">Track and manage school equipment and supplies</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                            disabled={refreshing}
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        {isStockOrAdmin && (
                            <>
                                <button
                                    onClick={() => setShowTransactionForm(true)}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={16} /> Transaction
                                </button>
                                <button
                                    onClick={() => setShowForm(!showForm)}
                                    className="px-4 py-2 bg-white text-amber-700 hover:bg-amber-50 rounded-xl text-sm font-semibold transition-colors shadow-lg flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-amber-200 text-sm">
                                <Box size={16} /> Total Items
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.total_items}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-amber-200 text-sm">
                                <TrendingUp size={16} /> Total Quantity
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.total_quantity?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-amber-200 text-sm">
                                <AlertTriangle size={16} /> Low Stock
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.low_stock_count}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 text-amber-200 text-sm">
                                <TrendingDown size={16} /> Depleted
                            </div>
                            <p className="text-2xl font-bold mt-1">{summary.depleted_count}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'items'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    All Items
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'transactions'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Transactions
                </button>
            </div>

            {/* Add Item Form */}
            {showForm && isStockOrAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-amber-600" /> Add New Stock Item
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                            <input required type="text" className="input-field" value={formData.item_name}
                                onChange={e => setFormData({ ...formData, item_name: e.target.value })} placeholder="e.g. Dell Monitor" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select className="input-field" value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="equipment">Equipment</option>
                                <option value="supplies">Supplies</option>
                                <option value="furniture">Furniture</option>
                                <option value="electronics">Electronics</option>
                                <option value="tools">Tools</option>
                                <option value="stationery">Stationery</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                            <input required type="number" min="0" className="input-field" value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select className="input-field" value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="pieces">Pieces</option>
                                <option value="boxes">Boxes</option>
                                <option value="reams">Reams</option>
                                <option value="liters">Liters</option>
                                <option value="kg">Kg</option>
                                <option value="pairs">Pairs</option>
                                <option value="sets">Sets</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity (Alert)</label>
                            <input type="number" min="0" className="input-field" value={formData.min_quantity}
                                onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input type="text" className="input-field" value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Room 101" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <input type="text" className="input-field" value={formData.supplier}
                                onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                            <input type="number" min="0" className="input-field" value={formData.purchase_price}
                                onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} placeholder="RWF" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                            <input type="date" className="input-field" value={formData.purchase_date}
                                onChange={e => setFormData({ ...formData, purchase_date: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea className="input-field" rows={2} value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Image (optional)</label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <input
                                    type="file" accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                    className="block text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                />
                                {uploadingImage && <span className="text-sm text-amber-600 animate-pulse">Uploading...</span>}
                                {formData.image_url && (
                                    <div className="relative">
                                        <img src={formData.image_url} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                                        <button type="button" onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold">Save Item</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transaction Form */}
            {showTransactionForm && isStockOrAdmin && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <RefreshCw size={20} className="text-amber-600" /> Record Transaction
                    </h3>
                    <form onSubmit={handleTransactionSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                            <select required className="input-field" value={transactionData.item_id}
                                onChange={e => setTransactionData({ ...transactionData, item_id: e.target.value })}>
                                <option value="">Select item...</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>{item.item_name} (Current: {item.quantity})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                            <select className="input-field" value={transactionData.transaction_type}
                                onChange={e => setTransactionData({ ...transactionData, transaction_type: e.target.value })}>
                                <option value="purchase">Purchase (Add)</option>
                                <option value="usage">Usage (Remove)</option>
                                <option value="damage">Damage</option>
                                <option value="disposal">Disposal</option>
                                <option value="return">Return</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                            <input required type="number" min="1" className="input-field" value={transactionData.quantity}
                                onChange={e => setTransactionData({ ...transactionData, quantity: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (RWF)</label>
                            <input type="number" min="0" className="input-field" value={transactionData.unit_price}
                                onChange={e => setTransactionData({ ...transactionData, unit_price: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                            <input type="text" className="input-field" value={transactionData.reference}
                                onChange={e => setTransactionData({ ...transactionData, reference: e.target.value })} placeholder="Invoice #" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input type="text" className="input-field" value={transactionData.notes}
                                onChange={e => setTransactionData({ ...transactionData, notes: e.target.value })} />
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowTransactionForm(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold">Record</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            {activeTab === 'items' && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field w-full sm:w-48"
                    >
                        <option value="all">All Categories</option>
                        <option value="equipment">Equipment</option>
                        <option value="food">Food</option>
                    </select>
                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${showLowStockOnly
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <AlertTriangle size={16} /> Low Stock Only
                    </button>
                </div>
            )}

            {/* Items Grid */}
            {activeTab === 'items' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                                <div className="h-8 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))
                    ) : filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col">
                            <div className={`h-2 ${item.status === 'available' ? 'bg-green-500' : item.status === 'low_stock' ? 'bg-amber-500' : 'bg-red-500'}`} />
                            {item.image_url && (
                                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                                    <img
                                        src={item.image_url}
                                        alt={item.item_name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold">
                                        {item.category}
                                    </div>
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            {getCategoryIcon(item.category)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate">{item.item_name}</h3>
                                            {item.item_code && <p className="text-[11px] text-gray-400 font-mono truncate">{item.item_code}</p>}
                                        </div>
                                    </div>
                                    {isStockOrAdmin && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-end justify-between mt-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Available</p>
                                        <p className="text-3xl font-black text-gray-900">{item.quantity}</p>
                                        <p className="text-xs text-gray-400">{item.unit}</p>
                                    </div>

                                    {isStockOrAdmin && (
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1, item.quantity, item.min_quantity)}
                                                className="w-8 h-8 flex justify-center items-center bg-white rounded text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                                disabled={item.quantity <= 0}
                                            >-</button>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1, item.quantity, item.min_quantity)}
                                                className="w-8 h-8 flex justify-center items-center bg-white rounded text-gray-600 hover:text-green-500 hover:bg-green-50 transition-colors shadow-sm"
                                            >+</button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                        {item.status?.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {item.location && <span className="text-xs text-gray-400">{item.location}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-amber-50/80 text-amber-800 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                    <th className="px-6 py-4">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                            {new Date(tx.transaction_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">{tx.item_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tx.transaction_type === 'purchase' ? 'bg-green-100 text-green-700' :
                                                tx.transaction_type === 'usage' ? 'bg-red-100 text-red-700' :
                                                    tx.transaction_type === 'damage' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">
                                            {tx.transaction_type === 'purchase' || tx.transaction_type === 'return' ? '+' : '-'}
                                            {tx.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{tx.reference || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!loading && transactions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <RefreshCw size={32} className="mx-auto mb-2 text-gray-300" />
                            No transactions found
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && activeTab === 'items' && items.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Package size={64} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-xl font-bold text-gray-700">Inventory is empty</p>
                    <p className="text-gray-400 mt-2">Start by adding your first stock item</p>
                </div>
            )}
        </div>
    );
};

export default Stock;

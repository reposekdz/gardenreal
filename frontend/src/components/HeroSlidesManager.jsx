import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { heroAPI } from '../utils/api';
import { Plus, Edit, Trash2, GripVertical, Image, Save, X, Upload, Eye } from 'lucide-react';

const HeroSlidesManager = () => {
    const { t } = useTranslation();
    const API_URL = import.meta.env.VITE_API_URL || '';

    // Available uploaded images to choose from
    const availableImages = [
        { url: `${API_URL}/uploads/school view/IMG-20250222-WA0013.jpg`, name: 'School Building' },
        { url: `${API_URL}/uploads/school view/IMG-20250222-WA0015.jpg`, name: 'Classroom' },
        { url: `${API_URL}/uploads/school view/IMG-20250222-WA0017.jpg`, name: 'Workshop' },
        { url: `${API_URL}/uploads/school view/IMG-20250222-WA0018.jpg`, name: 'Campus' },
        { url: `${API_URL}/uploads/school view/IMG-20260126-WA0053.jpg`, name: 'Library' },
        { url: `${API_URL}/uploads/school view/IMG-20260126-WA0060.jpg`, name: 'Computer Lab' },
        { url: `${API_URL}/uploads/school view/IMG-20260126-WA0076.jpg`, name: 'Sports Ground' },
        { url: `${API_URL}/uploads/trade card image/auto.jpg`, name: 'Automobile Technology' },
        { url: `${API_URL}/uploads/trade card image/bdc.jpg`, name: 'Building & Construction' },
        { url: `${API_URL}/uploads/trade card image/sod.jpg`, name: 'Software Development' },
    ];
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSlide, setEditingSlide] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        button_text: '',
        button_link: '',
        order_index: 0,
        is_active: true
    });

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const response = await heroAPI.getAllSlides();
            setSlides(response.data);
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSlide) {
                await heroAPI.updateSlide(editingSlide.id, formData);
            } else {
                await heroAPI.createSlide(formData);
            }
            fetchSlides();
            resetForm();
        } catch (error) {
            console.error('Error saving slide:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this slide?')) {
            try {
                await heroAPI.deleteSlide(id);
                fetchSlides();
            } catch (error) {
                console.error('Error deleting slide:', error);
            }
        }
    };

    const handleEdit = (slide) => {
        setEditingSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle || '',
            image_url: slide.image_url,
            button_text: slide.button_text || '',
            button_link: slide.button_link || '',
            order_index: slide.order_index,
            is_active: slide.is_active
        });
    };

    const resetForm = () => {
        setEditingSlide(null);
        setFormData({
            title: '',
            subtitle: '',
            image_url: '',
            button_text: '',
            button_link: '',
            order_index: slides.length,
            is_active: true
        });
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Image size={24} className="text-primary-600" />
                    {t('hero.title') || 'Hero Slides'}
                </h3>
                <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                    <Plus size={20} />
                    {t('hero.add') || 'Add Slide'}
                </button>
            </div>

            {/* Form */}
            {(editingSlide || slides.length === 0) && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('hero.title_label') || 'Title'}
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('hero.subtitle') || 'Subtitle'}
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {t('hero.image_url') || 'Ifoto'}
                        </label>
                        {/* File Upload Button */}
                        <div className="mb-3">
                            <input
                                type="file"
                                accept="image/*"
                                id="hero-image-upload"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_URL}/api/media/upload`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` },
                                                body: formData
                                            });
                                            const data = await res.json();
                                            if (data.url) {
                                                setFormData({ ...formData, image_url: data.url });
                                            }
                                        } catch (err) {
                                            console.error('Upload error:', err);
                                        }
                                    }
                                }}
                                className="hidden"
                            />
                            <label
                                htmlFor="hero-image-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-xl cursor-pointer hover:bg-primary-200 transition-colors"
                            >
                                <Upload size={18} />
                                Pakisha Ifoto
                            </label>
                        </div>
                        <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            placeholder="URL cyangwa hakure"
                            required
                        />
                    </div>
                    {/* Image Picker - Select from uploaded images */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Or select from uploaded images
                        </label>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                            {availableImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, image_url: img.url })}
                                    className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${formData.image_url === img.url
                                        ? 'border-accent-500 ring-2 ring-accent-300'
                                        : 'border-gray-200 hover:border-primary-300'
                                        }`}
                                    title={img.name}
                                >
                                    <img
                                        src={img.url}
                                        alt={img.name}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('hero.button_text') || 'Button Text'}
                            </label>
                            <input
                                type="text"
                                value={formData.button_text}
                                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('hero.button_link') || 'Button Link'}
                            </label>
                            <input
                                type="text"
                                value={formData.button_link}
                                onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                placeholder="/apply"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {t('hero.order') || 'Order'}
                            </label>
                            <input
                                type="number"
                                value={formData.order_index}
                                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 text-primary-600 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                                {t('hero.active') || 'Active'}
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                        >
                            <Save size={20} />
                            {t('hero.save') || 'Save'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                        >
                            <X size={20} />
                            {t('hero.cancel') || 'Cancel'}
                        </button>
                    </div>
                </form>
            )}

            {/* Slides List */}
            <div className="space-y-4">
                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 ${slide.is_active ? 'border-gray-100' : 'border-red-200 opacity-60'}`}
                    >
                        <GripVertical size={20} className="text-gray-400 cursor-move" />
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{slide.title}</h4>
                            <p className="text-sm text-gray-500">{slide.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {slide.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => handleEdit(slide)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(slide.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroSlidesManager;

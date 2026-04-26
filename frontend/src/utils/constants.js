// API Configuration for Production/Development
// This file centralizes all API URLs

// Get API URL from environment or use default
const getApiUrl = () => {
    // Vercel environment variable
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Development default
    return '';
};

const getUploadUrl = () => {
    const apiUrl = getApiUrl();
    // If using relative path (production), use same origin
    if (apiUrl.startsWith('/')) {
        return '';
    }
    // Extract base URL for uploads
    return apiUrl;
};

export const API_URL = getApiUrl();
export const UPLOAD_URL = getUploadUrl();

// For direct axios calls - use this prefix
export const API_PREFIX = API_URL.startsWith('http') ? API_URL : '';

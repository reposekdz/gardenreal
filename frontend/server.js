/**
 * Garden TVET School - Frontend Production Server
 * Serves the React SPA with proper client-side routing support
 * 
 * This server:
 * - Serves static files from the dist folder
 * - Handles SPA routing (React Router)
 * - Proxies API requests to the backend
 * - Supports environment-based configuration
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// API Proxy Configuration
// Forward all /api requests to the backend service
// This allows the frontend to work with a separate backend URL
app.use('/api', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api',  // Keep /api prefix when forwarding
    },
    onError: (err, req, res) => {
        console.error('API Proxy Error:', err.message);
        res.status(503).json({ error: 'Backend service unavailable' });
    },
}));

// Proxy for uploads (images, files)
app.use('/uploads', createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Uploads Proxy Error:', err.message);
        res.status(503).json({ error: 'Backend service unavailable' });
    },
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'garden-tvet-frontend',
        environment: process.env.NODE_ENV || 'development'
    });
});

// For any other route, serve the SPA index.html
// This enables React Router client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🌐 Garden TVET Frontend running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Backend: ${API_URL}`);
});

export default app;
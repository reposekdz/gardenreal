import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    X, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight,
    ZoomIn, ZoomOut, RotateCw, Loader2, FileText, MessageSquare, BookOpen
} from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import NoteCommentsPanel from './NoteCommentsPanel';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfReaderModal = ({ note, onClose, apiUrl = '', token = null, currentUser = null }) => {
    const [view, setView] = useState('pdf'); // 'pdf' | 'discuss'
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const pdfDocRef = useRef(null);

    const [pdfDoc, setPdfDoc] = useState(null);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pageInput, setPageInput] = useState('1');

    const viewUrl = `${apiUrl}/api/course-notes/${note?.id}/view`;
    const downloadUrl = `${apiUrl}/api/course-notes/${note?.id}/download`;

    // Load PDF document
    useEffect(() => {
        if (!note?.id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        const task = pdfjsLib.getDocument({ url: viewUrl, withCredentials: false });
        task.promise.then(doc => {
            if (cancelled) { doc.destroy(); return; }
            pdfDocRef.current = doc;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setPage(1);
            setPageInput('1');
            setLoading(false);
        }).catch(err => {
            if (cancelled) return;
            console.error('PDF load error', err);
            setError('Habayemo ikibazo mu gusoma PDF. Gerageza Download.');
            setLoading(false);
        });
        return () => {
            cancelled = true;
            try { task.destroy(); } catch { /* noop */ }
            if (pdfDocRef.current) {
                try { pdfDocRef.current.destroy(); } catch { /* noop */ }
                pdfDocRef.current = null;
            }
        };
    }, [note?.id, viewUrl]);

    // Render current page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;
        let cancelled = false;
        (async () => {
            try {
                if (renderTaskRef.current) {
                    try { renderTaskRef.current.cancel(); } catch { /* noop */ }
                    renderTaskRef.current = null;
                }
                const pdfPage = await pdfDoc.getPage(page);
                if (cancelled) return;
                const viewport = pdfPage.getViewport({ scale, rotation });
                const canvas = canvasRef.current;
                const dpr = window.devicePixelRatio || 1;
                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);
                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;
                const ctx = canvas.getContext('2d');
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                const task = pdfPage.render({ canvasContext: ctx, viewport, canvas });
                renderTaskRef.current = task;
                await task.promise;
            } catch (err) {
                if (err?.name === 'RenderingCancelledException') return;
                console.error('Render error', err);
            }
        })();
        return () => { cancelled = true; };
    }, [pdfDoc, page, scale, rotation]);

    // Body lock
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const goPrev = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
    const goNext = useCallback(() => setPage(p => Math.min(numPages || p, p + 1)), [numPages]);
    const zoomIn = useCallback(() => setScale(s => Math.min(3, +(s + 0.2).toFixed(2))), []);
    const zoomOut = useCallback(() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(2))), []);
    const fitWidth = useCallback(async () => {
        if (!pdfDoc || !containerRef.current) return;
        const pdfPage = await pdfDoc.getPage(page);
        const baseViewport = pdfPage.getViewport({ scale: 1, rotation });
        const containerWidth = containerRef.current.clientWidth - 32;
        setScale(Math.max(0.5, Math.min(3, containerWidth / baseViewport.width)));
    }, [pdfDoc, page, rotation]);
    const rotate = useCallback(() => setRotation(r => (r + 90) % 360), []);

    // Fullscreen API
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn('fullscreen failed', err);
        }
    }, []);

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'Escape') {
                if (document.fullscreenElement) return; // browser handles exit
                onClose();
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault(); goNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault(); goPrev();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault(); zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault(); zoomOut();
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault(); toggleFullscreen();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault(); rotate();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, goNext, goPrev, zoomIn, zoomOut, toggleFullscreen, rotate]);

    useEffect(() => { setPageInput(String(page)); }, [page]);

    // Persist reading progress (debounced)
    useEffect(() => {
        if (!note?.id || !numPages) return;
        const t = setTimeout(() => {
            const visitorId = (() => {
                try {
                    let v = localStorage.getItem('gtvet_visitor_id');
                    if (!v) {
                        v = 'v' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
                        localStorage.setItem('gtvet_visitor_id', v);
                    }
                    return v;
                } catch { return ''; }
            })();
            const headers = {
                'X-Visitor-Id': visitorId,
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
            axios.post(`${apiUrl}/api/learning/notes/${note.id}/progress`, {
                last_page: page,
                total_pages: numPages,
                completed: page === numPages
            }, { headers }).catch(() => {});
        }, 1500);
        return () => clearTimeout(t);
    }, [note?.id, page, numPages, apiUrl, token]);

    if (!note) return null;

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between text-white px-4 py-3 gap-3 bg-black/40">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                    <FileText size={20} className="text-accent-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                            {note.trade_name} {note.level ? `· ${note.level}` : ''}
                        </p>
                        <h3 className="font-black text-base sm:text-lg truncate">{note.title}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="hidden sm:flex bg-white/10 rounded-lg p-0.5 mr-1">
                        <button onClick={() => setView('pdf')}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${view === 'pdf' ? 'bg-white text-primary-900' : 'text-white/80 hover:text-white'}`}>
                            <BookOpen size={12} /> Soma
                        </button>
                        <button onClick={() => setView('discuss')}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ${view === 'discuss' ? 'bg-white text-primary-900' : 'text-white/80 hover:text-white'}`}>
                            <MessageSquare size={12} /> Vugana
                        </button>
                    </div>
                    <button onClick={() => setView(v => v === 'pdf' ? 'discuss' : 'pdf')}
                        className="sm:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Discuss">
                        {view === 'pdf' ? <MessageSquare size={16} /> : <BookOpen size={16} />}
                    </button>
                    <button onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Fullscreen (F)">
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <a href={downloadUrl} download={note.file_name}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-primary-900 text-xs sm:text-sm font-bold">
                        <Download size={14} /> <span className="hidden sm:inline">Download</span>
                    </a>
                    <button onClick={onClose}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/40 transition-colors" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-2 bg-black/30 text-white ${view === 'discuss' ? 'hidden' : ''}`}>
                <button onClick={goPrev} disabled={page <= 1}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed" title="Previous (←)">
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <input
                        value={pageInput}
                        onChange={e => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                        onBlur={() => {
                            const n = parseInt(pageInput, 10);
                            if (!isNaN(n) && n >= 1 && n <= numPages) setPage(n);
                            else setPageInput(String(page));
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-12 text-center bg-white/10 rounded px-1 py-1 border border-white/10 focus:bg-white/20 outline-none"
                    />
                    <span className="text-white/70">/ {numPages || '—'}</span>
                </div>
                <button onClick={goNext} disabled={page >= numPages}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed" title="Next (→)">
                    <ChevronRight size={16} />
                </button>
                <div className="hidden sm:block w-px h-5 bg-white/20 mx-1" />
                <button onClick={zoomOut} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Zoom out (-)">
                    <ZoomOut size={16} />
                </button>
                <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Zoom in (+)">
                    <ZoomIn size={16} />
                </button>
                <button onClick={fitWidth} className="px-2.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold">
                    Fit
                </button>
                <button onClick={rotate} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Rotate (R)">
                    <RotateCw size={16} />
                </button>
            </div>

            {/* Page area */}
            <div ref={containerRef}
                className={`flex-1 overflow-auto bg-neutral-900 flex items-start justify-center p-4 ${view === 'discuss' ? 'hidden' : ''}`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-white/80 mt-20">
                        <Loader2 className="animate-spin mb-3" size={36} />
                        <p className="text-sm font-semibold">Tegereza ho gato...</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-white/80 mt-20 max-w-md">
                        <p className="font-bold mb-3">{error}</p>
                        <a href={downloadUrl} download={note.file_name}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 text-primary-900 font-bold">
                            <Download size={16} /> Download PDF
                        </a>
                    </div>
                ) : (
                    <canvas ref={canvasRef} className="bg-white shadow-2xl rounded" />
                )}
            </div>

            {/* Discuss area */}
            {view === 'discuss' && (
                <div className="flex-1 overflow-auto bg-gray-50">
                    <NoteCommentsPanel
                        noteId={note.id}
                        apiUrl={apiUrl}
                        token={token}
                        currentUser={currentUser}
                    />
                </div>
            )}

            {/* Footer hint */}
            <div className="hidden sm:flex items-center justify-center gap-4 py-2 text-[10px] text-white/40 bg-black/40 font-mono">
                <span>← / →: navigate</span>
                <span>+ / −: zoom</span>
                <span>F: fullscreen</span>
                <span>R: rotate</span>
                <span>Esc: close</span>
            </div>
        </div>
    );
};

export default PdfReaderModal;

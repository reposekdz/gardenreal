// Extract first-page thumbnail from a PDF File using pdfjs-dist (client-side)
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Render the first page of a PDF File to a JPEG Blob.
 * @param {File} file
 * @param {{maxWidth?: number, quality?: number}} opts
 * @returns {Promise<Blob>}
 */
export async function extractPdfCover(file, opts = {}) {
    const maxWidth = opts.maxWidth ?? 800;
    const quality = opts.quality ?? 0.85;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport0 = page.getViewport({ scale: 1 });
    const scale = Math.min(2, Math.max(0.6, maxWidth / viewport0.width));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    return await new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Cover blob failed'))),
            'image/jpeg',
            quality
        );
    });
}

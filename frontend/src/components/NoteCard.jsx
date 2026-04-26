import React from 'react';
import { FileText, Download, BookOpen, User, Calendar, Eye, ArrowDownToLine } from 'lucide-react';

const formatBytes = (b) => {
    if (!b) return '';
    const kb = b / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

const fallbackGradient = (code) => {
    const map = {
        auto: 'from-blue-500 to-blue-700',
        bdc: 'from-amber-500 to-amber-700',
        sod: 'from-emerald-500 to-emerald-700',
        driving: 'from-rose-500 to-rose-700'
    };
    return map[code] || 'from-primary-600 to-primary-800';
};

const NoteCard = ({ note, onRead, apiUrl = '' }) => {
    const coverUrl = note.cover_image ? `${apiUrl}/api/course-notes/${note.id}/cover` : null;
    const downloadUrl = `${apiUrl}/api/course-notes/${note.id}/download`;

    return (
        <div className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all hover:-translate-y-1">
            {/* Cover */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={note.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient(note.trade_code)} flex items-center justify-center text-white`}>
                        <FileText size={64} className="opacity-80" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-end justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-wider text-gray-800">
                        {note.level}
                    </span>
                    <span className="text-white text-[10px] font-bold flex items-center gap-1">
                        <Eye size={11} /> {note.view_count || 0}
                        <ArrowDownToLine size={11} className="ml-1" /> {note.download_count || 0}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-black text-lg text-gray-900 mb-1 line-clamp-2">{note.title}</h3>
                {note.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{note.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1 mt-auto">
                    <div className="flex items-center gap-1.5"><User size={12} /> {note.uploaded_by_name || 'Umwarimu'}</div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(note.created_at).toLocaleDateString()}</span>
                        <span className="text-gray-400">{formatBytes(note.file_size)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 grid grid-cols-2">
                <button onClick={() => onRead(note)}
                    className="py-3 text-sm font-bold text-primary-700 hover:bg-primary-50 flex items-center justify-center gap-1.5 transition-colors">
                    <BookOpen size={15} /> Soma
                </button>
                <a href={downloadUrl} download={note.file_name}
                    className="py-3 text-sm font-bold text-white bg-gradient-to-r from-primary-700 to-primary-800 hover:from-primary-800 hover:to-primary-900 flex items-center justify-center gap-1.5 transition-colors">
                    <Download size={15} /> Download
                </a>
            </div>
        </div>
    );
};

export default NoteCard;

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';
import api from '../services/api';
import documentService from '../services/documentService';
import { useToast } from '../context/ToastContext';

/**
 * Modal xem tài liệu inline (PDF, DOCX, TXT).
 * Props:
 *  - doc: { id, title, fileName, fileType: 'PDF'|'DOCX'|'TXT' } | null
 *  - onClose: () => void
 */
const DocumentViewerModal = ({ doc, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');
  const [txtContent, setTxtContent] = useState('');
  const objectUrlRef = useRef(null);

  const fileType = doc?.fileType?.toUpperCase();

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPdfUrl(null);
    setDocxHtml('');
    setTxtContent('');

    const fetchAndRender = async () => {
      try {
        const res = await api.get(`/api/documents/${doc.id}/preview`, { responseType: 'blob' });
        if (cancelled) return;
        const blob = res.data;

        if (fileType === 'PDF') {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setPdfUrl(url);
        } else if (fileType === 'DOCX' || fileType === 'DOC') {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled) return;
          setDocxHtml(result.value);
        } else if (fileType === 'TXT') {
          const text = await blob.text();
          if (cancelled) return;
          setTxtContent(text);
        } else {
          setError('Loại file không hỗ trợ xem trực tiếp');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Không thể mở tài liệu');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAndRender();
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [doc?.id, fileType]);

  const handleDownload = async () => {
    try {
      await documentService.download(doc.id, doc.fileName || doc.title);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Tải xuống thất bại');
    }
  };

  // Đóng modal bằng ESC
  useEffect(() => {
    if (!doc) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doc, onClose]);

  if (!doc) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-ocean-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{doc.title}</div>
              <div className="text-xs text-gray-500 truncate">{doc.fileName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-ocean-500 text-ocean-600 rounded-lg hover:bg-ocean-50"
            >
              <Download className="w-4 h-4" /> Tải về
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 rounded-b-2xl">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-ocean-500 border-t-transparent mb-3" />
              <div className="text-sm">Đang tải tài liệu...</div>
            </div>
          )}

          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {!loading && !error && fileType === 'PDF' && pdfUrl && (
            <iframe
              src={pdfUrl}
              title={doc.title}
              className="w-full h-full border-0"
            />
          )}

          {!loading && !error && (fileType === 'DOCX' || fileType === 'DOC') && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-3xl mx-auto bg-white shadow-sm my-6 p-10 docx-preview"
                   dangerouslySetInnerHTML={{ __html: docxHtml }} />
            </div>
          )}

          {!loading && !error && fileType === 'TXT' && (
            <div className="h-full overflow-y-auto p-6">
              <pre className="max-w-3xl mx-auto bg-white shadow-sm rounded p-6 text-sm whitespace-pre-wrap font-mono">
                {txtContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;

import { useEffect, useRef, useState } from 'react';
import { X, FileText, AlertCircle, Columns2 } from 'lucide-react';
import mammoth from 'mammoth';
import api from '../services/api';

/**
 * Modal so sánh SONG SONG 2 tài liệu (preview cạnh nhau) — dùng cho admin xem
 * báo cáo đạo văn: tài liệu nghi vấn vs tài liệu trùng.
 *
 * Props:
 *  - left:  { id, title, fileName, fileType, label } — tài liệu bên trái
 *  - right: { id, title, fileName, fileType, label } — tài liệu bên phải
 *  - onClose: () => void
 */
const DocCompareModal = ({ left, right, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!left || !right) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-900">
            <Columns2 className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">So sánh tài liệu</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" title="Đóng (Esc)">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Two columns */}
        <div className="flex-1 grid grid-cols-2 gap-px bg-gray-200 overflow-hidden rounded-b-2xl">
          <ComparePane doc={left} accent="orange" />
          <ComparePane doc={right} accent="blue" />
        </div>
      </div>
    </div>
  );
};

const ComparePane = ({ doc, accent }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');
  const [txtContent, setTxtContent] = useState('');
  const objectUrlRef = useRef(null);

  const fileType = doc?.fileType?.toUpperCase();
  const accentCls = accent === 'orange'
    ? 'text-orange-700 bg-orange-50 border-orange-200'
    : 'text-blue-700 bg-blue-50 border-blue-200';

  useEffect(() => {
    if (!doc?.id) { setError('Không có tài liệu'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true); setError(''); setPdfUrl(null); setDocxHtml(''); setTxtContent('');

    (async () => {
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
          if (!cancelled) setDocxHtml(result.value);
        } else if (fileType === 'TXT') {
          const text = await blob.text();
          if (!cancelled) setTxtContent(text);
        } else {
          setError('Loại file không hỗ trợ xem trực tiếp');
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Không thể mở tài liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [doc?.id, fileType]);

  return (
    <div className="bg-white flex flex-col min-w-0">
      {/* Pane header */}
      <div className={`px-4 py-2 border-b ${accentCls} flex-shrink-0`}>
        {doc?.label && <div className="text-[10px] font-semibold uppercase tracking-wide">{doc.label}</div>}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{doc?.title}</div>
            {doc?.fileName && <div className="text-[11px] opacity-70 truncate">{doc.fileName}</div>}
          </div>
        </div>
      </div>

      {/* Pane body */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
            <div className="animate-spin h-7 w-7 rounded-full border-2 border-ocean-500 border-t-transparent mb-3" />
            <div className="text-sm">Đang tải...</div>
          </div>
        )}

        {!loading && error && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 py-12">
            <AlertCircle className="w-9 h-9 text-red-500 mb-3" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {!loading && !error && fileType === 'PDF' && pdfUrl && (
          <iframe src={pdfUrl} title={doc?.title} className="w-full h-full border-0 min-h-[70vh]" />
        )}

        {!loading && !error && (fileType === 'DOCX' || fileType === 'DOC') && (
          <div className="p-4">
            <div className="bg-white shadow-sm p-6 docx-preview text-sm"
                 dangerouslySetInnerHTML={{ __html: docxHtml }} />
          </div>
        )}

        {!loading && !error && fileType === 'TXT' && (
          <div className="p-4">
            <pre className="bg-white shadow-sm rounded p-4 text-sm whitespace-pre-wrap font-mono">
              {txtContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocCompareModal;

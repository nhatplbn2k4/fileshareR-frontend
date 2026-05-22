import { useEffect, useRef, useState } from 'react';
import { X, Download, FileText, AlertCircle, Sparkles } from 'lucide-react';
import mammoth from 'mammoth';
import api from '../services/api';
import documentService from '../services/documentService';
import { useToast } from '../context/ToastContext';

/**
 * Modal xem tài liệu inline (PDF, DOCX, TXT).
 *
 * Props:
 *  - doc: { id, title, fileName, fileType: 'PDF'|'DOCX'|'TXT' } | null
 *  - onClose: () => void
 *
 * Internal state `currentDoc` cho phép swap doc đang xem khi user click vào
 * "Tài liệu liên quan" mà không cần đóng modal.
 */
const DocumentViewerModal = ({ doc, onClose }) => {
  const toast = useToast();
  const [currentDoc, setCurrentDoc] = useState(doc);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');
  const [txtContent, setTxtContent] = useState('');
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const objectUrlRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const fileType = currentDoc?.fileType?.toUpperCase();

  // Sync prop -> internal state khi parent mở modal cho doc mới
  useEffect(() => {
    if (doc?.id && doc.id !== currentDoc?.id) {
      setCurrentDoc(doc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  // Fetch preview + related khi currentDoc thay đổi
  useEffect(() => {
    if (!currentDoc) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPdfUrl(null);
    setDocxHtml('');
    setTxtContent('');
    setRelatedDocs([]);
    setRelatedLoading(true);

    // Cuộn lên đầu khi swap doc
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const fetchPreview = async () => {
      try {
        const res = await api.get(`/api/documents/${currentDoc.id}/preview`, { responseType: 'blob' });
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

    const fetchRelated = async () => {
      try {
        const data = await documentService.getSimilar(currentDoc.id, 5);
        if (!cancelled) setRelatedDocs(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRelatedDocs([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    };

    fetchPreview();
    fetchRelated();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDoc?.id, fileType]);

  const handleDownload = async () => {
    try {
      await documentService.download(currentDoc.id, currentDoc.fileName || currentDoc.title);
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
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-ocean-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{currentDoc?.title}</div>
              <div className="text-xs text-gray-500 truncate">{currentDoc?.fileName}</div>
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

        {/* Scrollable body: preview + related */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gray-50 rounded-b-2xl">
          {/* Preview area */}
          <div className="min-h-[60vh] flex flex-col">
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
                <div className="animate-spin h-8 w-8 rounded-full border-2 border-ocean-500 border-t-transparent mb-3" />
                <div className="text-sm">Đang tải tài liệu...</div>
              </div>
            )}

            {!loading && error && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 py-12">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <div className="text-sm">{error}</div>
              </div>
            )}

            {!loading && !error && fileType === 'PDF' && pdfUrl && (
              <iframe
                src={pdfUrl}
                title={currentDoc?.title}
                className="w-full flex-1 border-0 min-h-[60vh]"
              />
            )}

            {!loading && !error && (fileType === 'DOCX' || fileType === 'DOC') && (
              <div className="flex-1">
                <div className="max-w-3xl mx-auto bg-white shadow-sm my-6 p-10 docx-preview"
                     dangerouslySetInnerHTML={{ __html: docxHtml }} />
              </div>
            )}

            {!loading && !error && fileType === 'TXT' && (
              <div className="flex-1 p-6">
                <pre className="max-w-3xl mx-auto bg-white shadow-sm rounded p-6 text-sm whitespace-pre-wrap font-mono">
                  {txtContent}
                </pre>
              </div>
            )}
          </div>

          {/* Related documents section */}
          <RelatedDocumentsSection
            docs={relatedDocs}
            loading={relatedLoading}
            onSelect={(d) => setCurrentDoc(d)}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Grid 5 card "Tài liệu liên quan" — click swap currentDoc trong modal cha.
 */
const RelatedDocumentsSection = ({ docs, loading, onSelect }) => {
  return (
    <div className="px-6 py-6 border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-ocean-600" />
          <h3 className="text-sm font-semibold text-gray-900">Tài liệu liên quan</h3>
        </div>

        {loading && (
          <div className="text-sm text-gray-500 py-4">Đang tìm tài liệu liên quan...</div>
        )}

        {!loading && docs.length === 0 && (
          <div className="text-sm text-gray-500 py-4">Chưa có tài liệu liên quan.</div>
        )}

        {!loading && docs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d)}
                className="text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-ocean-400 hover:shadow-md transition group"
              >
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="w-4 h-4 text-ocean-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-ocean-700">
                    {d.title}
                  </div>
                </div>
                {d.summary && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{d.summary}</p>
                )}
                <div className="text-xs text-gray-400 truncate">{d.fileName}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;

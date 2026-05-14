import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Folder, FolderOpen, Download, FileText, File, Users,
  ArrowLeft, ChevronRight, AlertTriangle, Loader2, BarChart2,
  BookmarkPlus, X, Check, HardDrive
} from 'lucide-react';
import groupService from '../services/groupService';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (t) =>
  t?.toUpperCase() === 'PDF'
    ? <File className="w-5 h-5 text-red-500" />
    : <FileText className="w-5 h-5 text-blue-500" />;

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Save to folder modal (same pattern) ───────────────────────────────────────

const SaveToFolderModal = ({ doc, onClose }) => {
  const toast = useToast();
  const [myFolders, setMyFolders] = useState([]);
  const [loadingF, setLoadingF] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    (async () => {
      try { setMyFolders(await folderService.getAll()); }
      catch { /* ignore */ }
      finally { setLoadingF(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentService.saveToFolder(doc.id, sel);
      setSaved(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      toast.error('Lưu thất bại: ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-ocean-500" />
            <h3 className="font-semibold text-gray-900">Lưu tài liệu</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 truncate">Lưu <strong>"{doc.title}"</strong> vào thư mục của bạn</p>
          {loadingF ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 text-ocean-500 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button onClick={() => setSel(null)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                  sel === null ? 'border-ocean-500 bg-ocean-50 text-ocean-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                <span className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> Không thuộc thư mục nào</span>
              </button>
              {myFolders.map(f => (
                <button key={f.id} onClick={() => setSel(f.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                    sel === f.id ? 'border-ocean-500 bg-ocean-50 text-ocean-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                  <span className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> {f.name}</span>
                </button>
              ))}
            </div>
          )}
          {saved ? (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              <Check className="w-4 h-4" /> Đã lưu thành công!
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition disabled:opacity-50 text-sm font-medium">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                {saving ? 'Đang lưu...' : 'Lưu vào thư mục'}
              </button>
              <button onClick={() => { documentService.publicDownload(doc.id, doc.fileName); onClose(); }}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                <Download className="w-4 h-4" /> Tải về máy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SharedGroupFolder = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [folder, setFolder] = useState(null);
  const [subFolders, setSubFolders] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingDoc, setSavingDoc] = useState(null);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const handleError = useCallback((err) => {
    if (err.response?.status === 404 || err.response?.status === 403) {
      setError('Thư mục không tồn tại, đã bị thu hồi, hoặc nhóm đã chuyển sang riêng tư.');
    } else {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    }
  }, []);

  const fetchRoot = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [folderData, subData, docsData] = await Promise.all([
        groupService.getGroupFolderByShareToken(token),
        groupService.getGroupFolderSubfoldersByShareToken(token),
        groupService.getGroupFolderDocumentsByShareToken(token),
      ]);
      setFolder(folderData);
      setSubFolders(subData);
      setDocuments(docsData);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const fetchSub = useCallback(async (subToken) => {
    setLoading(true); setError('');
    try {
      const [subData, docsData] = await Promise.all([
        groupService.getGroupFolderSubfoldersByShareToken(subToken),
        groupService.getGroupFolderDocumentsByShareToken(subToken),
      ]);
      setSubFolders(subData);
      setDocuments(docsData);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => { fetchRoot(); }, [fetchRoot]);

  const handleFolderClick = (sub) => {
    if (!sub.shareToken) {
      setError('Thư mục con này không có link chia sẻ.');
      return;
    }
    setCurrentFolder(sub);
    setBreadcrumbs(prev => [...prev, sub]);
    fetchSub(sub.shareToken);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
      fetchRoot();
    } else {
      const crumb = breadcrumbs[index];
      setCurrentFolder(crumb);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      fetchSub(crumb.shareToken);
    }
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const n = breadcrumbs.slice(0, -1);
      setBreadcrumbs(n);
      setCurrentFolder(n[n.length - 1]);
      fetchSub(n[n.length - 1].shareToken);
    } else {
      setCurrentFolder(null);
      setBreadcrumbs([]);
      fetchRoot();
    }
  };

  const handleDownload = async (doc) => {
    try {
      await groupService.downloadDocument(folder.groupId, doc.id, doc.fileName);
    } catch {
      toast.error('Tải xuống thất bại');
    }
  };

  if (loading && !folder) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-ocean-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Đang tải thư mục nhóm...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể truy cập</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="px-5 py-2 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition">
          Về trang chủ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-ocean-50 to-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-ocean-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{folder?.name}</h1>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" /> Thuộc nhóm: {folder?.groupName}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition px-3 py-1.5 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <nav className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1 flex-wrap">
          {currentFolder && (
            <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 mr-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
              !currentFolder ? 'bg-ocean-50 text-ocean-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Folder className="w-4 h-4" /> {folder?.name}
          </button>
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.id}>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                  i === breadcrumbs.length - 1
                    ? 'bg-ocean-50 text-ocean-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {loading && (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 text-ocean-500 animate-spin mx-auto" /></div>
        )}

        {!loading && subFolders.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">Thư mục con</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subFolders.map(sf => (
                <button
                  key={sf.id}
                  onClick={() => handleFolderClick(sf)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ocean-50 rounded-lg flex items-center justify-center group-hover:bg-ocean-100 transition flex-shrink-0">
                      <Folder className="w-5 h-5 text-ocean-500" />
                    </div>
                    <p className="font-medium text-gray-900 truncate group-hover:text-ocean-600 transition-colors">
                      {sf.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">Tài liệu</p>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Tên tài liệu</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Loại</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Kích thước</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">
                      <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Lượt tải</span>
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-600">Tải về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 transition cursor-pointer select-none"
                      onDoubleClick={() => setViewingDoc(doc)}
                      title="Nhấn đúp để xem"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            <p className="text-xs text-gray-400">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs uppercase font-medium">
                          {doc.fileType}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-gray-500">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-green-600 font-semibold">
                          <BarChart2 className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => isAuthenticated ? setSavingDoc(doc) : handleDownload(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ocean-500 text-white text-xs font-medium rounded-lg hover:bg-ocean-600 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải về
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && subFolders.length === 0 && documents.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-200">
            <Folder className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">Thư mục này trống</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Chia sẻ bởi <span className="font-semibold text-ocean-500">FileshareR</span>
        </p>
      </main>

      {savingDoc && (
        <SaveToFolderModal doc={savingDoc} onClose={() => setSavingDoc(null)} />
      )}
      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </div>
  );
};

export default SharedGroupFolder;

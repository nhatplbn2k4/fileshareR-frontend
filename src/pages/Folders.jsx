import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import folderService from '../services/folderService';
import documentService from '../services/documentService';
import PdfToWordModal from '../components/PdfToWordModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  ChevronRight,
  ArrowLeft,
  X,
  Clock,
  Upload,
  Download,
  File,
  HardDrive,
  Globe,
  Lock,
  Link,
  BarChart2,
  Check,
  Share2,
  Copy,
  RefreshCw,
  FileType2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

const VISIBILITY_CONFIG = {
  PUBLIC: {
    label: 'Công khai',
    icon: Globe,
    cls: 'bg-green-100 text-green-700 border-green-200',
    desc: 'Xuất hiện khi người khác tìm kiếm',
  },
  PRIVATE: {
    label: 'Riêng tư',
    icon: Lock,
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    desc: 'Chỉ bạn mới xem được, không hiện khi tìm kiếm',
  },
  LINK_ONLY: {
    label: 'Chỉ link',
    icon: Link,
    cls: 'bg-amber-100 text-amber-700 border-amber-200',
    desc: 'Chỉ người có link mới xem được, không hiện khi tìm kiếm',
  },
};

const VisibilityBadge = ({ visibility }) => {
  const cfg = VISIBILITY_CONFIG[visibility] || VISIBILITY_CONFIG.PUBLIC;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

const formatDate = (ds) =>
  ds ? new Date(ds).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
  switch (fileType?.toUpperCase()) {
    case 'PDF':  return <File className="w-6 h-6 text-red-500" />;
    case 'DOCX':
    case 'DOC':  return <FileText className="w-6 h-6 text-blue-500" />;
    default:     return <FileText className="w-6 h-6 text-gray-500" />;
  }
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Modal Tạo / Sửa thư mục với chọn visibility */
const FolderModal = ({ mode, initialName = '', initialVisibility = 'PUBLIC', onClose, onSave }) => {
  const toast = useToast();
  const [name, setName]             = useState(initialName);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [saving, setSaving]         = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onSave(name, visibility); onClose(); }
    catch (err) { toast.error('Lưu thất bại: ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Tạo thư mục mới' : 'Sửa thư mục'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên thư mục</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên thư mục..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Chế độ chia sẻ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ chia sẻ</label>
            <div className="space-y-2">
              {Object.entries(VISIBILITY_CONFIG).map(([val, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <label
                    key={val}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                      visibility === val ? 'border-ocean-400 bg-ocean-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={val}
                      checked={visibility === val}
                      onChange={() => setVisibility(val)}
                      className="mt-0.5 accent-ocean-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Icon className="w-4 h-4" /> {cfg.label}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-5 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white text-sm font-semibold rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Modal hiển thị share URL + copy + rotate token */
const ShareModal = ({ folder, onClose, onRotated }) => {
  const toast = useToast();
  const [currentToken, setCurrentToken] = useState(folder.shareToken);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const shareUrl = currentToken
    ? `${window.location.origin}/shared/${currentToken}`
    : '';

  const cfg = VISIBILITY_CONFIG[folder.visibility] || VISIBILITY_CONFIG.PUBLIC;
  const Icon = cfg.icon;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Sao chép thất bại');
    }
  };

  const handleRotate = async () => {
    if (!confirm('Tạo link mới sẽ làm link cũ hết hiệu lực. Tiếp tục?')) return;
    setRotating(true);
    try {
      const updated = await folderService.rotateShareToken(folder.id);
      setCurrentToken(updated.shareToken);
      onRotated?.(updated);
    } catch (err) {
      toast.error('Tạo link mới thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-ocean-500" />
            <h3 className="font-semibold text-gray-900">Chia sẻ thư mục</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs uppercase font-semibold text-gray-400 mb-1.5">Thư mục</p>
            <p className="font-medium text-gray-900 truncate">{folder.name}</p>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold text-gray-400 mb-1.5">Chế độ</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${cfg.cls}`}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
            <p className="text-xs text-gray-500 mt-1.5">{cfg.desc}</p>
          </div>

          {!currentToken ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Thư mục đang ở chế độ riêng tư nên không có link chia sẻ. Hãy sửa thư mục và đổi sang
              <span className="font-semibold"> Công khai </span> hoặc <span className="font-semibold">Chỉ link</span>.
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase font-semibold text-gray-400 mb-1.5">Link chia sẻ</p>
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-ocean-200"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition ${
                      copied
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-ocean-50 border-ocean-200 text-ocean-700 hover:bg-ocean-100'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã chép' : 'Chép'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRotate}
                disabled={rotating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
                {rotating ? 'Đang tạo...' : 'Tạo link mới (vô hiệu hóa link cũ)'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const Folders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [folders, setFolders]         = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [documents, setDocuments]     = useState([]);
  const [loading, setLoading]         = useState(true);

  // Modal state
  const [modalMode, setModalMode]       = useState('create');
  const [editingFolder, setEditingFolder] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [sharingFolder, setSharingFolder] = useState(null);

  const [showMenu, setShowMenu]         = useState(null);
  const [showDocMenu, setShowDocMenu]   = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Stats
  const [totalDownloads, setTotalDownloads] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => { fetchData(); }, [currentFolder]);

  // Deep-link: ?folder=<id> → preselect folder (vd: click từ Dashboard "Tài liệu gần đây")
  useEffect(() => {
    const folderId = searchParams.get('folder');
    if (!folderId) return;
    folderService
      .getById(folderId)
      .then((f) => {
        if (!f) return;
        setCurrentFolder(f);
        setBreadcrumbs([f]);
      })
      .catch((err) => console.error('Failed to load deep-linked folder:', err))
      .finally(() => {
        // Clean URL sau khi đã đọc, tránh re-trigger khi user navigate trong page
        setSearchParams({}, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Đóng menu khi click ngoài
    const handler = () => { setShowMenu(null); setShowDocMenu(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (currentFolder) {
        const [subFolders, folderDocs] = await Promise.all([
          folderService.getSubFolders(currentFolder.id),
          documentService.getByFolder(currentFolder.id),
        ]);
        setFolders(subFolders);
        setDocuments(folderDocs);
        setTotalDownloads(folderDocs.reduce((s, d) => s + (d.downloadCount || 0), 0));
      } else {
        const rootFolders = await folderService.getRootFolders();
        setFolders(rootFolders);
        setDocuments([]);
        setTotalDownloads(0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs([...breadcrumbs, folder]);
  };
  const handleBreadcrumbClick = (index) => {
    if (index === -1) { setCurrentFolder(null); setBreadcrumbs([]); }
    else { setCurrentFolder(breadcrumbs[index]); setBreadcrumbs(breadcrumbs.slice(0, index + 1)); }
  };
  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const n = breadcrumbs.slice(0, -1);
      setBreadcrumbs(n); setCurrentFolder(n[n.length - 1]);
    } else { setCurrentFolder(null); setBreadcrumbs([]); }
  };

  // Folder CRUD
  const openCreateModal = () => {
    setModalMode('create'); setEditingFolder(null); setShowModal(true);
  };
  const openEditModal = (folder) => {
    setModalMode('edit'); setEditingFolder(folder); setShowModal(true); setShowMenu(null);
  };
  const handleSaveFolder = async (name, visibility) => {
    if (modalMode === 'create') {
      const f = await folderService.create(name, currentFolder?.id || null, visibility);
      setFolders(prev => [...prev, f]);
    } else {
      const f = await folderService.update(editingFolder.id, {
        name, parentId: editingFolder.parentId, visibility,
      });
      setFolders(prev => prev.map(x => x.id === f.id ? f : x));
    }
  };
  const handleDeleteFolder = async (folder) => {
    if (!confirm(`Xóa thư mục "${folder.name}"?`)) return;
    await folderService.delete(folder.id);
    setFolders(prev => prev.filter(f => f.id !== folder.id));
    setShowMenu(null);
  };

  // Document actions
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!currentFolder) { toast.info('Vui lòng chọn một thư mục trước khi upload tài liệu'); return; }
    const title = prompt('Nhập tiêu đề tài liệu:', file.name.replace(/\.[^/.]+$/, ''));
    if (!title) return;
    try {
      setUploadLoading(true);
      await documentService.upload(file, title, currentFolder.id, 'PRIVATE');
      await fetchData();
      toast.success('Upload thành công!');
    } catch (error) {
      toast.error('Upload thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const handleDownloadDoc = async (doc) => {
    try { await documentService.download(doc.id, doc.fileName); }
    catch { toast.error('Tải xuống thất bại'); }
    setShowDocMenu(null);
  };
  const handleDeleteDoc = async (doc) => {
    if (!confirm(`Xóa "${doc.title}"?`)) return;
    await documentService.delete(doc.id);
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    setShowDocMenu(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thư Mục</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Tổ chức tài liệu theo thư mục — kiểm soát quyền truy cập từng thư mục</p>
          </div>
          <div className="flex items-center gap-3">
            {currentFolder && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-ocean-500 text-ocean-600 rounded-xl hover:bg-ocean-50 transition disabled:opacity-50 text-sm"
                >
                  {uploadLoading
                    ? <div className="animate-spin h-4 w-4 rounded-full border-b-2 border-ocean-600" />
                    : <Upload className="w-4 h-4" />}
                  {uploadLoading ? 'Đang tải...' : 'Tải Lên'}
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} className="hidden" />
              </>
            )}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-xl hover:from-ocean-600 hover:to-ocean-700 transition shadow-md text-sm font-medium"
            >
              <FolderPlus className="w-4 h-4" />
              {currentFolder ? 'Thư Mục Con' : 'Tạo Thư Mục'}
            </button>
            <button
              onClick={() => setShowConvertModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition text-sm font-medium"
              title="Chuyển PDF sang Word"
            >
              <FileType2 className="w-4 h-4" />
              PDF sang Word
            </button>
          </div>
        </div>

        {/* ── Breadcrumbs ── */}
        <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {currentFolder && (
              <button onClick={handleGoBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                !currentFolder ? 'bg-ocean-50 text-ocean-600 font-medium' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Folder className="w-4 h-4" /> Thư mục gốc
            </button>
            {breadcrumbs.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap ${
                    index === breadcrumbs.length - 1
                      ? 'bg-ocean-50 text-ocean-600 font-medium'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" /> {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Stats bar (khi đang trong folder) ── */}
        {currentFolder && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Thư mục con', value: folders.length, color: 'text-ocean-600' },
              { label: 'Tài liệu', value: documents.length, color: 'text-purple-600' },
              { label: 'Tổng lượt tải', value: totalDownloads, color: 'text-green-600', icon: BarChart2 },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                <div className="flex items-center gap-1.5">
                  {s.icon && <s.icon className={`w-4 h-4 ${s.color}`} />}
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Folders grid */}
            {folders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Thư mục</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-ocean-50 rounded-xl flex items-center justify-center">
                          <Folder className="w-6 h-6 text-ocean-500" />
                        </div>
                        {/* Context menu */}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setShowMenu(showMenu === folder.id ? null : folder.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {showMenu === folder.id && (
                            <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
                              <button
                                onClick={() => openEditModal(folder)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4 text-gray-400" /> Sửa / Phân quyền
                              </button>
                              {folder.visibility !== 'PRIVATE' && (
                                <button
                                  onClick={() => { setSharingFolder(folder); setShowMenu(null); }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Share2 className="w-4 h-4 text-ocean-500" /> Chia sẻ
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteFolder(folder)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 truncate mb-1.5 group-hover:text-ocean-600 transition-colors">
                        {folder.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <VisibilityBadge visibility={folder.visibility || 'PUBLIC'} />
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(folder.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents table */}
            {documents.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Tài liệu trong "{currentFolder?.name}"
                </p>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium text-gray-600">Tên tài liệu</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Loại</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Kích thước</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">
                          <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Lượt tải</span>
                        </th>
                        <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Ngày tạo</th>
                        <th className="text-right px-5 py-3 font-medium text-gray-600">Thao tác</th>
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
                          <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-sm">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                              <BarChart2 className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                            </span>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell text-gray-400 text-sm">
                            {formatDate(doc.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDownloadDoc(doc)}
                                className="p-1.5 text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition"
                                title="Tải xuống"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Footer tổng lượt tải */}
                    <tfoot className="border-t border-gray-200 bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-5 py-2.5 text-sm text-gray-500 font-medium">
                          Tổng cộng: {documents.length} tài liệu
                        </td>
                        <td className="px-5 py-2.5 hidden lg:table-cell">
                          <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                            <BarChart2 className="w-3.5 h-3.5" /> {totalDownloads} lượt tải
                          </span>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {folders.length === 0 && documents.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-dashed border-gray-200">
                <Folder className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentFolder ? 'Thư mục trống' : 'Chưa có thư mục nào'}
                </h3>
                <p className="text-gray-400 text-sm mb-5">
                  {currentFolder
                    ? 'Tải lên tài liệu hoặc tạo thư mục con'
                    : 'Tạo thư mục để tổ chức và phân quyền tài liệu của bạn'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {currentFolder && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-ocean-500 text-ocean-600 rounded-xl hover:bg-ocean-50 transition text-sm flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Tải Lên Tài Liệu
                    </button>
                  )}
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition text-sm flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {currentFolder ? 'Tạo Thư Mục Con' : 'Tạo Thư Mục'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Stats tổng (ở root) ── */}
        {!currentFolder && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Thư mục gốc</p>
              <p className="text-3xl font-bold text-ocean-600 mt-1">{folders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Công khai</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {folders.filter(f => !f.visibility || f.visibility === 'PUBLIC').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Riêng tư / Chỉ link</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">
                {folders.filter(f => f.visibility === 'PRIVATE' || f.visibility === 'LINK_ONLY').length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tạo / Sửa thư mục */}
      {showModal && (
        <FolderModal
          mode={modalMode}
          initialName={editingFolder?.name || ''}
          initialVisibility={editingFolder?.visibility || 'PUBLIC'}
          onClose={() => setShowModal(false)}
          onSave={handleSaveFolder}
        />
      )}

      {/* Modal Chia sẻ */}
      {sharingFolder && (
        <ShareModal
          folder={sharingFolder}
          onClose={() => setSharingFolder(null)}
          onRotated={(updated) => {
            setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
            setSharingFolder(updated);
          }}
        />
      )}

      <PdfToWordModal
        open={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        currentFolderId={currentFolder?.id}
        onSaved={() => fetchData()}
      />

      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default Folders;

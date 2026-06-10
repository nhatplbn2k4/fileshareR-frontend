import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import groupService from '../services/groupService';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import billingService from '../services/billingService';
import StorageProgress from '../components/StorageProgress';
import StorageUpgradeModal from '../components/StorageUpgradeModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import CoverPicker from '../components/groups/CoverPicker';
import {
  Users, FileText, Folder, Settings, Globe, Lock, Crown, Shield, ShieldCheck, User,
  Upload, Download, Trash2, Plus, Ban, UserCheck, UserX, ArrowLeft,
  Loader2, AlertTriangle, FolderPlus, RefreshCw, X, Check, Share2, Copy,
  BookmarkPlus, HardDrive, FolderOpen as FolderOpenIcon, Clock, Camera, Eye
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/format';

const MB = 1024 * 1024;

// ── Generic share link modal (dùng chung cho group invite + group folder) ───

const ShareLinkModal = ({ title, description, shareUrl, onClose, onRotate, rotating }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { toast.error('Sao chép thất bại'); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-ocean-500" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {description && <p className="text-sm text-gray-500">{description}</p>}
          {shareUrl ? (
            <>
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
                    copied ? 'bg-green-50 border-green-200 text-green-700'
                           : 'bg-ocean-50 border-ocean-200 text-ocean-700 hover:bg-ocean-100'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã chép' : 'Chép'}
                </button>
              </div>
              {onRotate && (
                <button
                  onClick={onRotate}
                  disabled={rotating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
                  {rotating ? 'Đang tạo...' : 'Tạo link mới (vô hiệu hóa link cũ)'}
                </button>
              )}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Không có link chia sẻ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Reusable helpers ──────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  const config = {
    OWNER:  { label: 'Chủ nhóm',  cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Crown },
    ADMIN:  { label: 'Quản trị',  cls: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
    MEMBER: { label: 'Thành viên',cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: User },
  };
  const c = config[role] || config.MEMBER;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${c.cls}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const ModerationBadge = ({ status, reason }) => {
  if (!status || status === 'APPROVED') return null;
  const config = {
    PENDING:  { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    REJECTED: { label: 'Đã từ chối', cls: 'bg-red-100 text-red-700 border-red-200', icon: Ban },
  };
  const c = config[status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${c.cls}`}
      title={reason || ''}
    >
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ocean-600" />
  </div>
);

// ── Save to folder modal (dùng chung cho DocumentsTab + FoldersTab) ──────────

const GroupSaveToFolderModal = ({ doc, onClose }) => {
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
                  <span className="flex items-center gap-2"><FolderOpenIcon className="w-4 h-4" /> {f.name}</span>
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

// ── Tab: Tài liệu ─────────────────────────────────────────────────────────────

const DocumentsTab = ({ groupId, myRole, isMember, onView }) => {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savingDoc, setSavingDoc] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try { setDocuments(await groupService.getDocuments(groupId)); }
    catch { setError('Không thể tải danh sách tài liệu'); }
    finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const title = file.name.replace(/\.[^/.]+$/, '');
    setUploading(true);
    try {
      const uploaded = await groupService.uploadDocument(groupId, file, title);
      if (uploaded?.moderationStatus === 'PENDING') {
        toast.info('Tài liệu của bạn đang chờ admin nhóm duyệt trước khi hiển thị cho thành viên khác.');
      }
      await fetchDocs();
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      await groupService.deleteDocument(groupId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      setError(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleDownload = async (doc) => {
    try { await groupService.downloadDocument(groupId, doc.id, doc.fileName); }
    catch { setError('Tải xuống thất bại'); }
  };

  const canUpload = isMember && (myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MEMBER');
  const canDelete = myRole === 'OWNER' || myRole === 'ADMIN';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {canUpload && (
        <div className="flex justify-end">
          <label className={`flex items-center gap-2 px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-ocean-600 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Đang upload...' : 'Upload tài liệu'}
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có tài liệu nào trong nhóm</p>
          {canUpload && <p className="text-gray-400 text-sm mt-1">Upload tài liệu đầu tiên của nhóm!</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tên tài liệu</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Người upload</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Loại</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Lượt tải</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map(doc => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 transition cursor-pointer select-none"
                  onDoubleClick={() => onView?.(doc)}
                  title="Nhấn đúp để xem"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ocean-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-ocean-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          <ModerationBadge status={doc.moderationStatus} reason={doc.moderationReason} />
                        </div>
                        <p className="text-xs text-gray-400">{doc.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {doc.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-gray-700 text-sm">{doc.userName || 'Không rõ'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 uppercase font-medium">{doc.fileType}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-green-600 font-semibold">{doc.downloadCount || 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSavingDoc(doc)}
                        className="p-1.5 text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition"
                        title="Lưu / Tải về"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {(canDelete || doc.isOwner) && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {savingDoc && (
        <GroupSaveToFolderModal doc={savingDoc} onClose={() => setSavingDoc(null)} />
      )}
    </div>
  );
};

// ── Tab: Thư mục (giống Folders cá nhân) ─────────────────────────────────────

const FoldersTab = ({ groupId, myRole, isMember, groupVisibility, onView }) => {
  const toast = useToast();
  const fileInputRef = React.useRef(null);

  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs]     = useState([]);
  const [folders, setFolders]             = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState('');
  const [sharingFolder, setSharingFolder] = useState(null);
  const [rotating, setRotating]           = useState(false);
  const [savingDoc, setSavingDoc]         = useState(null);

  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';
  const canShareFolder = canManage && groupVisibility === 'PUBLIC';
  const canUpload = isMember; // mọi thành viên upload được (trừ bị ban — BE kiểm tra)

  // ── Fetch dữ liệu ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (currentFolder) {
        // Trong folder: lấy sub-folders và tài liệu thuộc folder đó
        const [subs, docs] = await Promise.all([
          groupService.getSubFolders(groupId, currentFolder.id),
          groupService.getDocuments(groupId, currentFolder.id),
        ]);
        setFolders(subs);
        setDocuments(docs);
      } else {
        // Root: lấy folders gốc và tài liệu không thuộc folder nào
        const [roots, docs] = await Promise.all([
          groupService.getRootFolders(groupId),
          groupService.getDocuments(groupId, -1), // -1 = không có folder
        ]);
        setFolders(roots);
        setDocuments(docs);
      }
    } catch {
      setError('Không thể tải dữ liệu thư mục');
    } finally {
      setLoading(false);
    }
  }, [groupId, currentFolder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumbs(prev => [...prev, folder]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) { setCurrentFolder(null); setBreadcrumbs([]); }
    else { setCurrentFolder(breadcrumbs[index]); setBreadcrumbs(breadcrumbs.slice(0, index + 1)); }
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      const next = breadcrumbs.slice(0, -1);
      setBreadcrumbs(next); setCurrentFolder(next[next.length - 1]);
    } else { setCurrentFolder(null); setBreadcrumbs([]); }
  };

  // ── Folder actions ───────────────────────────────────────────────────────

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const f = await groupService.createFolder(groupId, {
        name: newFolderName,
        parentId: currentFolder?.id || null,
      });
      setFolders(prev => [...prev, f]);
      setNewFolderName(''); setShowCreate(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo thư mục thất bại');
    } finally { setCreating(false); }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (!window.confirm('Xóa thư mục này?')) return;
    try {
      await groupService.deleteFolder(groupId, folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
    } catch (err) { setError(err?.response?.data?.message || 'Xóa thất bại'); }
  };

  // ── Document actions ─────────────────────────────────────────────────────

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!currentFolder) {
      setError('Vui lòng mở một thư mục trước khi upload tài liệu vào đây.');
      e.target.value = ''; return;
    }
    const title = file.name.replace(/\.[^/.]+$/, '');
    setUploading(true);
    try {
      const uploaded = await groupService.uploadDocument(groupId, file, title, currentFolder.id);
      if (uploaded?.moderationStatus === 'PENDING') {
        toast.info('Tài liệu của bạn đang chờ admin nhóm duyệt trước khi hiển thị cho thành viên khác.');
      }
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload thất bại');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownload = async (doc) => {
    try { await groupService.downloadDocument(groupId, doc.id, doc.fileName); }
    catch { setError('Tải xuống thất bại'); }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      await groupService.deleteDocument(groupId, docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) { setError(err?.response?.data?.message || 'Xóa thất bại'); }
  };

  const canDeleteDoc = myRole === 'OWNER' || myRole === 'ADMIN';

  const getFileColor = (type) => {
    const t = type?.toUpperCase();
    if (t === 'PDF')  return 'bg-red-100 text-red-600';
    if (t === 'DOCX') return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Breadcrumb bar */}
      <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 flex-wrap">
          {currentFolder && (
            <button onClick={handleGoBack}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 mr-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
              ${!currentFolder ? 'bg-ocean-50 text-ocean-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Folder className="w-4 h-4" /> Thư mục gốc
          </button>
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.id}>
              <span className="text-gray-300">/</span>
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
                  ${i === breadcrumbs.length - 1 ? 'bg-ocean-50 text-ocean-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Actions toolbar */}
      <div className="flex items-center justify-end gap-3 flex-wrap">
        {/* Upload — chỉ khi đang trong folder */}
        {canUpload && currentFolder && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 border border-ocean-500 text-ocean-600 rounded-lg text-sm hover:bg-ocean-50 transition disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Đang upload...' : 'Upload tài liệu'}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
          </>
        )}

        {/* Tạo thư mục — chỉ ADMIN/OWNER */}
        {canManage && (
          showCreate ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder={currentFolder ? 'Tên thư mục con...' : 'Tên thư mục...'}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 w-44"
              />
              <button onClick={handleCreateFolder} disabled={creating}
                className="p-2 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setShowCreate(false); setNewFolderName(''); }}
                className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg text-sm font-medium hover:from-ocean-600 hover:to-ocean-700 transition shadow-sm">
              <FolderPlus className="w-4 h-4" />
              {currentFolder ? 'Tạo thư mục con' : 'Tạo thư mục'}
            </button>
          )
        )}
      </div>

      {/* Folders grid */}
      {folders.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Thư mục</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {folders.map(f => (
              <div
                key={f.id}
                onClick={() => handleFolderClick(f)}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-ocean-200 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-ocean-50 rounded-lg flex items-center justify-center">
                    <Folder className="w-6 h-6 text-ocean-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {canShareFolder && f.shareToken && (
                      <button
                        onClick={e => { e.stopPropagation(); setSharingFolder(f); }}
                        className="p-1.5 text-gray-300 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition"
                        title="Chia sẻ thư mục"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={e => handleDeleteFolder(f.id, e)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-medium text-gray-900 truncate group-hover:text-ocean-600 transition-colors">
                  {f.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">bởi {f.createdByName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents in current folder */}
      {documents.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">
            Tài liệu {currentFolder ? `trong "${currentFolder.name}"` : 'chưa xếp vào thư mục'}
          </p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tên tài liệu</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Loại</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Lượt tải</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map(doc => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition cursor-pointer select-none"
                    onDoubleClick={() => onView?.(doc)}
                    title="Nhấn đúp để xem"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getFileColor(doc.fileType)}`}>
                          {doc.fileType?.toUpperCase()?.slice(0, 3) || 'DOC'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            <ModerationBadge status={doc.moderationStatus} reason={doc.moderationReason} />
                          </div>
                          <p className="text-xs text-gray-400">{doc.fileName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getFileColor(doc.fileType)}`}>
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500">{doc.downloadCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSavingDoc(doc)}
                          className="p-1.5 text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition" title="Lưu / Tải về">
                          <Download className="w-4 h-4" />
                        </button>
                        {(canDeleteDoc || doc.isOwner) && (
                          <button onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {folders.length === 0 && documents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Folder className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">
            {currentFolder ? 'Thư mục này trống' : 'Chưa có thư mục nào'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {currentFolder
              ? 'Upload tài liệu hoặc tạo thư mục con bên trong'
              : 'Tạo thư mục để tổ chức tài liệu trong nhóm'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {canUpload && currentFolder && (
              <button onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-ocean-500 text-ocean-600 rounded-lg text-sm hover:bg-ocean-50 transition flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload tài liệu
              </button>
            )}
            {canManage && (
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm hover:bg-ocean-600 transition flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                {currentFolder ? 'Tạo thư mục con' : 'Tạo thư mục'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hint khi ở root mà muốn upload */}
      {!currentFolder && canUpload && folders.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          💡 Mở một thư mục để upload tài liệu vào bên trong
        </p>
      )}

      {/* Modal lưu tài liệu */}
      {savingDoc && (
        <GroupSaveToFolderModal doc={savingDoc} onClose={() => setSavingDoc(null)} />
      )}

      {/* Modal chia sẻ group folder */}
      {sharingFolder && (
        <ShareLinkModal
          title="Chia sẻ thư mục nhóm"
          description={`Link công khai cho "${sharingFolder.name}". Ai có link đều xem + tải tài liệu.`}
          shareUrl={sharingFolder.shareToken
            ? `${window.location.origin}/shared/group-folder/${sharingFolder.shareToken}`
            : ''}
          rotating={rotating}
          onClose={() => setSharingFolder(null)}
          onRotate={async () => {
            if (!window.confirm('Tạo link mới sẽ làm link cũ hết hiệu lực. Tiếp tục?')) return;
            setRotating(true);
            try {
              const updated = await groupService.rotateGroupFolderShareToken(sharingFolder.id);
              setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
              setSharingFolder(updated);
            } catch (err) {
              toast.error('Tạo link mới thất bại: ' + (err.response?.data?.message || err.message));
            } finally {
              setRotating(false);
            }
          }}
        />
      )}
    </div>
  );
};



// ── Tab: Thành viên ───────────────────────────────────────────────────────────

const BanModal = ({ target, onClose, onBanned }) => {
  const [banType, setBanType] = useState('UPLOAD_BAN_7_DAYS');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const options = [
    { val: 'KICKED',             label: '🚫 Đuổi khỏi nhóm',           desc: 'Vĩnh viễn, không thể tự join lại' },
    { val: 'UPLOAD_BAN_7_DAYS',  label: '⏱️ Cấm upload 7 ngày',         desc: 'Vẫn là thành viên, không thể upload' },
    { val: 'UPLOAD_BAN_1_MONTH', label: '📅 Cấm upload 1 tháng',        desc: 'Vẫn là thành viên, không thể upload' },
    { val: 'UPLOAD_BAN_1_YEAR',  label: '📆 Cấm upload 1 năm',          desc: 'Vẫn là thành viên, không thể upload' },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onBanned({ userId: target.userId, banType, reason });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Ban thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white rounded-t-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2"><Ban className="w-5 h-5" /> Hạn chế thành viên</h2>
          <p className="text-red-100 text-sm mt-1">Đối với: <strong>{target.fullName}</strong></p>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div className="space-y-2">
            {options.map(opt => (
              <label key={opt.val} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${banType === opt.val ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" value={opt.val} checked={banType === opt.val} onChange={e => setBanType(e.target.value)} className="mt-0.5 accent-red-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Lý do (không bắt buộc)..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Hủy</button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersTab = ({ groupId, myRole, ownerId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null);
  const [error, setError] = useState('');

  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try { setMembers(await groupService.getMembers(groupId)); }
    catch { setError('Không thể tải danh sách thành viên'); }
    finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleSetAdmin = async (userId, isAdmin) => {
    try {
      await groupService.setAdmin(groupId, userId, isAdmin);
      setMembers(prev => prev.map(m => m.userId === userId
        ? { ...m, role: isAdmin ? 'ADMIN' : 'MEMBER' } : m));
    } catch (err) { setError(err?.response?.data?.message || 'Thao tác thất bại'); }
  };

  const handleBanned = async (banData) => {
    await groupService.banMember(groupId, banData);
    await fetchMembers();
  };

  const handleUnban = async (userId) => {
    try {
      await groupService.unbanMember(groupId, userId);
      await fetchMembers();
    } catch (err) { setError(err?.response?.data?.message || 'Gỡ ban thất bại'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">{members.length} thành viên</span>
          <button onClick={fetchMembers} className="text-gray-400 hover:text-ocean-600 transition"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <ul className="divide-y divide-gray-50">
          {members.map(m => (
            <li key={m.userId} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {m.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{m.fullName}</p>
                  <RoleBadge role={m.role} />
                  {m.isUploadBanned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600 border border-red-200">
                      <Ban className="w-3 h-3" /> Cấm upload
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
              </div>

              {canManage && m.role !== 'OWNER' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {myRole === 'OWNER' && (
                    m.role === 'ADMIN' ? (
                      <button
                        onClick={() => handleSetAdmin(m.userId, false)}
                        title="Thu hồi admin"
                        className="p-1.5 text-purple-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition text-xs flex items-center gap-1"
                      >
                        <UserX className="w-4 h-4" /> Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetAdmin(m.userId, true)}
                        title="Cấp admin"
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition text-xs flex items-center gap-1"
                      >
                        <UserCheck className="w-4 h-4" /> Admin
                      </button>
                    )
                  )}
                  {m.isUploadBanned ? (
                    <button
                      onClick={() => handleUnban(m.userId)}
                      title="Gỡ ban"
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanTarget(m)}
                      title="Ban thành viên"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {banTarget && (
        <BanModal
          target={banTarget}
          onClose={() => setBanTarget(null)}
          onBanned={handleBanned}
        />
      )}
    </div>
  );
};

// ── Tab: Cài đặt (OWNER) ──────────────────────────────────────────────────────

// ── Tab: Yêu cầu tham gia ───────────────────────────────────────────────────

const JoinRequestsTab = ({ groupId }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try { setRequests(await groupService.getPendingRequests(groupId)); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [groupId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (reqId) => {
    try {
      await groupService.approveRequest(groupId, reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) { toast.error(err?.response?.data?.message || 'Duyệt thất bại'); }
  };

  const handleReject = async (reqId) => {
    try {
      await groupService.rejectRequest(groupId, reqId);
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) { toast.error(err?.response?.data?.message || 'Từ chối thất bại'); }
  };

  if (loading) return <LoadingSpinner />;

  if (requests.length === 0) return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
      <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">Không có yêu cầu nào đang chờ duyệt</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{requests.length} yêu cầu đang chờ</p>
      {requests.map(req => (
        <div key={req.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {req.userAvatarUrl ? (
                <img src={req.userAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {req.userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{req.userName}</p>
                <p className="text-xs text-gray-400">
                  {new Date(req.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {req.answers && req.answers.length > 0 && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-2">
                    {req.answers.map((ans, i) => (
                      <div key={i}>
                        {req.questions && req.questions[i] && (
                          <p className="text-xs font-medium text-gray-500">{req.questions[i]}</p>
                        )}
                        <p className="whitespace-pre-wrap">{ans}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleApprove(req.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
                <Check className="w-3.5 h-3.5" /> Duyệt
              </button>
              <button onClick={() => handleReject(req.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                <X className="w-3.5 h-3.5" /> Từ chối
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Tab: Chờ duyệt (Moderation) ──────────────────────────────────────────────
// Chỉ admin/owner thấy. Hiển thị các tài liệu PENDING + nút Duyệt/Từ chối.

const PendingReviewTab = ({ groupId, onChanged, onView }) => {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setDocs(await groupService.getPendingDocuments(groupId)); }
    catch { toast.error('Không thể tải danh sách tài liệu chờ duyệt'); }
    finally { setLoading(false); }
  }, [groupId, toast]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleApprove = async (doc) => {
    setBusyId(doc.id);
    try {
      await groupService.approveDocument(groupId, doc.id);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast.success(`Đã duyệt "${doc.title}"`);
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Duyệt thất bại');
    } finally { setBusyId(null); }
  };

  const handleReject = async () => {
    if (!rejectFor) return;
    const doc = rejectFor;
    setBusyId(doc.id);
    try {
      await groupService.rejectDocument(groupId, doc.id, rejectReason.trim());
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast.success(`Đã từ chối "${doc.title}"`);
      onChanged?.();
      setRejectFor(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Từ chối thất bại');
    } finally { setBusyId(null); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <ShieldCheck className="w-4 h-4 text-amber-500" />
        Tài liệu của thành viên thường được hệ thống quét tự động. Tài liệu nghi vấn xuất hiện ở đây để bạn quyết định.
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <ShieldCheck className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">Không có tài liệu nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 uppercase font-medium">
                        {doc.fileType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Người upload: <span className="font-medium">{doc.userName || 'Không rõ'}</span>
                    </p>
                    {doc.moderationReason && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                        <strong>Lý do nghi vấn:</strong> {doc.moderationReason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView?.(doc)}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                    title="Xem trước"
                  >
                    <Eye className="w-4 h-4" /> Xem
                  </button>
                  <button
                    onClick={() => handleApprove(doc)}
                    disabled={busyId === doc.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-60"
                  >
                    {busyId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Duyệt
                  </button>
                  <button
                    onClick={() => { setRejectFor(doc); setRejectReason(doc.moderationReason || ''); }}
                    disabled={busyId === doc.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Từ chối
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" /> Từ chối tài liệu
              </h3>
              <button onClick={() => { setRejectFor(null); setRejectReason(''); }}
                className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn đang từ chối <strong>"{rejectFor.title}"</strong>.
                Tài liệu sẽ vẫn được giữ lại nhưng ẩn khỏi thành viên khác.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do (tùy chọn)</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: nội dung không phù hợp với quy định nhóm..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRejectFor(null); setRejectReason(''); }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={busyId === rejectFor.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-60 text-sm font-medium"
                >
                  {busyId === rejectFor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsTab = ({ group, onUpdated, onDeleted, members }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: group.name,
    description: group.description || '',
    visibility: group.visibility,
    requireApproval: group.requireApproval || false,
    joinQuestions: group.joinQuestions || [],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupStorage, setGroupStorage] = useState(null);
  const [storageOpen, setStorageOpen] = useState(false);

  // Cấp phát dung lượng cho nhóm (lấy từ quota cá nhân của owner)
  const [myStorage, setMyStorage] = useState(null);
  const [allocMb, setAllocMb] = useState(Math.floor((group.allocatedQuotaBytes || 0) / MB));
  const [allocSaving, setAllocSaving] = useState(false);
  const [allocError, setAllocError] = useState('');
  const [allocSuccess, setAllocSuccess] = useState('');

  const refreshStorage = useCallback(() => {
    billingService.getGroupStorage(group.id).then(setGroupStorage).catch(() => {});
    billingService.getMyStorage().then(setMyStorage).catch(() => {});
  }, [group.id]);

  useEffect(() => {
    let mounted = true;
    billingService.getGroupStorage(group.id)
      .then(info => { if (mounted) { setGroupStorage(info); setAllocMb(Math.floor((info.allocatedQuotaBytes || 0) / MB)); } })
      .catch(() => {});
    billingService.getMyStorage()
      .then(info => mounted && setMyStorage(info))
      .catch(() => {});
    return () => { mounted = false; };
  }, [group.id]);

  const usedBytes = groupStorage?.storageUsed ?? group.storageUsed ?? 0;
  const currentAllocated = groupStorage?.allocatedQuotaBytes ?? group.allocatedQuotaBytes ?? 0;
  // Ngân sách tối đa có thể đặt = dung lượng owner còn khả dụng + phần đang cấp cho nhóm này
  const allocBudget = myStorage != null
    ? Math.max(0, (myStorage.availableQuotaBytes ?? 0)) + currentAllocated
    : null;
  const newAllocBytes = Math.round((Number(allocMb) || 0) * MB);

  const handleSaveAllocation = async () => {
    setAllocError(''); setAllocSuccess('');
    if (newAllocBytes < usedBytes) {
      return setAllocError(`Không thể đặt thấp hơn dung lượng nhóm đã dùng (${formatBytes(usedBytes)}).`);
    }
    if (allocBudget != null && newAllocBytes > allocBudget) {
      return setAllocError(`Vượt quá dung lượng khả dụng của bạn (tối đa ${formatBytes(allocBudget)}).`);
    }
    setAllocSaving(true);
    try {
      const updated = await groupService.updateGroup(group.id, { allocatedQuotaBytes: newAllocBytes });
      onUpdated(updated);
      refreshStorage();
      setAllocSuccess('Đã cập nhật dung lượng nhóm!');
    } catch (err) {
      setAllocError(err?.response?.data?.message || 'Cập nhật dung lượng thất bại');
    } finally { setAllocSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await groupService.updateGroup(group.id, form);
      onUpdated(updated);
      setSuccess('Đã lưu thay đổi!');
    } catch (err) {
      setError(err?.response?.data?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa nhóm này vĩnh viễn? Tất cả tài liệu và thành viên sẽ bị xóa.')) return;
    setDeleting(true);
    try {
      await groupService.deleteGroup(group.id);
      navigate('/groups');
    } catch (err) {
      setError(err?.response?.data?.message || 'Xóa nhóm thất bại');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Storage card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Bộ nhớ nhóm</h3>
        {groupStorage ? (
          <>
            <StorageProgress
              used={groupStorage.storageUsed}
              total={groupStorage.totalQuotaBytes}
              planName={groupStorage.plan?.name}
            />
            <button
              onClick={() => setStorageOpen(true)}
              className="w-full px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-600 transition-colors"
            >
              Nâng cấp / Mua thêm cho nhóm
            </button>
          </>
        ) : (
          <div className="text-sm text-gray-500">Đang tải...</div>
        )}
      </div>

      <StorageUpgradeModal
        open={storageOpen}
        onClose={() => setStorageOpen(false)}
        onSuccess={(info) => setGroupStorage(info)}
        context="group"
        groupId={group.id}
        currentPlanCode={groupStorage?.plan?.code}
      />

      {/* Cấp phát dung lượng cho nhóm (từ quota cá nhân của chủ nhóm) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-ocean-500" />
          <h3 className="font-semibold text-gray-900">Dung lượng cấp cho nhóm</h3>
        </div>
        <p className="text-sm text-gray-500">
          Dung lượng nhóm được lấy từ quota cá nhân của bạn. Thành viên upload sẽ dùng chung phần này.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="text-gray-500">Đang cấp</div>
            <div className="font-semibold text-gray-900">{formatBytes(currentAllocated)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="text-gray-500">Nhóm đã dùng</div>
            <div className="font-semibold text-gray-900">{formatBytes(usedBytes)}</div>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Đặt lại dung lượng (MB)</label>
            <input
              type="number"
              min={Math.ceil(usedBytes / MB)}
              max={allocBudget != null ? Math.floor(allocBudget / MB) : undefined}
              value={allocMb}
              onChange={e => setAllocMb(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSaveAllocation}
            disabled={allocSaving}
            className="px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm font-medium hover:bg-ocean-600 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {allocSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lưu
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Tối thiểu {formatBytes(usedBytes)} (đã dùng)
          {allocBudget != null && <> · tối đa {formatBytes(allocBudget)} (khả dụng của bạn)</>}.
        </p>
        {allocError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">{allocError}</div>}
        {allocSuccess && <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-2 text-sm flex items-center gap-2"><Check className="w-4 h-4" /> {allocSuccess}</div>}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Thông tin nhóm</h3>
        {/* Group avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ocean-100 to-ocean-200 flex items-center justify-center">
                <Users className="w-8 h-8 text-ocean-600" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-ocean-500 rounded-full flex items-center justify-center text-white hover:bg-ocean-600 transition cursor-pointer shadow">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const result = await groupService.uploadAvatar(group.id, file);
                  onUpdated({ avatarUrl: result.avatarUrl });
                } catch (err) { setError(err?.response?.data?.message || 'Upload avatar thất bại'); }
              }} />
            </label>
          </div>
          <p className="text-sm text-gray-500">Click biểu tượng camera để đổi avatar nhóm</p>
        </div>

        {/* Group cover picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa (16:9)</label>
          <CoverPicker
            value={{
              presetId: null,
              presetUrl: group.coverImageUrl,
              customBlob: null,
              customUrl: null,
            }}
            onChange={async (next) => {
              try {
                if (next.customBlob) {
                  const res = await groupService.uploadCover(group.id, next.customBlob);
                  onUpdated({ coverImageUrl: res.coverImageUrl });
                } else if (next.presetId) {
                  const updated = await groupService.setCoverPreset(group.id, next.presetId);
                  onUpdated({ coverImageUrl: updated.coverImageUrl });
                }
              } catch (err) {
                setError(err?.response?.data?.message || 'Cập nhật ảnh bìa thất bại');
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chế độ nhóm</label>
          <div className="flex gap-3">
            {[
              { val: 'PUBLIC',  icon: Globe, label: 'Công khai' },
              { val: 'PRIVATE', icon: Lock,  label: 'Riêng tư' },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => setForm({ ...form, visibility: opt.val })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition ${form.visibility === opt.val ? 'border-ocean-500 bg-ocean-50 text-ocean-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-ocean-500 text-white rounded-lg text-sm font-semibold hover:bg-ocean-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Lưu thay đổi
        </button>
      </div>

      {/* Join approval settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Phê duyệt tham gia</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.requireApproval}
            onChange={e => setForm({ ...form, requireApproval: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-ocean-500 focus:ring-ocean-500" />
          <div>
            <p className="text-sm font-medium text-gray-700">Yêu cầu phê duyệt trước khi tham gia</p>
            <p className="text-xs text-gray-400">Thành viên mới phải chờ admin/owner duyệt</p>
          </div>
        </label>
        {form.requireApproval && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Câu hỏi khi tham gia</label>
            {form.joinQuestions.map((q, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={q}
                  onChange={e => {
                    const updated = [...form.joinQuestions];
                    updated[i] = e.target.value;
                    setForm({ ...form, joinQuestions: updated });
                  }}
                  placeholder={`Câu hỏi ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
                <button type="button" onClick={() => {
                  setForm({ ...form, joinQuestions: form.joinQuestions.filter((_, j) => j !== i) });
                }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => {
              setForm({ ...form, joinQuestions: [...form.joinQuestions, ''] });
            }} className="flex items-center gap-1.5 text-sm text-ocean-600 hover:text-ocean-700 font-medium">
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Transfer ownership */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 space-y-4">
        <h3 className="font-semibold text-amber-700">Chuyển quyền sở hữu</h3>
        <p className="text-sm text-gray-500">Chuyển quyền owner cho thành viên khác. Bạn sẽ trở thành admin.</p>
        <div className="flex gap-2">
          <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500">
            <option value="">Chọn thành viên...</option>
            {(members || []).filter(m => m.role !== 'OWNER').map(m => (
              <option key={m.userId} value={m.userId}>{m.fullName} ({m.role})</option>
            ))}
          </select>
          <button onClick={async () => {
            if (!transferTarget || !window.confirm('Chuyển quyền sở hữu? Bạn sẽ trở thành admin.')) return;
            setTransferring(true);
            try {
              const updated = await groupService.transferOwnership(group.id, Number(transferTarget));
              onUpdated(updated);
              setSuccess('Đã chuyển quyền sở hữu!');
              setTransferTarget('');
            } catch (err) { setError(err?.response?.data?.message || 'Chuyển quyền thất bại'); }
            finally { setTransferring(false); }
          }} disabled={!transferTarget || transferring}
            className="px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50 flex items-center gap-2">
            {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Chuyển
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
        <h3 className="font-semibold text-red-600 mb-2">Vùng nguy hiểm</h3>
        <p className="text-sm text-gray-500 mb-4">Xóa nhóm sẽ xóa toàn bộ tài liệu, thư mục và thành viên. Hành động không thể hoàn tác.</p>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-60">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Xóa nhóm
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [joining, setJoining] = useState(false);
  const [showGroupInvite, setShowGroupInvite] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinAnswers, setJoinAnswers] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { fetchGroup(); }, [groupId]);

  const refreshPendingCount = useCallback(async () => {
    try { setPendingCount(await groupService.countPendingDocuments(groupId)); }
    catch { /* ignore — chỉ admin mới gọi được endpoint này */ }
  }, [groupId]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const g = await groupService.getById(groupId);
      setGroup(g);
      if (g.isMember) {
        try { setMembers(await groupService.getMembers(groupId)); }
        catch { /* ignore */ }
        if (g.myRole === 'OWNER' || g.myRole === 'ADMIN') {
          refreshPendingCount();
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải thông tin nhóm');
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    // Nếu cần approval → mở modal nhập câu trả lời
    if (group.requireApproval) {
      setShowJoinModal(true);
      return;
    }
    setJoining(true);
    try {
      await groupService.joinGroup(groupId);
      await fetchGroup();
    } catch (err) { setError(err?.response?.data?.message || 'Tham gia thất bại'); }
    finally { setJoining(false); }
  };

  const handleSubmitJoinRequest = async () => {
    setJoining(true);
    try {
      await groupService.submitJoinRequest(groupId, joinAnswers.length > 0 ? joinAnswers : null);
      setShowJoinModal(false);
      setJoinAnswers([]);
      await fetchGroup();
    } catch (err) { setError(err?.response?.data?.message || 'Gửi yêu cầu thất bại'); }
    finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!window.confirm('Rời khỏi nhóm này?')) return;
    setLeaving(true);
    try {
      await groupService.leaveGroup(groupId);
      navigate('/groups');
    } catch (err) {
      setError(err?.response?.data?.message || 'Rời nhóm thất bại');
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600" />
        </div>
      </MainLayout>
    );
  }

  if (error || !group) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error || 'Không tìm thấy nhóm'}</p>
          <button onClick={() => navigate('/groups')} className="mt-4 px-4 py-2 bg-ocean-500 text-white rounded-lg text-sm hover:bg-ocean-600 transition">
            Về danh sách nhóm
          </button>
        </div>
      </MainLayout>
    );
  }

  const myRole = group.myRole;
  const isMember = group.isMember;

  // PRIVATE + non-member → hiện thông báo riêng tư
  if (!isMember && group.visibility === 'PRIVATE') {
    return (
      <MainLayout>
        <div className="space-y-6">
          <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-ocean-600 transition">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold">
                {group.avatarUrl
                  ? <img src={group.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  : group.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{group.name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-white/20 border border-white/20">
                    <Lock className="w-3.5 h-3.5" /> Riêng tư
                  </span>
                </div>
                {group.description && <p className="text-gray-300 mt-1.5 text-sm">{group.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {group.memberCount} thành viên</span>
                  <span>Chủ nhóm: <strong className="text-white">{group.ownerName}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Nhóm này là riêng tư</h2>
            <p className="text-gray-600 text-sm mb-4">Bạn phải tham gia nhóm để xem nội dung</p>
            {isAuthenticated && !group.hasPendingRequest && (
              <button onClick={handleJoin} disabled={joining}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-ocean-500 text-white rounded-xl font-semibold hover:bg-ocean-600 transition disabled:opacity-60">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {group.requireApproval ? 'Xin tham gia' : 'Tham gia nhóm'}
              </button>
            )}
            {isAuthenticated && group.hasPendingRequest && (
              <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-semibold border border-amber-200">
                <Clock className="w-4 h-4" /> Đã gửi yêu cầu, chờ duyệt
              </span>
            )}
            {!isAuthenticated && (
              <button onClick={() => { sessionStorage.setItem('returnTo', `/groups/${groupId}`); navigate('/login'); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-ocean-500 text-white rounded-xl font-semibold hover:bg-ocean-600 transition">
                Đăng nhập để tham gia
              </button>
            )}
          </div>
        </div>

        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Xin tham gia nhóm</h3>
                <button onClick={() => setShowJoinModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="p-6 space-y-4">
                {group.joinQuestions && group.joinQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {group.joinQuestions.map((q, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-gray-700 mb-1">{i + 1}. {q}</p>
                        <textarea value={joinAnswers[i] || ''} onChange={e => { const u = [...joinAnswers]; u[i] = e.target.value; setJoinAnswers(u); }}
                          placeholder="Nhập câu trả lời..." rows={2}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Yêu cầu của bạn sẽ được gửi cho admin/owner.</p>
                )}
                <button onClick={handleSubmitJoinRequest} disabled={joining}
                  className="w-full py-2.5 bg-ocean-500 text-white rounded-lg text-sm font-semibold hover:bg-ocean-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {joining ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    );
  }
  const isOwner = myRole === 'OWNER';
  const isAdminOrOwner = myRole === 'OWNER' || myRole === 'ADMIN';
  const canManageGroup = isOwner;
  const isPublic = group.visibility === 'PUBLIC';

  const tabs = [
    { key: 'documents', label: 'Tài liệu', icon: FileText, show: true },
    { key: 'folders',   label: 'Thư mục',  icon: Folder,   show: true },
    { key: 'members',   label: 'Thành viên', icon: Users,  show: true },
    { key: 'moderation', label: 'Chờ duyệt', icon: ShieldCheck, show: isAdminOrOwner, badge: pendingCount },
    { key: 'requests',  label: 'Yêu cầu',  icon: UserCheck, show: isAdminOrOwner && group.requireApproval },
    { key: 'settings',  label: 'Cài đặt',  icon: Settings, show: canManageGroup },
  ].filter(t => t.show);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back button */}
        <button onClick={() => navigate('/groups')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-ocean-600 transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Group Header — 16:9 cover + info section below with avatar overlap */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cover 16:9 — max-height clamps on wide screens */}
          <div className="relative w-full aspect-video max-h-72 bg-gradient-to-r from-ocean-500 to-ocean-600">
            {group.coverImageUrl && (
              <img
                src={group.coverImageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Info section */}
          <div className="px-6 md:px-8 pb-6 pt-0 relative">
            <div className="flex items-end gap-5 flex-wrap">
              {/* Avatar overlap */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white ring-4 ring-white shadow-lg overflow-hidden -mt-12 flex items-center justify-center text-3xl md:text-4xl font-bold text-ocean-600 bg-gradient-to-br from-ocean-100 to-ocean-200 flex-shrink-0">
                {group.avatarUrl
                  ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : group.name.charAt(0).toUpperCase()}
              </div>

              {/* Title + meta */}
              <div className="flex-1 min-w-0 pt-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{group.name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${isPublic ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                {group.description && <p className="text-gray-600 mt-1.5 text-sm">{group.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {group.memberCount} thành viên</span>
                  <span>Chủ nhóm: <strong className="text-gray-900">{group.ownerName}</strong></span>
                  {myRole && <RoleBadge role={myRole} />}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                {isMember && group.shareToken && (
                  <button onClick={() => setShowGroupInvite(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-ocean-50 text-ocean-700 rounded-xl font-semibold hover:bg-ocean-100 transition border border-ocean-200">
                    <Share2 className="w-4 h-4" /> Chia sẻ nhóm
                  </button>
                )}
                {isAuthenticated && !isMember && isPublic && !group.hasPendingRequest && (
                  <button onClick={handleJoin} disabled={joining}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-xl font-semibold hover:from-ocean-600 hover:to-ocean-700 transition shadow disabled:opacity-60">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {group.requireApproval ? 'Xin tham gia' : 'Tham gia'}
                  </button>
                )}
                {isAuthenticated && !isMember && group.hasPendingRequest && (
                  <span className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-semibold border border-amber-200">
                    <Clock className="w-4 h-4" /> Chờ duyệt
                  </span>
                )}
                {isMember && !isOwner && (
                  <button onClick={handleLeave} disabled={leaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition border border-gray-200 disabled:opacity-60">
                    {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Rời nhóm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-ocean-500 text-ocean-600 bg-ocean-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[11px] font-semibold bg-red-500 text-white rounded-full">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 md:p-6">
            {activeTab === 'documents' && (
              <DocumentsTab groupId={groupId} myRole={myRole} isMember={isMember} onView={setViewingDoc} />
            )}
            {activeTab === 'folders' && (
              <FoldersTab
                groupId={groupId}
                myRole={myRole}
                isMember={isMember}
                groupVisibility={group.visibility}
                onView={setViewingDoc}
              />
            )}
            {activeTab === 'members' && (
              <MembersTab groupId={groupId} myRole={myRole} ownerId={group.ownerId} />
            )}
            {activeTab === 'moderation' && isAdminOrOwner && (
              <PendingReviewTab
                groupId={groupId}
                onChanged={refreshPendingCount}
                onView={setViewingDoc}
              />
            )}
            {activeTab === 'requests' && isAdminOrOwner && (
              <JoinRequestsTab groupId={groupId} />
            )}
            {activeTab === 'settings' && canManageGroup && (
              <SettingsTab
                group={group}
                members={members}
                onUpdated={(updated) => setGroup(prev => ({ ...prev, ...updated }))}
                onDeleted={() => navigate('/groups')}
              />
            )}
          </div>
        </div>
      </div>

      {showGroupInvite && group.shareToken && (
        <ShareLinkModal
          title="Mời người khác vào nhóm"
          description={group.requireApproval
            ? `Gửi link này cho bạn bè — họ sẽ phải chờ duyệt trước khi tham gia "${group.name}".`
            : `Gửi link này cho bạn bè — họ sẽ tự động tham gia "${group.name}" sau khi đăng nhập.`}
          shareUrl={`${window.location.origin}/shared/group/${group.shareToken}`}
          onClose={() => setShowGroupInvite(false)}
        />
      )}

      {/* Modal nhập câu trả lời khi xin tham gia */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Xin tham gia nhóm</h3>
              <button onClick={() => setShowJoinModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {group.joinQuestions && group.joinQuestions.length > 0 ? (
                <div className="space-y-3">
                  {group.joinQuestions.map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-gray-700 mb-1">{i + 1}. {q}</p>
                      <textarea
                        value={joinAnswers[i] || ''}
                        onChange={e => {
                          const updated = [...joinAnswers];
                          updated[i] = e.target.value;
                          setJoinAnswers(updated);
                        }}
                        placeholder="Nhập câu trả lời..."
                        rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nhóm này yêu cầu phê duyệt. Yêu cầu của bạn sẽ được gửi cho admin/owner.</p>
              )}
              <button onClick={handleSubmitJoinRequest} disabled={joining}
                className="w-full py-2.5 bg-ocean-500 text-white rounded-lg text-sm font-semibold hover:bg-ocean-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {joining ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default GroupDetail;

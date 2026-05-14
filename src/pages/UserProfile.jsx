import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import DocumentViewerModal from '../components/DocumentViewerModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User, FileText, File, Download, Folder, Clock, HardDrive,
  ArrowLeft, Loader2, AlertTriangle, BarChart2, Tag, BookmarkPlus,
  X, Check, FolderOpen
} from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (ds) =>
  ds ? new Date(ds).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const getFileIcon = (ft) =>
  ft?.toUpperCase() === 'PDF'
    ? <File className="w-5 h-5 text-red-500" />
    : <FileText className="w-5 h-5 text-blue-500" />;

const ROLE_LABEL = { USER: 'Người dùng', ADMIN: 'Quản trị viên' };

/** Modal lưu tài liệu vào thư mục cá nhân */
const SaveToFolderModal = ({ doc, onClose }) => {
  const toast = useToast();
  const [myFolders, setMyFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  useEffect(() => {
    (async () => {
      try { setMyFolders(await folderService.getAll()); }
      catch { /* ignore */ }
      finally { setLoadingFolders(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentService.saveToFolder(doc.id, selectedFolder);
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
          {loadingFolders ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 text-ocean-500 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button onClick={() => setSelectedFolder(null)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                  selectedFolder === null ? 'border-ocean-500 bg-ocean-50 text-ocean-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}>
                <span className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> Không thuộc thư mục nào</span>
              </button>
              {myFolders.map(f => (
                <button key={f.id} onClick={() => setSelectedFolder(f.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                    selectedFolder === f.id ? 'border-ocean-500 bg-ocean-50 text-ocean-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}>
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

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingDoc, setSavingDoc] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [prof, docs, flds] = await Promise.all([
        documentService.getUserProfile(userId),
        documentService.getUserPublicDocuments(userId),
        documentService.getUserPublicFolders(userId),
      ]);
      setProfile(prof);
      setDocuments(docs);
      setFolders(flds);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Người dùng không tồn tại.');
      } else {
        setError('Không thể tải thông tin.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = async (doc) => {
    try {
      await documentService.publicDownload(doc.id, doc.fileName);
    } catch {
      toast.error('Tải xuống thất bại');
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-ocean-500 animate-spin" />
      </div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
      <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
        <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-ocean-500 text-white rounded-xl hover:bg-ocean-600 transition">
          Quay lại
        </button>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-ocean-600 transition">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-ocean-100" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ocean-100 to-ocean-200 flex items-center justify-center">
                <User className="w-10 h-10 text-ocean-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{ROLE_LABEL[profile.role] || profile.role}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" /> {profile.publicDocumentCount} tài liệu công khai
                </span>
                <span className="flex items-center gap-1">
                  <Folder className="w-4 h-4" /> {profile.publicFolderCount} thư mục công khai
                </span>
                {profile.createdAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Tham gia {formatDate(profile.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public folders */}
        {folders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Thư mục công khai</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {folders.map(f => (
                <Link key={f.id}
                  to={f.shareToken ? `/shared/${f.shareToken}` : '#'}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ocean-50 rounded-lg flex items-center justify-center group-hover:bg-ocean-100 transition">
                      <Folder className="w-5 h-5 text-ocean-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-ocean-600 transition-colors">{f.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(f.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Public documents */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Tài liệu công khai</h2>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer select-none"
                  onDoubleClick={() => setViewingDoc(doc)}
                  title="Nhấn đúp để xem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{doc.fileName}</p>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {doc.keywords.slice(0, 5).map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{kw}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {formatFileSize(doc.fileSize)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(doc.createdAt)}</span>
                          {doc.downloadCount > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <BarChart2 className="w-3 h-3" /> {doc.downloadCount} lượt tải
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSavingDoc(doc)}
                      className="p-2 hover:bg-ocean-50 rounded-lg text-gray-500 hover:text-ocean-600 transition flex-shrink-0"
                      title="Lưu / Tải về">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-200">
              <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có tài liệu công khai nào</p>
            </div>
          )}
        </div>
      </div>

      {savingDoc && (
        <SaveToFolderModal doc={savingDoc} onClose={() => setSavingDoc(null)} />
      )}
      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default UserProfile;

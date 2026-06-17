import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import documentService from '../services/documentService';
import groupService from '../services/groupService';
import folderService from '../services/folderService';
import DocumentViewerModal from '../components/DocumentViewerModal';
import SearchBox from '../components/SearchBox';
import {
  Search as SearchIcon, FileText, File, Download, Clock, HardDrive,
  FolderOpen, AlertCircle, Tag, BarChart2, User, Users, X, Check,
  FolderPlus, Loader2, BookmarkPlus, Globe, Lock,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// ── Save to folder modal ──────────────────────────────────────────────────────

const SaveToFolderModal = ({ doc, onClose }) => {
  const toast = useToast();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null); // null = không thuộc thư mục

  useEffect(() => {
    (async () => {
      try {
        const all = await folderService.getAll();
        setFolders(all);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentService.saveToFolder(doc.id, selectedFolder);
      setSaved(true);
      setTimeout(() => onClose(true), 800);
    } catch (err) {
      toast.error('Lưu thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-ocean-500" />
            <h3 className="font-semibold text-gray-900">Lưu tài liệu</h3>
          </div>
          <button onClick={() => onClose(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 truncate">
            Lưu <strong>"{doc.title}"</strong> vào thư mục của bạn
          </p>

          {loading ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 text-ocean-500 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                  selectedFolder === null
                    ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Không thuộc thư mục nào
                </span>
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolder(f.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                    selectedFolder === f.id
                      ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" /> {f.name}
                  </span>
                </button>
              ))}
              {folders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Chưa có thư mục nào. Tạo thư mục trước trong trang Thư Mục.</p>
              )}
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
              <button onClick={() => {
                documentService.publicDownload(doc.id, doc.fileName);
                onClose(false);
              }}
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

// ── Main ───────��─────────────────────────────��────────────────────────────────

const Search = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [results, setResults] = useState([]);
  const [groupResults, setGroupResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [savingDoc, setSavingDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [suggested, setSuggested] = useState([]);

  // Auto-search khi mở từ header (có ?q=)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams]);

  // Gợi ý tài liệu PUBLIC mới nhất (hiển thị khi chưa tìm kiếm)
  useEffect(() => {
    let mounted = true;
    documentService.latestPublic(12)
      .then((docs) => mounted && setSuggested(Array.isArray(docs) ? docs : []))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const doSearch = async (keyword) => {
    try {
      setLoading(true);
      setSearched(true);
      const [docs, groups] = await Promise.all([
        documentService.search(keyword),
        groupService.searchGroups(keyword),
      ]);
      setResults(docs);
      setGroupResults(groups);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toUpperCase()) {
      case 'PDF': return <File className="w-6 h-6 text-red-500" />;
      case 'DOCX':
      case 'DOC': return <FileText className="w-6 h-6 text-blue-500" />;
      default: return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (ds) =>
    ds ? new Date(ds).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tim Kiem</h1>
          <p className="text-gray-600">Tim kiem tai lieu va nhom</p>
        </div>

        <SearchBox
          variant="page"
          initialValue={query}
          placeholder="Nhập từ khóa tìm kiếm..."
          onSubmit={(kw) => { setQuery(kw); doSearch(kw); }}
        />

        {/* Tabs */}
        {searched && !loading && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs mx-auto">
            {[
              { key: 'documents', label: `Tai lieu (${results.length})`, icon: FileText },
              { key: 'groups', label: `Nhom (${groupResults.length})`, icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    activeTab === tab.key ? 'bg-white text-ocean-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600" />
          </div>
        ) : searched ? (
          (results.length > 0 || groupResults.length > 0) ? (
            <div className="space-y-6">

              {/* ── Tab nhóm ── */}
              {activeTab === 'groups' && (
                groupResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupResults.map(g => (
                      <Link key={g.id} to={`/groups/${g.id}`}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition group">
                        <div className="flex items-center gap-3">
                          {g.avatarUrl ? (
                            <img src={g.avatarUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">{g.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              {g.visibility === 'PUBLIC'
                                ? <span className="flex items-center gap-0.5 text-green-600"><Globe className="w-3 h-3" /> Cong khai</span>
                                : <span className="flex items-center gap-0.5 text-gray-500"><Lock className="w-3 h-3" /> Rieng tu</span>}
                              <span>{g.memberCount} thanh vien</span>
                              {g.isMember && <span className="text-ocean-600 font-medium">Thanh vien</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-200">
                    <Users className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Khong co nhom nao khop voi "{query}"</p>
                  </div>
                )
              )}

              {/* ── Tab tài liệu ── */}
              {activeTab === 'documents' && (
              <div className="space-y-4">
              <p className="text-gray-600">
                {results.length} tai lieu
                {' '}cho "{query}"
              </p>

              <div className="space-y-3">
                {results.map((doc) => (
                  <div key={doc.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition cursor-pointer select-none"
                    onDoubleClick={() => setViewingDoc(doc)}
                    title="Nhấn đúp để xem">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                          <p className="text-sm text-gray-500 truncate">{doc.fileName}</p>

                          {doc.summary && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.summary}</p>
                          )}

                          {doc.keywords && doc.keywords.length > 0 && (
                            <div className="flex items-center flex-wrap gap-1.5 mt-2">
                              <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {doc.keywords.slice(0, 6).map((kw, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  kw.toLowerCase().includes(query.toLowerCase())
                                    ? 'bg-ocean-100 text-ocean-700 border border-ocean-200'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Owner + group + meta */}
                          <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-gray-400">
                            {doc.userName && (
                              <Link to={`/users/${doc.userId}`}
                                className="flex items-center gap-1 text-ocean-600 hover:underline">
                                <User className="w-3 h-3" /> {doc.userName}
                              </Link>
                            )}
                            {doc.groupName && (
                              <Link to={`/groups/${doc.groupId}`}
                                className="flex items-center gap-1 text-purple-600 hover:underline">
                                <Users className="w-3 h-3" /> {doc.groupName}
                              </Link>
                            )}
                            {doc.folderName && (
                              <span className="flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" /> {doc.folderName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" /> {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatDate(doc.createdAt)}
                            </span>
                            {doc.downloadCount > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <BarChart2 className="w-3 h-3" /> {doc.downloadCount} lượt tải
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => setSavingDoc(doc)}
                          className="p-2 hover:bg-ocean-50 rounded-lg text-gray-500 hover:text-ocean-600 transition"
                          title="Tai ve">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </div>
              )}
              </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-gray-500">Không có kết quả nào khớp với từ khóa "{query}"</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-ocean-600" />
              <h2 className="text-lg font-semibold text-gray-900">Gợi ý tài liệu</h2>
              <span className="text-sm text-gray-400">— tài liệu công khai mới nhất</span>
            </div>

            {suggested.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có tài liệu công khai</h3>
                <p className="text-gray-500">Nhập từ khóa để tìm kiếm tài liệu theo tiêu đề, từ khóa hoặc nội dung</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggested.map((doc) => (
                  <div key={doc.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-ocean-200 transition cursor-pointer select-none flex flex-col"
                    onDoubleClick={() => setViewingDoc(doc)}
                    title="Nhấn đúp để xem">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                        {doc.summary && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.summary}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 text-xs text-gray-400">
                      <span className="flex items-center gap-1 min-w-0">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{doc.userName}</span>
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(doc.createdAt)}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSavingDoc(doc); }}
                          className="p-1 hover:bg-ocean-50 rounded text-gray-500 hover:text-ocean-600 transition" title="Tải về / Lưu">
                          <Download className="w-4 h-4" />
                        </button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-ocean-50 rounded-xl p-6 border border-ocean-100">
          <h3 className="font-semibold text-ocean-800 mb-3">Mẹo tìm kiếm</h3>
          <ul className="space-y-2 text-sm text-ocean-700">
            <li>- Kết quả xếp hạng theo mức độ liên quan: <strong>tiêu đề &gt; từ khóa &gt; nội dung</strong></li>
            <li>- Sử dụng từ khóa ngắn gọn và cụ thể để có kết quả chính x��c hơn</li>
            <li>- Tìm kiếm trong nội dung tài liệu PDF, DOCX tự động</li>
          </ul>
        </div>
      </div>

      {savingDoc && (
        <SaveToFolderModal doc={savingDoc} onClose={() => setSavingDoc(null)} />
      )}
      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default Search;

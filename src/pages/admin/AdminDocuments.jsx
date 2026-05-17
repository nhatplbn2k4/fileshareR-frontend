import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileText,
  Eye,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const FileTypeBadge = ({ type }) => {
  const colors = {
    PDF: 'bg-red-100 text-red-700',
    DOCX: 'bg-blue-100 text-blue-700',
    TXT: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
      {type || '-'}
    </span>
  );
};

const VisibilityBadge = ({ v }) => {
  const map = {
    PRIVATE: { cls: 'bg-gray-100 text-gray-700', label: 'Riêng tư' },
    PUBLIC: { cls: 'bg-emerald-100 text-emerald-700', label: 'Công khai' },
    SHARED: { cls: 'bg-amber-100 text-amber-700', label: 'Đã chia sẻ' },
  };
  const cfg = map[v] || { cls: 'bg-gray-100 text-gray-700', label: v };
  return <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
};

const ConfirmDeleteModal = ({ open, doc, onCancel, onConfirm, busy }) => {
  if (!open || !doc) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Xoá tài liệu?</h3>
        <p className="text-sm text-gray-700 mb-1">
          Sẽ xoá file vật lý + record DB của: <strong className="font-semibold">{doc.title}</strong>
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Chủ sở hữu: {doc.ownerEmail}. Quota của user/nhóm sẽ được giảm tương ứng. Hành động không hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={busy} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? 'Đang xoá...' : 'Xoá vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDocuments = () => {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [visibility, setVisibility] = useState('');

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [searchDraft, setSearchDraft] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchDraft); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listDocuments({
        search: search || undefined,
        fileType: fileType || undefined,
        visibility: visibility || undefined,
        page,
        size,
      });
      setDocs(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [search, fileType, visibility, page]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await adminService.deleteDocument(deleting.id);
      setDocs((prev) => prev.filter((d) => d.id !== deleting.id));
      setTotalElements((n) => Math.max(0, n - 1));
      toast.success('Đã xoá tài liệu');
      setDeleting(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại');
    } finally {
      setDeletingBusy(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const max = 5;
    const start = Math.max(0, Math.min(page - 2, totalPages - max));
    const end = Math.min(totalPages, start + max);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tài Liệu</h1>
          <p className="text-gray-600 mt-1">Xem toàn bộ tài liệu trên hệ thống, xoá nội dung không phù hợp</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên tài liệu / file / email chủ sở hữu..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select value={fileType} onChange={(e) => { setFileType(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Tất cả loại file</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="TXT">TXT</option>
          </select>
          <select value={visibility} onChange={(e) => { setVisibility(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Tất cả visibility</option>
            <option value="PRIVATE">Riêng tư</option>
            <option value="PUBLIC">Công khai</option>
            <option value="SHARED">Đã chia sẻ</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Tài liệu</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Kích thước</th>
                <th className="px-4 py-3">Tải</th>
                <th className="px-4 py-3">Chủ sở hữu</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </td>
                </tr>
              )}
              {!loading && docs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    Không tìm thấy tài liệu nào khớp bộ lọc
                  </td>
                </tr>
              )}
              {!loading && docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate" title={d.title}>{d.title}</p>
                        <p className="text-xs text-gray-500 truncate" title={d.fileName}>{d.fileName}</p>
                        {d.groupName && (
                          <p className="text-xs text-purple-600 truncate">Nhóm: {d.groupName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><FileTypeBadge type={d.fileType} /></td>
                  <td className="px-4 py-3"><VisibilityBadge v={d.visibility} /></td>
                  <td className="px-4 py-3 text-gray-600">{formatBytes(d.fileSize)}</td>
                  <td className="px-4 py-3 text-gray-600">{d.downloadCount || 0}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-xs">{d.ownerFullName}</p>
                    <p className="text-xs text-gray-500">{d.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {d.ownerId && (
                        <Link
                          to={`/users/${d.ownerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                          title="Xem profile chủ sở hữu"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => setDeleting(d)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                        title="Xoá tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Trang {page + 1} / {totalPages} ({totalElements} tài liệu)
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded text-sm ${n === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-200 text-gray-700'}`}>
                  {n + 1}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleting}
        doc={deleting}
        busy={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminDocuments;

import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import documentService from '../services/documentService';
import folderService from '../services/folderService';
import DocumentViewerModal from '../components/DocumentViewerModal';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  File,
  FileImage,
  X,
  FolderOpen,
  Clock,
  HardDrive,
  BarChart2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [viewingDoc, setViewingDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const toast = useToast();

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedFolder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsData, foldersData] = await Promise.all([
        selectedFolder
          ? documentService.getByFolder(selectedFolder)
          : documentService.getAll(),
        folderService.getAll(),
      ]);
      setDocuments(docsData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const title = prompt('Nhập tiêu đề tài liệu:', file.name.replace(/\.[^/.]+$/, ''));
    if (!title) return;

    try {
      setUploadLoading(true);
      await documentService.upload(file, title, selectedFolder, 'PRIVATE');
      await fetchData();
      toast.success('Upload thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentService.download(doc.id, doc.fileName);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Tải xuống thất bại');
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Bạn có chắc muốn xóa "${doc.title}"?`)) return;

    try {
      await documentService.delete(doc.id);
      await fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Xóa thất bại');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    try {
      setLoading(true);
      const results = await documentService.search(searchQuery);
      setDocuments(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toUpperCase()) {
      case 'PDF':
        return <File className="w-8 h-8 text-red-500" />;
      case 'DOCX':
      case 'DOC':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'TXT':
        return <FileText className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tài Liệu</h1>
            <p className="text-gray-600 mt-1">Quản lý và tổ chức tài liệu của bạn</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white rounded-lg hover:from-ocean-600 hover:to-ocean-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {uploadLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>{uploadLoading ? 'Đang tải...' : 'Tải Lên'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              />
            </div>

            {/* Folder filter */}
            <select
              value={selectedFolder || ''}
              onChange={(e) => setSelectedFolder(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            >
              <option value="">Tất cả thư mục</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-ocean-600' : 'text-gray-500'
                  }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-ocean-600' : 'text-gray-500'
                  }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Documents */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có tài liệu nào</h3>
            <p className="text-gray-500 mb-4">Bắt đầu bằng cách tải lên tài liệu đầu tiên</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-ocean-500 text-white rounded-lg hover:bg-ocean-600 transition-colors"
            >
              Tải Lên Tài Liệu
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group cursor-pointer select-none"
                onDoubleClick={() => setViewingDoc(doc)}
                title="Nhấn đúp để xem"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(showMenu === doc.id ? null : doc.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    {showMenu === doc.id && (
                      <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            handleDownload(doc);
                            setShowMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải xuống</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(doc);
                            setShowMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 truncate mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-500 truncate mb-2">{doc.fileName}</p>

                {doc.summary && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2" title={doc.summary}>
                    {doc.summary}
                  </p>
                )}

                {doc.keywords && doc.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.keywords.slice(0, 3).map((keyword, index) => (
                      <span key={index} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> {formatFileSize(doc.fileSize)}
                  </span>
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <BarChart2 className="w-3 h-3" /> {doc.downloadCount || 0} lượt tải
                  </span>
                </div>

                {doc.folderName && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="inline-flex items-center text-xs text-ocean-600 bg-ocean-50 px-2 py-1 rounded-full">
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {doc.folderName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tài liệu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Thư mục</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Kích thước</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> Lượt tải</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Ngày tạo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 cursor-pointer select-none"
                    onDoubleClick={() => setViewingDoc(doc)}
                    title="Nhấn đúp để xem"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mr-3">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="max-w-md">
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          <p className="text-sm text-gray-500">{doc.fileName}</p>
                          {doc.summary && (
                            <p className="text-xs text-gray-400 truncate mt-1" title={doc.summary}>
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {doc.folderName ? (
                        <span className="inline-flex items-center text-sm text-ocean-600">
                          <FolderOpen className="w-4 h-4 mr-1" />
                          {doc.folderName}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                        <BarChart2 className="w-3.5 h-3.5" /> {doc.downloadCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-ocean-600 transition-colors"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                          title="Xóa"
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
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng tài liệu</p>
            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">PDF</p>
            <p className="text-2xl font-bold text-red-500">
              {documents.filter((d) => d.fileType === 'PDF').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng lượt tải</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <BarChart2 className="w-5 h-5" />
              {documents.reduce((sum, d) => sum + (d.downloadCount || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng dung lượng</p>
            <p className="text-2xl font-bold text-ocean-600">
              {formatFileSize(documents.reduce((sum, d) => sum + (d.fileSize || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </MainLayout>
  );
};

export default Documents;

import api from './api';

/** Trigger download chuẩn (hiện trong download history của trình duyệt) */
const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const documentService = {
  // Upload document
  upload: async (file, title, folderId = null, visibility = 'PRIVATE') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (folderId) {
      formData.append('folderId', folderId);
    }
    formData.append('visibility', visibility);

    const response = await api.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Lấy tất cả documents
  getAll: async () => {
    const response = await api.get('/api/documents');
    return response.data;
  },

  // Lấy documents theo folder
  getByFolder: async (folderId) => {
    const response = await api.get(`/api/documents/folder/${folderId}`);
    return response.data;
  },

  // Lấy documents không có folder
  getWithoutFolder: async () => {
    const response = await api.get('/api/documents/no-folder');
    return response.data;
  },

  // Lấy chi tiết document
  getById: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}`);
    return response.data;
  },

  // Cập nhật document
  update: async (documentId, data) => {
    const response = await api.put(`/api/documents/${documentId}`, data);
    return response.data;
  },

  // Xóa document
  delete: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}`);
    return response.data;
  },

  // Download document (cho phép chọn thư mục đích nếu trình duyệt hỗ trợ)
  download: async (documentId, fileName) => {
    const response = await api.get(`/api/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    await saveBlob(new Blob([response.data]), fileName);
  },

  // Download tài liệu public (không cần auth, cho phép chọn thư mục đích)
  publicDownload: async (documentId, fileName) => {
    const response = await api.get(`/api/documents/${documentId}/public-download`, {
      responseType: 'blob',
    });
    await saveBlob(new Blob([response.data]), fileName);
  },

  // Tìm kiếm documents
  search: async (keyword) => {
    const response = await api.get('/api/documents/search', {
      params: { keyword },
    });
    return response.data;
  },

  // Gợi ý: tài liệu PUBLIC mới nhất (cho trang tìm kiếm khi chưa nhập từ khóa)
  latestPublic: async (limit = 12) => {
    const response = await api.get('/api/documents/public/latest', { params: { limit } });
    return response.data;
  },

  // Lấy danh sách tài liệu PUBLIC có nội dung liên quan (Cosine Similarity trên TF-IDF).
  // Anonymous-friendly: endpoint cho phép gọi không cần JWT cho tài liệu PUBLIC.
  getSimilar: async (documentId, limit = 5) => {
    const response = await api.get(`/api/documents/${documentId}/similar`, {
      params: { limit },
    });
    return response.data;
  },

  // Lưu tài liệu vào thư mục của mình
  saveToFolder: async (documentId, folderId = null) => {
    const params = {};
    if (folderId) params.folderId = folderId;
    const response = await api.post(`/api/documents/${documentId}/save-to-folder`, null, { params });
    return response.data;
  },

  // ── Public profile ──
  getUserProfile: async (userId) => {
    const response = await api.get(`/api/users/${userId}/profile`);
    return response.data;
  },

  getUserPublicDocuments: async (userId) => {
    const response = await api.get(`/api/users/${userId}/documents`);
    return response.data;
  },

  getUserPublicFolders: async (userId) => {
    const response = await api.get(`/api/users/${userId}/folders`);
    return response.data;
  },
};

export default documentService;

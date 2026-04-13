import api from './api';

const folderService = {
  // Tạo folder mới
  create: async (name, parentId = null, visibility = 'PUBLIC') => {
    const response = await api.post('/api/folders', { name, parentId, visibility });
    return response.data;
  },

  // Lấy tất cả folders
  getAll: async () => {
    const response = await api.get('/api/folders');
    return response.data;
  },

  // Lấy root folders
  getRootFolders: async () => {
    const response = await api.get('/api/folders/root');
    return response.data;
  },

  // Lấy subfolders
  getSubFolders: async (folderId) => {
    const response = await api.get(`/api/folders/${folderId}/subfolders`);
    return response.data;
  },

  // Lấy chi tiết folder
  getById: async (folderId) => {
    const response = await api.get(`/api/folders/${folderId}`);
    return response.data;
  },

  // Cập nhật folder
  update: async (folderId, data) => {
    const response = await api.put(`/api/folders/${folderId}`, data);
    return response.data;
  },

  // Xóa folder
  delete: async (folderId) => {
    const response = await api.delete(`/api/folders/${folderId}`);
    return response.data;
  },

  // ── Share by token ──────────────────────────────────────────────────────
  getByShareToken: async (token) => {
    const response = await api.get(`/api/folders/shared/${token}`);
    return response.data;
  },

  getDocsByShareToken: async (token) => {
    const response = await api.get(`/api/folders/shared/${token}/documents`);
    return response.data;
  },

  getSubfoldersByShareToken: async (token) => {
    const response = await api.get(`/api/folders/shared/${token}/subfolders`);
    return response.data;
  },

  rotateShareToken: async (folderId) => {
    const response = await api.post(`/api/folders/${folderId}/share/rotate`);
    return response.data;
  },
};

export default folderService;

import api from './api';

const groupService = {
  // ─── Nhóm ─────────────────────────────────────────────────────────────────

  /** Tìm nhóm PUBLIC (không cần auth) */
  searchPublicGroups: async (keyword = '') => {
    const response = await api.get('/api/groups/public', { params: { keyword } });
    return response.data;
  },

  /** Tìm nhóm: PUBLIC + PRIVATE mà user là thành viên */
  searchGroups: async (keyword = '') => {
    const response = await api.get('/api/groups/search', { params: { keyword } });
    return response.data;
  },

  /** Chi tiết nhóm */
  getById: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}`);
    return response.data;
  },

  /** Nhóm của tôi */
  getMyGroups: async () => {
    const response = await api.get('/api/groups/my');
    return response.data;
  },

  /** Tạo nhóm */
  createGroup: async (data) => {
    const response = await api.post('/api/groups', data);
    return response.data;
  },

  /** Cập nhật nhóm (OWNER) */
  updateGroup: async (groupId, data) => {
    const response = await api.put(`/api/groups/${groupId}`, data);
    return response.data;
  },

  /** Upload avatar nhóm (OWNER) */
  uploadAvatar: async (groupId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Upload ảnh bìa custom 16:9 (OWNER). file = Blob từ cropper. */
  uploadCover: async (groupId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/groups/${groupId}/cover/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { coverImageUrl }
  },

  /** Set cover từ preset (OWNER) */
  setCoverPreset: async (groupId, presetId) => {
    const response = await api.patch(`/api/groups/${groupId}/cover`, null, { params: { presetId } });
    return response.data; // GroupResponse
  },

  /** List active cover presets (user picker) */
  listCoverPresets: async () => {
    const response = await api.get('/api/group-cover-presets');
    return response.data;
  },

  /** Xóa nhóm (OWNER) */
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/api/groups/${groupId}`);
    return response.data;
  },

  /** Tham gia nhóm PUBLIC */
  joinGroup: async (groupId) => {
    const response = await api.post(`/api/groups/${groupId}/join`);
    return response.data;
  },

  /** Rời nhóm */
  leaveGroup: async (groupId) => {
    const response = await api.delete(`/api/groups/${groupId}/leave`);
    return response.data;
  },

  // ─── Thành viên ───────────────────────────────────────────────────────────

  /** Danh sách thành viên */
  getMembers: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/members`);
    return response.data;
  },

  /** Cấp / thu hồi ADMIN (OWNER) */
  setAdmin: async (groupId, userId, isAdmin) => {
    const response = await api.post(`/api/groups/${groupId}/admin`, { userId, isAdmin });
    return response.data;
  },

  // ─── Ban ──────────────────────────────────────────────────────────────────

  /** Ban thành viên (ADMIN/OWNER) */
  banMember: async (groupId, data) => {
    // data = { userId, banType, reason }
    const response = await api.post(`/api/groups/${groupId}/ban`, data);
    return response.data;
  },

  /** Gỡ ban (ADMIN/OWNER) */
  unbanMember: async (groupId, targetUserId) => {
    const response = await api.delete(`/api/groups/${groupId}/ban/${targetUserId}`);
    return response.data;
  },

  /** Danh sách ban (ADMIN/OWNER) */
  getBans: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/bans`);
    return response.data;
  },

  // ─── Tài liệu nhóm ────────────────────────────────────────────────────────

  /** Lấy tài liệu nhóm. folderId=undefined → tất cả, folderId=-1 → không có folder */
  getDocuments: async (groupId, folderId = undefined) => {
    const params = {};
    if (folderId !== undefined) params.folderId = folderId;
    const response = await api.get(`/api/groups/${groupId}/documents`, { params });
    return response.data;
  },

  /** Upload tài liệu vào nhóm */
  uploadDocument: async (groupId, file, title, groupFolderId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (groupFolderId) formData.append('groupFolderId', groupFolderId);
    formData.append('visibility', 'PUBLIC');

    const response = await api.post(`/api/groups/${groupId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Tải tài liệu nhóm */
  downloadDocument: async (groupId, documentId, fileName) => {
    const response = await api.get(
      `/api/groups/${groupId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  },

  /** Xóa tài liệu nhóm */
  deleteDocument: async (groupId, documentId) => {
    const response = await api.delete(`/api/groups/${groupId}/documents/${documentId}`);
    return response.data;
  },

  // ─── Kiểm duyệt tài liệu (ADMIN/OWNER) ────────────────────────────────────

  /** Danh sách tài liệu đang chờ duyệt */
  getPendingDocuments: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/documents/pending`);
    return response.data;
  },

  /** Số lượng tài liệu đang chờ duyệt (cho badge) */
  countPendingDocuments: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/documents/pending/count`);
    return response.data.count;
  },

  /** Duyệt tài liệu */
  approveDocument: async (groupId, documentId) => {
    const response = await api.post(`/api/groups/${groupId}/documents/${documentId}/approve`);
    return response.data;
  },

  /** Từ chối tài liệu */
  rejectDocument: async (groupId, documentId, reason = '') => {
    const response = await api.post(`/api/groups/${groupId}/documents/${documentId}/reject`, { reason });
    return response.data;
  },

  // ─── Thư mục nhóm ─────────────────────────────────────────────────────────

  /** Danh sách thư mục nhóm */
  getFolders: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/folders`);
    return response.data;
  },

  /** Thư mục gốc */
  getRootFolders: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/folders/root`);
    return response.data;
  },

  /** Thư mục con của một folder */
  getSubFolders: async (groupId, folderId) => {
    const response = await api.get(`/api/groups/${groupId}/folders/${folderId}/subfolders`);
    return response.data;
  },

  /** Tạo thư mục (ADMIN/OWNER) */
  createFolder: async (groupId, data) => {
    const response = await api.post(`/api/groups/${groupId}/folders`, data);
    return response.data;
  },

  /** Xóa thư mục (ADMIN/OWNER) */
  deleteFolder: async (groupId, folderId) => {
    const response = await api.delete(`/api/groups/${groupId}/folders/${folderId}`);
    return response.data;
  },

  // ─── Share by token ───────────────────────────────────────────────────────

  /** Lấy landing info nhóm qua invite token (public) */
  getLandingByShareToken: async (token) => {
    const response = await api.get(`/api/groups/shared/${token}`);
    return response.data;
  },

  /** Join nhóm qua invite token (cần login) */
  joinByShareToken: async (token) => {
    const response = await api.post(`/api/groups/shared/${token}/join`);
    return response.data;
  },

  /** Xem group folder qua share token (public, chỉ group PUBLIC) */
  getGroupFolderByShareToken: async (token) => {
    const response = await api.get(`/api/groups/folders/shared/${token}`);
    return response.data;
  },

  /** Sub-folders của group folder share */
  getGroupFolderSubfoldersByShareToken: async (token) => {
    const response = await api.get(`/api/groups/folders/shared/${token}/subfolders`);
    return response.data;
  },

  /** Documents của group folder share */
  getGroupFolderDocumentsByShareToken: async (token) => {
    const response = await api.get(`/api/groups/folders/shared/${token}/documents`);
    return response.data;
  },

  // ─── Join requests + Transfer ─────────────────────────────────────────────

  submitJoinRequest: async (groupId, answers = null) => {
    const response = await api.post(`/api/groups/${groupId}/join-request`, { answers });
    return response.data;
  },

  submitJoinRequestByToken: async (token, answers = null) => {
    const response = await api.post(`/api/groups/shared/${token}/join-request`, { answers });
    return response.data;
  },

  getPendingRequests: async (groupId) => {
    const response = await api.get(`/api/groups/${groupId}/join-requests`);
    return response.data;
  },

  approveRequest: async (groupId, requestId) => {
    const response = await api.post(`/api/groups/${groupId}/join-requests/${requestId}/approve`);
    return response.data;
  },

  rejectRequest: async (groupId, requestId) => {
    const response = await api.post(`/api/groups/${groupId}/join-requests/${requestId}/reject`);
    return response.data;
  },

  transferOwnership: async (groupId, newOwnerId) => {
    const response = await api.post(`/api/groups/${groupId}/transfer-ownership`, { newOwnerId });
    return response.data;
  },

  /** Rotate share token của group folder (ADMIN/OWNER) */
  rotateGroupFolderShareToken: async (folderId) => {
    const response = await api.post(`/api/groups/folders/${folderId}/share/rotate`);
    return response.data;
  },
};

export default groupService;

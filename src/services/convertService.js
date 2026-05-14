import api from './api';

const convertService = {
  getCurrentEngine: async () => {
    const res = await api.get('/api/convert/engine');
    return res.data;
  },

  // Upload file → download DOCX (blob)
  convertUploadDownload: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/convert/pdf-to-word/upload', formData, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  },

  // Upload file → lưu vào folder
  convertUploadSave: async (file, folderId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    const res = await api.post('/api/convert/pdf-to-word/upload/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Document có sẵn → download DOCX
  convertDocumentDownload: async (documentId) => {
    const res = await api.post(`/api/convert/pdf-to-word/document/${documentId}`, null, {
      responseType: 'blob',
    });
    return res.data;
  },

  // Document có sẵn → lưu vào folder
  convertDocumentSave: async (documentId, folderId) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    const res = await api.post(
      `/api/convert/pdf-to-word/document/${documentId}/save${params.toString() ? `?${params}` : ''}`
    );
    return res.data;
  },
};

export default convertService;

import api from './api';

const coverPresetAdminService = {
  listAll: async () => {
    const response = await api.get('/api/admin/group-cover-presets');
    return response.data;
  },

  create: async (name, file) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    const response = await api.post('/api/admin/group-cover-presets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id, patch) => {
    const response = await api.patch(`/api/admin/group-cover-presets/${id}`, patch);
    return response.data;
  },

  remove: async (id) => {
    await api.delete(`/api/admin/group-cover-presets/${id}`);
  },
};

export default coverPresetAdminService;

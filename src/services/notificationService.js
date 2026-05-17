import api from './api';

const notificationService = {
  list: async ({ page = 0, size = 20 } = {}) => {
    const res = await api.get('/api/notifications', { params: { page, size } });
    return res.data;
  },

  listUnread: async () => {
    const res = await api.get('/api/notifications/unread');
    return res.data;
  },

  unreadCount: async () => {
    const res = await api.get('/api/notifications/unread-count');
    return res.data.count;
  },

  markAsRead: async (id) => {
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.patch('/api/notifications/read-all');
    return res.data;
  },

  remove: async (id) => {
    await api.delete(`/api/notifications/${id}`);
  },
};

export default notificationService;

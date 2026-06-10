import api from './api';

const searchService = {
  /** Lịch sử tìm kiếm gần đây → [{ id, keyword }] */
  getHistory: async () => {
    const res = await api.get('/api/search/history');
    return res.data;
  },

  /** Xóa 1 mục lịch sử theo id */
  deleteHistoryItem: async (id) => {
    await api.delete(`/api/search/history/${id}`);
  },

  /** Xóa toàn bộ lịch sử */
  clearHistory: async () => {
    await api.delete('/api/search/history');
  },

  /** Gợi ý autocomplete khi gõ → [{ text, type }] (type: DOCUMENT | GROUP) */
  suggest: async (q) => {
    const res = await api.get('/api/search/suggest', { params: { q } });
    return res.data;
  },
};

export default searchService;

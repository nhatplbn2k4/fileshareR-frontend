import api from './api';

const plagiarismService = {
  /**
   * List reports (group by suspected doc). Pageable.
   * @param {Object} params { status, page, size }
   */
  list: async ({ status = 'PENDING', page = 0, size = 20 } = {}) => {
    const res = await api.get('/api/admin/plagiarism', {
      params: { status, page, size, sort: 'maxScore,desc' },
    });
    return res.data;
  },

  /** Chi tiết 1 report = 1 suspected doc + matches. */
  getDetail: async (docId) => {
    const res = await api.get(`/api/admin/plagiarism/${docId}`);
    return res.data;
  },

  /** Admin xử lý: action ∈ KEEP | REMOVE | PRIVATIZE | IGNORE. */
  resolve: async (docId, action, note) => {
    const res = await api.patch(`/api/admin/plagiarism/${docId}/resolve`, { action, note });
    return res.data;
  },

  /** Số report PENDING — dùng cho badge sidebar. */
  pendingCount: async () => {
    const res = await api.get('/api/admin/plagiarism/pending-count');
    return res.data.count;
  },
};

export default plagiarismService;

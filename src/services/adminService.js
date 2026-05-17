import api from './api';

const adminService = {
  /**
   * Dashboard stats. Backend enforces hasRole('ADMIN') — non-admin callers
   * get 403, which the protected route should prevent anyway.
   */
  getStats: async () => {
    const res = await api.get('/api/admin/stats');
    return res.data;
  },

  /**
   * Chart datasets — signups + revenue (daily 30d + monthly 12mo),
   * documents-by-type, payments-by-status, users-by-plan.
   */
  getCharts: async () => {
    const res = await api.get('/api/admin/stats/charts');
    return res.data;
  },
};

export default adminService;

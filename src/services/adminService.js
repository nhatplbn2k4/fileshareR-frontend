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

  // ── User management ──────────────────────────────────────────────────
  listUsers: async ({ search, planCode, isActive, page = 0, size = 20, sort = 'createdAt,desc' } = {}) => {
    const params = { page, size, sort };
    if (search) params.search = search;
    if (planCode) params.planCode = planCode;
    if (isActive !== undefined && isActive !== null && isActive !== '') params.isActive = isActive;
    const res = await api.get('/api/admin/users', { params });
    return res.data;
  },

  getUser: async (userId) => {
    const res = await api.get(`/api/admin/users/${userId}`);
    return res.data;
  },

  updateUser: async (userId, payload) => {
    const res = await api.patch(`/api/admin/users/${userId}`, payload);
    return res.data;
  },

  // ── Plans CRUD ───────────────────────────────────────────────────────
  listPlans: async () => {
    const res = await api.get('/api/admin/plans');
    return res.data;
  },
  createPlan: async (payload) => {
    const res = await api.post('/api/admin/plans', payload);
    return res.data;
  },
  updatePlan: async (id, payload) => {
    const res = await api.patch(`/api/admin/plans/${id}`, payload);
    return res.data;
  },
  deletePlan: async (id) => {
    await api.delete(`/api/admin/plans/${id}`);
  },

  // ── Addons CRUD ──────────────────────────────────────────────────────
  listAddons: async () => {
    const res = await api.get('/api/admin/addons');
    return res.data;
  },
  createAddon: async (payload) => {
    const res = await api.post('/api/admin/addons', payload);
    return res.data;
  },
  updateAddon: async (id, payload) => {
    const res = await api.patch(`/api/admin/addons/${id}`, payload);
    return res.data;
  },
  deleteAddon: async (id) => {
    await api.delete(`/api/admin/addons/${id}`);
  },
};

export default adminService;

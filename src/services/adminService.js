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

  // ── Documents ───────────────────────────────────────────────────────
  listDocuments: async ({ search, fileType, visibility, userId, page = 0, size = 20, sort = 'createdAt,desc' } = {}) => {
    const params = { page, size, sort };
    if (search) params.search = search;
    if (fileType) params.fileType = fileType;
    if (visibility) params.visibility = visibility;
    if (userId) params.userId = userId;
    const res = await api.get('/api/admin/documents', { params });
    return res.data;
  },
  deleteDocument: async (id) => {
    await api.delete(`/api/admin/documents/${id}`);
  },

  // ── Payments ───────────────────────────────────────────────────────
  listPayments: async ({ search, provider, status, page = 0, size = 20, sort = 'createdAt,desc' } = {}) => {
    const params = { page, size, sort };
    if (search) params.search = search;
    if (provider) params.provider = provider;
    if (status) params.status = status;
    const res = await api.get('/api/admin/payments', { params });
    return res.data;
  },
  getPayment: async (id) => {
    const res = await api.get(`/api/admin/payments/${id}`);
    return res.data;
  },

  // ── Groups ───────────────────────────────────────────────────────────
  listGroups: async ({ search, visibility, page = 0, size = 20, sort = 'createdAt,desc' } = {}) => {
    const params = { page, size, sort };
    if (search) params.search = search;
    if (visibility) params.visibility = visibility;
    const res = await api.get('/api/admin/groups', { params });
    return res.data;
  },
  deleteGroup: async (id) => {
    await api.delete(`/api/admin/groups/${id}`);
  },
};

export default adminService;

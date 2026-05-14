import api from './api';

const billingService = {
  // Lookup
  listPlans: async () => {
    const res = await api.get('/api/plans');
    return res.data;
  },
  listAddons: async () => {
    const res = await api.get('/api/storage-addons');
    return res.data;
  },

  // User
  getMyStorage: async () => {
    const res = await api.get('/api/users/me/storage');
    return res.data;
  },
  upgradeUserPlan: async (planCode) => {
    const res = await api.post('/api/users/me/upgrade-plan', { planCode });
    return res.data;
  },
  purchaseUserAddon: async (addonCode) => {
    const res = await api.post('/api/users/me/purchase-addon', { addonCode });
    return res.data;
  },

  // Group
  getGroupStorage: async (groupId) => {
    const res = await api.get(`/api/groups/${groupId}/storage`);
    return res.data;
  },
  upgradeGroupPlan: async (groupId, planCode) => {
    const res = await api.post(`/api/groups/${groupId}/upgrade-plan`, { planCode });
    return res.data;
  },
  purchaseGroupAddon: async (groupId, addonCode) => {
    const res = await api.post(`/api/groups/${groupId}/purchase-addon`, { addonCode });
    return res.data;
  },
};

export default billingService;

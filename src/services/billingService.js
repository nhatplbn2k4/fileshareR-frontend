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

  // Storage info
  getMyStorage: async () => {
    const res = await api.get('/api/users/me/storage');
    return res.data;
  },
  getGroupStorage: async (groupId) => {
    const res = await api.get(`/api/groups/${groupId}/storage`);
    return res.data;
  },

  /**
   * Initiate a payment for plan upgrade or addon purchase.
   *
   * @param {Object} params
   * @param {'VNPAY'|'MOMO'} params.provider
   * @param {'PLAN'|'ADDON'} params.purchaseType
   * @param {'USER'|'GROUP'} params.scope
   * @param {string} [params.planCode]   required when purchaseType=PLAN
   * @param {string} [params.addonCode]  required when purchaseType=ADDON
   * @param {number} [params.groupId]    required when scope=GROUP
   * @returns {Promise<{paymentId:number, txnRef:string, provider:string, amountVnd:number, redirectUrl:string}>}
   */
  initiatePayment: async (params) => {
    const res = await api.post('/api/payments/initiate', params);
    return res.data;
  },
};

export default billingService;

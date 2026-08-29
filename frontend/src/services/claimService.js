import api from './api';

export const claimService = {
  createClaim: async (claimData) => {
    const res = await api.post('/claims', claimData);
    return res.data;
  },

  getClaims: async (params = {}) => {
    const res = await api.get('/claims', { params });
    return res.data;
  },

  getClaimById: async (id) => {
    const res = await api.get(`/claims/${id}`);
    return res.data;
  },

  updateClaimStatus: async (id, statusData) => {
    const res = await api.patch(`/claims/${id}/status`, statusData);
    return res.data;
  },
};

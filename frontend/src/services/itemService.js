import api from './api';

export const itemService = {
  getItems: async (params = {}) => {
    const res = await api.get('/items', { params });
    return res.data;
  },

  getItemById: async (id) => {
    const res = await api.get(`/items/${id}`);
    return res.data;
  },

  createLostItem: async (itemData) => {
    const res = await api.post('/items/lost', itemData);
    return res.data;
  },

  createFoundItem: async (itemData) => {
    const res = await api.post('/items/found', itemData);
    return res.data;
  },

  updateItem: async (id, itemData) => {
    const res = await api.put(`/items/${id}`, itemData);
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },

  getMyReports: async (params = {}) => {
    const res = await api.get('/items/user/my-reports', { params });
    return res.data;
  },

  getStatsSummary: async () => {
    const res = await api.get('/items/stats/summary');
    return res.data;
  },
};

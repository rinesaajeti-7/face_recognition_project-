import api from './api';

export const getAlerts = () => api.get('/alerts/');
export const reviewAlert = (id) => api.post(`/alerts/${id}/review`);
export const createManualAlert = (personId) => api.post(`/alerts/create/${personId}`);
export const deleteAlert = (alertId) => api.delete(`/alerts/${alertId}`);
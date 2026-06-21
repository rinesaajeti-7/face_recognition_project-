import api from './api';

export const getAlerts = () => {
  return api.get('/alerts/');
};

export const createAlert = (personId) => {
  return api.post(`/alerts/create/${personId}`);
};

export const createManualAlert = (personId) => {
  return api.post(`/alerts/create/${personId}`);
};

export const reviewAlert = (alertId) => {
  return api.put(`/alerts/${alertId}/review`);
};

export const unreviewAlert = (alertId) => {
  return api.put(`/alerts/${alertId}/unreview`);
};

export const markAsRead = (alertId) => {
  return api.put(`/alerts/${alertId}/read`);
};

export const deleteAlert = (alertId) => {
  return api.delete(`/alerts/${alertId}`);
};
// alertsService.js – shto këto

export const createPublicAlert = (title, message, priority = 'high', image_path = null) => {
  return api.post('/alerts/public', { title, message, priority, image_path });
};

export const getPublicAlerts = () => {
  return api.get('/alerts/public');
};

export const saveAlertToGallery = (alertId) => {
  return api.post(`/alerts/${alertId}/save-to-gallery`);
};

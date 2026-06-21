import api from './api';

// Use GET (if backend supports it) – this is the standard
export const getUsers = () => api.get('/admin/users');

// Use PUT with JSON body
export const updateUserRole = (userId, role) => 
  api.put(`/admin/users/${userId}/role`, { role });
import api from './api';

export const getUsers = () => api.get('/admin/users');
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, null, {
  params: { role }
});
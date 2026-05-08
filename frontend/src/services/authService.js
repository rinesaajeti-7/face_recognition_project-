import api from './api';

export const register = (email, password, fullName, role) => {
  return api.post('/auth/register', { email, password, full_name: fullName, role });
};

export const login = (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

export const changePassword = (oldPassword, newPassword) => {
  return api.post('/profile/change-password', null, {
    params: { old_password: oldPassword, new_password: newPassword }
  });
};
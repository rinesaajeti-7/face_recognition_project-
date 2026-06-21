import api from './api';

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  
  try {
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // Timeout specifik për login
    });
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      console.log('✅ Token saved successfully');
    }
    
    return response;
  } catch (error) {
    console.error('Login API error:', error.message);
    throw error;
  }
};

export const getCurrentUser = () => {
  return api.get('/auth/me');
};

export const register = (email, password, fullName, role) => {
  return api.post('/auth/register', { 
    email, 
    password, 
    full_name: fullName, 
    role 
  });
};

export const changePassword = (oldPassword, newPassword) => {
  return api.post('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword
  });
};

export const logout = () => {
  localStorage.removeItem('access_token');
  window.location.href = '/login';
};
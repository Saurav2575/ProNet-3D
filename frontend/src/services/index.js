import api from './api';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  search: (q) => api.get('/users/search', { params: { q } }),
  getSuggestions: () => api.get('/users/suggestions'),
  getUserPosts: (id) => api.get(`/users/${id}/posts`),
};

export const postAPI = {
  getPopular: () => api.get('/posts/popular'),
  getFeed: (page = 1, scope = 'all') => api.get('/posts/feed', { params: { page, scope } }),
  create: (data) => api.post('/posts', data),
  like: (id) => api.put(`/posts/${id}/like`),
  comment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
  delete: (id) => api.delete(`/posts/${id}`),
};

export const connectionAPI = {
  getAll: () => api.get('/connections'),
  getPending: () => api.get('/connections/pending'),
  getStatus: (userId) => api.get(`/connections/status/${userId}`),
  sendRequest: (userId) => api.post(`/connections/request/${userId}`),
  respond: (id, action) => api.put(`/connections/${id}/respond`, { action }),
};

export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  apply: (id, data) => api.post(`/jobs/${id}/apply`, data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  myApplications: () => api.get('/jobs/applications/mine'),
  myJobs: () => api.get('/jobs/mine'),
  applicants: (id) => api.get(`/jobs/${id}/applicants`),
  updateStatus: (id, status) => api.put(`/jobs/applications/${id}/status`, { status }),
};

export const uploadAPI = {
  image: (file, folder = 'posts') => {
    const data = new FormData(); data.append('image',file); data.append('folder',folder);
    return api.post('/uploads',data);
  },
};
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  read: id => api.put(`/notifications/${id}/read`),
  readAll: () => api.put('/notifications/read-all'),
};

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication APIs
export const loginStudent = (credentials) => api.post('/student/login', credentials);

// Student APIs
export const getStudentProfile = (id) => api.get(`/student/profile/${id}`);
export const updateStudentProfile = (data) => api.put('/student/profile', data);
export const uploadProfilePicture = (formData) => {
  return api.post('/student/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const getStudentProjects = (projectId) => api.get(`/student/projects/${projectId}`);
export const submitProgressUpdate = (projectId, data) => api.post(`/student/progress/${projectId}`, data);
export const uploadProjectFile = (projectId, formData) => {
  return api.post(`/student/upload/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Admin APIs
export const getAllStudents = () => api.get('/admin/students');
export const getStudentById = (id) => api.get(`/admin/students/${id}`);
export const createStudent = (data) => api.post('/admin/students', data);
export const recordAttendance = (studentId, data) => api.post(`/admin/attendance/${studentId}`, data);
export const getStudentCredentials = (studentId) => api.get(`/admin/student-credentials/${studentId}`);

// Project APIs
export const getAllProjects = () => api.get('/admin/projects');
export const getProjectById = (id) => api.get(`/admin/projects/${id}`);
export const createProject = (data) => api.post('/admin/projects', data);
export const updateProject = (id, data) => api.put(`/admin/projects/${id}`, data);

// Intern APIs
export const getAllInterns = () => api.get('/interns');
export const getPastInterns = () => api.get('/interns/past');
export const getInternById = (id) => api.get(`/interns/${id}`);
export const createIntern = (formData) => {
  return api.post('/interns', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateIntern = (id, formData) => {
  return api.put(`/interns/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateInternProgress = (id, data) => api.put(`/interns/${id}/progress`, data);
export const recordInternAttendance = (id, data) => api.post(`/interns/${id}/attendance`, data);
export const deleteIntern = (id) => api.delete(`/interns/${id}`);
export const updateInternCredentials = (id, data) => api.put(`/interns/${id}/credentials`, data);

export const checkApiHealth = async () => {
    const res = await api.get('/health'); // example
  };

export default api;
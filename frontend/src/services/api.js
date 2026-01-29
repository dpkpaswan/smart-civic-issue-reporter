import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Functions

// Issues API
export const issuesAPI = {
  // Get all issues with optional filters
  getAll: (params = {}) => api.get('/issues', { params }),
  
  // Get specific issue by ID
  getById: (id) => api.get(`/issues/${id}`),
  
  // Create new issue
  create: (issueData) => api.post('/issues', issueData),
  
  // Update issue status
  updateStatus: (id, status) => api.put(`/issues/${id}/status`, { status }),
  
  // Add resolution proof
  addResolution: (id, resolutionData) => api.post(`/issues/${id}/resolution`, resolutionData),
  
  // Delete issue (for testing)
  delete: (id) => api.delete(`/issues/${id}`),
};

// Authentication API
export const authAPI = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Verify token
  verify: () => api.get('/auth/verify'),
};

// Upload API
export const uploadAPI = {
  // Upload single image
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload multiple images
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete uploaded file
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
  
  // List all uploaded files
  listFiles: () => api.get('/upload/list'),
};

// Utility functions
export const apiUtils = {
  // Health check
  healthCheck: () => api.get('/health'),
  
  // Get full image URL
  getImageUrl: (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL.replace('/api', '')}${imagePath}`;
  },
  
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
      return {
        type: 'server',
        status: error.response.status,
        message: message,
      };
    } else if (error.request) {
      // Network error
      return {
        type: 'network',
        message: 'Unable to connect to server. Please check your internet connection.',
      };
    } else {
      // Other error
      return {
        type: 'client',
        message: error.message || 'An unexpected error occurred',
      };
    }
  },
};

// Mock data for development/testing
export const mockData = {
  sampleIssue: {
    citizenName: 'John Doe',
    citizenEmail: 'john@example.com',
    category: 'pothole',
    description: 'Large pothole on Main Street causing traffic issues',
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: 'Main Street, New York, NY'
    },
    images: []
  }
};

export default api;
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Functions

// Issues API
export const issuesApi = {
  // Get all issues with optional filtering
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters.citizenEmail) {
        params.append('citizenEmail', filters.citizenEmail);
      }
      
      const response = await apiClient.get(`/issues?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch issues');
    }
  },

  // Get single issue by ID
  getById: async (issueId) => {
    try {
      const response = await apiClient.get(`/issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching issue ${issueId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch issue details');
    }
  },

  // Create new issue
  create: async (issueData) => {
    try {
      const response = await apiClient.post('/issues', issueData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error(error.response?.data?.message || 'Failed to create issue');
    }
  },

  // Update issue status
  updateStatus: async (issueId, status, notes = '') => {
    try {
      const response = await apiClient.patch(`/issues/${issueId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating issue ${issueId} status:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update issue status');
    }
  },

  // Update issue priority
  updatePriority: async (issueId, priority) => {
    try {
      const response = await apiClient.patch(`/issues/${issueId}/priority`, {
        priority
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating issue ${issueId} priority:`, error);
      throw new Error(error.response?.data?.message || 'Failed to update issue priority');
    }
  },

  // Add assignment to issue
  assignIssue: async (issueId, assigneeData) => {
    try {
      const response = await apiClient.patch(`/issues/${issueId}/assign`, assigneeData);
      return response.data;
    } catch (error) {
      console.error(`Error assigning issue ${issueId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to assign issue');
    }
  }
};

// Upload API
export const uploadApi = {
  // Upload single image
  uploadImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  },

  // Upload multiple images
  uploadImages: async (imageFiles) => {
    try {
      const formData = new FormData();
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await apiClient.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload images');
    }
  }
};

// Auth API (if needed in future)
export const authApi = {
  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local logout even if server request fails
      localStorage.removeItem('auth_token');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user info');
    }
  }
};

// Health check
export const healthApi = {
  check: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend service is unavailable');
    }
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      details: error.response.data
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error: Unable to connect to server',
      status: 0,
      details: error.request
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
      details: error
    };
  }
};

export default apiClient;
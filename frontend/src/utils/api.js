import axios from 'axios';

// API Configuration
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Backend base URL (without /api) for serving static files like uploaded images
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Resolve an image URL to point to the correct backend server.
 * Handles:
 * - Relative paths like /uploads/file.jpg
 * - Old hardcoded http://localhost:5000/uploads/file.jpg
 * - Already-correct full URLs
 * - null/undefined/empty
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  
  // Already a valid external URL (Unsplash, Cloudinary, blob, data, etc.)
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('https://images.unsplash.com')) {
    return url;
  }
  
  // Relative path like /uploads/filename.jpg
  if (url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  
  // Hardcoded localhost URL — extract the path and re-base it
  const uploadsMatch = url.match(/https?:\/\/[^/]+(\/uploads\/.+)$/);
  if (uploadsMatch) {
    return `${BACKEND_BASE_URL}${uploadsMatch[1]}`;
  }
  
  // Return as-is (fully qualified external URL or unknown format)
  return url;
};

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
      // Don't redirect for auth-check calls — let AuthContext handle those
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/me')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/authority-login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API client — identical to apiClient but NEVER sends auth tokens.
// Used for public-facing pages (transparency dashboard) so the backend
// returns ALL issues instead of filtering by the logged-in user's department.
const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// API Service Functions

// Issues API
export const issuesApi = {
  // Get all issues with optional filtering (uses auth token → department-scoped)
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

  // Get ALL issues for public transparency — never sends auth token
  getPublic: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);

      const response = await publicApiClient.get(`/issues/public?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public issues:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch public issues');
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

  // Create new issue (longer timeout — AI classification + Gemini image check)
  create: async (issueData) => {
    try {
      const response = await apiClient.post('/issues', issueData, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error(error.response?.data?.message || 'Failed to create issue');
    }
  },

  // Update issue status
  updateStatus: async (issueId, status, notes = '', resolutionImages = []) => {
    try {
      const body = { status };
      if (notes) body.resolutionNotes = notes;
      if (resolutionImages && resolutionImages.length > 0) body.resolutionImages = resolutionImages;

      const response = await apiClient.patch(`/issues/${issueId}/status`, body);
      return response.data;
    } catch (error) {
      console.error(`Error updating issue ${issueId} status:`, error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to update issue status';
      throw new Error(msg);
    }
  },

  // Get success stories (resolved issues with before/after images)
  getSuccessStories: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/issues/success-stories?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching success stories:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch success stories');
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
  },

  // Upload single image with AI classification
  uploadAndClassifyImage: async (imageFile, userCategory = null) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (userCategory) {
        formData.append('category', userCategory);
      }

      const response = await apiClient.post('/upload/classify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000 // Extended timeout for AI processing
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading and classifying image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload and classify image');
    }
  }
};

// Auth API (if needed in future)
export const authApi = {
  // Login
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      // Token is nested inside response.data.data.token (axios wraps in .data, then API wraps in .data)
      const token = response.data?.data?.token || response.data?.token;
      if (token) {
        localStorage.setItem('auth_token', token);
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
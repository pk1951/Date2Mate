// Base API configuration - use environment variable or default to production URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://date2mate.onrender.com';

// Ensure API_BASE_URL doesn't end with a slash
const BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

console.log('Using API base URL:', BASE_URL); // Debug log

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;
  
  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  // Configure request options
  const requestOptions = {
    ...options,
    headers,
    credentials: 'include',  // Important for cookies
    mode: 'cors',           // Enable CORS mode
  };
  
  // Add body if present (except for GET/HEAD requests)
  if (options.body && !['GET', 'HEAD'].includes(options.method || 'GET')) {
    requestOptions.body = JSON.stringify(options.body);
  }
  
  // Log request details
  console.group(`API Request: ${options.method || 'GET'} ${url}`);
  console.log('Headers:', headers);
  if (requestOptions.body) console.log('Body:', requestOptions.body);

  try {
    let response;
    try {
      response = await fetch(url, requestOptions);
      console.log(`Response status: ${response.status} ${response.statusText}`);
    } catch (networkError) {
      console.error('Network error:', networkError);
      throw {
        status: 0,
        message: 'Network error. Please check your internet connection.',
        originalError: networkError
      };
    }
    
    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      // Only try to parse as JSON if the content type is JSON or response is not empty
      if (contentType && contentType.includes('application/json') || response.status !== 204) {
        data = await response.json();
        console.log('Response data:', data);
      } else if (response.status === 204) {
        // Handle 204 No Content responses
        console.log('Received 204 No Content response');
        return { status: 'success' };
      } else {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      if (response.ok) {
        // If the response is ok but we couldn't parse it, return empty success
        return { status: 'success' };
      }
      throw parseError;
    }

    // Handle HTTP error responses
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      
      // Auto-logout on 401 Unauthorized
      if (response.status === 401) {
        console.log('Authentication failed, logging out...');
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        // Redirect to login will be handled by the component
      }
      
      throw error;
    }
    
    return data || {}; // Always return an object to prevent undefined errors
  } catch (error) {
    console.groupEnd(); // Close the API request log group
    
    // Log detailed error information
    console.error('API request failed:', {
      endpoint,
      url,
      method: options.method || 'GET',
      status: error.status,
      message: error.message,
      data: error.data
    });
    
    // Enhance the error with more context
    error.endpoint = endpoint;
    error.url = url;
    error.method = options.method || 'GET';
    
    // Provide more user-friendly error messages
    if (error.status === 0) {
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status === 401) {
      error.message = 'Your session has expired. Please log in again.';
      localStorage.removeItem('userInfo');
      // Use window.location instead of navigate to ensure full page reload
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.status === 403) {
      error.message = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      error.message = 'The requested resource was not found.';
    } else if (error.status >= 500) {
      error.message = 'A server error occurred. Please try again later.';
    } else if (!error.status) {
      error.status = 0; // Network error or CORS issue
      error.message = 'Unable to connect to the server. Please try again later.';
    }
    
    // Add status code to error object if not present
    if (!error.status) {
      error.status = 0;
    }
    
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Login user
  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
    }),
    
  // Register new user
  register: (userData) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: userData,
    }),
    
  // Get current user profile (alias for getCurrentUser for backward compatibility)
  getProfile: () => apiRequest('/api/auth/me'),
  
  // Get current user
  getCurrentUser: () => apiRequest('/api/auth/me'),
  
  // Update user profile
  updateProfile: (profileData) =>
    apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: profileData,
    }),
  
  // Password reset methods
  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
    
  verifyResetToken: (token) =>
    apiRequest(`/api/auth/verify-reset-token/${token}`),
    
  resetPassword: ({ token, password }) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),
};

// Matches API
export const matchesAPI = {
  // Get daily match
  getDailyMatch: () => apiRequest('/api/matches/daily'),
  
  // Get match details
  getMatch: (matchId) => apiRequest(`/api/matches/${matchId}`),
  
  // Pin a match
  pinMatch: (matchId) => apiRequest(`/api/matches/${matchId}/pin`, { method: 'PUT' }),
  
  // Unpin a match
  unpinMatch: (matchId) => apiRequest(`/api/matches/${matchId}/unpin`, { method: 'PUT' }),
  
  // Get user's match history
  getMatchHistory: () => apiRequest('/api/matches/history'),
  
  // Get match statistics
  getMatchStats: () => apiRequest('/api/matches/stats'),
  
  // Update match status
  updateMatchStatus: (matchId, status) => 
    apiRequest(`/api/matches/${matchId}/status`, { 
      method: 'PUT',
      body: { status }
    })
};

// Messages API
export const messagesAPI = {
  getMessages: (matchId) => apiRequest(`/api/messages/${matchId}`),
  
  sendMessage: (matchId, message) => apiRequest('/api/messages', {
    method: 'POST',
    body: { matchId, content: message },
  }),
  
  sendMilestone: (matchId, milestone) => apiRequest(`/api/messages/${matchId}/milestone`, {
    method: 'POST',
    body: milestone,
  }),
};

// Notifications API
export const notificationsAPI = {
  // Get all notifications
  getNotifications: () => apiRequest('/api/notifications'),
  
  // Get chat activity
  getActivity: () => apiRequest('/api/notifications/activity'),
  
  // Mark notification as read
  markAsRead: (notificationId) => 
    apiRequest(`/api/notifications/${notificationId}/read`, { 
      method: 'PUT' 
    }),
    
  // Mark all notifications as read
  markAllAsRead: () => 
    apiRequest('/api/notifications/read-all', { 
      method: 'PUT' 
    }),
    
  // Get unread count
  getUnreadCount: () => apiRequest('/api/notifications/unread-count')
};

// User Stats API
export const statsAPI = {
  // Get user statistics
  getUserStats: () => apiRequest('/api/users/stats'),
  
  // Get user activity
  getUserActivity: (period = 'week') => 
    apiRequest(`/api/users/activity?period=${period}`),
    
  // Get compatibility insights
  getCompatibilityInsights: () => 
    apiRequest('/api/users/insights/compatibility'),
    
  // Get matching patterns
  getMatchingPatterns: () => 
    apiRequest('/api/users/insights/matching-patterns')
};

// Upload API
export const uploadAPI = {
  uploadProfilePicture: async (formData) => {
    const token = localStorage.getItem('token');
    
    try {
      console.log('Starting profile picture upload...');
      
      const response = await fetch(`${API_BASE_URL}/api/upload/profile-picture`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let the browser set it with the correct boundary
        },
        body: formData,
      });
      
      const data = await response.json();
      
      console.log('Upload response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (!response.ok) {
        const error = new Error(data.message || 'Upload failed');
        error.response = response;
        error.data = data;
        throw error;
      }
      
      if (!data.success) {
        const error = new Error(data.message || 'Upload was not successful');
        error.response = response;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Upload error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.data
        } : 'No response',
        formData: formData ? 'FormData present' : 'No FormData'
      });
      
      // Enhance the error message for better user feedback
      if (!error.message) {
        error.message = 'Failed to upload profile picture. Please try again.';
      }
      
      throw error;
    }
  },
};

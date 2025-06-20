// Base API configuration - using the production backend URL
const API_BASE_URL = 'https://date2mate.onrender.com';

// For local development, you can uncomment the line below:
// const API_BASE_URL = 'http://localhost:5000';

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (response.status === 204) {
      // Handle 204 No Content responses
      return { status: 'success' };
    } else {
      const text = await response.text();
      throw new Error(`Unexpected response format: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  
  register: (userData) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: userData,
  }),
  
  getProfile: () => apiRequest('/api/auth/profile'),
  
  updateProfile: (profileData) => apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: profileData,
  }),
  
  getCurrentUser: () => apiRequest('/api/auth/me'),
};

// Matches API
export const matchesAPI = {
  getDailyMatches: () => apiRequest('/api/matches/daily'),
  
  getMatch: (matchId) => apiRequest(`/api/matches/${matchId}`),
  
  pinMatch: (matchId) => apiRequest(`/api/matches/${matchId}/pin`, {
    method: 'POST',
  }),
  
  unpinMatch: (matchId) => apiRequest(`/api/matches/${matchId}/unpin`, {
    method: 'POST',
  }),
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
  getNotifications: () => apiRequest('/api/notifications'),
  
  getActivity: () => apiRequest('/api/notifications/activity'),
};

// Upload API
export const uploadAPI = {
  uploadProfilePicture: (formData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/api/upload/profile-picture`, {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let the browser set it with the correct boundary
      },
      body: formData,
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    })
    .catch(error => {
      console.error('Upload error:', error);
      throw error;
    });
  },
};

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  // Include credentials for CORS with cookies
  options.credentials = 'include';

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : null,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
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
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json());
  },
};

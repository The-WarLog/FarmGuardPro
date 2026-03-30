// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/v1/chat`,
  DETECT: `${API_BASE_URL}/api/v1/detect`,
  DISEASES: `${API_BASE_URL}/api/v1/diseases`,
  HEALTH: `${API_BASE_URL}/`
};

// API helper functions
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(API_ENDPOINTS.DETECT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

export const sendChatMessage = async (message) => {
  return apiCall(API_ENDPOINTS.CHAT, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};
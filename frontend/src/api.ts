const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

// Helper function to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('remember_token');
};

// Authenticated fetch wrapper
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return fetch(apiUrl(url), {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};

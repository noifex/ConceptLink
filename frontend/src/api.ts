const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

// localStorage is the canonical auth store.
// AuthContext keeps React state in sync with it, but api.ts reads directly
// to avoid a circular dependency between api.ts and AuthContext.
export const getAuthToken = (): string | null => {
  return localStorage.getItem('remember_token');
};

// Called when a 401 is received mid-session (e.g. token expired on server).
// AuthContext registers this callback on mount so apiFetch can clear auth state.
let onUnauthorizedCallback: (() => void) | null = null;

export const registerUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorizedCallback = handler;
};

// Authenticated fetch wrapper
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(apiUrl(url), {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    onUnauthorizedCallback?.();
    throw new Error('セッションが切れました。再度ログインしてください。');
  }

  return response;
};

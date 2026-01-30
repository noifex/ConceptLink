import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  username: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('remember_token');

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedToken })
        });

        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          setToken(data.token);
        } else {
          localStorage.removeItem('remember_token');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('remember_token');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (username: string, token: string) => {
    setUsername(username);
    setToken(token);
    localStorage.setItem('remember_token', token);
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }

    setUsername(null);
    setToken(null);
    localStorage.removeItem('remember_token');
  };

  return (
    <AuthContext.Provider value={{
      username,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

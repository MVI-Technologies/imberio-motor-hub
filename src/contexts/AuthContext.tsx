import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'operador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - will be replaced by Supabase Auth
const MOCK_USERS: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@imberio.com', role: 'admin' },
  { id: '2', name: 'Operador João', email: 'operador@imberio.com', role: 'operador' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('imberio_user');
    const tokenExpiry = localStorage.getItem('imberio_token_expiry');
    
    if (storedUser && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      if (Date.now() < expiryTime) {
        setUser(JSON.parse(storedUser));
      } else {
        // Token expired
        localStorage.removeItem('imberio_user');
        localStorage.removeItem('imberio_token_expiry');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock authentication - replace with Supabase Auth
    const foundUser = MOCK_USERS.find(u => u.email === email);
    
    if (foundUser && password === '123456') {
      // Set 15 hour token expiry
      const expiryTime = Date.now() + (15 * 60 * 60 * 1000);
      localStorage.setItem('imberio_user', JSON.stringify(foundUser));
      localStorage.setItem('imberio_token_expiry', expiryTime.toString());
      setUser(foundUser);
      setIsLoading(false);
      return {};
    }
    
    setIsLoading(false);
    return { error: 'E-mail ou senha inválidos' };
  };

  const logout = () => {
    localStorage.removeItem('imberio_user');
    localStorage.removeItem('imberio_token_expiry');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

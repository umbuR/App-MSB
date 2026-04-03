import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, User } from '../lib/db';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Seed initial users if they don't exist
        const usersCount = await db.users.count();
        if (usersCount === 0) {
          await db.users.bulkAdd([
            { email: 'pimpinan@koperasi.com', password: 'password123', role: 'pimpinan', name: 'Bapak Pimpinan' },
            { email: 'kolektor@koperasi.com', password: 'password123', role: 'kolektor', name: 'Mas Kolektor' }
          ]);
        }

        // Check local storage for logged in user
        const storedUser = localStorage.getItem('koperasi_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('koperasi_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('koperasi_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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


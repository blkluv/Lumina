import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@shared/schema";
import { apiRequest, queryClient, refreshCsrfToken, resetCsrfToken } from "./queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    setUser(data.user);
    setIsLoading(false);
    // Refresh CSRF token for new session
    await refreshCsrfToken();
    await queryClient.invalidateQueries();
  }

  async function signup(email: string, username: string, password: string): Promise<User> {
    const response = await apiRequest("POST", "/api/auth/signup", { email, username, password });
    const data = await response.json();
    setUser(data.user);
    setIsLoading(false);
    // Refresh CSRF token for new session
    await refreshCsrfToken();
    await queryClient.invalidateQueries();
    return data.user;
  }

  async function logout() {
    await apiRequest("POST", "/api/auth/logout", {});
    setUser(null);
    // Reset CSRF token on logout
    resetCsrfToken();
    queryClient.clear();
  }

  function updateUser(updates: Partial<User>) {
    if (user) {
      setUser({ ...user, ...updates });
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

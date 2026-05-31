import { create } from "zustand";

interface User {
  id: number;
  username: string;
  role: string;
  display_name: string;
}

function getStoredAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  return {
    token,
    user: userStr ? JSON.parse(userStr) : null,
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  hydrate: () => {
    const stored = getStoredAuth();
    set({ token: stored.token, user: stored.user });
  },
}));

import { createContext } from "react";
import type { AuthUser } from "../types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registrationOpen: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  updateProfileImage: (profileImage: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

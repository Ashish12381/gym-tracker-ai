import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  getRegistrationStatus,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateProfileImage as updateProfileImageRequest,
} from "../services/authService";
import type { AuthUser } from "../types/auth";
import { getStoredToken, setStoredToken } from "../utils/authStorage";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const status = await getRegistrationStatus();
        setRegistrationOpen(status.registrationOpen);

        if (!getStoredToken()) {
          return;
        }

        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setStoredToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setStoredToken(response.token);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await registerRequest({ name, email, password });
    setStoredToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  const updateUser = (nextUser: AuthUser) => {
    setUser(nextUser);
  };

  const updateProfileImage = async (profileImage: string) => {
    const updatedUser = await updateProfileImageRequest(profileImage);
    setUser(updatedUser);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      registrationOpen,
      login,
      register,
      logout,
      updateUser,
      updateProfileImage,
    }),
    [user, isLoading, registrationOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

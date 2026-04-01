import API from "./api";
import type { AuthResponse, RegistrationStatus } from "../types/auth";

export const getRegistrationStatus = async (): Promise<RegistrationStatus> => {
  const response = await API.get("/auth/status");
  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const login = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  await API.post("/auth/logout");
};

export const getCurrentUser = async () => {
  const response = await API.get("/auth/me");
  return response.data.user;
};

export const updateProfileImage = async (profileImage: string) => {
  const response = await API.put("/auth/profile-image", { profileImage });
  return response.data.user;
};

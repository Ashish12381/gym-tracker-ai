export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegistrationStatus {
  registrationOpen: boolean;
}

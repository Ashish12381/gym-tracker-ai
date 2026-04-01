const AUTH_TOKEN_KEY = "gym-tracker-token";

export const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

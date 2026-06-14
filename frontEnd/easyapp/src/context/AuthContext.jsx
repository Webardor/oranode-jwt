import { createContext, useContext, useMemo, useState } from "react";

import {
  login as loginRequest,
  logout as logoutRequest
} from "../services/authService";

const AUTH_STORAGE_KEY = "misone_auth";

const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const value = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(authState) {
  if (!authState) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readStoredAuth);

  const signIn = async (credentials) => {
    const data = await loginRequest(credentials);
    const nextState = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      user: data.user
    };

    setAuthState(nextState);
    writeStoredAuth(nextState);

    return nextState;
  };

  const signOut = async () => {
    const token = authState?.accessToken;

    setAuthState(null);
    writeStoredAuth(null);

    try {
      await logoutRequest(token);
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  };

  const value = useMemo(() => ({
    isAuthenticated: Boolean(authState?.accessToken),
    accessToken: authState?.accessToken || "",
    user: authState?.user || null,
    signIn,
    signOut
  }), [authState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredAuth, setStoredAuth } from "../lib/api.js";

const AuthContext = createContext(null);

// Stores ONLY the token and the user payload from /api/accounts/login/
// ({ id, first_name, last_name, email, role, company_name? }).
// Profile and eligibility data are never kept in the browser: the backend
// always looks them up from the token.
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  // api.js fires this when the server rejects the token (expired / logged out elsewhere).
  useEffect(() => {
    const onUnauthorized = () => setAuth(null);
    window.addEventListener("scout:unauthorized", onUnauthorized);
    return () => window.removeEventListener("scout:unauthorized", onUnauthorized);
  }, []);

  const signIn = useCallback((token, user) => {
    const next = { token, user };
    setStoredAuth(next);
    setAuth(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // token may already be invalid; clear locally either way
    }
    setStoredAuth(null);
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      token: auth?.token || null,
      user: auth?.user || null,
      role: auth?.user?.role || null,
      isAuthenticated: Boolean(auth?.token),
      signIn,
      signOut,
    }),
    [auth, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

export function displayName(user) {
  if (!user) return "";
  return [user.first_name, user.last_name].filter(Boolean).join(" ");
}

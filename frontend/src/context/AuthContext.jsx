import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("scout_token"));

  useEffect(() => {
    const cachedUser = localStorage.getItem("scout_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        // ignore malformed cache
      }
    }
  }, []);

  function signIn(nextToken, nextUser) {
    localStorage.setItem("scout_token", nextToken);
    localStorage.setItem("scout_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function signOut() {
    localStorage.removeItem("scout_token");
    localStorage.removeItem("scout_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

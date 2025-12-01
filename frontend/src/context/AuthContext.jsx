import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,setToken]=useState(()=>localStorage.getItem('auth_token')||'');
  const [user,setUser]=useState(()=>{
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = (tk, usr) => {
    setToken(tk); setUser(usr);
    localStorage.setItem('auth_token', tk);
    localStorage.setItem('auth_user', JSON.stringify(usr));
  };
  const logout = () => {
    setToken(''); setUser(null); localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user');
  };

  const value = { token, user, login, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

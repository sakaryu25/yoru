import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthSession, Role } from './types';
import { storage, keys } from './storage';
import { CASTS } from './data';

interface AuthContextValue {
  session: AuthSession | null;
  role: Role;
  booting: boolean;
  castName: string;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (r: Role) => void;
  setCastName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [role, setRoleState] = useState<Role>('manager');
  const [booting, setBooting] = useState(true);
  const [castName, setCastNameState] = useState<string>(CASTS[0]?.name ?? '');

  useEffect(() => {
    Promise.all([
      storage.get<AuthSession | null>(keys.session(), null),
      storage.get<string>('castboard_cast_name', CASTS[0]?.name ?? ''),
      storage.get<Role>('castboard_role', 'manager'),
    ]).then(([s, name, savedRole]) => {
      if (s) setSession(s);
      setCastNameState(name);
      setRoleState(savedRole);
      setBooting(false);
    });
  }, []);

  const login = async (s: AuthSession) => {
    await storage.set(keys.session(), s);
    setSession(s);
  };

  const setRole = (r: Role) => {
    storage.set('castboard_role', r);
    setRoleState(r);
  };

  const logout = async () => {
    await storage.remove(keys.session());
    setSession(null);
    setRoleState('manager');
    storage.set('castboard_role', 'manager');
  };

  const setCastName = async (name: string) => {
    await storage.set('castboard_cast_name', name);
    setCastNameState(name);
  };

  return (
    <AuthContext.Provider value={{ session, role, booting, login, logout, setRole, castName, setCastName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

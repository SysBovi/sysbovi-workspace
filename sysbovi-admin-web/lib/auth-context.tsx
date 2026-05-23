'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type UserRole = 'UP' | 'UE' | 'UA' | 'UC';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  fazenda?: { id: string; nome: string };
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getRoleName: () => string;
  canAccessVendas: boolean;
  canAccessEquipe: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mapeia o papel do backend para o role do frontend
function papelToRole(papel: string): UserRole {
  switch (papel) {
    case 'ADMIN_FAZENDA': return 'UP';
    case 'ESPECIALISTA':  return 'UE';
    case 'COMUM':         return 'UC';
    case 'UA':            return 'UA';
    default:              return 'UC';
  }
}

const ROLE_NAMES: Record<UserRole, string> = {
  UP: 'Proprietário',
  UE: 'Especialista',
  UA: 'Administrador',
  UC: 'Usuário',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sysbovi_user');
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.usuario) setUser(stored.usuario);
      }
    } catch {
      localStorage.removeItem('sysbovi_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const data = await api.post<{ accessToken: string; usuario: any }>(
        '/auth/login',
        { email, senha: password },
      );

      const authUser: AuthUser = {
        id: data.usuario.id,
        name: data.usuario.nome,
        email: data.usuario.email,
        role: papelToRole(data.usuario.papel),
        fazenda: data.usuario.fazenda,
      };

      localStorage.setItem('sysbovi_user', JSON.stringify({
        accessToken: data.accessToken,
        usuario: authUser,
      }));

      setUser(authUser);
      return true;
    } catch {
      return false;
    }
  }

  async function loginAdmin(email: string, password: string): Promise<boolean> {
    try {
      const data = await api.post<{ accessToken: string; admin: any }>(
        '/auth/admin/login',
        { email, senha: password },
      );

      const authUser: AuthUser = {
        id: data.admin.id,
        name: data.admin.nome,
        email: data.admin.email,
        role: 'UA',
      };

      localStorage.setItem('sysbovi_user', JSON.stringify({
        accessToken: data.accessToken,
        usuario: authUser,
      }));

      setUser(authUser);
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('sysbovi_user');
    setUser(null);
    window.location.href = '/login';
  }

  const canAccessVendas = user?.role === 'UP' || user?.role === 'UE' || user?.role === 'UA';
  const canAccessEquipe = user?.role === 'UE' || user?.role === 'UA';

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      loginAdmin,
      logout,
      getRoleName: () => user ? ROLE_NAMES[user.role] : '',
      canAccessVendas,
      canAccessEquipe,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

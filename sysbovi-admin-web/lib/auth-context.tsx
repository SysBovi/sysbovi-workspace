'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, BASE_URL } from './api';

export type UserRole = 'UP' | 'UE' | 'UA' | 'UC';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  planoNome?: string;
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

function papelToRole(papel: string): UserRole {
  switch (papel) {
    case 'ADMIN_FAZENDA': return 'UP';
    case 'ESPECIALISTA':  return 'UE';
    case 'COMUM':         return 'UC';
    case 'UA':            return 'UA';
    default:              return 'UC';
  }
}

function mapUser(data: any): AuthUser {
  return {
    id: data.id,
    name: data.nome,
    email: data.email,
    role: papelToRole(data.papel),
    planoNome: data.planoNome,
    fazenda: data.fazenda,
  };
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

  // Restaura a sessão via cookie — raw fetch para não disparar redirect automático em 401
  useEffect(() => {
    fetch(`${BASE_URL}/auth/me`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data) setUser(mapUser(data)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const data = await api.post<{ usuario: any }>(
        '/auth/login',
        { email, senha: password },
      );
      setUser(mapUser(data.usuario));
      return true;
    } catch {
      return false;
    }
  }

  async function loginAdmin(email: string, password: string): Promise<boolean> {
    try {
      const data = await api.post<{ admin: any }>(
        '/auth/admin/login',
        { email, senha: password },
      );
      setUser({ ...mapUser(data.admin), role: 'UA' });
      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {});
    } catch { /* token pode já ter expirado — prossegue com limpeza local */ }
    setUser(null);
    window.location.href = '/login';
  }

  const canAccessVendas = (user?.role === 'UP' || user?.role === 'UE')
    && ['PREMIUM', 'EMPRESARIAL'].includes(user?.planoNome ?? '');
  const canAccessEquipe = (user?.role === 'UP' || user?.role === 'UE' || user?.role === 'UA')
    && (user?.role === 'UA' || user?.planoNome === 'EMPRESARIAL');

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

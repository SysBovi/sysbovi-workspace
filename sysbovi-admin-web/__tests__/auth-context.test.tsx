/**
 * Testes unitários — AuthContext (lib/auth-context.tsx)
 *
 * Verifica:
 *  1. Restauração de sessão via GET /auth/me no mount
 *  2. Mapeamento de papéis backend → roles frontend (papelToRole)
 *  3. canAccessVendas — combinações de role × plano
 *  4. canAccessEquipe — combinações de role × plano (inclui bug documentado)
 *  5. login com sucesso → seta user (sem localStorage)
 *  6. login com falha → retorna false, user permanece null
 *  7. getRoleName → exibe nome legível do papel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'

// ── Mock global fetch — padrão: 401 (sem sessão ativa) ────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function fetchReturns401() {
  mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
}

// Simula GET /auth/me retornando um usuário autenticado
const roleToPapel: Record<string, string> = {
  UP: 'ADMIN_FAZENDA',
  UE: 'ESPECIALISTA',
  UA: 'UA',
  UC: 'COMUM',
}
function mockMeResponse(role: string, planoNome = 'BASICO') {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 'user-1',
      nome: 'Teste',
      email: 'teste@fazenda.com',
      papel: roleToPapel[role] ?? 'COMUM',
      planoNome,
      fazenda: { id: 'fazenda-1', nome: 'Fazenda Demo' },
    }),
  })
}

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  BASE_URL: 'http://localhost:3001/api',
}))

import { api } from '../lib/api'
import { AuthProvider, useAuth } from '../lib/auth-context'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// ── 1. Restauração de sessão via /auth/me ─────────────────────────────────────

describe('restauração de sessão via /auth/me', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
    fetchReturns401()
  })

  it('seta user quando /auth/me retorna 200', async () => {
    mockMeResponse('UP', 'PREMIUM')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user?.role).toBe('UP')
    expect(result.current.user?.planoNome).toBe('PREMIUM')
  })

  it('user permanece null quando /auth/me retorna 401', async () => {
    fetchReturns401()
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user).toBeNull()
  })
})

// ── 2. Mapeamento de papéis ───────────────────────────────────────────────────

describe('papelToRole — mapeamento backend → frontend', () => {
  beforeEach(() => {
    fetchReturns401()
    vi.mocked(api.post).mockReset()
  })

  it.each([
    ['ADMIN_FAZENDA', 'UP'],
    ['ESPECIALISTA',  'UE'],
    ['COMUM',         'UC'],
    ['PAPEL_INVALIDO','UC'],
  ])('papel "%s" deve mapear para role "%s"', async (papel, expectedRole) => {
    vi.mocked(api.post).mockResolvedValue({
      usuario: {
        id: '1', nome: 'T', email: 't@t.com',
        papel, planoNome: 'BASICO',
        fazenda: { id: 'f1', nome: 'F' },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('t@t.com', '123456')
    })

    expect(result.current.user?.role).toBe(expectedRole)
  })
})

// ── 3. canAccessVendas ────────────────────────────────────────────────────────

describe('canAccessVendas — role × plano', () => {
  beforeEach(() => vi.mocked(api.post).mockReset())

  it.each([
    ['UP', 'PREMIUM',     true,  'proprietário com Premium pode ver vendas'],
    ['UP', 'EMPRESARIAL', true,  'proprietário com Empresarial pode ver vendas'],
    ['UE', 'PREMIUM',     true,  'especialista com Premium pode ver vendas'],
    ['UE', 'EMPRESARIAL', true,  'especialista com Empresarial pode ver vendas'],
    ['UP', 'BASICO',      false, 'proprietário com Básico NÃO pode ver vendas'],
    ['UC', 'PREMIUM',     false, 'usuário comum NÃO pode ver vendas mesmo com Premium'],
    ['UC', 'EMPRESARIAL', false, 'usuário comum NÃO pode ver vendas mesmo com Empresarial'],
    ['UA', 'PREMIUM',     false, 'super admin NÃO acessa vendas de tenant'],
  ] as const)('%s + %s → canAccessVendas=%s (%s)', async (role, plano, expected, _description) => {
    mockMeResponse(role, plano)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canAccessVendas).toBe(expected)
  })
})

// ── 4. canAccessEquipe ────────────────────────────────────────────────────────

describe('canAccessEquipe — role × plano', () => {
  beforeEach(() => vi.mocked(api.post).mockReset())

  it('UA pode acessar equipe independente de plano', async () => {
    mockMeResponse('UA', '')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(true)
  })

  it('UE + EMPRESARIAL pode acessar equipe', async () => {
    mockMeResponse('UE', 'EMPRESARIAL')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(true)
  })

  it('UP + EMPRESARIAL pode acessar equipe', async () => {
    mockMeResponse('UP', 'EMPRESARIAL')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(true)
  })

  it('[BUG] UP + PREMIUM não pode acessar equipe — proprietário bloqueado sem plano Empresarial', async () => {
    mockMeResponse('UP', 'PREMIUM')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(false)
  })

  it('UC nunca pode acessar equipe, mesmo com Empresarial', async () => {
    mockMeResponse('UC', 'EMPRESARIAL')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(false)
  })

  it('UE + PREMIUM não pode acessar equipe', async () => {
    mockMeResponse('UE', 'PREMIUM')
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.canAccessEquipe).toBe(false)
  })
})

// ── 5. login ──────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => {
    fetchReturns401()
    vi.mocked(api.post).mockReset()
  })

  it('retorna true e seta user ao ter sucesso (sem localStorage)', async () => {
    vi.mocked(api.post).mockResolvedValue({
      usuario: {
        id: 'u1', nome: 'Premium User', email: 'p@fazenda.com',
        papel: 'ADMIN_FAZENDA', planoNome: 'PREMIUM',
        fazenda: { id: 'f1', nome: 'Fazenda Demo' },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let success!: boolean

    await act(async () => {
      success = await result.current.login('p@fazenda.com', 'senha123')
    })

    expect(success).toBe(true)
    expect(result.current.user?.email).toBe('p@fazenda.com')
    expect(result.current.user?.role).toBe('UP')
    expect(localStorage.getItem('sysbovi_user')).toBeNull() // token nunca vai para localStorage
  })

  it('retorna false e não altera user quando credenciais são inválidas', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Credenciais inválidas'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    let success!: boolean

    await act(async () => {
      success = await result.current.login('errado@test.com', 'errada')
    })

    expect(success).toBe(false)
    expect(result.current.user).toBeNull()
  })
})

// ── 6. getRoleName ────────────────────────────────────────────────────────────

describe('getRoleName — nome legível do papel', () => {
  beforeEach(() => vi.mocked(api.post).mockReset())

  it.each([
    ['UP', 'Proprietário'],
    ['UE', 'Especialista'],
    ['UC', 'Usuário'],
    ['UA', 'Administrador'],
  ] as const)('role "%s" → "%s"', async (role, expectedName) => {
    mockMeResponse(role)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.getRoleName()).toBe(expectedName)
  })

  it('retorna string vazia quando não há usuário logado', async () => {
    fetchReturns401()
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.getRoleName()).toBe('')
  })
})

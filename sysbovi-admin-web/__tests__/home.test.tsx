/**
 * Testes de componente — HomePage (app/(app)/home/page.tsx)
 *
 * Verifica:
 *  1. Admin UA → renderiza AdminHomePage (sem dashboard de stats)
 *  2. Tenant → chama GET /dashboard/stats e exibe métricas
 *  3. Geração de alertas a partir de insumos (Crítico/Baixo) e pastos (Superlotado)
 *  4. canAccessVendas=true → exibe card AvaliaVenda
 *  5. canAccessVendas=false → oculta card AvaliaVenda
 *  6. Erro no stats → mantém tela sem crash (stats=null → continua skeleton)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('../lib/api', () => ({
  api: { get: vi.fn() },
  BASE_URL: 'http://localhost:3001/api',
}))

const mockUseAuth = vi.fn()
vi.mock('../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseData = vi.fn()
vi.mock('../lib/data-context', () => ({
  useData: () => mockUseData(),
}))

import { api } from '../lib/api'
import HomePage from '../app/(app)/home/page'

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyData() {
  mockUseData.mockReturnValue({ bovinos: [], insumos: [], pastos: [] })
}

function tenantUser(opts: { canAccessVendas?: boolean } = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', name: 'João Silva', role: 'UP', fazenda: { nome: 'Fazenda Demo' } },
    canAccessVendas: opts.canAccessVendas ?? true,
  })
}

function adminUser() {
  mockUseAuth.mockReturnValue({
    user: { id: 'a1', name: 'Super Admin', email: 'admin@sysbovi.com', role: 'UA' },
    canAccessVendas: false,
  })
}

const defaultStats = {
  totalCabecas: 42, gmd: 1.2,
  insumosEmAlerta: 0, pastosSuperlotados: 0, pesoMedio: 380,
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('HomePage — modo Admin UA', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe Painel Administrativo e não chama stats API', () => {
    adminUser()
    emptyData()

    render(<HomePage />)

    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument()
    expect(vi.mocked(api.get)).not.toHaveBeenCalled()
  })

  it('exibe email e perfil do admin', () => {
    adminUser()
    emptyData()

    render(<HomePage />)

    expect(screen.getByText('admin@sysbovi.com')).toBeInTheDocument()
    expect(screen.getByText('Super Admin (UA)')).toBeInTheDocument()
  })
})

describe('HomePage — modo Tenant (UP/UE/UC)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama GET /dashboard/stats e exibe métricas quando stats carregam', async () => {
    tenantUser()
    emptyData()
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
    expect(screen.getByText('1.2 kg')).toBeInTheDocument()
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/dashboard/stats')
  })

  it('exibe saudação com primeiro nome do usuário', async () => {
    tenantUser()
    emptyData()
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() => expect(screen.getByText(/Olá, João/)).toBeInTheDocument())
  })

  it('exibe nome da fazenda no subtítulo', async () => {
    tenantUser()
    emptyData()
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() => expect(screen.getByText(/Fazenda Demo/)).toBeInTheDocument())
  })

  it('mantém componente estável quando stats falham (exibe skeleton/loading)', async () => {
    tenantUser()
    emptyData()
    vi.mocked(api.get).mockRejectedValue(new Error('Erro de rede'))

    render(<HomePage />)

    // Não deve lançar erro. Após rejeição, stats=null → componente mantém estado de loading
    await act(async () => {
      await new Promise(r => setTimeout(r, 100))
    })
    expect(screen.queryByText('Painel Administrativo')).not.toBeInTheDocument()
  })
})

describe('HomePage — geração de alertas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe alerta de estoque crítico para insumo com status Crítico', async () => {
    tenantUser()
    mockUseData.mockReturnValue({
      bovinos: [],
      insumos: [{ id: 'i1', nome: 'Ração Premium', status: 'Crítico', quantidadeAtual: 5, unidade: 'kg', nivelMinimo: 50 }],
      pastos: [],
    })
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() =>
      expect(screen.getByText('Estoque Crítico: Ração Premium')).toBeInTheDocument()
    )
  })

  it('exibe alerta de estoque baixo para insumo com status Baixo', async () => {
    tenantUser()
    mockUseData.mockReturnValue({
      bovinos: [],
      insumos: [{ id: 'i2', nome: 'Vermífugo', status: 'Baixo', quantidadeAtual: 30, unidade: 'ml', nivelMinimo: 100 }],
      pastos: [],
    })
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() =>
      expect(screen.getByText('Estoque Baixo: Vermífugo')).toBeInTheDocument()
    )
  })

  it('exibe alerta de pasto superlotado', async () => {
    tenantUser()
    mockUseData.mockReturnValue({
      bovinos: [],
      insumos: [],
      pastos: [{ id: 'p1', nome: 'Pasto Norte', status: 'Superlotado', ocupacaoAtual: 10, capacidade: 8 }],
    })
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() =>
      expect(screen.getByText('Pasto Superlotado: Pasto Norte')).toBeInTheDocument()
    )
  })

  it('não exibe seção de alertas quando tudo está normal', async () => {
    tenantUser()
    mockUseData.mockReturnValue({
      bovinos: [],
      insumos: [{ id: 'i1', nome: 'Ração', status: 'Normal', quantidadeAtual: 100, unidade: 'kg', nivelMinimo: 20 }],
      pastos: [{ id: 'p1', nome: 'Pasto A', status: 'Normal', ocupacaoAtual: 3, capacidade: 10 }],
    })
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
    expect(screen.queryByText('Alertas')).not.toBeInTheDocument()
  })
})

describe('HomePage — canAccessVendas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exibe card AvaliaVenda quando canAccessVendas=true', async () => {
    tenantUser({ canAccessVendas: true })
    emptyData()
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() =>
      expect(screen.getByText('AvaliaVenda')).toBeInTheDocument()
    )
  })

  it('oculta card AvaliaVenda quando canAccessVendas=false', async () => {
    tenantUser({ canAccessVendas: false })
    emptyData()
    vi.mocked(api.get).mockResolvedValue(defaultStats)

    render(<HomePage />)

    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument())
    expect(screen.queryByText('AvaliaVenda')).not.toBeInTheDocument()
  })
})

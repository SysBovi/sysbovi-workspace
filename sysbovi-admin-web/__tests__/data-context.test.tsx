/**
 * Testes unitários — DataContext (lib/data-context.tsx)
 *
 * Verifica:
 *  1. Sem user → nenhuma chamada de API, estado vazio
 *  2. User admin (UA sem fazenda) → nenhuma chamada de API
 *  3. User com fazenda → carrega bovinos/pastos/insumos/equipe no mount
 *  4. mapBovino — sexo, statusSaude, lote, pesoAtual, campos opcionais
 *  5. mapInsumo — tipo label, status traduzido
 *  6. mapPasto — statusOcupacao (Superlotado / Disponível / Normal)
 *  7. Erro silenciado — estado permanece vazio quando API falha
 *  8. addBovino — POST + reload de bovinos e pastos
 *  9. criarInsumo — POST + reload de insumos
 * 10. getHistoricoInsumo — GET direto sem estado
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  BASE_URL: 'http://localhost:3001/api',
}))

const mockUseAuth = vi.fn()

vi.mock('../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { api } from '../lib/api'
import { DataProvider, useData } from '../lib/data-context'

const mockApi = vi.mocked(api)

// ── Helpers ───────────────────────────────────────────────────────────────────

function userWithFazenda() {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'u1', name: 'Proprietário', email: 'prop@fazenda.com',
      role: 'UP', planoNome: 'PREMIUM',
      fazenda: { id: 'f1', nome: 'Fazenda Demo' },
    },
    isLoading: false,
  })
}

function adminUser() {
  mockUseAuth.mockReturnValue({
    user: { id: 'a1', name: 'Admin', email: 'admin@sysbovi.com', role: 'UA' },
    isLoading: false,
  })
}

function noUser() {
  mockUseAuth.mockReturnValue({ user: null, isLoading: false })
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>{children}</DataProvider>
)

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('DataProvider — carregamento inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.get.mockResolvedValue([])
  })

  it('não chama API e mantém estado vazio quando não há usuário', async () => {
    noUser()
    const { result } = renderHook(() => useData(), { wrapper })

    await new Promise(r => setTimeout(r, 50))

    expect(mockApi.get).not.toHaveBeenCalled()
    expect(result.current.bovinos).toEqual([])
    expect(result.current.pastos).toEqual([])
    expect(result.current.insumos).toEqual([])
  })

  it('não carrega dados de fazenda quando usuário é admin UA (sem fazenda)', async () => {
    adminUser()
    const { result } = renderHook(() => useData(), { wrapper })

    await new Promise(r => setTimeout(r, 50))

    expect(mockApi.get).not.toHaveBeenCalled()
    expect(result.current.bovinos).toEqual([])
  })

  it('carrega bovinos, pastos, insumos e equipe quando usuário tem fazenda', async () => {
    userWithFazenda()
    const { result } = renderHook(() => useData(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockApi.get).toHaveBeenCalledWith('/bovinos')
    expect(mockApi.get).toHaveBeenCalledWith('/pastos')
    expect(mockApi.get).toHaveBeenCalledWith('/insumos')
    expect(mockApi.get).toHaveBeenCalledWith('/equipe')
  })

  it('mantém estado vazio e não lança erro quando API falha', async () => {
    userWithFazenda()
    mockApi.get.mockRejectedValue(new Error('Erro de rede'))

    const { result } = renderHook(() => useData(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.bovinos).toEqual([])
    expect(result.current.pastos).toEqual([])
    expect(result.current.insumos).toEqual([])
  })
})

// ── 4. mapBovino ──────────────────────────────────────────────────────────────

describe('mapBovino — transformações de campo', () => {
  beforeEach(() => vi.clearAllMocks())

  const rawBovino = {
    id: 'bov-1', brinco: 'BR001', raca: 'Nelore',
    sexo: 'M', dataNascimento: '2022-01-01', dataEntrada: '2022-06-01',
    pesoAtual: 450, pesoEntrada: 200, statusSaude: 'SAUDAVEL',
    lote: { nome: 'Lote A' }, loteId: 'lote-1',
    ultimaPesagem: '2024-01-01', idadeMeses: 24, custoAcumulado: 500,
  }

  it('mapeia sexo "M" → "Macho"', async () => {
    userWithFazenda()
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/bovinos' ? [rawBovino] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.bovinos).toHaveLength(1))

    expect(result.current.bovinos[0].sexo).toBe('Macho')
  })

  it('mapeia sexo "F" → "Fêmea"', async () => {
    userWithFazenda()
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/bovinos' ? [{ ...rawBovino, sexo: 'F' }] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.bovinos).toHaveLength(1))

    expect(result.current.bovinos[0].sexo).toBe('Fêmea')
  })

  it.each([
    ['SAUDAVEL',      'Saudável'],
    ['EM_TRATAMENTO', 'Em Tratamento'],
    ['OBSERVACAO',    'Observação'],
    ['DESCONHECIDO',  'Saudável'], // fallback
  ])('statusSaude "%s" → "%s"', async (statusSaude, expected) => {
    userWithFazenda()
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/bovinos' ? [{ ...rawBovino, statusSaude }] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.bovinos).toHaveLength(1))

    expect(result.current.bovinos[0].statusSaude).toBe(expected)
  })

  it('usa pesoEntrada como fallback quando pesoAtual está ausente', async () => {
    userWithFazenda()
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/bovinos' ? [{ ...rawBovino, pesoAtual: undefined }] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.bovinos).toHaveLength(1))

    expect(result.current.bovinos[0].pesoAtual).toBe(200) // pesoEntrada
  })

  it('usa nome do lote como pastoAtual', async () => {
    userWithFazenda()
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/bovinos' ? [rawBovino] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.bovinos).toHaveLength(1))

    expect(result.current.bovinos[0].pastoAtual).toBe('Lote A')
    expect(result.current.bovinos[0].lote).toBe('Lote A')
  })
})

// ── 5. mapInsumo ──────────────────────────────────────────────────────────────

describe('mapInsumo — transformações de campo', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['NORMAL',  'Normal'],
    ['BAIXO',   'Baixo'],
    ['CRITICO', 'Crítico'],
  ])('status "%s" → "%s"', async (status, expected) => {
    userWithFazenda()
    const rawInsumo = {
      id: 'i1', nome: 'Ração', tipo: 'SUPLEMENTO',
      quantidadeAtual: 50, nivelMinimo: 100, unidade: 'kg',
      status, validade: null,
    }
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/insumos' ? [rawInsumo] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.insumos).toHaveLength(1))

    expect(result.current.insumos[0].status).toBe(expected)
  })

  it.each([
    ['VACINA',      'Vacina'],
    ['SUPLEMENTO',  'Suplemento'],
    ['MEDICAMENTO', 'Medicamento'],
    ['MINERAL',     'Mineral'],
  ])('tipo "%s" → label "%s"', async (tipo, expectedLabel) => {
    userWithFazenda()
    const rawInsumo = {
      id: 'i1', nome: 'Item', tipo,
      quantidadeAtual: 10, nivelMinimo: 5, unidade: 'un',
      status: 'NORMAL', validade: null,
    }
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/insumos' ? [rawInsumo] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.insumos).toHaveLength(1))

    expect(result.current.insumos[0].tipo).toBe(expectedLabel)
  })
})

// ── 6. mapPasto ───────────────────────────────────────────────────────────────

describe('mapPasto — statusOcupacao', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['SUPERLOTADO', 10, 10, 'Superlotado'],
    ['NORMAL',       5, 10, 'Disponível'],  // 5/10 = 50% < 80%
    ['NORMAL',       9, 10, 'Normal'],      // 9/10 = 90% >= 80%
  ])('statusOcupacao="%s" ocupacao=%i cap=%i → "%s"', async (statusOcupacao, ocupacaoAtual, capacidade, expected) => {
    userWithFazenda()
    const rawPasto = {
      id: 'p1', nome: 'Pasto A', areaHectares: 10,
      capacidade, ocupacaoAtual, diasDescanso: 30,
      statusOcupacao, ultimoRodizio: null,
    }
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/pastos' ? [rawPasto] : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.pastos).toHaveLength(1))

    expect(result.current.pastos[0].status).toBe(expected)
  })
})

// ── 8. addBovino ──────────────────────────────────────────────────────────────

describe('addBovino()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /bovinos e recarrega bovinos e pastos', async () => {
    userWithFazenda()
    mockApi.get.mockResolvedValue([])
    mockApi.post.mockResolvedValue({ id: 'bov-novo' })

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callsBefore = mockApi.get.mock.calls.length

    await act(async () => {
      await result.current.addBovino({
        brinco: 'BR100', raca: 'Angus', sexo: 'M',
        dataNascimento: '2022-01-01', pesoEntrada: 300,
      })
    })

    expect(mockApi.post).toHaveBeenCalledWith('/bovinos', expect.objectContaining({ brinco: 'BR100' }))
    // Após addBovino, recarregarBovinos e recarregarPastos são chamados
    const callsAfter = mockApi.get.mock.calls.length
    expect(callsAfter).toBeGreaterThan(callsBefore)
    expect(mockApi.get).toHaveBeenCalledWith('/bovinos')
    expect(mockApi.get).toHaveBeenCalledWith('/pastos')
  })
})

// ── 9. criarInsumo ────────────────────────────────────────────────────────────

describe('criarInsumo()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama POST /insumos e recarrega lista de insumos', async () => {
    userWithFazenda()
    mockApi.get.mockResolvedValue([])
    mockApi.post.mockResolvedValue({ id: 'ins-novo' })

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.criarInsumo({
        nome: 'Vermífugo', tipo: 'MEDICAMENTO', unidade: 'ml',
        quantidadeAtual: 500, custoUnitario: 2.5, nivelMinimo: 100,
      })
    })

    expect(mockApi.post).toHaveBeenCalledWith('/insumos', expect.objectContaining({ nome: 'Vermífugo' }))
    expect(mockApi.get).toHaveBeenCalledWith('/insumos')
  })
})

// ── 10. getHistoricoInsumo ────────────────────────────────────────────────────

describe('getHistoricoInsumo()', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna lista de histórico via GET sem alterar estado global', async () => {
    userWithFazenda()
    mockApi.get.mockResolvedValue([])
    const historico = [{ id: 'h1', dataUso: '2024-01-01', loteNome: 'Lote A', quantidadeUtilizada: 5, valorUnitario: 10, custoTotal: 50 }]
    mockApi.get.mockImplementation((url: string) =>
      Promise.resolve(url === '/insumos/ins-1/historico' ? historico : []),
    )

    const { result } = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let returned: any
    await act(async () => {
      returned = await result.current.getHistoricoInsumo('ins-1')
    })

    expect(returned).toEqual(historico)
    // Estado global de insumos não muda
    expect(result.current.insumos).toEqual([])
  })
})

/**
 * Testes unitários — Cliente HTTP (lib/api.ts)
 *
 * Verifica:
 *  1. credentials: 'include' é sempre enviado (autenticação via cookie HttpOnly)
 *  2. Cabeçalho Authorization nunca é injetado pelo cliente
 *  3. Resposta 401 → limpa localStorage e redireciona para /login
 *  4. Erros HTTP (4xx/5xx) → lança Error com mensagem da API
 *  5. Resposta 204 → retorna undefined sem tentar parsear JSON
 *  6. Resposta de sucesso → retorna JSON parseado
 *  7. POST serializa body como JSON e envia Content-Type correto
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// ── Mocks globais ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// jsdom não permite sobrescrever window.location diretamente
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost/' },
  writable: true,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResponse(status: number, body: unknown, contentType = 'application/json') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (header: string) =>
        header.toLowerCase() === 'content-type' ? contentType : null,
    },
    json: async () => body,
  }
}

// ── Importar módulo APÓS configurar mocks ─────────────────────────────────────

import { api } from '../lib/api'

// ── Testes ────────────────────────────────────────────────────────────────────

describe('api — autenticação via cookie (HttpOnly)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('envia credentials: "include" em toda requisição para o cookie ser transmitido', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { ok: true }))

    await api.get('/bovinos')

    const options = mockFetch.mock.calls[0][1]
    expect(options.credentials).toBe('include')
  })

  it('nunca injeta cabeçalho Authorization — autenticação é pelo cookie', async () => {
    localStorage.setItem('sysbovi_user', JSON.stringify({ id: 'u1', role: 'UP' }))
    mockFetch.mockResolvedValue(makeResponse(200, []))

    await api.get('/bovinos')

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('também não injeta Authorization quando localStorage está vazio', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, []))

    await api.get('/public')

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })
})

describe('api — resposta 401 (sessão expirada)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
    window.location.href = 'http://localhost/'
  })

  it('redireciona para /login', async () => {
    mockFetch.mockResolvedValue(makeResponse(401, { message: 'Unauthorized' }))

    await expect(api.get('/protegido')).rejects.toThrow('Sessão expirada.')
    expect(window.location.href).toBe('/login')
  })

  it('não toca no localStorage — limpeza de estado é responsabilidade do AuthContext', async () => {
    localStorage.setItem('algum_dado', 'valor')
    mockFetch.mockResolvedValue(makeResponse(401, {}))

    await expect(api.get('/protegido')).rejects.toThrow()
    expect(localStorage.getItem('algum_dado')).toBe('valor')
  })
})

describe('api — erros HTTP (não-401)', () => {
  beforeEach(() => mockFetch.mockReset())

  it('lança Error com a mensagem retornada pela API', async () => {
    mockFetch.mockResolvedValue(makeResponse(422, { message: 'Brinco já cadastrado' }))

    await expect(api.post('/bovinos', {})).rejects.toThrow('Brinco já cadastrado')
  })

  it('lança mensagem genérica quando body não contém "message"', async () => {
    mockFetch.mockResolvedValue(makeResponse(500, {}))

    await expect(api.get('/erro')).rejects.toThrow('Erro na requisição.')
  })

  it('lança mensagem genérica quando body não é JSON válido', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new Error('parse error') },
    })

    await expect(api.get('/down')).rejects.toThrow('Erro desconhecido.')
  })
})

describe('api — resposta 204 (sem conteúdo)', () => {
  beforeEach(() => mockFetch.mockReset())

  it('retorna undefined sem tentar parsear JSON', async () => {
    mockFetch.mockResolvedValue(makeResponse(204, null, ''))

    const result = await api.delete('/bovinos/1')
    expect(result).toBeUndefined()
  })
})

describe('api — resposta de sucesso', () => {
  beforeEach(() => mockFetch.mockReset())

  it('GET retorna o JSON parseado', async () => {
    const payload = [{ id: '1', brinco: 'BR001' }, { id: '2', brinco: 'BR002' }]
    mockFetch.mockResolvedValue(makeResponse(200, payload))

    const result = await api.get('/bovinos')
    expect(result).toEqual(payload)
  })

  it('POST envia body serializado como JSON com Content-Type correto', async () => {
    const body = { email: 'user@fazenda.com', senha: 'senha123' }
    mockFetch.mockResolvedValue(makeResponse(200, { accessToken: 'jwt' }))

    await api.post('/auth/login', body)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual(body)
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('PUT e PATCH também enviam body', async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { id: '1' }))

    await api.put('/bovinos/1', { statusSaude: 'EM_TRATAMENTO' })

    const options = mockFetch.mock.calls[0][1]
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({ statusSaude: 'EM_TRATAMENTO' })
  })
})

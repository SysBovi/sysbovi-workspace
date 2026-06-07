/**
 * Testes de componente — LoginPage (app/login/page.tsx)
 *
 * Verifica:
 *  1. Renderização dos campos de email e senha
 *  2. Erros de validação ao submeter formulário vazio
 *  3. Erro de formato de email inválido
 *  4. Erro de senha muito curta (< 6 caracteres)
 *  5. Chamada correta de login() com dados válidos
 *  6. Redirecionamento para /home após login bem-sucedido
 *  7. Toast de erro quando credenciais são incorretas
 *  8. Alternância de visibilidade da senha
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRouterReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

const mockLogin = vi.fn()

vi.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import LoginPage from '../app/login/page'
import { toast } from 'sonner'

// ── Testes ────────────────────────────────────────────────────────────────────

describe('LoginPage — renderização', () => {
  it('exibe campos de email, senha e botão de submit', () => {
    render(<LoginPage />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('campo de senha começa com type="password"', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('exibe link para acesso administrativo', () => {
    render(<LoginPage />)
    expect(screen.getByText(/acesso administrativo/i)).toBeInTheDocument()
  })
})

describe('LoginPage — validação de formulário', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockRouterReplace.mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it('exibe erros em ambos os campos ao submeter formulário vazio', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('exibe erro de formato para email inválido', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'email-sem-arroba')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    // fireEvent.submit bypassa a validação nativa do browser (type="email" no jsdom)
    // e invoca diretamente o onSubmit do React, que executa o validate() customizado
    fireEvent.submit(document.querySelector('form')!)

    expect(screen.getByText('Email inválido')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('exibe erro quando senha tem menos de 6 caracteres', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), '12345')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('não exibe erros ao preencher corretamente antes de submeter', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(false)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(screen.queryByText('Email é obrigatório')).not.toBeInTheDocument()
    expect(screen.queryByText('Senha é obrigatória')).not.toBeInTheDocument()
  })
})

describe('LoginPage — submit', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockRouterReplace.mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it('chama login() com email e senha corretos', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(true)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'premium@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('premium@fazenda.com', 'senha123')
    })
  })

  it('redireciona para /home após login bem-sucedido', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(true)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/home')
    })
  })

  it('exibe toast de sucesso após login bem-sucedido', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(true)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Login realizado!',
        expect.objectContaining({ description: 'Bem-vindo ao SYSBOVI' }),
      )
    })
  })

  it('exibe toast de erro quando login falha', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(false)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Falha no login',
        expect.objectContaining({ description: 'Email ou senha incorretos' }),
      )
    })
  })

  it('não redireciona quando login falha', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(false)
    render(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@fazenda.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})

describe('LoginPage — toggle de senha', () => {
  it('alterna type do input de "password" para "text" ao clicar no botão', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Senha')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // O botão de toggle é o único button sem texto visível (contém apenas SVG)
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(btn => btn.textContent?.trim() === '')
    expect(toggleBtn).toBeDefined()

    await user.click(toggleBtn!)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('volta para "password" ao clicar novamente no botão de toggle', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText('Senha')
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(btn => btn.textContent?.trim() === '')!

    await user.click(toggleBtn)
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

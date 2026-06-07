/**
 * Testes de componente — AdminLoginPage (app/admin-login/page.tsx)
 *
 * Verifica:
 *  1. Renderização dos campos de email e senha
 *  2. Erros de validação ao submeter formulário vazio
 *  3. Erro de senha muito curta (< 3 caracteres — limiar diferente do login normal)
 *  4. Chamada correta de loginAdmin() com dados válidos
 *  5. Redirecionamento para /home após login bem-sucedido
 *  6. Toast de sucesso com mensagem de Super Admin
 *  7. Toast de erro quando credenciais são incorretas
 *  8. Alternância de visibilidade da senha
 *  9. Link de voltar para /login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRouterReplace = vi.fn()
const mockRouterPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: vi.fn(),
  }),
}))

const mockLoginAdmin = vi.fn()

vi.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    loginAdmin: mockLoginAdmin,
    isLoading: false,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import AdminLoginPage from '../app/admin-login/page'
import { toast } from 'sonner'

// ── Testes ────────────────────────────────────────────────────────────────────

describe('AdminLoginPage — renderização', () => {
  it('exibe campos de email, senha e botão de submit', () => {
    render(<AdminLoginPage />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar como admin/i })).toBeInTheDocument()
  })

  it('campo de senha começa com type="password"', () => {
    render(<AdminLoginPage />)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('exibe título de painel administrativo', () => {
    render(<AdminLoginPage />)
    expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
  })

  it('exibe botão de voltar para login padrão', () => {
    render(<AdminLoginPage />)
    expect(screen.getByText(/voltar para login padrão/i)).toBeInTheDocument()
  })
})

describe('AdminLoginPage — validação de formulário', () => {
  beforeEach(() => {
    mockLoginAdmin.mockReset()
    mockRouterReplace.mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it('exibe erros em ambos os campos ao submeter formulário vazio', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    expect(mockLoginAdmin).not.toHaveBeenCalled()
  })

  it('exibe erro de formato para email inválido', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'email-invalido')
    await user.type(screen.getByLabelText('Senha'), 'abc')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    expect(screen.getByText('Email inválido')).toBeInTheDocument()
    expect(mockLoginAdmin).not.toHaveBeenCalled()
  })

  it('exibe erro quando senha tem menos de 3 caracteres', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'ab')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument()
    expect(mockLoginAdmin).not.toHaveBeenCalled()
  })
})

describe('AdminLoginPage — submit', () => {
  beforeEach(() => {
    mockLoginAdmin.mockReset()
    mockRouterReplace.mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it('chama loginAdmin() com email e senha corretos', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue(true)
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'superadmin123')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    await waitFor(() => {
      expect(mockLoginAdmin).toHaveBeenCalledWith('superadmin@sysbovi.com', 'superadmin123')
    })
  })

  it('redireciona para /home após login bem-sucedido', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue(true)
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'superadmin123')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/home')
    })
  })

  it('exibe toast de sucesso com mensagem de Super Admin', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue(true)
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'superadmin123')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Login realizado!',
        expect.objectContaining({ description: 'Bem-vindo, Super Admin' }),
      )
    })
  })

  it('exibe toast de erro quando login falha', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue(false)
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Falha no login',
        expect.objectContaining({ description: 'Email ou senha incorretos' }),
      )
    })
  })

  it('não redireciona quando login falha', async () => {
    const user = userEvent.setup()
    mockLoginAdmin.mockResolvedValue(false)
    render(<AdminLoginPage />)

    await user.type(screen.getByLabelText('Email'), 'superadmin@sysbovi.com')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: /entrar como admin/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
})

describe('AdminLoginPage — toggle de senha', () => {
  it('alterna type do input de "password" para "text" ao clicar no botão', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    const passwordInput = screen.getByLabelText('Senha')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(btn => btn.textContent?.trim() === '')
    expect(toggleBtn).toBeDefined()

    await user.click(toggleBtn!)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('volta para "password" ao clicar novamente no botão de toggle', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    const passwordInput = screen.getByLabelText('Senha')
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(btn => btn.textContent?.trim() === '')!

    await user.click(toggleBtn)
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

describe('AdminLoginPage — navegação', () => {
  it('botão "Voltar para login padrão" navega para /login', async () => {
    const user = userEvent.setup()
    render(<AdminLoginPage />)

    await user.click(screen.getByText(/voltar para login padrão/i))

    expect(mockRouterPush).toHaveBeenCalledWith('/login')
  })
})

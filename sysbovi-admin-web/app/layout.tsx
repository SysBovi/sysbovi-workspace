import type { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'SYSBOVI - Gestão Inteligente de Gado de Corte',
  description: 'Plataforma SaaS para gestão completa do seu rebanho bovino.',
  icons: {
    icon: [
      { url: '@/public/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '@/public/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '@/public/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '@/public/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#15783a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

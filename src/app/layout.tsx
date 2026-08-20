import type { Metadata } from 'next'
import QueryProvider from '@/providers/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'BestFork Master — Painel de Gestão',
  description: 'Painel administrativo para o dono das casas BestFork Experience',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}

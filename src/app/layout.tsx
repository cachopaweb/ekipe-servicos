import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from './contexts/app_context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ekipe Serviços',
  description: 'Ekipe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css" />
      </head>
      <body className={inter.className}>{
      <AppProvider>
        {children}
      </AppProvider>
      }</body>
    </html>
  )
}

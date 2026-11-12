import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./contexts/app_context";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ekipe Serviços | Gestão Integrada",
  description: "Sistema de Gestão de Vendas, Orçamentos, Ordens de Serviço e Empreitadas - Ekipe Serviços",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-ek-ground text-ek-text selection:bg-brand-border selection:text-ek-text">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

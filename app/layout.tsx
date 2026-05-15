import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LanguageProvider } from "@/components/language-provider"
import { AuthSessionProvider } from "@/components/session-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GOTS Group Research - Universidad Industrial de Santander",
  description: "Grupo de Óptica y Tratamiento de Señales (GOTS)",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={`font-sans antialiased`}>
        <AuthSessionProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthSessionProvider>
  {/* <Analytics /> */}
      </body>
    </html>
  )
}

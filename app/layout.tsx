import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LanguageProvider } from "@/components/language-provider"
import { AuthSessionProvider } from "@/components/session-provider"
import { ChatDock } from "@/components/chat-dock"
import { PwaRegister } from "@/components/pwa-register"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GOTS Group Research - Universidad Industrial de Santander",
  description: "Grupo de Óptica y Tratamiento de Señales (GOTS)",
  generator: "v0.app",
  applicationName: "GOTS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GOTS",
  },
  icons: {
    icon: [{ url: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/pwa-192.png", sizes: "192x192", type: "image/png" }],
  },
}

export const viewport = {
  themeColor: "#0b0b0b",
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
          <LanguageProvider>
            {children}
            <PwaRegister />
            <ChatDock />
          </LanguageProvider>
        </AuthSessionProvider>
  {/* <Analytics /> */}
      </body>
    </html>
  )
}

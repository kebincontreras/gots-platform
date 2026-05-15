"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { getPagePath } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: t("nav.home"), isSection: false },
    { href: "/noticias", label: t("nav.news"), isSection: false },
    { href: "/publicaciones", label: t("nav.publications"), isSection: false },
    { href: "/equipo", label: t("nav.team"), isSection: false },
  ]
  const languageOptions = [
    { code: "fr" as const, label: "FR", flag: "🇫🇷" },
    { code: "es" as const, label: "ES", flag: "🇨🇴" },
    { code: "en" as const, label: "EN", flag: "🇬🇧" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href={getPagePath("/")} className="flex items-center">
            <span
              className={`text-xl font-sans font-bold transition-colors ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              GOTS Group Research
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              // Simplificar la lógica para evitar errores de hidratación
              const finalHref = item.isSection ? item.href : getPagePath(item.href);
              
              return (
                <a
                  key={item.href}
                  href={finalHref}
                  className={`text-sm font-sans font-medium transition-colors ${
                    isScrolled ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
            <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background/20 p-1">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`rounded px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                    language === lang.code
                      ? "bg-accent text-accent-foreground"
                      : isScrolled
                        ? "text-foreground/80 hover:text-foreground"
                        : "text-white/80 hover:text-white"
                  }`}
                  aria-label={`Change language to ${lang.code}`}
                >
                  <span className="mr-1">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            {session?.user ? (
              <div className="flex items-center gap-3">
                <a
                  href={(session.user as any).role === "PROFESSOR" ? "/profesor" : "/dashboard"}
                  className={`text-sm font-sans font-medium transition-colors ${
                    isScrolled ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
                  }`}
                >
                  {(session.user as any).role === "PROFESSOR" ? t("header.students") : t("header.panel")}
                </a>
                {(session.user as any).role === "PROFESSOR" ? (
                  <a
                    href="/profesor/tareas"
                    className={`text-sm font-sans font-medium transition-colors ${
                      isScrolled ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
                    }`}
                  >
                    {t("header.tasks")}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={`text-sm font-sans font-medium transition-colors ${
                    isScrolled ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
                  }`}
                >
                  {t("auth.signOut")}
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className={`text-sm font-sans font-medium transition-colors ${
                  isScrolled ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
                }`}
              >
                {t("header.access")}
              </a>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${isScrolled ? "" : "text-white hover:text-white hover:bg-white/10"}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 bg-background/95 backdrop-blur-md rounded-lg p-4 -mx-4">
            {navItems.map((item) => {
              // Simplificar la lógica para evitar errores de hidratación
              const finalHref = item.isSection ? item.href : getPagePath(item.href);
              
              return (
                <a
                  key={item.href}
                  href={finalHref}
                  className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              )
            })}
            <div className="flex items-center gap-2 pt-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`rounded px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                    language === lang.code
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                  aria-label={`Change language to ${lang.code}`}
                >
                  <span className="mr-1">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>

            {session?.user ? (
              <>
                <a
                  href={(session.user as any).role === "PROFESSOR" ? "/profesor" : "/dashboard"}
                  className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {(session.user as any).role === "PROFESSOR" ? t("header.students") : t("header.panel")}
                </a>
                {(session.user as any).role === "PROFESSOR" ? (
                  <a
                    href="/profesor/tareas"
                    className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("header.tasks")}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="text-left text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut({ callbackUrl: "/" })
                  }}
                >
                  {t("auth.signOut")}
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("header.access")}
              </a>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

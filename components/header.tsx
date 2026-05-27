"use client"

import { useState, useEffect } from "react"
import { Menu, MoreVertical, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { getPagePath } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { NotificationsBell } from "@/components/notifications-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGroupMember, setIsGroupMember] = useState(false)
  const { data: session } = useSession()
  const { language, setLanguage, t } = useLanguage()
  const pathname = usePathname()
  const forceSolidHeader = pathname === "/dashboard" || pathname?.startsWith("/profesor")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const role = (session?.user as any)?.role as string | undefined
    if (!session?.user) {
      setIsGroupMember(false)
      return
    }
    if (role === "PROFESSOR") {
      setIsGroupMember(true)
      return
    }
    ;(async () => {
      try {
        const res = await fetch("/api/membership/request")
        const body = await res.json().catch(() => ({}))
        if (res.ok) {
          setIsGroupMember(Boolean(body?.groupMember))
        }
      } catch {
        // ignore
      }
    })()
  }, [session?.user])

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
        isScrolled || forceSolidHeader ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href={getPagePath("/")} className="flex items-center">
            <span
              className={`text-xl font-sans font-bold transition-colors ${
                isScrolled || forceSolidHeader ? "text-foreground" : "text-white"
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
                    isScrolled || forceSolidHeader ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
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
                      : isScrolled || forceSolidHeader
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
                <NotificationsBell solid={Boolean(isScrolled || forceSolidHeader)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isScrolled || forceSolidHeader ? "" : "text-white hover:text-white hover:bg-white/10"}
                      aria-label="Configuración"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" sideOffset={8} collisionPadding={12}>
                    <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(session.user as any).role === "PROFESSOR" ? (
                      <>
                        <DropdownMenuItem asChild>
                          <a href="/profesor">Panel</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href="/profesor/tareas">Calendario</a>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <a href="/dashboard?tab=perfil">Perfil</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href="/dashboard?tab=avances">Avances</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href="/dashboard?tab=calendario">Calendario</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href="/dashboard?tab=seguridad">Seguridad</a>
                        </DropdownMenuItem>
                        {isGroupMember ? (
                          <DropdownMenuItem asChild>
                            <a href="/dashboard?tab=chat">Chat</a>
                          </DropdownMenuItem>
                        ) : null}
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Editar</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <a href="/noticias/editor">Noticias</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/publicaciones/editor">Artículos</a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        signOut({ callbackUrl: "/" })
                      }}
                    >
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <a
                href="/login"
                className={`text-sm font-sans font-medium transition-colors ${
                  isScrolled || forceSolidHeader ? "text-foreground hover:text-gold" : "text-white hover:text-gold"
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
            className={`md:hidden ${isScrolled || forceSolidHeader ? "" : "text-white hover:text-white hover:bg-white/10"}`}
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Notificaciones</div>
                  <NotificationsBell solid />
                </div>
                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Configuración</div>
                {(session.user as any).role === "PROFESSOR" ? (
                  <>
                    <a
                      href="/profesor"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Panel
                    </a>
                    <a
                      href="/profesor/tareas"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Calendario
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/dashboard?tab=perfil"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Perfil
                    </a>
                    <a
                      href="/dashboard?tab=avances"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Avances
                    </a>
                    <a
                      href="/dashboard?tab=calendario"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Calendario
                    </a>
                    <a
                      href="/dashboard?tab=seguridad"
                      className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Seguridad
                    </a>
                    {isGroupMember ? (
                      <a
                        href="/dashboard?tab=chat"
                        className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Chat
                      </a>
                    ) : null}
                  </>
                )}

                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">Editar</div>
                <a
                  href="/noticias/editor"
                  className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Noticias
                </a>
                <a
                  href="/publicaciones/editor"
                  className="text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Artículos
                </a>
                <button
                  type="button"
                  className="text-left text-sm font-sans font-medium text-foreground hover:text-accent transition-colors"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut({ callbackUrl: "/" })
                  }}
                >
                  Cerrar sesión
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

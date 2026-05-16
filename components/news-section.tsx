"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"
import { getImagePath, getPagePath } from "@/lib/utils"
import { type Language, useLanguage } from "@/components/language-provider"
import { localizeNewsItem } from "@/lib/content-i18n"

interface NewsItem {
  id: number
  title: string
  description: string
  summary: string
  date: string
  dateFormatted?: string
  image: string
  featured: boolean
  category: string
  tags: string[]
  author: string
  readTime: string
  content?: string | null
}

export function NewsSection() {
  const { t, language } = useLanguage()
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const openModal = (id: number) => setExpandedId(id)
  const closeModal = () => setExpandedId(null)
  const modalSeminario: Record<Language, string> = {
    es: "Seguro no sabias que...\n\nLas cristalinas del nucleo del cristalino son algunas de las proteinas mas longevas del organismo humano; muchas nunca se reemplazan desde antes del nacimiento. Con el paso de las decadas sufren modificaciones post-traduccionales acumulativas (oxidacion, deamidacion) que generan pigmentos amarillentos. Este envejecimiento molecular silencioso esta directamente ligado a las cataratas.",
    en: "Did you know?\n\nCrystallins in the lens nucleus are among the longest-lived proteins in the human body; many are never replaced after birth. Over decades, they accumulate post-translational modifications (oxidation, deamidation) that generate yellowish pigments. This silent molecular aging is directly linked to cataracts.",
    fr: "Le saviez-vous ?\n\nLes cristallines du noyau du cristallin font partie des proteines les plus longeves du corps humain ; beaucoup ne sont jamais remplacees apres la naissance. Au fil des decennies, elles accumulent des modifications post-traductionnelles (oxydation, desamidation) qui generent des pigments jaunatres. Ce vieillissement moleculaire silencieux est directement lie aux cataractes.",
  }

  useEffect(() => {
    const loadNews = async () => {
      try {
        let data: any = null
        try {
          const res = await fetch("/api/news")
          if (res.ok) data = await res.json()
        } catch {
          // ignore
        }
        if (!data) {
          const response = await fetch(getImagePath("/Noticias/news.json"))
          data = await response.json()
        }
        // Filtrar solo las noticias destacadas y tomar las 3 más recientes
        const featured = (data.news ?? [])
          .filter((item: NewsItem) => item.featured)
          .sort((a: NewsItem, b: NewsItem) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
        setFeaturedNews(featured)
      } catch (error) {
        console.error('Error loading news:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const todayLabel: Record<Language, string> = {
    es: "Hoy",
    en: "Today",
    fr: "Aujourd'hui",
  }

  const countdownLabel: Record<Language, string> = {
    es: "Empieza en",
    en: "Starts in",
    fr: "Commence dans",
  }

  const getCountdownToToday6pm = (item: NewsItem) => {
    if (item.id !== 2) return null
    const target = new Date(now)
    target.setHours(18, 0, 0, 0)
    const ms = target.getTime() - now.getTime()
    if (ms <= 0) return null
    const total = Math.floor(ms / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  if (loading) {
    return (
      <section id="noticias" className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded mb-4"></div>
              <div className="h-6 bg-muted rounded max-w-2xl mx-auto mb-16"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="noticias" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">{t("news.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">{t("news.highlight")}</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("news.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredNews.map((news: NewsItem) => {
              const localized = localizeNewsItem(news, language)
              const countdown = getCountdownToToday6pm(news)
              return (
              <Card
                key={localized.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openModal(localized.id)}
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={getImagePath(localized.image) || getImagePath("/placeholder.svg")}
                    alt={localized.title}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>{localized.dateFormatted}</span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {localized.category}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-serif">{localized.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {localized.summary}
                  </CardDescription>
                  {countdown && (
                    <div className="mt-3 text-xs font-semibold text-orange-600">
                      {countdownLabel[language]} {countdown}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-xs text-muted-foreground">{localized.readTime} {t("news.readingTime")}</span>
                    <span className="text-xs font-medium text-primary">{countdown ? todayLabel[language] : t("news.featured")}</span>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
          {/* Modal de noticia expandida */}
          <Dialog open={expandedId !== null} onOpenChange={open => !open && closeModal()}>
            {expandedId !== null && (() => {
              const item = featuredNews.find(n => n.id === expandedId)
              if (!item) return null
              const localizedItem = localizeNewsItem(item, language)
              return (
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{localizedItem.title}</DialogTitle>
                    <DialogDescription>{localizedItem.dateFormatted} &middot; {localizedItem.category}</DialogDescription>
                  </DialogHeader>
                  <div className="w-full flex flex-col items-center gap-6">
                    <img
                      src={getImagePath(item.image)}
                      alt={localizedItem.title}
                      className="w-full max-w-lg rounded-lg shadow-lg object-cover"
                      style={{ maxHeight: 350, objectFit: 'cover' }}
                    />
                    <div className="w-full text-base text-foreground whitespace-pre-line">
                      {item.id === 1 ? modalSeminario[language] : (localizedItem.content || localizedItem.description)}
                    </div>
                  </div>
                </DialogContent>
              )
            })()}
          </Dialog>

          {/* Botón Ver Más Noticias */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-accent text-black hover:bg-accent hover:text-accent-foreground bg-transparent font-sans font-medium"
              asChild
            >
              <a href={getPagePath('/noticias')}>
                {t("news.viewAll")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

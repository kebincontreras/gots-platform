"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Calendar, Clock, User } from "lucide-react"
import { getImagePath } from "@/lib/utils"
import { type Language, useLanguage } from "@/components/language-provider"
import { localizeNewsItem } from "@/lib/content-i18n"

interface NewsItem {
  id: number
  title: string
  description: string
  summary: string
  date: string
  dateFormatted: string
  image: string
  featured: boolean
  category: string
  tags: string[]
  author: string
  readTime: string
}

export default function NewsPage() {
  const { language } = useLanguage()
  const [allNews, setAllNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const loadNews = async () => {
      try {
  const response = await fetch(getImagePath('/Noticias/news.json'))
        const data = await response.json()
        // Ordenar por fecha (más recientes primero) y luego por destacadas
        const sorted = data.news.sort((a: NewsItem, b: NewsItem) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          if (dateB !== dateA) return dateB - dateA
          if (a.featured !== b.featured) return a.featured ? -1 : 1
          return 0
        })
        setAllNews(sorted)
        setFilteredNews(sorted)
      } catch (error) {
        console.error('Error loading news:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  useEffect(() => {
    let filtered = allNews

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => localizeNewsItem(item, language).category === categoryFilter)
    }

    setFilteredNews(filtered)
  }, [allNews, categoryFilter, language])

  useEffect(() => {
    setCategoryFilter("all")
  }, [language])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const openModal = (id: number) => setExpandedId(id)
  const closeModal = () => setExpandedId(null)
  const labels: Record<Language, Record<string, string>> = {
    es: {
      title: "Todas las Noticias",
      subtitle: "Explora todas las novedades, logros y actividades de nuestro grupo de investigacion",
      showing: "Mostrando",
      of: "de",
      items: "noticias",
      category: "Categoria",
      allCategories: "Todas las categorias",
      featured: "Destacada",
      today: "Hoy",
      startsIn: "Empieza en",
      readMore: "Leer mas",
      noItems: "No se encontraron noticias con los filtros seleccionados",
    },
    en: {
      title: "All News",
      subtitle: "Explore updates, achievements, and activities from our research group",
      showing: "Showing",
      of: "of",
      items: "news items",
      category: "Category",
      allCategories: "All categories",
      featured: "Featured",
      today: "Today",
      startsIn: "Starts in",
      readMore: "Read more",
      noItems: "No news found with the selected filters",
    },
    fr: {
      title: "Toutes les actualites",
      subtitle: "Explorez toutes les nouveautes, realisations et activites de notre groupe de recherche",
      showing: "Affichage de",
      of: "sur",
      items: "actualites",
      category: "Categorie",
      allCategories: "Toutes les categories",
      featured: "A la une",
      today: "Aujourd'hui",
      startsIn: "Commence dans",
      readMore: "Lire plus",
      noItems: "Aucune actualite ne correspond aux filtres selectionnes",
    },
  }
  const modalSeminario: Record<Language, string> = {
    es: "Seguro no sabias que...\n\nLas cristalinas del nucleo del cristalino son algunas de las proteinas mas longevas del organismo humano; muchas nunca se reemplazan desde antes del nacimiento. Con el paso de las decadas sufren modificaciones post-traduccionales acumulativas (oxidacion, deamidacion) que generan pigmentos amarillentos. Este envejecimiento molecular silencioso esta directamente ligado a las cataratas.",
    en: "Did you know?\n\nCrystallins in the lens nucleus are among the longest-lived proteins in the human body; many are never replaced after birth. Over decades, they accumulate post-translational modifications (oxidation, deamidation) that generate yellowish pigments. This silent molecular aging is directly linked to cataracts.",
    fr: "Le saviez-vous ?\n\nLes cristallines du noyau du cristallin font partie des proteines les plus longeves du corps humain ; beaucoup ne sont jamais remplacees apres la naissance. Au fil des decennies, elles accumulent des modifications post-traductionnelles (oxydation, desamidation) qui generent des pigments jaunatres. Ce vieillissement moleculaire silencieux est directement lie aux cataractes.",
  }
  const l = labels[language]
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

  // Obtener categorías únicas
  const uniqueCategories = [...new Set(allNews.map((item) => localizeNewsItem(item, language).category))].sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-32">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded mb-4"></div>
            <div className="h-6 bg-muted rounded max-w-2xl mx-auto mb-16"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-16 pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              {l.title}
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              {l.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {l.showing} {filteredNews.length} {l.of} {allNews.length} {l.items}
              </div>
              <div className="flex gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={l.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{l.allCategories}</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item: NewsItem) => {
                const localized = localizeNewsItem(item, language)
                const countdown = getCountdownToToday6pm(item)
                return (
                <Card
                  key={localized.id}
                  className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    localized.featured ? 'ring-2 ring-accent/20 bg-accent/5' : ''
                  }`}
                  onClick={() => openModal(localized.id)}
                >
                  {/* Imagen */}
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={getImagePath(localized.image)}
                      alt={localized.title}
                      loading="lazy"
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    />
                    {localized.featured && (
                      <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                        {countdown ? l.today : l.featured}
                      </div>
                    )}
                  </div>
                  {/* Contenido */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{localized.dateFormatted}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {localized.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-serif leading-tight line-clamp-2">
                      {localized.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {localized.summary}
                    </p>
                    {countdown && (
                      <p className="text-xs font-semibold text-orange-600 mb-4">
                        {l.startsIn} {countdown}
                      </p>
                    )}
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {localized.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {localized.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{localized.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{localized.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{localized.readTime}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                        onClick={e => { e.stopPropagation(); openModal(localized.id); }}
                      >
                        {l.readMore}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
            {/* Modal de noticia expandida */}
            <Dialog open={expandedId !== null} onOpenChange={open => !open && closeModal()}>
              {expandedId !== null && (() => {
                const item = filteredNews.find(n => n.id === expandedId)
                if (!item) return null
                const localized = localizeNewsItem(item, language)
                return (
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{localized.title}</DialogTitle>
                      <DialogDescription>{localized.dateFormatted} &middot; {localized.category}</DialogDescription>
                    </DialogHeader>
                    <div className="w-full flex flex-col items-center gap-6">
                      <img
                        src={getImagePath(item.image)}
                        alt={localized.title}
                        className="w-full max-w-lg rounded-lg shadow-lg object-cover"
                        style={{ maxHeight: 350, objectFit: 'cover' }}
                      />
                      <div className="w-full text-base text-foreground whitespace-pre-line">
                        {item.id === 1 ? modalSeminario[language] : (localized.content || localized.description)}
                      </div>
                    </div>
                  </DialogContent>
                )
              })()}
            </Dialog>
            </div>

            {filteredNews.length === 0 && (
              <div className="text-center py-16">
                <div className="text-muted-foreground text-lg">
                  {l.noItems}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

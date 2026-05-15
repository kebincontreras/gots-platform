import type { Language } from "@/components/language-provider"

type NewsFields = {
  title?: string
  summary?: string
  description?: string
  content?: string
  category?: string
  tags?: string[]
}

type TeamFields = {
  cargo?: string | null
  nivelEscolar?: string | null
  institucion?: string | null
  areasInvestigacion?: string[]
}

const NEWS_TRANSLATIONS: Record<number, Record<Language, NewsFields>> = {
  1: {
    es: {
      title: "Seminario: Fundamentos del indice de refraccion en gradiente",
      summary: "Seminario sobre fundamentos del indice de refraccion en gradiente y modelos del cristalino.",
      description:
        "FUNDAMENTOS DEL INDICE DE REFRACCION EN GRADIENTE Y SU INCORPORACION EN MODELOS DEL CRISTALINO. Edif. L.L. Demostraciones 313 - 6:00 - 7:00 P.M. Martes 11 de Noviembre, 2025. Ponente: Sthefania Pinto Basto (Estudiante de Pregrado).",
      content:
        "Seguro no sabias que...\n\nLas cristalinas del nucleo del cristalino son algunas de las proteinas mas longevas del organismo humano; muchas nunca se reemplazan desde antes del nacimiento. Con el paso de las decadas sufren modificaciones post-traduccionales acumulativas (oxidacion, deamidacion) que generan pigmentos amarillentos. Este envejecimiento molecular silencioso esta directamente ligado a las cataratas.",
      category: "Seminario",
      tags: ["seminario", "optica"],
    },
    en: {
      title: "Seminar: Fundamentals of gradient refractive index",
      summary: "Seminar on the fundamentals of gradient refractive index and crystalline lens modeling.",
      description:
        "FUNDAMENTALS OF THE GRADIENT REFRACTIVE INDEX AND ITS INCORPORATION IN CRYSTALLINE LENS MODELS. L.L. Building, Demonstrations Room 313 - 6:00 - 7:00 P.M. Tuesday, November 11, 2025. Speaker: Sthefania Pinto Basto (Undergraduate Student).",
      content:
        "Did you know?\n\nCrystallins in the lens nucleus are among the longest-lived proteins in the human body; many are never replaced after birth. Over decades, they accumulate post-translational modifications (oxidation, deamidation) that generate yellowish pigments. This silent molecular aging is directly linked to cataracts.",
      category: "Seminar",
      tags: ["seminar", "optics"],
    },
    fr: {
      title: "Seminaire : Fondements de l'indice de refraction a gradient",
      summary: "Seminaire sur les fondements de l'indice de refraction a gradient et les modeles du cristallin.",
      description:
        "FONDEMENTS DE L'INDICE DE REFRACTION A GRADIENT ET SON INTEGRATION DANS LES MODELES DU CRISTALLIN. Batiment L.L., salle 313 - 18h00 a 19h00. Mardi 11 novembre 2025. Intervenante : Sthefania Pinto Basto (etudiante de premier cycle).",
      content:
        "Le saviez-vous ?\n\nLes cristallines du noyau du cristallin font partie des proteines les plus longeves du corps humain ; beaucoup ne sont jamais remplacees apres la naissance. Au fil des decennies, elles accumulent des modifications post-traductionnelles (oxydation, desamidation) qui generent des pigments jaunatres. Ce vieillissement moleculaire silencieux est directement lie aux cataractes.",
      category: "Seminaire",
      tags: ["seminaire", "optique"],
    },
  },
}

const TEAM_FIELD_TRANSLATIONS: Record<Language, Record<string, string>> = {
  es: {
    "Director del Grupo": "Director del Grupo",
    Investigador: "Investigador",
    Doctorado: "Doctorado",
    "Estudiante de Doctorado": "Estudiante de Doctorado",
    "Estudiante de Fisica": "Estudiante de Fisica",
    Maestria: "Maestria",
    Pregrado: "Pregrado",
    Bachiller: "Bachiller",
    "Universidad Industrial de Santander": "Universidad Industrial de Santander",
    "Mecanica cuantica": "Mecanica cuantica",
    "Teoria de senales": "Teoria de senales",
    Optica: "Optica",
    Fisica: "Fisica",
    "Percepcion visual": "Percepcion visual",
    "Optimizacion matematica": "Optimizacion matematica",
    "Fisica optica": "Fisica optica",
  },
  en: {
    "Director del Grupo": "Group Director",
    Investigador: "Researcher",
    Doctorado: "PhD",
    "Estudiante de Doctorado": "PhD Student",
    "Estudiante de Fisica": "Physics Student",
    Maestria: "Master's",
    Pregrado: "Undergraduate",
    Bachiller: "High School",
    "Universidad Industrial de Santander": "Industrial University of Santander",
    "Mecanica cuantica": "Quantum Mechanics",
    "Teoria de senales": "Signal Theory",
    Optica: "Optics",
    Fisica: "Physics",
    "Percepcion visual": "Visual Perception",
    "Optimizacion matematica": "Mathematical Optimization",
    "Fisica optica": "Optical Physics",
  },
  fr: {
    "Director del Grupo": "Directeur du groupe",
    Investigador: "Chercheur",
    Doctorado: "Doctorat",
    "Estudiante de Doctorado": "Doctorant",
    "Estudiante de Fisica": "Etudiant en physique",
    Maestria: "Master",
    Pregrado: "Licence",
    Bachiller: "Baccalaureat",
    "Universidad Industrial de Santander": "Universite Industrielle de Santander",
    "Mecanica cuantica": "Mecanique quantique",
    "Teoria de senales": "Theorie des signaux",
    Optica: "Optique",
    Fisica: "Physique",
    "Percepcion visual": "Perception visuelle",
    "Optimizacion matematica": "Optimisation mathematique",
    "Fisica optica": "Physique optique",
  },
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
}

function translateToken(language: Language, value?: string | null) {
  if (!value) return ""
  const dictionary = TEAM_FIELD_TRANSLATIONS[language]
  return dictionary[normalize(value)] ?? value
}

export function getLocale(language: Language) {
  if (language === "fr") return "fr-FR"
  if (language === "en") return "en-US"
  return "es-CO"
}

export function formatDateByLanguage(language: Language, date?: string, fallback?: string) {
  if (!date) return fallback ?? ""
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return fallback ?? ""
  return new Intl.DateTimeFormat(getLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed)
}

export function localizeNewsItem<T extends { id: number; date?: string; dateFormatted?: string; readTime?: string }>(
  item: T & NewsFields,
  language: Language,
) {
  const byId = NEWS_TRANSLATIONS[item.id]?.[language]
  const readMinutes = item.readTime?.match(/\d+/)?.[0]
  return {
    ...item,
    ...byId,
    dateFormatted: formatDateByLanguage(language, item.date, item.dateFormatted),
    readTime: readMinutes ? `${readMinutes} min` : item.readTime,
  }
}

export type TeamLevelKey =
  | "doctorate"
  | "phd_student"
  | "masters"
  | "undergraduate"
  | "physics_student"
  | "high_school"
  | "other"

export function getTeamLevelKey(level?: string | null): TeamLevelKey {
  const key = normalize(level || "").toLowerCase()
  if (key === "doctorado") return "doctorate"
  if (key === "estudiante de doctorado") return "phd_student"
  if (key === "maestria") return "masters"
  if (key === "pregrado") return "undergraduate"
  if (key === "estudiante de fisica") return "physics_student"
  if (key === "bachiller") return "high_school"
  return "other"
}

export function getTeamLevelRank(levelKey: TeamLevelKey) {
  const order: Record<TeamLevelKey, number> = {
    doctorate: 6,
    phd_student: 5,
    masters: 4,
    undergraduate: 3,
    physics_student: 2,
    high_school: 1,
    other: 0,
  }
  return order[levelKey]
}

export function localizeTeamMember<T extends TeamFields>(
  member: T,
  language: Language,
): T & {
  cargo: string
  nivelEscolar: string
  institucion: string
  areasInvestigacion: string[]
} {
  const areas = (member.areasInvestigacion || []).map((area) => translateToken(language, area))
  return {
    ...member,
    cargo: translateToken(language, member.cargo),
    nivelEscolar: translateToken(language, member.nivelEscolar),
    institucion: translateToken(language, member.institucion),
    areasInvestigacion: areas,
  }
}

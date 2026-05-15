"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { getImagePath } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Linkedin, GraduationCap } from "lucide-react"
import { type Language, useLanguage } from "@/components/language-provider"

interface TeamMember {
  id: number
  nombre: string
  apellido: string | null
  programaAcademico?: string | null
  nivelEscolar?: string | null
  email: string
  scholar?: string | null
  linkedin?: string | null
  researchgate?: string | null
  activo: boolean
}

type GroupKey = "profesores" | "doctorado" | "maestria" | "fisica" | "otros"

const GROUP_ORDER: GroupKey[] = ["profesores", "doctorado", "maestria", "fisica", "otros"]

function normalize(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
}

function getProgram(member: TeamMember) {
  return member.programaAcademico || member.nivelEscolar || "Sin programa"
}

function getGroup(program: string): GroupKey {
  const text = normalize(program)
  if (text.includes("PROFESOR")) return "profesores"
  if (text.includes("DOCTORADO")) return "doctorado"
  if (text.includes("MAESTRIA")) return "maestria"
  if (text.includes("FISICA")) return "fisica"
  return "otros"
}

const TEAM_PHOTOS = [
  "/team/Alejandro Hernández/IMG_1364.jpg",
  "/team/Ambar Nirvana/IMG_1189.jpg",
  "/team/Angie Sandoval (Confley)/IMG_1043.jpg",
  "/team/Angie Solano/IMG_1109.jpg",
  "/team/Carlos Beltrán/IMG_1184.jpg",
  "/team/Cristian Cely (Critian)/IMG_1141.jpg",
  "/team/Jefferson Serrano/IMG_1174.jpg",
  "/team/Juan Andres Guarin Rojas/JuanAndresGuarinRojas.jpeg",
  "/team/Juan Reyes /IMG_1066.jpg",
  "/team/Kebin/Kebin.jpg",
  "/team/Jaime meneses/Jaime meneses.png",
  "/team/Laura Almeidaa/IMG_1410.jpg",
  "/team/lizaraso/lizaraso.png",
  "/team/Mafe Estupiñan/IMG_1513.jpg",
  "/team/Miguel Jafert (Goofy)/IMG_1107.jpg",
  "/team/Rafael torres amaris/Rafael.JPG",
  "/team/Sofía Cárdenas/IMG_1025.jpg",
  "/team/Steven Marin/IMG_1154.jpg",
  "/team/yesid torres moreno/yesid.png",
  "/team/arturo plaza gomez/arturo.png",
]

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((x) => x.length >= 3)
}

function tokenSimilarity(a: string, b: string) {
  if (a === b) return 1
  if (a.startsWith(b) || b.startsWith(a)) return 0.8
  return 0
}

function folderNameFromPath(path: string) {
  const parts = path.split("/")
  return parts[2] || ""
}

function matchScore(memberName: string, folderName: string) {
  const memberTokens = tokenize(memberName)
  const folderTokens = tokenize(folderName)
  let score = 0

  for (const mt of memberTokens) {
    let best = 0
    for (const ft of folderTokens) {
      best = Math.max(best, tokenSimilarity(mt, ft))
    }
    score += best
  }

  return score
}

function getPhotoForMember(member: TeamMember) {
  const fullName = `${member.nombre} ${member.apellido || ""}`.trim()
  const normalizedName = normalize(fullName)

  // Alias rules for known Excel/folder naming differences.
  const aliases: Record<string, string> = {
    "ARTURO PLATA GOMEZ": "/team/arturo plaza gomez/arturo.png",
    "JAIME MENESES FONSECA": "/team/Jaime meneses/Jaime meneses.png",
    "ZADRUA YOANA LIZARAZO MEJIA": "/team/lizaraso/lizaraso.png",
    "FABIAN STEVEN MARIN MORENO": "/team/Steven Marin/IMG_1154.jpg",
    "YESID TORRES MORENO": "/team/yesid torres moreno/yesid.png",
    "YEZI TORRES MORENO": "/team/yesid torres moreno/yesid.png",
    "KEBIN CONTRERAS": "/team/Kebin/Kebin.jpg",
    "ANUAR NIRVANA RODRIGUEZ PEREZ": "/team/Ambar Nirvana/IMG_1189.jpg",
    "MARIA SOFIA CARDENAS SANCHO": "/team/Sofía Cárdenas/IMG_1025.jpg",
    "MIGUEL JAIFER SERRANO MANTILLA": "/team/Miguel Jafert (Goofy)/IMG_1107.jpg",
    "SILVIA ALEJANDRA GOMEZ RODRIGUEZ": "/team/Laura Almeidaa/IMG_1410.jpg",
    "SHARITH DAYANA PINZON QUINTERO": "/team/Mafe Estupiñan/IMG_1513.jpg",
  }
  if (aliases[normalizedName]) return aliases[normalizedName]

  let bestPath = "/placeholder-user.jpg"
  let bestScore = 0

  for (const photoPath of TEAM_PHOTOS) {
    const folderName = folderNameFromPath(photoPath)
    const score = matchScore(fullName, folderName)
    if (score > bestScore) {
      bestScore = score
      bestPath = photoPath
    }
  }

  // Keep placeholder when confidence is low.
  if (bestScore < 1.6) return "/placeholder-user.jpg"
  return bestPath
}

function getMemberProfileLinks(member: TeamMember) {
  const fullName = `${member.nombre} ${member.apellido || ""}`.trim()
  const q = encodeURIComponent(fullName)

  return {
    mailto: `mailto:${member.email}`,
    linkedin: member.linkedin || `https://www.linkedin.com/search/results/all/?keywords=${q}`,
    researchgate: member.researchgate || `https://www.researchgate.net/search/researcher?q=${q}`,
    scholar: member.scholar || `https://scholar.google.com/scholar?q=${q}`,
  }
}

export default function EquipoPage() {
  const { language } = useLanguage()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const ui: Record<Language, { teamTitle: string; loading: string; groupLabels: Record<GroupKey, string>; mailAria: string }> = {
    es: {
      teamTitle: "Equipo",
      loading: "Cargando equipo...",
      groupLabels: {
        profesores: "Profesores",
        doctorado: "Estudiantes Doctorado",
        maestria: "Estudiantes Maestria",
        fisica: "Estudiantes Fisica",
        otros: "Otros",
      },
      mailAria: "Enviar correo",
    },
    en: {
      teamTitle: "Team",
      loading: "Loading team...",
      groupLabels: {
        profesores: "Professors",
        doctorado: "Doctoral Students",
        maestria: "Master's Students",
        fisica: "Physics Students",
        otros: "Others",
      },
      mailAria: "Send email",
    },
    fr: {
      teamTitle: "Equipe",
      loading: "Chargement de l'equipe...",
      groupLabels: {
        profesores: "Professeurs",
        doctorado: "Etudiants en doctorat",
        maestria: "Etudiants en master",
        fisica: "Etudiants en physique",
        otros: "Autres",
      },
      mailAria: "Envoyer un e-mail",
    },
  }
  const labels = ui[language]

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await fetch(getImagePath("/equipo.json"))
        const data = await response.json()
        const active = (data.team as TeamMember[]).filter((member) => member.activo)
        setTeamMembers(active)
      } catch (error) {
        console.error("Error loading team:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [])

  const grouped = useMemo(() => {
    const buckets: Record<GroupKey, TeamMember[]> = {
      profesores: [],
      doctorado: [],
      maestria: [],
      fisica: [],
      otros: [],
    }

    for (const member of teamMembers) {
      buckets[getGroup(getProgram(member))].push(member)
    }

    for (const key of GROUP_ORDER) {
      buckets[key].sort((a, b) => {
        const aHasPhoto = getPhotoForMember(a) !== "/placeholder-user.jpg"
        const bHasPhoto = getPhotoForMember(b) !== "/placeholder-user.jpg"
        if (aHasPhoto !== bHasPhoto) return aHasPhoto ? -1 : 1

        if (key === "profesores") {
          const aName = normalize(`${a.nombre} ${a.apellido || ""}`)
          const bName = normalize(`${b.nombre} ${b.apellido || ""}`)
          const aProgram = normalize(getProgram(a))
          const bProgram = normalize(getProgram(b))

          const aIsRafael = aName.includes("RAFAEL") && aName.includes("TORRES")
          const bIsRafael = bName.includes("RAFAEL") && bName.includes("TORRES")
          if (aIsRafael && !bIsRafael) return -1
          if (!aIsRafael && bIsRafael) return 1

          const aIsCatedra = aProgram.includes("CATEDRA")
          const bIsCatedra = bProgram.includes("CATEDRA")
          if (aIsCatedra !== bIsCatedra) return aIsCatedra ? 1 : -1
        }

        const aName = `${a.nombre} ${a.apellido || ""}`.trim().toLowerCase()
        const bName = `${b.nombre} ${b.apellido || ""}`.trim().toLowerCase()
        return aName.localeCompare(bName)
      })
    }

    return buckets
  }, [teamMembers])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary text-primary-foreground py-16 pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">{labels.teamTitle}</h1>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-10">
            {loading && (
              <div className="text-center text-muted-foreground">{labels.loading}</div>
            )}

            {!loading && GROUP_ORDER.map((group) => {
              const members = grouped[group]
              if (members.length === 0) return null

              return (
                <section key={group} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-6 py-4 border-b bg-secondary/60">
                    <h2 className="text-2xl font-serif font-bold">
                      {labels.groupLabels[group]} ({members.length})
                    </h2>
                  </div>

                  <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {members.map((member) => {
                      const fullName = `${member.nombre} ${member.apellido || ""}`.trim()
                      const imagePath = getPhotoForMember(member)
                      return (
                        <article
                          key={member.id}
                          className="rounded-xl border border-border bg-background overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setSelectedMember(member)}
                        >
                          <div className="aspect-[4/3] bg-muted overflow-hidden">
                            <img
                              src={getImagePath(imagePath)}
                              alt={fullName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = getImagePath("/placeholder-user.jpg")
                              }}
                            />
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="font-semibold leading-tight">{fullName}</h3>
                            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              {getProgram(member)}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            <Dialog open={selectedMember !== null} onOpenChange={(open) => !open && setSelectedMember(null)}>
              {selectedMember && (
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {`${selectedMember.nombre} ${selectedMember.apellido || ""}`.trim()}
                    </DialogTitle>
                    <DialogDescription>{getProgram(selectedMember)}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="w-full rounded-lg overflow-hidden bg-muted">
                      <img
                        src={getImagePath(getPhotoForMember(selectedMember))}
                        alt={`${selectedMember.nombre} ${selectedMember.apellido || ""}`.trim()}
                        className="w-full h-auto max-h-[420px] object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getImagePath("/placeholder-user.jpg")
                        }}
                      />
                    </div>
                    {(() => {
                      const links = getMemberProfileLinks(selectedMember)
                      return (
                        <div className="flex items-center justify-center gap-5 py-2">
                          <a
                            href={links.mailto}
                            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
                            aria-label={labels.mailAria}
                            title={labels.mailAria}
                          >
                            <Mail className="h-8 w-8 text-red-600" />
                          </a>
                          <a
                            href={links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
                            aria-label="LinkedIn"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-8 w-8 text-[#0A66C2]" />
                          </a>
                          <a
                            href={links.researchgate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
                            aria-label="ResearchGate"
                            title="ResearchGate"
                          >
                            <span className="text-lg font-extrabold text-[#00CCBB]">RG</span>
                          </a>
                          <a
                            href={links.scholar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
                            aria-label="Google Scholar"
                            title="Google Scholar"
                          >
                            <GraduationCap className="h-8 w-8 text-[#1A73E8]" />
                          </a>
                        </div>
                      )
                    })()}
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}

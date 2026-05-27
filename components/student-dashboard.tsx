"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LinksForm } from "@/components/links-form"
import { TasksPanel } from "@/components/tasks-panel"
import { useLanguage } from "@/components/language-provider"
import { MembershipRequestCard } from "@/components/membership-request-card"
import { ProfileForm, type ProfileDraft, type ProfessorOption } from "@/components/profile-form"
import { GroupChat } from "@/components/group-chat"
import { SecurityForm } from "@/components/security-form"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"

export function StudentDashboard({
  userId,
  name,
  driveEmbedUrl,
  docEmbedUrl,
  groupMember,
  pendingMembershipRequest,
  initialProfile,
  professors,
  legacyDirectorNames,
}: {
  userId: string
  name: string
  driveEmbedUrl: string | null
  docEmbedUrl: string | null
  groupMember: boolean
  pendingMembershipRequest: { id: string; createdAt: string } | null
  initialProfile: ProfileDraft
  professors: ProfessorOption[]
  legacyDirectorNames: string[]
}) {
  const { t } = useLanguage()
  const greeting = t("dashboard.studentGreeting").replace("{name}", name)
  const hasAdvances = Boolean(driveEmbedUrl || docEmbedUrl)
  const advancesLabel = useMemo(() => (hasAdvances ? "Avances" : "Avances (sin enlaces)"), [hasAdvances])
  const [active, setActive] = useState<"perfil" | "seguridad" | "avances" | "calendario" | "chat">("perfil")
  const params = useSearchParams()

  // Allow deep-links like /dashboard?tab=avances
  const tabParam = (params.get("tab") ?? "").toLowerCase()
  const allowedTabs = useMemo(
    () => new Set(["perfil", "seguridad", "avances", "calendario", "chat"]),
    [],
  )

  // Sync with URL changes (e.g. /dashboard?tab=avances)
  useEffect(() => {
    if (allowedTabs.has(tabParam as any)) {
      if (tabParam === "chat" && !groupMember) return
      setActive(tabParam as any)
    }
  }, [allowedTabs, tabParam, groupMember])

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">{t("dashboard.studentPanel")}</h1>
        <p className="text-muted-foreground mt-1">{greeting}</p>

        <div className="mt-6 grid gap-6">
          <MembershipRequestCard groupMember={groupMember} pending={pendingMembershipRequest} />

          <Tabs value={active} onValueChange={(v: any) => setActive(v)}>
            <TabsContent value="perfil">
              <div className="rounded-xl border p-5">
                <h2 className="font-semibold">Perfil</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura tu información para aparecer en la sección Equipo.
                </p>
                <div className="mt-4">
                  <ProfileForm initial={initialProfile} professors={professors} legacyDirectorNames={legacyDirectorNames} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seguridad">
              <div className="rounded-xl border p-5">
                <h2 className="font-semibold">Seguridad</h2>
                <p className="text-sm text-muted-foreground mt-1">Cambiar contraseña.</p>
                <div className="mt-4">
                  <SecurityForm />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avances">
              <div className="rounded-xl border p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{advancesLabel}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aquí se muestran tu PPT y tu Doc (si los has agregado).
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-6">
                  <div className="rounded-lg border p-4">
                    <div className="font-medium">{t("dashboard.linksTitle")}</div>
                    <div className="text-sm text-muted-foreground mt-1">{t("dashboard.linksDesc")}</div>
                    <div className="mt-3">
                      <LinksForm initialPptUrl={driveEmbedUrl ?? ""} initialDocUrl={docEmbedUrl ?? ""} />
                    </div>
                  </div>

                  {driveEmbedUrl ? (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="px-5 py-3 border-b">
                        <h3 className="font-semibold">{t("dashboard.previewTitle")}</h3>
                      </div>
                      <iframe title="Drive preview" src={driveEmbedUrl} className="w-full h-[70vh]" allow="autoplay" />
                    </div>
                  ) : null}
                  {docEmbedUrl ? (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="px-5 py-3 border-b">
                        <h3 className="font-semibold">{t("dashboard.docPreviewTitle")}</h3>
                      </div>
                      <iframe title="Document preview" src={docEmbedUrl} className="w-full h-[70vh]" />
                    </div>
                  ) : null}
                  {!driveEmbedUrl && !docEmbedUrl ? (
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">{t("dashboard.noLinkYet")}</div>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendario">
              <div className="rounded-xl border p-5">
                <h2 className="font-semibold">{t("dashboard.calendarTitle")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("dashboard.calendarDesc")}</p>
                <div className="mt-4">
                  <TasksPanel canEdit forUserId={userId} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat">
              {groupMember ? (
                <div className="rounded-xl border p-5">
                  <h2 className="font-semibold">Chat del grupo</h2>
                  <p className="text-sm text-muted-foreground mt-1">Solo visible para miembros aceptados.</p>
                  <div className="mt-4">
                    <GroupChat />
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </main>
  )
}

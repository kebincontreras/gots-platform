"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LinksForm } from "@/components/links-form"
import { TasksPanel } from "@/components/tasks-panel"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { MembershipRequestCard } from "@/components/membership-request-card"
import { ProfileForm, type ProfileDraft, type ProfessorOption } from "@/components/profile-form"
import { GroupChat } from "@/components/group-chat"

export function StudentDashboard({
  userId,
  name,
  driveEmbedUrl,
  docEmbedUrl,
  groupMember,
  pendingMembershipRequest,
  initialProfile,
  professors,
}: {
  userId: string
  name: string
  driveEmbedUrl: string | null
  docEmbedUrl: string | null
  groupMember: boolean
  pendingMembershipRequest: { id: string; createdAt: string } | null
  initialProfile: ProfileDraft
  professors: ProfessorOption[]
}) {
  const { t } = useLanguage()
  const greeting = t("dashboard.studentGreeting").replace("{name}", name)
  const [showEditLinks, setShowEditLinks] = useState(false)
  const hasAdvances = Boolean(driveEmbedUrl || docEmbedUrl)
  const advancesLabel = useMemo(() => (hasAdvances ? "Avances" : "Avances (sin enlaces)"), [hasAdvances])

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">{t("dashboard.studentPanel")}</h1>
        <p className="text-muted-foreground mt-1">{greeting}</p>

        <div className="mt-6 grid gap-6">
          <MembershipRequestCard groupMember={groupMember} pending={pendingMembershipRequest} />

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">Perfil</h2>
            <p className="text-sm text-muted-foreground mt-1">Configura tu información para aparecer en la sección Equipo.</p>
            <div className="mt-4">
              <ProfileForm initial={initialProfile} professors={professors} />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{t("dashboard.linksTitle")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("dashboard.linksDesc")}</p>
              </div>
              <Button variant="outline" onClick={() => setShowEditLinks((v) => !v)}>
                {showEditLinks ? "Ocultar" : "Editar enlaces"}
              </Button>
            </div>
            <div className="mt-4">
              {showEditLinks ? (
                <LinksForm initialPptUrl={driveEmbedUrl ?? ""} initialDocUrl={docEmbedUrl ?? ""} />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {hasAdvances ? "Enlaces guardados." : "Aún no has agregado enlaces. Usa “Editar enlaces”."}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">{t("dashboard.calendarTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.calendarDesc")}</p>
            <div className="mt-4">
              <TasksPanel canEdit forUserId={userId} />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">{advancesLabel}</h2>
            <p className="text-sm text-muted-foreground mt-1">Aquí se muestran tu PPT y tu Doc (si los has agregado).</p>
            <div className="mt-4 grid gap-6">
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

          {groupMember ? (
            <div className="rounded-xl border p-5">
              <h2 className="font-semibold">Chat del grupo</h2>
              <p className="text-sm text-muted-foreground mt-1">Solo visible para miembros aceptados.</p>
              <div className="mt-4">
                <GroupChat />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </main>
  )
}

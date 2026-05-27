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
import { SecurityForm } from "@/components/security-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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
  const hasAdvances = Boolean(driveEmbedUrl || docEmbedUrl)
  const advancesLabel = useMemo(() => (hasAdvances ? "Avances" : "Avances (sin enlaces)"), [hasAdvances])
  const [active, setActive] = useState<"perfil" | "seguridad" | "avances" | "calendario" | "chat">("perfil")
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">{t("dashboard.studentPanel")}</h1>
        <p className="text-muted-foreground mt-1">{greeting}</p>

        <div className="mt-6 grid gap-6">
          <MembershipRequestCard groupMember={groupMember} pending={pendingMembershipRequest} />

          <div className="flex items-center justify-between gap-3">
            <Tabs value={active} onValueChange={(v: any) => setActive(v)} className="hidden md:flex">
              <TabsList>
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
                <TabsTrigger value="avances">Avances</TabsTrigger>
                <TabsTrigger value="calendario">Calendario</TabsTrigger>
                {groupMember ? <TabsTrigger value="chat">Chat</TabsTrigger> : null}
              </TabsList>
            </Tabs>

            <div className="md:hidden">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Panel</SheetTitle>
                  </SheetHeader>
                  <div className="p-4 grid gap-2">
                    {(
                      [
                        ["perfil", "Perfil"],
                        ["seguridad", "Seguridad"],
                        ["avances", "Avances"],
                        ["calendario", "Calendario"],
                        ...(groupMember ? ([["chat", "Chat"]] as any) : []),
                      ] as Array<[any, string]>
                    ).map(([k, label]) => (
                      <Button
                        key={k}
                        variant={active === k ? "default" : "outline"}
                        onClick={() => {
                          setActive(k)
                          setMenuOpen(false)
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <Tabs value={active} onValueChange={(v: any) => setActive(v)}>
            <TabsContent value="perfil">
              <div className="rounded-xl border p-5">
                <h2 className="font-semibold">Perfil</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura tu información para aparecer en la sección Equipo.
                </p>
                <div className="mt-4">
                  <ProfileForm initial={initialProfile} professors={professors} />
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

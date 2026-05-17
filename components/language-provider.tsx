"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Language = "fr" | "es" | "en"

type TranslationKey =
  | "nav.home"
  | "nav.news"
  | "nav.publications"
  | "nav.team"
  | "hero.subtitle"
  | "hero.viewPublications"
  | "hero.contactUs"
  | "hero.researchAreas"
  | "news.title"
  | "news.highlight"
  | "news.description"
  | "news.readingTime"
  | "news.featured"
  | "news.viewAll"
  | "publications.title"
  | "publications.highlight"
  | "publications.description"
  | "publications.viewMore"
  | "publications.viewAll"
  | "contact.title"
  | "contact.subtitle"
  | "contact.infoTitle"
  | "contact.infoDescription"
  | "contact.address"
  | "contact.phone"
  | "contact.socialTitle"
  | "contact.socialDescription"
  | "contact.hoursTitle"
  | "contact.weekdays"
  | "contact.weekend"
  | "contact.closed"
  | "contact.connectTitle"
  | "contact.connectDescription"
  | "contact.sendEmail"
  | "contact.findUs"
  | "contact.viewOnMaps"
  | "contact.projectTitle"
  | "contact.projectDescription"
  | "contact.proposeCollab"
  | "contact.viewWork"
  | "footer.quickLinks"
  | "footer.followUs"
  | "footer.rights"
  | "auth.loginTitle"
  | "auth.loginSubtitle"
  | "auth.registerTitle"
  | "auth.registerSubtitle"
  | "auth.email"
  | "auth.password"
  | "auth.name"
  | "auth.passwordMin"
  | "auth.confirmEmail"
  | "auth.confirmPassword"
  | "auth.mismatchEmail"
  | "auth.mismatchPassword"
  | "auth.signIn"
  | "auth.signOut"
  | "auth.entering"
  | "auth.creating"
  | "auth.noAccount"
  | "auth.haveAccount"
  | "auth.createAccount"
  | "auth.invalidCredentials"
  | "header.access"
  | "header.panel"
  | "header.students"
  | "header.tasks"
  | "header.newsEditor"
  | "header.publicationsEditor"
  | "header.edit"
  | "dashboard.studentPanel"
  | "dashboard.studentGreeting"
  | "dashboard.linksTitle"
  | "dashboard.linksDesc"
  | "dashboard.calendarTitle"
  | "dashboard.calendarDesc"
  | "dashboard.previewTitle"
  | "dashboard.docPreviewTitle"
  | "dashboard.noLinkYet"
  | "drive.savedLink"
  | "drive.edit"
  | "drive.cancel"
  | "drive.save"
  | "drive.saving"
  | "drive.saved"
  | "drive.placeholder"
  | "doc.savedLink"
  | "doc.edit"
  | "doc.cancel"
  | "doc.save"
  | "doc.saving"
  | "doc.saved"
  | "doc.placeholder"
  | "links.pptLabel"
  | "links.docLabel"
  | "links.pptPlaceholder"
  | "links.docPlaceholder"
  | "links.save"
  | "links.saving"
  | "links.saved"
  | "links.reset"
  | "tasks.calendar"
  | "tasks.selectedDate"
  | "tasks.tasksFor"
  | "tasks.weeklyDesc"
  | "tasks.refresh"
  | "tasks.loading"
  | "tasks.addTask"
  | "tasks.title"
  | "tasks.descriptionOptional"
  | "tasks.add"
  | "tasks.saving"
  | "tasks.noTasks"
  | "tasks.createdAt"
  | "tasks.dueDate"

const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    "nav.home": "Accueil",
    "nav.news": "Actualites",
    "nav.publications": "Publications",
    "nav.team": "Equipe",
    "hero.subtitle": "Groupe d'Optique et de Traitement du Signal (GOTS)",
    "hero.viewPublications": "Voir les publications",
    "hero.contactUs": "Nous contacter",
    "hero.researchAreas": "Axes de recherche",
    "news.title": "Actualites",
    "news.highlight": "A la une",
    "news.description":
      "Restez informe des dernieres nouveautes et des realisations les plus importantes de notre groupe de recherche.",
    "news.readingTime": "de lecture",
    "news.featured": "A la une",
    "news.viewAll": "Voir toutes les actualites",
    "publications.title": "Publications",
    "publications.highlight": "A la une",
    "publications.description":
      "Explorez nos contributions scientifiques les plus pertinentes dans des revues et conferences internationales.",
    "publications.viewMore": "Voir plus",
    "publications.viewAll": "Voir toutes les publications",
    "contact.title": "Contact",
    "contact.subtitle":
      "Interesse par une collaboration ou envie d'en savoir plus sur notre travail ? Contactez-nous.",
    "contact.infoTitle": "Informations de contact",
    "contact.infoDescription": "Nous sommes situes a l'Universite Industrielle de Santander.",
    "contact.address": "Adresse",
    "contact.phone": "Telephone",
    "contact.socialTitle": "Suivez-nous sur les reseaux",
    "contact.socialDescription": "Restez a jour avec nos dernieres recherches.",
    "contact.hoursTitle": "Horaires d'ouverture",
    "contact.weekdays": "Lun - Ven",
    "contact.weekend": "Sam - Dim",
    "contact.closed": "Ferme",
    "contact.connectTitle": "Connectez-vous avec nous",
    "contact.connectDescription": "Moyens directs de nous contacter et de nous rendre visite.",
    "contact.sendEmail": "Envoyer un email",
    "contact.findUs": "Nous localiser",
    "contact.viewOnMaps": "Voir sur Google Maps",
    "contact.projectTitle": "Vous avez un projet en tete ?",
    "contact.projectDescription":
      "Nous sommes interesses par les collaborations academiques, les projets de recherche et les opportunites d'echange scientifique.",
    "contact.proposeCollab": "Proposer une collaboration",
    "contact.viewWork": "Voir notre travail",
    "footer.quickLinks": "Liens rapides",
    "footer.followUs": "Suivez-nous",
    "footer.rights": "Tous droits reserves.",

    "auth.loginTitle": "Connexion",
    "auth.loginSubtitle": "Accedez avec votre compte du groupe.",
    "auth.registerTitle": "Creer un compte",
    "auth.registerSubtitle": "Compte prive pour televerser votre avancement (Drive).",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.name": "Nom",
    "auth.passwordMin": "Mot de passe (min. 8)",
    "auth.confirmEmail": "Confirmer l'email",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.mismatchEmail": "Les emails ne correspondent pas.",
    "auth.mismatchPassword": "Les mots de passe ne correspondent pas.",
    "auth.signIn": "Se connecter",
    "auth.signOut": "Se deconnecter",
    "auth.entering": "Connexion...",
    "auth.creating": "Creation...",
    "auth.noAccount": "Pas de compte ?",
    "auth.haveAccount": "Deja un compte ?",
    "auth.createAccount": "Creer un compte",
    "auth.invalidCredentials": "Identifiants invalides.",

    "header.access": "Acceder",
    "header.panel": "Panel",
    "header.students": "Estudiantes",
    "header.tasks": "Taches",
    "header.newsEditor": "Nouvelles",
    "header.publicationsEditor": "Publications",
    "header.edit": "Editer",

    "dashboard.studentPanel": "Espace etudiant",
    "dashboard.studentGreeting": "Bonjour, {name}. Ici vous pouvez coller le lien de votre presentation.",
    "dashboard.linksTitle": "Liens (PPT et Doc)",
    "dashboard.linksDesc":
      "Collez vos liens : PPT (Drive/Slides) puis Doc (Google Docs). Vous pouvez aussi coller les deux d'un coup.",
    "dashboard.calendarTitle": "Calendrier et taches",
    "dashboard.calendarDesc": "Consultez ce que vous devez presenter a chaque reunion.",
    "dashboard.previewTitle": "Apercu",
    "dashboard.docPreviewTitle": "Apercu du document",
    "dashboard.noLinkYet": "Vous n'avez pas encore ajoute de lien.",

    "drive.savedLink": "Lien enregistre",
    "drive.edit": "Modifier",
    "drive.cancel": "Annuler",
    "drive.save": "Enregistrer",
    "drive.saving": "Enregistrement...",
    "drive.saved": "Enregistre.",
    "drive.placeholder":
      "Drive: https://drive.google.com/file/d/.../preview | Slides: https://docs.google.com/presentation/d/.../edit",

    "doc.savedLink": "Lien enregistre",
    "doc.edit": "Modifier",
    "doc.cancel": "Annuler",
    "doc.save": "Enregistrer",
    "doc.saving": "Enregistrement...",
    "doc.saved": "Enregistre.",
    "doc.placeholder":
      "Docs: https://docs.google.com/document/d/.../edit | Drive: https://drive.google.com/file/d/.../preview",

    "links.pptLabel": "PPT (Drive/Slides)",
    "links.docLabel": "Doc (Google Docs)",
    "links.pptPlaceholder":
      "Collez l'URL du PPT... (Drive ou Slides)",
    "links.docPlaceholder":
      "Collez l'URL du Doc... (Google Docs ou fichier Drive)",
    "links.save": "Enregistrer",
    "links.saving": "Enregistrement...",
    "links.saved": "Enregistre.",
    "links.reset": "Reinitialiser",

    "tasks.calendar": "Calendrier",
    "tasks.selectedDate": "Date selectionnee",
    "tasks.tasksFor": "Taches pour {date}",
    "tasks.weeklyDesc": "Ce qui doit etre presente lors de la reunion hebdomadaire.",
    "tasks.refresh": "Actualiser",
    "tasks.loading": "Chargement...",
    "tasks.addTask": "Ajouter une tache",
    "tasks.title": "Titre",
    "tasks.descriptionOptional": "Description (optionnel)",
    "tasks.add": "Ajouter",
    "tasks.saving": "Enregistrement...",
    "tasks.noTasks": "Aucune tache pour cette date.",
    "tasks.createdAt": "Cree",
    "tasks.dueDate": "A rendre",
  },
  es: {
    "nav.home": "Inicio",
    "nav.news": "Noticias",
    "nav.publications": "Publicaciones",
    "nav.team": "Equipo",
    "hero.subtitle": "Grupo de Optica y Tratamiento de Senales (GOTS)",
    "hero.viewPublications": "Ver Publicaciones",
    "hero.contactUs": "Contactanos",
    "hero.researchAreas": "Ramas de investigacion",
    "news.title": "Noticias",
    "news.highlight": "Destacadas",
    "news.description":
      "Mantente al dia con las ultimas novedades y logros mas importantes de nuestro grupo de investigacion.",
    "news.readingTime": "de lectura",
    "news.featured": "Destacada",
    "news.viewAll": "Ver Todas las Noticias",
    "publications.title": "Publicaciones",
    "publications.highlight": "Destacadas",
    "publications.description":
      "Explora nuestras contribuciones cientificas mas relevantes en revistas y conferencias internacionales.",
    "publications.viewMore": "Ver mas",
    "publications.viewAll": "Ver Todas las Publicaciones",
    "contact.title": "Contacto",
    "contact.subtitle": "Interesado en colaborar o conocer mas sobre nuestro trabajo? Contactanos.",
    "contact.infoTitle": "Informacion de Contacto",
    "contact.infoDescription": "Estamos ubicados en la Universidad Industrial de Santander.",
    "contact.address": "Direccion",
    "contact.phone": "Telefono",
    "contact.socialTitle": "Siguenos en Redes Sociales",
    "contact.socialDescription": "Mantente al dia con nuestras ultimas investigaciones.",
    "contact.hoursTitle": "Horario de Atencion",
    "contact.weekdays": "Lun - Vie",
    "contact.weekend": "Sab - Dom",
    "contact.closed": "Cerrado",
    "contact.connectTitle": "Conecta con Nosotros",
    "contact.connectDescription": "Formas directas de contactarnos y visitarnos.",
    "contact.sendEmail": "Enviar un Email",
    "contact.findUs": "Ubicanos",
    "contact.viewOnMaps": "Ver en Google Maps",
    "contact.projectTitle": "Tienes un proyecto en mente?",
    "contact.projectDescription":
      "Estamos interesados en colaboraciones academicas, proyectos de investigacion y oportunidades de intercambio cientifico.",
    "contact.proposeCollab": "Proponer Colaboracion",
    "contact.viewWork": "Ver Nuestro Trabajo",
    "footer.quickLinks": "Enlaces Rapidos",
    "footer.followUs": "Siguenos",
    "footer.rights": "Todos los derechos reservados.",

    "auth.loginTitle": "Iniciar sesión",
    "auth.loginSubtitle": "Accede con tu cuenta del grupo.",
    "auth.registerTitle": "Crear cuenta",
    "auth.registerSubtitle": "Cuenta privada para subir tu avance (Drive).",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.name": "Nombre",
    "auth.passwordMin": "Contraseña (mín. 8)",
    "auth.confirmEmail": "Confirmar email",
    "auth.confirmPassword": "Confirmar contraseña",
    "auth.mismatchEmail": "Los correos no coinciden.",
    "auth.mismatchPassword": "Las contraseñas no coinciden.",
    "auth.signIn": "Entrar",
    "auth.signOut": "Salir",
    "auth.entering": "Entrando...",
    "auth.creating": "Creando...",
    "auth.noAccount": "¿No tienes cuenta?",
    "auth.haveAccount": "¿Ya tienes cuenta?",
    "auth.createAccount": "Crear cuenta",
    "auth.invalidCredentials": "Credenciales inválidas.",

    "header.access": "Acceder",
    "header.panel": "Panel",
    "header.students": "Estudiantes",
    "header.tasks": "Tareas",
    "header.newsEditor": "Editar noticias",
    "header.publicationsEditor": "Editar publicaciones",
    "header.edit": "Editar",

    "dashboard.studentPanel": "Panel de estudiante",
    "dashboard.studentGreeting": "Hola, {name}. Aquí puedes pegar el enlace de tu presentación.",
    "dashboard.linksTitle": "Enlaces (PPT y Doc)",
    "dashboard.linksDesc":
      "Pega tus enlaces: primero el PPT (Drive/Slides) y luego el Doc (Google Docs). También puedes pegar ambos de una vez.",
    "dashboard.calendarTitle": "Calendario y tareas",
    "dashboard.calendarDesc": "Revisa lo que debes presentar en cada reunión.",
    "dashboard.previewTitle": "Vista previa",
    "dashboard.docPreviewTitle": "Vista previa del documento",
    "dashboard.noLinkYet": "Aún no has agregado un enlace.",

    "drive.savedLink": "Enlace guardado",
    "drive.edit": "Editar",
    "drive.cancel": "Cancelar",
    "drive.save": "Guardar",
    "drive.saving": "Guardando...",
    "drive.saved": "Guardado.",
    "drive.placeholder":
      "Drive: https://drive.google.com/file/d/.../preview | Slides: https://docs.google.com/presentation/d/.../edit",

    "doc.savedLink": "Enlace guardado",
    "doc.edit": "Editar",
    "doc.cancel": "Cancelar",
    "doc.save": "Guardar",
    "doc.saving": "Guardando...",
    "doc.saved": "Guardado.",
    "doc.placeholder":
      "Docs: https://docs.google.com/document/d/.../edit | Drive: https://drive.google.com/file/d/.../preview",

    "links.pptLabel": "PPT (Drive/Slides)",
    "links.docLabel": "Doc (Google Docs)",
    "links.pptPlaceholder": "Pega la URL del PPT... (Drive o Slides)",
    "links.docPlaceholder": "Pega la URL del Doc... (Google Docs o archivo Drive)",
    "links.save": "Guardar",
    "links.saving": "Guardando...",
    "links.saved": "Guardado.",
    "links.reset": "Restablecer",

    "tasks.calendar": "Calendario",
    "tasks.selectedDate": "Fecha seleccionada",
    "tasks.tasksFor": "Tareas para {date}",
    "tasks.weeklyDesc": "Lo que se debe presentar en la reunión semanal.",
    "tasks.refresh": "Actualizar",
    "tasks.loading": "Cargando...",
    "tasks.addTask": "Agregar tarea",
    "tasks.title": "Título",
    "tasks.descriptionOptional": "Descripción (opcional)",
    "tasks.add": "Agregar",
    "tasks.saving": "Guardando...",
    "tasks.noTasks": "No hay tareas para esta fecha.",
    "tasks.createdAt": "Creada",
    "tasks.dueDate": "Entrega",
  },
  en: {
    "nav.home": "Home",
    "nav.news": "News",
    "nav.publications": "Publications",
    "nav.team": "Team",
    "hero.subtitle": "Optics and Signal Processing Group (GOTS)",
    "hero.viewPublications": "View Publications",
    "hero.contactUs": "Contact Us",
    "hero.researchAreas": "Research Areas",
    "news.title": "News",
    "news.highlight": "Featured",
    "news.description":
      "Stay up to date with the latest milestones and key achievements from our research group.",
    "news.readingTime": "read",
    "news.featured": "Featured",
    "news.viewAll": "View All News",
    "publications.title": "Publications",
    "publications.highlight": "Featured",
    "publications.description":
      "Explore our most relevant scientific contributions in international journals and conferences.",
    "publications.viewMore": "View more",
    "publications.viewAll": "View All Publications",
    "contact.title": "Contact",
    "contact.subtitle":
      "Interested in collaborating or learning more about our work? Contact us.",
    "contact.infoTitle": "Contact Information",
    "contact.infoDescription": "We are located at Universidad Industrial de Santander.",
    "contact.address": "Address",
    "contact.phone": "Phone",
    "contact.socialTitle": "Follow us on Social Media",
    "contact.socialDescription": "Stay updated with our latest research.",
    "contact.hoursTitle": "Office Hours",
    "contact.weekdays": "Mon - Fri",
    "contact.weekend": "Sat - Sun",
    "contact.closed": "Closed",
    "contact.connectTitle": "Connect with Us",
    "contact.connectDescription": "Direct ways to contact us and visit us.",
    "contact.sendEmail": "Send an Email",
    "contact.findUs": "Find Us",
    "contact.viewOnMaps": "View on Google Maps",
    "contact.projectTitle": "Do you have a project in mind?",
    "contact.projectDescription":
      "We are interested in academic collaborations, research projects, and scientific exchange opportunities.",
    "contact.proposeCollab": "Propose Collaboration",
    "contact.viewWork": "View Our Work",
    "footer.quickLinks": "Quick Links",
    "footer.followUs": "Follow Us",
    "footer.rights": "All rights reserved.",

    "auth.loginTitle": "Sign in",
    "auth.loginSubtitle": "Access with your group account.",
    "auth.registerTitle": "Create account",
    "auth.registerSubtitle": "Private account to upload your progress (Drive).",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.passwordMin": "Password (min. 8)",
    "auth.confirmEmail": "Confirm email",
    "auth.confirmPassword": "Confirm password",
    "auth.mismatchEmail": "Emails do not match.",
    "auth.mismatchPassword": "Passwords do not match.",
    "auth.signIn": "Sign in",
    "auth.signOut": "Sign out",
    "auth.entering": "Signing in...",
    "auth.creating": "Creating...",
    "auth.noAccount": "No account?",
    "auth.haveAccount": "Already have an account?",
    "auth.createAccount": "Create account",
    "auth.invalidCredentials": "Invalid credentials.",

    "header.access": "Access",
    "header.panel": "Dashboard",
    "header.students": "Students",
    "header.tasks": "Tasks",
    "header.newsEditor": "Edit news",
    "header.publicationsEditor": "Edit publications",
    "header.edit": "Edit",

    "dashboard.studentPanel": "Student dashboard",
    "dashboard.studentGreeting": "Hi, {name}. Paste your presentation link here.",
    "dashboard.linksTitle": "Links (PPT and Doc)",
    "dashboard.linksDesc":
      "Paste your links: PPT first (Drive/Slides) then Doc (Google Docs). You can also paste both at once.",
    "dashboard.calendarTitle": "Calendar and tasks",
    "dashboard.calendarDesc": "Check what you should present each meeting.",
    "dashboard.previewTitle": "Preview",
    "dashboard.docPreviewTitle": "Document preview",
    "dashboard.noLinkYet": "You have not added a link yet.",

    "drive.savedLink": "Saved link",
    "drive.edit": "Edit",
    "drive.cancel": "Cancel",
    "drive.save": "Save",
    "drive.saving": "Saving...",
    "drive.saved": "Saved.",
    "drive.placeholder":
      "Drive: https://drive.google.com/file/d/.../preview | Slides: https://docs.google.com/presentation/d/.../edit",

    "doc.savedLink": "Saved link",
    "doc.edit": "Edit",
    "doc.cancel": "Cancel",
    "doc.save": "Save",
    "doc.saving": "Saving...",
    "doc.saved": "Saved.",
    "doc.placeholder":
      "Docs: https://docs.google.com/document/d/.../edit | Drive: https://drive.google.com/file/d/.../preview",

    "links.pptLabel": "PPT (Drive/Slides)",
    "links.docLabel": "Doc (Google Docs)",
    "links.pptPlaceholder": "Paste the PPT URL... (Drive or Slides)",
    "links.docPlaceholder": "Paste the Doc URL... (Google Docs or Drive file)",
    "links.save": "Save",
    "links.saving": "Saving...",
    "links.saved": "Saved.",
    "links.reset": "Reset",

    "tasks.calendar": "Calendar",
    "tasks.selectedDate": "Selected date",
    "tasks.tasksFor": "Tasks for {date}",
    "tasks.weeklyDesc": "What should be presented in the weekly meeting.",
    "tasks.refresh": "Refresh",
    "tasks.loading": "Loading...",
    "tasks.addTask": "Add task",
    "tasks.title": "Title",
    "tasks.descriptionOptional": "Description (optional)",
    "tasks.add": "Add",
    "tasks.saving": "Saving...",
    "tasks.noTasks": "No tasks for this date.",
    "tasks.createdAt": "Created",
    "tasks.dueDate": "Due",
  },
}

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)
const STORAGE_KEY = "gots_language"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("es")

  useEffect(() => {
    // Force Spanish as default on every load.
    setLanguage("es")
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }
  return context
}

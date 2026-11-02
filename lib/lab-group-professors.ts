/**
 * Profesores del grupo GOTS cuyo inventario se explora en Labs.
 *
 * Es la misma lista, con el mismo orden, que GOTS_LAB guarda en su tabla
 * `group_professors` (migración 20240101000028_prestamos.sql). Solo el
 * inventario de Rafael Ángel Torres Amaris está cargado todavía (el Excel de
 * origen lleva su nombre); el resto se muestra como "Próximamente".
 *
 * Las fotos son las mismas que usa la página de Equipo (`public/team/<carpeta>/`).
 * Jader Guerrero todavía no tiene foto en esa carpeta, así que se muestra un icono.
 */
export type GroupProfessor = {
  id: string
  fullName: string
  imageUrl: string | null
  /** true si ya hay inventario cargado para este profesor */
  hasInventory: boolean
}

export const GROUP_PROFESSORS: readonly GroupProfessor[] = [
  { id: "rafael-torres", fullName: "Rafael Ángel Torres Amaris", imageUrl: "/team/Rafael torres amaris/Rafael.JPG", hasInventory: true },
  { id: "zandra-lizarazo", fullName: "Zandra Yoana Lizarazo Mejía", imageUrl: "/team/lizaraso/lizaraso.png", hasInventory: false },
  { id: "yezid-torres", fullName: "Yezid Torres Moreno", imageUrl: "/team/yesid torres moreno/yesid.png", hasInventory: false },
  { id: "jaime-meneses", fullName: "Jaime Enrique Meneses Fonseca", imageUrl: "/team/Jaime meneses/Jaime meneses.png", hasInventory: false },
  { id: "jader-guerrero", fullName: "Jader Enrique Guerrero Bermúdez", imageUrl: null, hasInventory: false },
  { id: "arturo-plata", fullName: "Arturo Plata Gómez", imageUrl: "/team/arturo plaza gomez/arturo.png", hasInventory: false },
]

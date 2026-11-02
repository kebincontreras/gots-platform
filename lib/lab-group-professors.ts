/**
 * Profesores del grupo GOTS cuyo inventario se explora en Labs.
 *
 * Es la misma lista, con el mismo orden, que GOTS_LAB guarda en su tabla
 * `group_professors` (migración 20240101000028_prestamos.sql). Solo el
 * inventario de Rafael Ángel Torres Amaris está cargado todavía (el Excel de
 * origen lleva su nombre); el resto se muestra como "Próximamente".
 *
 * Las fotos salen de `public/team` cuando existe una; si no, se usa un icono.
 */
export type GroupProfessor = {
  id: string
  fullName: string
  imageUrl: string | null
  /** true si ya hay inventario cargado para este profesor */
  hasInventory: boolean
}

export const GROUP_PROFESSORS: readonly GroupProfessor[] = [
  { id: "rafael-torres", fullName: "Rafael Ángel Torres Amaris", imageUrl: "/team/Rafael.JPG", hasInventory: true },
  { id: "zandra-lizarazo", fullName: "Zandra Yoana Lizarazo Mejía", imageUrl: null, hasInventory: false },
  { id: "yezid-torres", fullName: "Yezid Torres Moreno", imageUrl: null, hasInventory: false },
  { id: "jaime-meneses", fullName: "Jaime Enrique Meneses Fonseca", imageUrl: null, hasInventory: false },
  { id: "jader-guerrero", fullName: "Jader Enrique Guerrero Bermúdez", imageUrl: null, hasInventory: false },
  { id: "arturo-plata", fullName: "Arturo Plata Gómez", imageUrl: null, hasInventory: false },
]

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImagePath(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  return `${basePath}${path}`
}

export function getPagePath(path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  return `${basePath}${path}`
}

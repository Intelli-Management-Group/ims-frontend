import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isStatic(fieldType: string): boolean {
  return [
    "Separator",
    "H1",
    "H2",
    "H3",
    "FieldDescription",
    "FieldLegend",
  ].includes(fieldType)
}

export function logger(msg: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[form-builder]: ${msg}`, data)
  }
}

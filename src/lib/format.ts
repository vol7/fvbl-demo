import type { RegionPack } from "@/regions/types"

export function normalizeVin(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase()
}

export function isValidVin(input: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(input))
}

export function maskName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] + "*".repeat(Math.max(part.length - 1, 1)))
    .join(" ")
}

/** A reading in the region's unit: "31 240 km" or "19,410 mi". */
export function formatOdometer(value: number, unit: "km" | "mi"): string {
  const separator = unit === "km" ? " " : ","
  const grouped = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return `${grouped} ${unit}`
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** The local calendar date of a timestamp, "2026-10-01", for a history event. */
export function localDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Times read "4:02 p.m.", so a sentence ending on one takes no second period. */
export function endsSentence(text: string): string {
  return text.endsWith(".") ? text : `${text}.`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  })
}

/** "October 3, 2026 at 6:00 a.m.": a deadline or a cut-off. */
export function formatDateTime(iso: string): string {
  return `${formatDate(localDate(iso))} at ${formatTime(iso)}`
}

/** "just now", "3 minutes ago", "2 hours ago". Coarse on purpose. */
export function formatRelative(from: Date | string, now: Date = new Date()): string {
  const ms = Math.max(0, now.getTime() - new Date(from).getTime())
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

/**
 * A plate as text, with its state where the region has one ("OH JKR 4821"), or the
 * region's phrase for a vehicle not plated yet.
 */
export function plateLabel(region: RegionPack["plate"], plate: string | null): string {
  if (!plate) return region.missing
  return region.state ? `${region.state} ${plate}` : plate
}

/** "Feb 2023" */
export function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
  })
}

/** "A, B and C". With `capitalize`, the first name starts upper case. */
export function joinNames(names: string[], capitalize = false): string {
  const list =
    names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
  return capitalize ? list.charAt(0).toUpperCase() + list.slice(1) : list
}

/** Whole days from one ISO date to another. */
export function daysBetween(from: string, to: string): number {
  const day = (iso: string) => {
    const [year, month, date] = iso.slice(0, 10).split("-").map(Number)
    return Date.UTC(year, month - 1, date)
  }
  return Math.round((day(to) - day(from)) / 86_400_000)
}

/** "3 yr 5 mo", "6 mo", "Under a month". */
export function formatDuration(from: string, to: string): string {
  const [y1, m1, d1] = from.slice(0, 10).split("-").map(Number)
  const [y2, m2, d2] = to.slice(0, 10).split("-").map(Number)
  const months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
  if (months < 1) return "Under a month"
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return `${rest} mo`
  return rest === 0 ? `${years} yr` : `${years} yr ${rest} mo`
}

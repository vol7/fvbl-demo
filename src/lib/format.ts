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

export function formatOdometer(km: number): string {
  const grouped = km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${grouped} km`
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  })
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

/** A plate, or the phrase the portal uses for a vehicle the ministry has not plated yet. */
export function plateLabel(plate: string | null): string {
  return plate ?? "Not yet plated"
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

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

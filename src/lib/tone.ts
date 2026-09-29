export type Tone = "success" | "danger" | "info" | "warning" | "neutral"

/** Map a status label to a colour tone. */
export function toneFor(label: string): Tone {
  switch (label.toLowerCase()) {
    case "clear":
    case "checks clear":
    case "authorized":
    case "authorized to issue":
    case "issued":
    case "package issued":
    case "closed":
    case "confirmed":
    case "owner confirmed":
    case "title issued":
      return "success"
    case "blocked":
    case "cannot be issued":
    case "hold, do not issue":
    case "held for review":
    case "escalated":
    case "referred, do not issue":
    case "referred for investigation":
    case "hold for review":
    case "referred to investigators":
    case "not me":
      return "danger"
    case "pending":
    case "awaiting owner":
    case "open":
      return "info"
    case "frozen":
    case "owner denied":
    case "request expired":
    case "under review":
    case "expired":
      return "warning"
    default:
      return "neutral"
  }
}

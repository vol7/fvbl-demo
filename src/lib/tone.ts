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
      return "success"
    case "blocked":
    case "cannot be issued":
    case "escalated":
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

import type { AuthorizationState } from "./authorization"

/** The verdict pill: one label for the whole record. */
export function verdictLabel(state: AuthorizationState): string {
  switch (state.status) {
    case "escalated":
      return "Escalated"
    case "blocked":
      return "Cannot be issued"
    case "frozen":
      return state.reason === "denied" ? "Owner denied" : "Request expired"
    case "pending":
      return "Awaiting owner"
    case "authorized":
      return state.issued ? "Package issued" : "Authorized to issue"
    case "idle":
      return "Checks clear"
  }
}

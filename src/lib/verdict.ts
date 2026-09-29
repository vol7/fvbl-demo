import type { VerdictLabels } from "@/regions/types"

import type { AuthorizationState } from "./authorization"

/** The verdict pill: one label for the whole record, in the region's words. */
export function verdictLabel(state: AuthorizationState, labels: VerdictLabels): string {
  switch (state.status) {
    case "escalated":
      return labels.escalated
    case "blocked":
      return labels.blocked
    case "frozen":
      return state.reason === "denied" ? labels.denied : labels.timeout
    case "pending":
      return labels.pending
    case "authorized":
      return state.issued ? labels.issued : labels.authorized
    case "idle":
      return labels.idle
  }
}

/**
 * The registered owner's confirmation of an export (Canada, 2026-09-30 call).
 *
 * When a vehicle is declared for export, FVBL texts the owner on the ledger, at
 * the mobile on the registration, not one on the declaration. The permit can be
 * genuine and the car not reported stolen, and still be leaving without the
 * owner's consent: sold on a deposit and shipped under the seller's name before
 * the sale is paid. Only the owner's answer catches that.
 *
 * A separate machine from `authorization` and `registration`. The owner has until
 * the loading cut-off to answer. A refusal carries a reference the owner can give
 * to police. The border officer can then hold the container (`Examination`),
 * which is keyed by container, not by VIN.
 */

type Sent = {
  /** Who the declaration names as the exporter. */
  exporter: string
  otp: string
  /** Alphanumeric token in the SMS link. */
  link: string
  sentAt: string
  /** The loading cut-off: the owner's deadline. */
  expiresAt: string
}

export type ExportState =
  | { status: "none" }
  | ({ status: "pending" } & Sent)
  | ({ status: "confirmed"; confirmationCode: string; confirmedAt: string } & Sent)
  | ({ status: "denied"; reference: string; deniedAt: string } & Sent)
  | ({ status: "expired"; expiredAt: string } & Sent)

export type ExportAction =
  | {
      type: "declare"
      exporter: string
      otp: string
      link: string
      at: string
      /** The loading cut-off for this declaration. */
      expiresAt: string
    }
  | { type: "confirm"; confirmationCode: string; at: string }
  | { type: "deny"; reference: string; at: string }
  | { type: "expire"; at: string }

export const NO_EXPORT: ExportState = { status: "none" }

/** A container the border officer held for examination before loading. */
export type Examination = { reference: string; heldAt: string }

function sent(state: Sent): Sent {
  const { exporter, otp, link, sentAt, expiresAt } = state
  return { exporter, otp, link, sentAt, expiresAt }
}

export function exportReducer(state: ExportState, action: ExportAction): ExportState {
  switch (action.type) {
    case "declare": {
      if (state.status !== "none") return state
      return {
        status: "pending",
        exporter: action.exporter,
        otp: action.otp,
        link: action.link,
        sentAt: action.at,
        expiresAt: action.expiresAt,
      }
    }
    case "confirm": {
      if (state.status !== "pending") return state
      return {
        status: "confirmed",
        ...sent(state),
        confirmationCode: action.confirmationCode,
        confirmedAt: action.at,
      }
    }
    case "deny": {
      if (state.status !== "pending") return state
      return { status: "denied", ...sent(state), reference: action.reference, deniedAt: action.at }
    }
    case "expire": {
      if (state.status !== "pending") return state
      return { status: "expired", ...sent(state), expiredAt: action.at }
    }
  }
}

/** When the owner answered, or ran out of time. Null while they still can. */
export function answeredAt(state: ExportState): string | null {
  switch (state.status) {
    case "confirmed":
      return state.confirmedAt
    case "denied":
      return state.deniedAt
    case "expired":
      return state.expiredAt
    default:
      return null
  }
}

/**
 * The next loading cut-off after a declaration: two days on, at 6:00 a.m. A
 * stand-in until the client confirms how far ahead of loading CBSA receives a
 * used vehicle's declaration.
 */
export function loadingCutoff(declaredAt: Date): string {
  const cutoff = new Date(declaredAt)
  cutoff.setDate(cutoff.getDate() + 2)
  cutoff.setHours(6, 0, 0, 0)
  return cutoff.toISOString()
}

/**
 * A dated reference after the region's prefix: a container hold (EX-2026-10-01-0418)
 * or the owner's refusal, which they give to police (EXR-2026-10-01-2291).
 */
export function generateExportRef(
  prefix: string,
  date: Date,
  random: () => number = Math.random
): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const n = String(Math.floor(random() * 10000)).padStart(4, "0")
  return `${prefix}-${date.getFullYear()}-${mm}-${dd}-${n}`
}

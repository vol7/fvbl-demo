/**
 * First registration of a brand-new vehicle by a dealer: the birth of the VIN.
 *
 * A separate machine from `authorization`: a registration is not a UVIP
 * request and never shares its slot. The dealer submits with the NVIS in hand;
 * the submission is confirmed from the dealership's registered mobile through
 * the same SMS link the owner flow uses.
 */

/** What the dealer submits. Prefilled in the demo; only the NVIS check mark is live. */
export type Submission = {
  dealer: string
  dealerMobileLast4: string
  nvis: string
  deliveryKm: number
  firstOwner: string
}

type Sent = Submission & {
  otp: string
  /** Alphanumeric token in the SMS link. */
  link: string
  sentAt: string
}

/** The submission and the text that carried it, as they were when sent. */
function sent(state: Sent): Sent {
  const { dealer, dealerMobileLast4, nvis, deliveryKm, firstOwner, otp, link, sentAt } = state
  return { dealer, dealerMobileLast4, nvis, deliveryKm, firstOwner, otp, link, sentAt }
}

export type RegistrationState =
  | { status: "none" }
  | ({ status: "pending"; expiresAt: string } & Sent)
  | ({ status: "registered"; registrationRef: string; registeredAt: string; office: string } & Sent)
  | ({ status: "declined"; declinedAt: string } & Sent)

export type RegistrationAction =
  | { type: "submit"; submission: Submission; otp: string; link: string; at: string }
  | { type: "confirm"; registrationRef: string; at: string }
  | { type: "decline"; at: string }
  | { type: "reset" }

export const REGISTRATION_WINDOW_MS = 24 * 60 * 60 * 1000

export const NO_REGISTRATION: RegistrationState = { status: "none" }

/** The MTO office string for a dealer-channel submission. */
export function dealerOffice(dealer: string): string {
  return `Dealer channel · ${dealer}`
}

function plus(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString()
}

export function registrationReducer(
  state: RegistrationState,
  action: RegistrationAction
): RegistrationState {
  switch (action.type) {
    case "submit": {
      if (state.status !== "none") return state
      return {
        status: "pending",
        ...action.submission,
        otp: action.otp,
        link: action.link,
        sentAt: action.at,
        expiresAt: plus(action.at, REGISTRATION_WINDOW_MS),
      }
    }
    case "confirm": {
      if (state.status !== "pending") return state
      return {
        status: "registered",
        ...sent(state),
        registrationRef: action.registrationRef,
        registeredAt: action.at,
        office: dealerOffice(state.dealer),
      }
    }
    case "decline": {
      if (state.status !== "pending") return state
      return { status: "declined", ...sent(state), declinedAt: action.at }
    }
    case "reset":
      return NO_REGISTRATION
  }
}

/** Reference printed once the ministry records the registration, e.g. FVBL-R-2026-09-15-0417. */
export function generateRegistrationRef(date: Date, random: () => number = Math.random): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const n = String(Math.floor(random() * 10000)).padStart(4, "0")
  return `FVBL-R-${date.getFullYear()}-${mm}-${dd}-${n}`
}

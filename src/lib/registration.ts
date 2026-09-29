/**
 * First registration of a brand-new vehicle by a dealer: the birth of the VIN.
 *
 * A separate machine from `authorization`: a registration is not an owner
 * authorization and never shares its slot. The dealer submits with the source
 * document in hand (the NVIS, or the US certificate of origin);
 * the submission is confirmed from the dealership's registered mobile through
 * the same SMS link the owner flow uses.
 */

/** The document the dealer submits from: the NVIS in Canada, the certificate of origin in the US. */
export type SourceDocument = { label: string; number: string }

/**
 * What the dealer submits. Prefilled in the demo; only the source document's check
 * mark is live.
 */
export type Submission = {
  dealer: string
  dealerMobileLast4: string
  sourceDocument: SourceDocument
  deliveryKm: number
  firstOwner: string
  /** The first owner's title-alert opt-in (US). Null in Canada. */
  titleAlerts: { mobileLast4: string } | null
}

type Sent = Submission & {
  otp: string
  /** Alphanumeric token in the SMS link. */
  link: string
  sentAt: string
}

/** The submission and the text that carried it, as they were when sent. */
function sent(state: Sent): Sent {
  const { dealer, dealerMobileLast4, sourceDocument, deliveryKm, firstOwner, titleAlerts } = state
  const { otp, link, sentAt } = state
  return {
    dealer,
    dealerMobileLast4,
    sourceDocument,
    deliveryKm,
    firstOwner,
    titleAlerts,
    otp,
    link,
    sentAt,
  }
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

/** The registry office string for a dealer-channel submission. */
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

/**
 * Registrations stored before the US version carry `nvis` instead of
 * `sourceDocument`, and no `titleAlerts`. Upgraded so an older Canadian session
 * still reads.
 */
export function upgradeRegistration(state: RegistrationState): RegistrationState {
  if (state.status === "none") return state
  const old = state as Omit<Sent, "sourceDocument" | "titleAlerts"> &
    Partial<Pick<Sent, "sourceDocument" | "titleAlerts">> & { nvis?: string }
  if (old.sourceDocument && old.titleAlerts !== undefined) return state
  const { nvis, ...rest } = old
  return {
    ...rest,
    sourceDocument: old.sourceDocument ?? { label: "NVIS", number: nvis ?? "" },
    titleAlerts: old.titleAlerts ?? null,
  } as RegistrationState
}

/** Reference printed once the registry records the registration, e.g. FVBL-R-2026-09-15-0417. */
export function generateRegistrationRef(
  date: Date,
  random: () => number = Math.random,
  prefix = "FVBL-R"
): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const n = String(Math.floor(random() * 10000)).padStart(4, "0")
  return `${prefix}-${date.getFullYear()}-${mm}-${dd}-${n}`
}

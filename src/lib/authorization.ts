/** Who started the authorization. */
export type Origin = "clerk" | "owner" | "buyer"

export type AuthorizationState =
  | { status: "idle" }
  | { status: "blocked" }
  | {
      status: "pending"
      origin: Origin
      requester: string
      otp: string
      /** Alphanumeric token in the SMS link. */
      link: string
      sentAt: string
      expiresAt: string
    }
  | {
      status: "authorized"
      origin: Origin
      requester: string
      otp: string
      link: string
      sentAt: string
      authorizationCode: string
      approvedAt: string
      validUntil: string
      /** Set once the clerk hands over the package. */
      issued?: { at: string; packageNumber: string }
    }
  | {
      status: "frozen"
      origin: Origin
      requester: string
      reason: "denied" | "timeout"
      otp: string
      link: string
      sentAt: string
      frozenAt: string
    }
  | { status: "escalated"; caseReference: string; escalatedAt: string }

export type AuthorizationAction =
  | { type: "request"; otp: string; link: string; requester: string; at: string }
  | { type: "approve"; authorizationCode: string; at: string }
  | { type: "deny"; at: string }
  | { type: "timeout"; at: string }
  | { type: "issue"; packageNumber: string; at: string }
  | { type: "escalate"; caseReference: string; at: string }
  | { type: "reset"; canRequest: boolean }

export const AUTHORIZATION_WINDOW_MS = 24 * 60 * 60 * 1000
export const PREAPPROVAL_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000

export function initialState(canRequest: boolean): AuthorizationState {
  return canRequest ? { status: "idle" } : { status: "blocked" }
}

function plus(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString()
}

/** Owner verified their identity online: authorization exists immediately. */
export function preapprovedState(input: {
  owner: string
  authorizationCode: string
  at: string
}): AuthorizationState {
  return {
    status: "authorized",
    origin: "owner",
    requester: input.owner,
    otp: "",
    sentAt: input.at,
    link: "",
    authorizationCode: input.authorizationCode,
    approvedAt: input.at,
    validUntil: plus(input.at, PREAPPROVAL_VALIDITY_MS),
  }
}

/** Buyer asked online: owner is texted, request is pending. */
export function buyerPendingState(input: {
  buyer: string
  otp: string
  link: string
  at: string
}): AuthorizationState {
  return {
    status: "pending",
    origin: "buyer",
    requester: input.buyer,
    otp: input.otp,
    link: input.link,
    sentAt: input.at,
    expiresAt: plus(input.at, AUTHORIZATION_WINDOW_MS),
  }
}

export function authorizationReducer(
  state: AuthorizationState,
  action: AuthorizationAction
): AuthorizationState {
  switch (action.type) {
    case "request": {
      if (state.status !== "idle") return state
      return {
        status: "pending",
        origin: "clerk",
        requester: action.requester,
        otp: action.otp,
        link: action.link,
        sentAt: action.at,
        expiresAt: plus(action.at, AUTHORIZATION_WINDOW_MS),
      }
    }
    case "approve": {
      if (state.status !== "pending") return state
      return {
        status: "authorized",
        origin: state.origin,
        requester: state.requester,
        otp: state.otp,
        link: state.link,
        sentAt: state.sentAt,
        authorizationCode: action.authorizationCode,
        approvedAt: action.at,
        validUntil: plus(action.at, PREAPPROVAL_VALIDITY_MS),
      }
    }
    case "deny": {
      if (state.status !== "pending") return state
      return {
        status: "frozen",
        origin: state.origin,
        requester: state.requester,
        reason: "denied",
        otp: state.otp,
        link: state.link,
        sentAt: state.sentAt,
        frozenAt: action.at,
      }
    }
    case "timeout": {
      if (state.status !== "pending") return state
      return {
        status: "frozen",
        origin: state.origin,
        requester: state.requester,
        reason: "timeout",
        otp: state.otp,
        link: state.link,
        sentAt: state.sentAt,
        frozenAt: action.at,
      }
    }
    case "issue": {
      if (state.status !== "authorized" || state.issued) return state
      return { ...state, issued: { at: action.at, packageNumber: action.packageNumber } }
    }
    case "escalate": {
      if (state.status !== "blocked") return state
      return {
        status: "escalated",
        caseReference: action.caseReference,
        escalatedAt: action.at,
      }
    }
    case "reset":
      return initialState(action.canRequest)
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function pick(alphabet: string, length: number, random: () => number): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(random() * alphabet.length)]
  }
  return out
}

export function generateOtp(random: () => number = Math.random): string {
  const digits = pick("0123456789", 6, random)
  return `${digits.slice(0, 3)} ${digits.slice(3)}`
}

export function generateAuthorizationCode(random: () => number = Math.random): string {
  return `OV-${pick(CODE_ALPHABET, 4, random)}-${pick(CODE_ALPHABET, 4, random)}`
}

/** Token in the SMS link. Sixteen alphanumerics, so it reads as a real one-time URL. */
export function generateLinkToken(random: () => number = Math.random): string {
  return pick("abcdefghjkmnpqrstuvwxyz23456789", 16, random)
}

/** Document number printed on the issued package, e.g. UVIP-2026-09-09-4821. */
export function generatePackageNumber(date: Date, random: () => number = Math.random): string {
  return `UVIP-${stamp(date)}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`
}

export function generateCaseReference(date: Date, random: () => number = Math.random): string {
  return `FVBL-${stamp(date)}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`
}

function stamp(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** Who started the authorization. */
export type Origin = "clerk" | "owner" | "buyer"

/**
 * Whether issuing waits for the owner. Canada needs the owner's approval before
 * the package is issued; in the US the owner's confirmation is evidence the clerk
 * weighs, and the clerk issues the title (US plan, Task 5).
 */
export type Policy = { ownerConfirmation: "required" | "optional" }

export const REQUIRED: Policy = { ownerConfirmation: "required" }

/** The issued document. `reviewNote` is the clerk's reason for issuing over a hold. */
export type Issued = { at: string; reference: string; reviewNote?: string }

export type AuthorizationState =
  | { status: "idle"; issued?: Issued }
  | { status: "blocked"; issued?: Issued }
  | {
      status: "pending"
      origin: Origin
      requester: string
      otp: string
      /** Alphanumeric token in the SMS link. */
      link: string
      sentAt: string
      expiresAt: string
      issued?: Issued
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
      issued?: Issued
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
      issued?: Issued
    }
  | { status: "escalated"; caseReference: string; escalatedAt: string }

export type AuthorizationAction =
  | { type: "request"; otp: string; link: string; requester: string; at: string }
  | { type: "approve"; authorizationCode: string; at: string }
  | { type: "deny"; at: string }
  | { type: "timeout"; at: string }
  | { type: "issue"; reference: string; at: string; reviewNote?: string }
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

/**
 * Where the clerk may issue. Canada: only once the owner approved. US: anywhere
 * but a referral; over a hold (failed checks or the owner's "Not me") only with
 * the clerk's review note.
 */
function canIssue(state: AuthorizationState, reviewNote: string | undefined, policy: Policy) {
  if (state.status === "escalated" || state.issued) return false
  if (policy.ownerConfirmation === "required") return state.status === "authorized"
  const held =
    state.status === "blocked" || (state.status === "frozen" && state.reason === "denied")
  return !held || Boolean(reviewNote?.trim())
}

export function authorizationReducer(
  state: AuthorizationState,
  action: AuthorizationAction,
  policy: Policy = REQUIRED
): AuthorizationState {
  // Once issued, the record is closed: a late approval or denial changes nothing.
  if (state.status !== "escalated" && state.issued && action.type !== "reset") return state
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
      if (state.status === "escalated" || !canIssue(state, action.reviewNote, policy)) return state
      const issued: Issued = { at: action.at, reference: action.reference }
      const note = action.reviewNote?.trim()
      return { ...state, issued: note ? { ...issued, reviewNote: note } : issued }
    }
    case "escalate": {
      // A US clerk may also refer the owner's "Not me"; in Canada that stays frozen.
      const notMe =
        policy.ownerConfirmation === "optional" &&
        state.status === "frozen" &&
        state.reason === "denied"
      if (state.status !== "blocked" && !notMe) return state
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

/** Number printed on the issued document, e.g. UVIP-2026-09-09-4821 (`pack.references.issued`). */
export function generateIssuedNumber(
  prefix: string,
  date: Date,
  random: () => number = Math.random
): string {
  return `${prefix}-${stamp(date)}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`
}

export function generateCaseReference(date: Date, random: () => number = Math.random): string {
  return `FVBL-${stamp(date)}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`
}

function stamp(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mm}-${dd}`
}

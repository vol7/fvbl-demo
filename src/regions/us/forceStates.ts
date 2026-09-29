import {
  AUTHORIZATION_WINDOW_MS,
  PREAPPROVAL_VALIDITY_MS,
  type AuthorizationState,
} from "@/lib/authorization"
import { dealerOffice, REGISTRATION_WINDOW_MS, type RegistrationState } from "@/lib/registration"
import type { SessionState } from "@/lib/session"

import { BUYER, DEALER, FIRST_OWNER } from "./people"
import { CLEAN_VIN, EXPORTED_VIN, NEW_VIN } from "./vehicles"

/** Demo-control shortcuts for the US beats, in the order the cut plays them. */
export type ForceKey =
  | "idle"
  | "dealerSubmitted"
  | "titleRecorded"
  | "buyerAsked"
  | "ownerConfirmed"
  | "notMe"
  | "noReply"
  | "held"

export const FORCE_STATES: { key: ForceKey; label: string }[] = [
  { key: "idle", label: "Idle" },
  { key: "dealerSubmitted", label: "Dealer submitted" },
  { key: "titleRecorded", label: "Title recorded" },
  { key: "buyerAsked", label: "Buyer asked" },
  { key: "ownerConfirmed", label: "Owner confirmed" },
  { key: "notMe", label: "Owner said “Not me”" },
  { key: "noReply", label: "No reply" },
  { key: "held", label: "Held for review" },
]

const OTP = "514 087"
const LINK = "q8h3t2mz7rkc4vwn"
const CODE = "OH-TA-7KMR-2QX4"

function iso(base: Date, offsetMs: number): string {
  return new Date(base.getTime() + offsetMs).toISOString()
}

function one(vin: string, authorization: AuthorizationState): SessionState {
  return { authorizations: { [vin]: authorization }, registrations: {}, activeVin: vin }
}

function registration(vin: string, state: RegistrationState): SessionState {
  return { authorizations: {}, registrations: { [vin]: state }, activeVin: vin }
}

export function forcedSession(key: ForceKey, now: Date = new Date()): SessionState {
  const sentAt = iso(now, -3 * 60_000)
  const at = now.toISOString()
  // In the US the request always starts from the Ohio title search, at the seller's driveway.
  const buyer = { origin: "buyer" as const, requester: BUYER.name }
  const submission = {
    dealer: DEALER.name,
    dealerMobileLast4: DEALER.mobileLast4,
    sourceDocument: { label: "Certificate of origin", number: DEALER.nvis },
    deliveryKm: 12,
    firstOwner: FIRST_OWNER.name,
    titleAlerts: { mobileLast4: FIRST_OWNER.mobileLast4 },
  }

  const confirmed: AuthorizationState = {
    status: "authorized",
    ...buyer,
    otp: OTP,
    link: LINK,
    sentAt,
    authorizationCode: CODE,
    approvedAt: at,
    validUntil: iso(now, PREAPPROVAL_VALIDITY_MS),
  }

  switch (key) {
    case "idle":
      return { authorizations: {}, registrations: {}, activeVin: null }
    case "dealerSubmitted":
      return registration(NEW_VIN, {
        status: "pending",
        ...submission,
        otp: OTP,
        link: LINK,
        sentAt,
        expiresAt: iso(now, REGISTRATION_WINDOW_MS),
      })
    case "titleRecorded":
      return registration(NEW_VIN, {
        status: "registered",
        ...submission,
        otp: OTP,
        link: LINK,
        sentAt,
        registrationRef: "FVBL-T-2026-09-15-0417",
        registeredAt: at,
        office: dealerOffice(DEALER.name),
      })
    case "buyerAsked":
      return one(CLEAN_VIN, {
        status: "pending",
        ...buyer,
        otp: OTP,
        link: LINK,
        sentAt,
        expiresAt: iso(now, AUTHORIZATION_WINDOW_MS),
      })
    case "ownerConfirmed":
      return one(CLEAN_VIN, confirmed)
    case "notMe":
    case "noReply":
      return one(CLEAN_VIN, {
        status: "frozen",
        ...buyer,
        reason: key === "notMe" ? "denied" : "timeout",
        otp: OTP,
        link: LINK,
        sentAt,
        frozenAt: at,
      })
    case "held":
      return one(EXPORTED_VIN, { status: "blocked" })
  }
}

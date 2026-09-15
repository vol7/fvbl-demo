import {
  AUTHORIZATION_WINDOW_MS,
  PREAPPROVAL_VALIDITY_MS,
  type AuthorizationState,
} from "./authorization"
import { BUYER } from "./people"
import type { SessionState } from "./session"
import { CLEAN_VIN, CLONED_VIN } from "./vehicles"

/** Demo-control shortcuts: jump the session straight to a state for a re-shoot. */
export type ForceKey =
  | "idle"
  | "pending"
  | "pendingBuyer"
  | "authorized"
  | "issued"
  | "preapproved"
  | "denied"
  | "timeout"
  | "blocked"
  | "escalated"

export const FORCE_STATES: { key: ForceKey; label: string }[] = [
  { key: "idle", label: "Idle" },
  { key: "pending", label: "Pending · counter" },
  { key: "pendingBuyer", label: "Pending · online" },
  { key: "authorized", label: "Authorized" },
  { key: "issued", label: "Issued" },
  { key: "preapproved", label: "Pre-approved" },
  { key: "denied", label: "Denied" },
  { key: "timeout", label: "Expired" },
  { key: "blocked", label: "Blocked" },
  { key: "escalated", label: "Escalated" },
]

const OTP = "868 292"
const LINK = "k7m2p9xq4tvn8bwz"
const CODE = "OV-ZAFL-QAY9"

function iso(base: Date, offsetMs: number): string {
  return new Date(base.getTime() + offsetMs).toISOString()
}

function one(vin: string, authorization: AuthorizationState): SessionState {
  return { authorizations: { [vin]: authorization }, activeVin: vin }
}

export function forcedSession(key: ForceKey, now: Date = new Date()): SessionState {
  const sentAt = iso(now, -3 * 60_000)
  const at = now.toISOString()
  const clerk = { origin: "clerk" as const, requester: "Marcus B." }
  const buyer = { origin: "buyer" as const, requester: BUYER.name }

  const authorized: AuthorizationState = {
    status: "authorized",
    ...clerk,
    otp: OTP,
    link: LINK,
    sentAt,
    authorizationCode: CODE,
    approvedAt: at,
    validUntil: iso(now, PREAPPROVAL_VALIDITY_MS),
  }

  switch (key) {
    case "idle":
      return { authorizations: {}, activeVin: null }
    case "pending":
      return one(CLEAN_VIN, {
        status: "pending",
        ...clerk,
        otp: OTP,
        link: LINK,
        sentAt,
        expiresAt: iso(now, AUTHORIZATION_WINDOW_MS),
      })
    case "pendingBuyer":
      return one(CLEAN_VIN, {
        status: "pending",
        ...buyer,
        otp: OTP,
        link: LINK,
        sentAt,
        expiresAt: iso(now, AUTHORIZATION_WINDOW_MS),
      })
    case "authorized":
      return one(CLEAN_VIN, authorized)
    case "issued":
      return one(CLEAN_VIN, {
        ...authorized,
        issued: { at, packageNumber: "UVIP-2026-09-09-4821" },
      })
    case "preapproved":
      return one(CLEAN_VIN, {
        status: "authorized",
        origin: "owner",
        requester: "Daniel Okafor",
        otp: "",
        link: "",
        sentAt,
        authorizationCode: "OV-K3PM-7HQ2",
        approvedAt: sentAt,
        validUntil: iso(now, PREAPPROVAL_VALIDITY_MS),
      })
    case "denied":
    case "timeout":
      return one(CLEAN_VIN, {
        status: "frozen",
        ...clerk,
        reason: key === "denied" ? "denied" : "timeout",
        otp: OTP,
        link: LINK,
        sentAt,
        frozenAt: at,
      })
    case "blocked":
      return one(CLONED_VIN, { status: "blocked" })
    case "escalated":
      return one(CLONED_VIN, {
        status: "escalated",
        caseReference: "FVBL-2026-09-09-3631",
        escalatedAt: at,
      })
  }
}

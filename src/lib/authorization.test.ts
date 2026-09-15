import { describe, expect, it } from "vitest"

import {
  AUTHORIZATION_WINDOW_MS,
  PREAPPROVAL_VALIDITY_MS,
  authorizationReducer,
  buyerPendingState,
  preapprovedState,
  generateAuthorizationCode,
  generateCaseReference,
  generateLinkToken,
  generateOtp,
  generatePackageNumber,
  initialState,
  type AuthorizationState,
} from "./authorization"

const T0 = "2026-09-02T18:14:00.000Z"
const T1 = "2026-09-02T18:16:30.000Z"

function pending(): AuthorizationState {
  return authorizationReducer(initialState(true), {
    type: "request",
    otp: "482 193",
    link: "k7m2p9xq4tvn8bwz",
    requester: "Marcus B.",
    at: T0,
  })
}

describe("initialState", () => {
  it("is idle when a request is allowed", () => {
    expect(initialState(true)).toEqual({ status: "idle" })
  })
  it("is blocked when a request is not allowed", () => {
    expect(initialState(false)).toEqual({ status: "blocked" })
  })
})

describe("authorizationReducer", () => {
  it("request moves idle to pending with a 24h expiry", () => {
    const state = pending()
    expect(state).toMatchObject({
      status: "pending",
      origin: "clerk",
      requester: "Marcus B.",
      otp: "482 193",
      sentAt: T0,
    })
    if (state.status !== "pending") throw new Error("expected pending")
    expect(new Date(state.expiresAt).getTime() - new Date(T0).getTime()).toBe(
      AUTHORIZATION_WINDOW_MS
    )
  })

  it("approve moves pending to authorized", () => {
    const state = authorizationReducer(pending(), {
      type: "approve",
      authorizationCode: "OV-7K2M-9Q3F",
      at: T1,
    })
    expect(state).toMatchObject({
      status: "authorized",
      origin: "clerk",
      requester: "Marcus B.",
      otp: "482 193",
      sentAt: T0,
      authorizationCode: "OV-7K2M-9Q3F",
      approvedAt: T1,
    })
    if (state.status !== "authorized") throw new Error("expected authorized")
    expect(new Date(state.validUntil).getTime() - new Date(T1).getTime()).toBe(
      PREAPPROVAL_VALIDITY_MS
    )
  })

  it("deny moves pending to frozen (denied)", () => {
    expect(authorizationReducer(pending(), { type: "deny", at: T1 })).toEqual({
      status: "frozen",
      origin: "clerk",
      requester: "Marcus B.",
      reason: "denied",
      otp: "482 193",
      link: "k7m2p9xq4tvn8bwz",
      sentAt: T0,
      frozenAt: T1,
    })
  })

  it("timeout moves pending to frozen (timeout)", () => {
    expect(authorizationReducer(pending(), { type: "timeout", at: T1 })).toEqual({
      status: "frozen",
      origin: "clerk",
      requester: "Marcus B.",
      reason: "timeout",
      otp: "482 193",
      link: "k7m2p9xq4tvn8bwz",
      sentAt: T0,
      frozenAt: T1,
    })
  })

  it("escalate moves blocked to escalated", () => {
    const state = authorizationReducer(initialState(false), {
      type: "escalate",
      caseReference: "FVBL-2026-09-02-0417",
      at: T1,
    })
    expect(state).toEqual({
      status: "escalated",
      caseReference: "FVBL-2026-09-02-0417",
      escalatedAt: T1,
    })
  })

  it("reset returns to the initial state for the given permission", () => {
    expect(authorizationReducer(pending(), { type: "reset", canRequest: true })).toEqual({
      status: "idle",
    })
    expect(authorizationReducer(pending(), { type: "reset", canRequest: false })).toEqual({
      status: "blocked",
    })
  })

  it("ignores invalid transitions and returns the same state object", () => {
    const blocked = initialState(false)
    expect(
      authorizationReducer(blocked, {
        type: "request",
        otp: "000 000",
        link: "k7m2p9xq4tvn8bwz",
        requester: "Marcus B.",
        at: T0,
      })
    ).toBe(blocked)
    const idle = initialState(true)
    expect(authorizationReducer(idle, { type: "approve", authorizationCode: "x", at: T0 })).toBe(
      idle
    )
    expect(authorizationReducer(idle, { type: "escalate", caseReference: "x", at: T0 })).toBe(idle)
    const authorized = authorizationReducer(pending(), {
      type: "approve",
      authorizationCode: "OV-AAAA-BBBB",
      at: T1,
    })
    expect(authorizationReducer(authorized, { type: "deny", at: T1 })).toBe(authorized)
  })
})

describe("code generators", () => {
  it("generateOtp yields six digits grouped in threes", () => {
    expect(generateOtp()).toMatch(/^\d{3} \d{3}$/)
    expect(generateOtp(() => 0.5)).toBe("555 555")
  })
  it("generateAuthorizationCode yields OV-XXXX-XXXX without ambiguous characters", () => {
    const code = generateAuthorizationCode()
    expect(code).toMatch(/^OV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
  })
  it("generateCaseReference embeds the date and a 4-digit sequence", () => {
    expect(generateCaseReference(new Date(2026, 8, 2), () => 0.0417)).toBe("FVBL-2026-09-02-0417")
  })
})

describe("pre-approval states", () => {
  it("preapprovedState is authorized immediately with owner origin and 30-day validity", () => {
    const state = preapprovedState({
      owner: "Daniel Okafor",
      authorizationCode: "OV-AAAA-BBBB",
      at: T0,
    })
    expect(state).toMatchObject({
      status: "authorized",
      origin: "owner",
      requester: "Daniel Okafor",
      authorizationCode: "OV-AAAA-BBBB",
      approvedAt: T0,
    })
    if (state.status !== "authorized") throw new Error("expected authorized")
    expect(new Date(state.validUntil).getTime() - new Date(T0).getTime()).toBe(
      PREAPPROVAL_VALIDITY_MS
    )
  })

  it("buyerPendingState is pending with buyer origin and keeps the origin through approve", () => {
    const pendingState = buyerPendingState({
      buyer: "Marcus Beaulieu",
      otp: "111 222",
      link: "k7m2p9xq4tvn8bwz",
      at: T0,
    })
    expect(pendingState).toMatchObject({
      status: "pending",
      origin: "buyer",
      requester: "Marcus Beaulieu",
    })
    const approved = authorizationReducer(pendingState, {
      type: "approve",
      authorizationCode: "OV-CCCC-DDDD",
      at: T1,
    })
    expect(approved).toMatchObject({
      status: "authorized",
      origin: "buyer",
      requester: "Marcus Beaulieu",
    })
    const denied = authorizationReducer(pendingState, { type: "deny", at: T1 })
    expect(denied).toMatchObject({ status: "frozen", origin: "buyer", reason: "denied" })
  })
})

describe("issue", () => {
  function authorized() {
    return authorizationReducer(pending(), {
      type: "approve",
      authorizationCode: "OV-7K2M-9Q3F",
      at: T1,
    })
  }

  it("records the package number against the authorization", () => {
    const state = authorizationReducer(authorized(), {
      type: "issue",
      packageNumber: "UVIP-2026-09-02-4821",
      at: T1,
    })
    expect(state).toMatchObject({
      status: "authorized",
      issued: { at: T1, packageNumber: "UVIP-2026-09-02-4821" },
    })
  })

  it("is a no-op before authorization and when already issued", () => {
    const idle = initialState(true)
    expect(authorizationReducer(idle, { type: "issue", packageNumber: "X", at: T1 })).toBe(idle)
    const once = authorizationReducer(authorized(), {
      type: "issue",
      packageNumber: "UVIP-1",
      at: T1,
    })
    expect(authorizationReducer(once, { type: "issue", packageNumber: "UVIP-2", at: T1 })).toBe(
      once
    )
  })
})

describe("generateLinkToken", () => {
  it("is sixteen lowercase alphanumerics", () => {
    const token = generateLinkToken()
    expect(token).toMatch(/^[a-z2-9]{16}$/)
  })
})

describe("generatePackageNumber", () => {
  it("stamps the date and a sequence", () => {
    expect(generatePackageNumber(new Date(2026, 8, 9), () => 0.4821)).toBe("UVIP-2026-09-09-4821")
  })
})

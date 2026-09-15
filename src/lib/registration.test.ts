import { describe, expect, it } from "vitest"

import {
  REGISTRATION_WINDOW_MS,
  generateRegistrationRef,
  registrationReducer,
  type RegistrationState,
  type Submission,
} from "./registration"

const T0 = "2026-09-15T14:02:00.000Z"
const T1 = "2026-09-15T14:05:30.000Z"
const LINK = "k7m2p9xq4tvn8bwz"
const NONE: RegistrationState = { status: "none" }

const SUBMISSION: Submission = {
  dealer: "Mercedes-Benz Downtown",
  dealerMobileLast4: "2204",
  nvis: "NVIS 2026-MB-0187342",
  deliveryKm: 12,
  firstOwner: "Léa Tremblay",
}

function pending(): RegistrationState {
  return registrationReducer(NONE, {
    type: "submit",
    submission: SUBMISSION,
    otp: "482 193",
    link: LINK,
    at: T0,
  })
}

describe("registrationReducer", () => {
  it("a dealer submission moves none to pending and keeps the submission", () => {
    const s = pending()
    expect(s).toMatchObject({ status: "pending", link: LINK, sentAt: T0, ...SUBMISSION })
  })

  it("a pending submission expires 24 hours after it was sent", () => {
    const s = pending()
    if (s.status !== "pending") throw new Error("expected pending")
    expect(new Date(s.expiresAt).getTime() - new Date(s.sentAt).getTime()).toBe(
      REGISTRATION_WINDOW_MS
    )
    expect(REGISTRATION_WINDOW_MS).toBe(24 * 60 * 60 * 1000)
  })

  it("confirming records the registration with a reference and the dealer channel office", () => {
    const s = registrationReducer(pending(), {
      type: "confirm",
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: T1,
    })
    expect(s).toMatchObject({
      status: "registered",
      registrationRef: "FVBL-R-2026-09-15-0417",
      registeredAt: T1,
      office: "Dealer channel · Mercedes-Benz Downtown",
      ...SUBMISSION,
    })
  })

  it("declining withdraws the submission", () => {
    const s = registrationReducer(pending(), { type: "decline", at: T1 })
    expect(s).toMatchObject({ status: "declined", declinedAt: T1, ...SUBMISSION })
  })

  it("reset returns to none", () => {
    expect(registrationReducer(pending(), { type: "reset" })).toEqual(NONE)
  })

  it("illegal transitions return the same object", () => {
    const p = pending()
    const registered = registrationReducer(p, { type: "confirm", registrationRef: "X", at: T1 })
    expect(registrationReducer(NONE, { type: "confirm", registrationRef: "X", at: T1 })).toBe(NONE)
    expect(registrationReducer(NONE, { type: "decline", at: T1 })).toBe(NONE)
    expect(
      registrationReducer(p, {
        type: "submit",
        submission: SUBMISSION,
        otp: "1",
        link: "x",
        at: T1,
      })
    ).toBe(p)
    expect(registrationReducer(registered, { type: "decline", at: T1 })).toBe(registered)
    expect(registrationReducer(registered, { type: "confirm", registrationRef: "Y", at: T1 })).toBe(
      registered
    )
  })
})

describe("generateRegistrationRef", () => {
  it("stamps the date and four digits behind an R", () => {
    expect(generateRegistrationRef(new Date(2026, 8, 15), () => 0.0417)).toBe(
      "FVBL-R-2026-09-15-0417"
    )
  })
})

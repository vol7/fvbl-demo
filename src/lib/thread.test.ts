import { describe, expect, it } from "vitest"

import { EMPTY_SESSION, sessionReducer, type SessionState } from "./session"
import { liveThread } from "./thread"
import { CLEAN_VIN, NEW_VIN } from "./vehicles"

const T0 = "2026-09-15T14:02:00.000Z"
const LINK = "k7m2p9xq4tvn8bwz"
const submission = {
  dealer: "Mercedes-Benz Downtown",
  dealerMobileLast4: "2204",
  nvis: "NVIS 2026-MB-0187342",
  deliveryKm: 12,
  firstOwner: "Léa Tremblay",
}

function requested(): SessionState {
  return sessionReducer(EMPTY_SESSION, {
    type: "request",
    vin: CLEAN_VIN,
    canRequest: true,
    otp: "482 193",
    link: LINK,
    requester: "Marcus Beaulieu",
    at: T0,
  })
}

function submitted(from = EMPTY_SESSION): SessionState {
  return sessionReducer(from, {
    type: "submitRegistration",
    vin: NEW_VIN,
    submission,
    otp: "111 222",
    link: LINK,
    at: T0,
  })
}

describe("liveThread", () => {
  it("is null until something was texted", () => {
    expect(liveThread(EMPTY_SESSION)).toBeNull()
  })

  it("is an authorization thread for a UVIP request", () => {
    const thread = liveThread(requested())
    expect(thread?.kind).toBe("authorization")
    expect(thread?.vehicle.vin).toBe(CLEAN_VIN)
  })

  it("follows a dealer submission as a registration thread", () => {
    const thread = liveThread(submitted(requested()))
    expect(thread?.kind).toBe("registration")
    expect(thread?.vehicle.vin).toBe(NEW_VIN)
    expect(thread?.state.status).toBe("pending")
  })

  it("keeps the registration thread once confirmed", () => {
    const s = sessionReducer(submitted(), {
      type: "confirmRegistration",
      vin: NEW_VIN,
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: T0,
    })
    const thread = liveThread(s)
    expect(thread?.kind).toBe("registration")
    expect(thread?.state.status).toBe("registered")
  })
})

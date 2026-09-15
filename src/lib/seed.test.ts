import { describe, expect, it } from "vitest"

import { recentRows } from "./seed"
import { EMPTY_SESSION, sessionReducer } from "./session"
import { NEW_VIN } from "./vehicles"

const submission = {
  dealer: "Mercedes-Benz Downtown",
  dealerMobileLast4: "2204",
  nvis: "NVIS 2026-MB-0187342",
  deliveryKm: 12,
  firstOwner: "Léa Tremblay",
}

describe("recentRows", () => {
  it("leaves the unborn vehicle out until it is registered", () => {
    expect(recentRows(EMPTY_SESSION).some((r) => r.vin === NEW_VIN)).toBe(false)
    const pending = sessionReducer(EMPTY_SESSION, {
      type: "submitRegistration",
      vin: NEW_VIN,
      submission,
      otp: "482 193",
      link: "k7m2p9xq4tvn8bwz",
      at: "2026-09-15T14:02:00.000Z",
    })
    expect(recentRows(pending).some((r) => r.vin === NEW_VIN)).toBe(false)
  })

  it("lists the newborn first, clear and just registered", () => {
    let s = sessionReducer(EMPTY_SESSION, {
      type: "submitRegistration",
      vin: NEW_VIN,
      submission,
      otp: "482 193",
      link: "k7m2p9xq4tvn8bwz",
      at: "2026-09-15T14:02:00.000Z",
    })
    s = sessionReducer(s, {
      type: "confirmRegistration",
      vin: NEW_VIN,
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: "2026-09-15T14:05:30.000Z",
    })
    const [first] = recentRows(s)
    expect(first).toMatchObject({
      vin: NEW_VIN,
      plate: "Not yet plated",
      outcome: "clear",
      live: true,
    })
    expect(first.when).toMatch(/Today/)
  })
})

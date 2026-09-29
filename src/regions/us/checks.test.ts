import { describe, expect, it } from "vitest"

import type { AuthorizationState } from "@/lib/authorization"
import { evaluateChecks, failingChecks } from "@/lib/checks"
import { recordStory } from "@/lib/story"
import { findVehicle } from "@/lib/vehicles"
import { us } from "@/regions/us"

import { CLEAN_VIN, EXPORTED_VIN, NEW_VIN, ONTARIO_VIN, SALVAGE_VIN } from "./vehicles"

const vehicle = (vin: string) => findVehicle(us, vin)!
const failing = (vin: string, authorization?: AuthorizationState) =>
  failingChecks(evaluateChecks(us, vehicle(vin), { authorization })).map((c) => c.id)

const sent = {
  origin: "buyer" as const,
  requester: "Tyler Brooks",
  otp: "482 193",
  link: "k7m2p9xq4tvn8bwz",
  sentAt: "2026-09-29T14:02:00.000Z",
}
const confirmed: AuthorizationState = {
  status: "authorized",
  ...sent,
  authorizationCode: "OH-A-4821",
  approvedAt: "2026-09-29T14:03:10.000Z",
  validUntil: "2026-10-29T14:03:10.000Z",
}
const notMe: AuthorizationState = {
  status: "frozen",
  ...sent,
  reason: "denied",
  frozenAt: "2026-09-29T14:03:10.000Z",
}

describe("the Ohio record checks", () => {
  it("run in the counter's order, leaving out the owner's answer until there is one", () => {
    expect(evaluateChecks(us, vehicle(CLEAN_VIN)).map((c) => c.id)).toEqual([
      "border",
      "decode",
      "stolen",
      "nmvtis",
      "otherJurisdiction",
      "brand",
      "odometer",
      "lien",
    ])
  })

  it("fail exactly each scenario's catch", () => {
    expect(failing(CLEAN_VIN)).toEqual([])
    expect(failing(EXPORTED_VIN)).toEqual(["border"])
    expect(failing(ONTARIO_VIN)).toEqual(["otherJurisdiction"])
    // Alongside the NMVTIS check, never in place of it: both report the brand.
    expect(failing(SALVAGE_VIN)).toEqual(["nmvtis", "brand"])
    expect(failing(NEW_VIN)).toEqual([])
  })

  it("say the brief's phrase when no other jurisdiction holds the VIN", () => {
    const row = evaluateChecks(us, vehicle(CLEAN_VIN)).find((c) => c.id === "otherJurisdiction")!
    expect(row.result).toBe("No active title in another state or Canada")
  })

  it("read odometers in miles", () => {
    const row = evaluateChecks(us, vehicle(SALVAGE_VIN)).find((c) => c.id === "odometer")!
    expect(row.detail).toContain("46,730 mi")
  })

  it("pass the owner's confirmation when they approved, as the last row", () => {
    const checks = evaluateChecks(us, vehicle(CLEAN_VIN), { authorization: confirmed })
    expect(checks.at(-1)).toMatchObject({ id: "ownerConfirmed", status: "pass" })
  })

  it("fail it high on “Not me”, and leave it out while pending or after no reply", () => {
    expect(failing(CLEAN_VIN, notMe)).toEqual(["ownerConfirmed"])
    const pending: AuthorizationState = {
      status: "pending",
      ...sent,
      expiresAt: "2026-09-30T14:02:00.000Z",
    }
    const timeout: AuthorizationState = { ...notMe, reason: "timeout" }
    for (const authorization of [pending, timeout, { status: "idle" } as const]) {
      const ids = evaluateChecks(us, vehicle(CLEAN_VIN), { authorization }).map((c) => c.id)
      expect(ids).not.toContain("ownerConfirmed")
    }
  })
})

describe("the Ohio stories", () => {
  const story = (vin: string, authorization?: AuthorizationState) =>
    recordStory(us, vehicle(vin), evaluateChecks(us, vehicle(vin), { authorization }))!

  const all = () => [
    story(EXPORTED_VIN),
    story(ONTARIO_VIN),
    story(SALVAGE_VIN),
    story(CLEAN_VIN, notMe),
  ]

  it("tell each catch", () => {
    expect(story(EXPORTED_VIN).title).toBe(
      "This VIN was reported exported and has no re-entry on record"
    )
    expect(story(EXPORTED_VIN).body).toContain("Laredo, TX")
    expect(story(ONTARIO_VIN).title).toBe("This VIN is on an active Ontario registration")
    expect(story(ONTARIO_VIN).body).toContain("The Georgia title presented here")
    expect(story(ONTARIO_VIN).foot).toMatch(/^Reported by Ontario's vehicle registry\./)
    expect(story(SALVAGE_VIN).title).toBe(
      "This VIN carried a salvage brand before its current title"
    )
    expect(story(SALVAGE_VIN).foot).toContain("alongside the NMVTIS check")
    expect(story(CLEAN_VIN, notMe).title).toBe("The registered owner said this sale isn't theirs")
  })

  it("end every red story with the clerk's decision", () => {
    for (const s of all()) expect(s.foot).toMatch(/Your office decides whether to issue\.$/)
  })

  it("never gate, deny or fault Ohio's records", () => {
    for (const s of all()) {
      const text = `${s.title} ${s.body} ${s.foot}`
      expect(text).not.toMatch(/blocked|denied by|will not allow|alone would have/i)
    }
  })
})

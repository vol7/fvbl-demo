import { describe, expect, it } from "vitest"

import { BORDER } from "@/regions/ca/border"
import { ca } from "@/regions/ca"
import { EXPORT_VIN } from "@/regions/ca/vehicles"

import { declaredView, declaredViews, permitResult } from "./border"
import { EMPTY_SESSION, sessionReducer, type SessionState } from "./session"
import { liveThread } from "./thread"
import { findVehicle, withExportAnswer } from "./vehicles"

const T0 = "2026-10-01T13:02:00.000Z"
const MDX = "5J8YE1H07PL017354"
const RAV4 = "2T3F1RFV6PW287316"
const GLC = "WDC0G4KB0KV167329"

function declared(from = EMPTY_SESSION): SessionState {
  return sessionReducer(from, {
    type: "declareExport",
    vin: EXPORT_VIN,
    exporter: BORDER.live.exporter,
    otp: "1",
    link: "k7m2p9xq4tvn8bwz",
    at: T0,
    expiresAt: "2026-10-03T10:00:00.000Z",
  })
}

const denied = () =>
  sessionReducer(declared(), {
    type: "denyExport",
    vin: EXPORT_VIN,
    reference: "EXR-2026-10-01-2291",
    at: T0,
  })

const find = (vin: string) => BORDER.declared.find((v) => v.vin === vin)!

describe("permitResult", () => {
  it("fails another car's permit and a number that is nowhere on file", () => {
    expect(permitResult(find(MDX))).toBe("otherVehicle")
    expect(permitResult(find(RAV4))).toBe("notOnFile")
  })

  it("finds the owner by VIN when only a bill of sale was presented", () => {
    expect(permitResult(find(GLC))).toBe("notPresented")
  })

  it("passes the RAM's permit: the paperwork is genuine", () => {
    expect(permitResult(find(EXPORT_VIN))).toBe("match")
  })
})

describe("declaredViews", () => {
  it("lists the two bad permits first, and leaves the RAM off until it is declared", () => {
    const views = declaredViews(BORDER, EMPTY_SESSION)
    expect(views.map((v) => v.vehicle.vin)).not.toContain(EXPORT_VIN)
    expect(views.slice(0, 2).map((v) => [v.vehicle.vin, v.verdict, v.reason])).toEqual([
      [MDX, "hold", "otherVehicle"],
      [RAV4, "hold", "notOnFile"],
    ])
    expect(views.slice(2).every((v) => v.verdict === "cleared")).toBe(true)
  })

  it("adds the declared RAM, awaiting its owner", () => {
    const view = declaredView(BORDER, declared(), EXPORT_VIN)
    expect(view).toMatchObject({ verdict: "awaiting", reason: "pending", exporterIsOwner: true })
  })

  it("clears it when the owner confirms, and holds it first in line when they say no", () => {
    const confirmed = sessionReducer(declared(), {
      type: "confirmExport",
      vin: EXPORT_VIN,
      confirmationCode: "OV-1",
      at: T0,
    })
    expect(declaredView(BORDER, confirmed, EXPORT_VIN)?.verdict).toBe("cleared")

    const [first] = declaredViews(BORDER, denied())
    expect(first).toMatchObject({ verdict: "hold", reason: "denied" })
    expect(first.vehicle.vin).toBe(EXPORT_VIN)
  })

  it("moves a held container below the ones still to decide", () => {
    const held = sessionReducer(denied(), {
      type: "holdContainer",
      container: find(EXPORT_VIN).container,
      reference: "EX-2026-10-01-0418",
      at: T0,
    })
    const views = declaredViews(BORDER, held)
    expect(views.slice(0, 2).map((v) => v.vehicle.vin)).toEqual([MDX, RAV4])
    expect(views[2]).toMatchObject({ hold: { reference: "EX-2026-10-01-0418" } })
  })

  it("names the exporter against the registered owner", () => {
    expect(declaredView(BORDER, EMPTY_SESSION, GLC)?.exporterIsOwner).toBe(false)
  })
})

describe("the owner's text and the clerk's record", () => {
  it("puts the owner's text on the phone once the export is declared", () => {
    const thread = liveThread(ca, declared())
    expect(thread?.kind).toBe("export")
    expect(thread?.vehicle.vin).toBe(EXPORT_VIN)
  })

  it("shows a clerk's later request instead of the export", () => {
    const requested = sessionReducer(declared(), {
      type: "request",
      vin: EXPORT_VIN,
      canRequest: true,
      otp: "2",
      link: "abcdefghjkmnpqrs",
      requester: "Marcus Beaulieu",
      at: "2026-10-01T14:00:00.000Z",
    })
    expect(liveThread(ca, requested)?.kind).toBe("authorization")
  })

  it("adds the owner's answer to the clerk's history, never while they can still answer", () => {
    const ram = findVehicle(ca, EXPORT_VIN)!
    expect(withExportAnswer(ca, ram, declared().exports![EXPORT_VIN]).history).toHaveLength(
      ram.history.length
    )
    const answered = withExportAnswer(ca, ram, denied().exports![EXPORT_VIN])
    expect(answered.history.at(-1)).toMatchObject({
      kind: "exportDeclared",
      agency: "CBSA",
      port: "Port of Montréal",
      answer: "denied",
    })
    expect(JSON.stringify(answered.history.at(-1))).not.toMatch(/HBLU|EX-|examination/i)
  })
})

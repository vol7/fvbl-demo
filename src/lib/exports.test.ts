import { describe, expect, it } from "vitest"

import { answeredAt, exportReducer, generateExportRef, loadingCutoff, NO_EXPORT } from "./exports"

const T0 = "2026-10-01T13:02:00.000Z"
const CUTOFF = "2026-10-03T10:00:00.000Z"
const declare = {
  type: "declare" as const,
  exporter: "Hannah Kowalski",
  otp: "1",
  link: "x",
  at: T0,
  expiresAt: CUTOFF,
}

describe("exportReducer", () => {
  it("texts the owner on declaration, with until the loading cut-off to answer", () => {
    expect(exportReducer(NO_EXPORT, declare)).toMatchObject({
      status: "pending",
      exporter: "Hannah Kowalski",
      sentAt: T0,
      expiresAt: CUTOFF,
    })
  })

  it("takes the owner's one answer and ignores a second", () => {
    const pending = exportReducer(NO_EXPORT, declare)
    const denied = exportReducer(pending, { type: "deny", reference: "EXR-1", at: T0 })
    expect(denied).toMatchObject({ status: "denied", reference: "EXR-1" })
    expect(exportReducer(denied, { type: "confirm", confirmationCode: "OV-1", at: T0 })).toBe(
      denied
    )
    expect(
      exportReducer(pending, { type: "confirm", confirmationCode: "OV-1", at: T0 })
    ).toMatchObject({ status: "confirmed", confirmationCode: "OV-1" })
    expect(exportReducer(pending, { type: "expire", at: T0 }).status).toBe("expired")
  })

  it("declares a vehicle once", () => {
    const pending = exportReducer(NO_EXPORT, declare)
    expect(exportReducer(pending, declare)).toBe(pending)
  })

  it("knows when the owner answered, and not while they still can", () => {
    const pending = exportReducer(NO_EXPORT, declare)
    expect(answeredAt(pending)).toBeNull()
    expect(answeredAt(exportReducer(pending, { type: "deny", reference: "x", at: CUTOFF }))).toBe(
      CUTOFF
    )
  })
})

describe("loadingCutoff", () => {
  it("is two days after the declaration, at 6:00 a.m.", () => {
    const cutoff = new Date(loadingCutoff(new Date(2026, 9, 1, 19, 30)))
    expect([cutoff.getDate(), cutoff.getHours(), cutoff.getMinutes()]).toEqual([3, 6, 0])
  })
})

describe("generateExportRef", () => {
  it("dates the reference after the region's prefix", () => {
    expect(generateExportRef("EX", new Date(2026, 9, 1), () => 0.04185)).toBe("EX-2026-10-01-0418")
  })
})

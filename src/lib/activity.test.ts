import { describe, expect, it } from "vitest"

import { deriveActivity } from "./activity"
import { CLEAN_VIN, findVehicle } from "./vehicles"

const T0 = "2026-09-04T18:10:00.000Z"
const T1 = "2026-09-04T18:14:00.000Z"
const T2 = "2026-09-04T18:16:30.000Z"

describe("deriveActivity", () => {
  it("is empty when nothing is open", () => {
    expect(deriveActivity({ status: "idle" }, null, "M. Chen")).toEqual([])
  })

  it("has only the lookup when idle", () => {
    const events = deriveActivity({ status: "idle" }, T0, "M. Chen")
    expect(events.map((e) => e.id)).toEqual(["lookup"])
    expect(events[0].detail).toBe("Lookup by M. Chen")
  })

  it("lists lookup, request and approval in order", () => {
    const events = deriveActivity(
      {
        status: "authorized",
        origin: "clerk",
        requester: "Marcus B.",
        otp: "1",
        link: "",
        sentAt: T1,
        authorizationCode: "OV-AAAA-BBBB",
        approvedAt: T2,
        validUntil: T2,
      },
      T0,
      "M. Chen"
    )
    expect(events.map((e) => e.id)).toEqual(["lookup", "sent", "approved"])
    expect(events[2].detail).toContain("OV-AAAA-BBBB")
  })

  it("describes a denial as a warning", () => {
    const events = deriveActivity(
      {
        status: "frozen",
        origin: "clerk",
        requester: "Marcus B.",
        reason: "denied",
        otp: "1",
        link: "",
        sentAt: T1,
        frozenAt: T2,
      },
      T0,
      "M. Chen"
    )
    expect(events.at(-1)).toMatchObject({ id: "frozen", title: "Owner denied", tone: "warning" })
  })

  it("shows a single pre-approval event for an owner-origin authorization", () => {
    const events = deriveActivity(
      {
        status: "authorized",
        origin: "owner",
        requester: "Daniel Okafor",
        otp: "",
        link: "",
        sentAt: T0,
        authorizationCode: "OV-AAAA-BBBB",
        approvedAt: T0,
        validUntil: T2,
      },
      T1,
      "M. Chen"
    )
    expect(events.map((e) => e.id)).toEqual(["preapproved", "lookup"])
  })

  it("names the buyer for a buyer-origin request", () => {
    const events = deriveActivity(
      {
        status: "pending",
        origin: "buyer",
        requester: "Marcus Beaulieu",
        otp: "1",
        link: "",
        sentAt: T0,
        expiresAt: T2,
      },
      T1,
      "M. Chen"
    )
    expect(events[0]).toMatchObject({ id: "sent", title: "Pre-approval requested online" })
    expect(events[0].detail).toContain("Marcus Beaulieu")
  })

  it("lists blocked then escalated for a cloned vehicle", () => {
    const events = deriveActivity(
      { status: "escalated", caseReference: "FVBL-2026-09-04-0001", escalatedAt: T2 },
      T0,
      "M. Chen"
    )
    expect(events.map((e) => e.id)).toEqual(["lookup", "blocked", "escalated"])
  })

  it("adds a package issued event once the clerk hands it over", () => {
    const events = deriveActivity(
      {
        status: "authorized",
        origin: "clerk",
        requester: "Marcus B.",
        otp: "1",
        link: "",
        sentAt: T1,
        authorizationCode: "OV-AAAA-BBBB",
        approvedAt: T2,
        validUntil: T2,
        issued: { at: T2, packageNumber: "UVIP-2026-09-09-4821" },
      },
      T0,
      "M. Chen"
    )
    expect(events.map((e) => e.id)).toContain("issued")
    expect(events.at(-1)).toMatchObject({ title: "Package issued", tone: "success" })
  })

  it("stamps on-chain events with a certificate when given the vehicle", () => {
    const events = deriveActivity(
      {
        status: "authorized",
        origin: "clerk",
        requester: "Marcus B.",
        otp: "1",
        link: "",
        sentAt: T1,
        authorizationCode: "OV-AAAA-BBBB",
        approvedAt: T2,
        validUntil: T2,
        issued: { at: T2, packageNumber: "UVIP-2026-09-09-4821" },
      },
      T0,
      "M. Chen",
      findVehicle(CLEAN_VIN)
    )
    const byId = Object.fromEntries(events.map((e) => [e.id, e]))
    expect(byId.lookup.certificate).toBeUndefined()
    expect(byId.sent.certificate).toMatch(/^[0-9a-f]{64}$/)
    expect(byId.approved.certificate).toMatch(/^[0-9a-f]{64}$/)
    expect(byId.issued.certificate).toMatch(/^[0-9a-f]{64}$/)
  })
})

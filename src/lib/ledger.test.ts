import { describe, expect, it } from "vitest"

import type { AuthorizationState } from "./authorization"
import {
  authorizationCertificates,
  fingerprint,
  historyCertificates,
  ledgerEntries,
  shortHash,
} from "./ledger"
import { bornVehicle, CLEAN_VIN, EXPORTED_VIN, findVehicle, NEW_VIN } from "./vehicles"

const clean = findVehicle(CLEAN_VIN)!
const exported = findVehicle(EXPORTED_VIN)!

const T1 = "2026-09-10T14:02:00.000Z"
const T2 = "2026-09-10T14:05:30.000Z"
const T3 = "2026-09-10T14:09:00.000Z"

const issued: AuthorizationState = {
  status: "authorized",
  origin: "clerk",
  requester: "Marcus Beaulieu",
  otp: "1",
  link: "k7m2p9xq4tvn8bwz",
  sentAt: T1,
  authorizationCode: "OV-AAAA-BBBB",
  approvedAt: T2,
  validUntil: T3,
  issued: { at: T3, packageNumber: "UVIP-2026-09-10-4821" },
}

describe("fingerprint", () => {
  it("is deterministic and 64 hex characters", () => {
    expect(fingerprint("abc")).toBe(fingerprint("abc"))
    expect(fingerprint("abc")).toMatch(/^[0-9a-f]{64}$/)
    expect(fingerprint("abc")).not.toBe(fingerprint("abd"))
  })

  it("shortens to the first and last four", () => {
    expect(shortHash("abcd" + "0".repeat(56) + "wxyz")).toBe("abcd…wxyz")
  })
})

describe("ledgerEntries", () => {
  it("lists history then session events, numbered from one", () => {
    const entries = ledgerEntries(clean, issued)
    expect(entries).toHaveLength(clean.history.length + 3)
    expect(entries.map((e) => e.seq)).toEqual(entries.map((_, i) => i + 1))
    expect(entries.slice(-3).map((e) => e.kind)).toEqual([
      "authorization.requested",
      "authorization.approved",
      "package.issued",
    ])
  })

  it("chains: an earlier change alters every later certificate", () => {
    const a = ledgerEntries(clean, issued)
    const b = ledgerEntries(
      {
        ...clean,
        history: clean.history.map((e, i) => (i === 0 ? { ...e, date: "2023-02-28" } : e)),
      },
      issued
    )
    for (let i = 0; i < a.length; i++) expect(a[i].hash).not.toBe(b[i].hash)
  })

  it("marks odometer readings private and everything else public", () => {
    for (const e of ledgerEntries(exported, { status: "blocked" })) {
      expect(e.visibility).toBe(e.kind === "vehicle.odometer" ? "private" : "public")
    }
  })

  it("never carries a name, plate or phone", () => {
    const text = JSON.stringify(ledgerEntries(clean, issued))
    expect(text).not.toContain("Okafor")
    expect(text).not.toContain("Beaulieu")
    expect(text).not.toContain(clean.plate)
    expect(text).not.toContain("0917")
    expect(text).not.toContain(issued.link)
  })

  it("carries the MTO office on registration events", () => {
    const first = ledgerEntries(clean, { status: "idle" }).find(
      (e) => e.kind === "registration.firstRegistration"
    )!
    expect(first.office).toBe("4412 · Toronto")
  })
})

describe("certificates", () => {
  it("match the chain for both history and session events", () => {
    const entries = ledgerEntries(clean, issued)
    expect(historyCertificates(clean)).toEqual(
      entries.slice(0, clean.history.length).map((e) => e.hash)
    )
    const certs = authorizationCertificates(clean, issued)
    expect(certs.sent).toBe(entries.at(-3)!.hash)
    expect(certs.approved).toBe(entries.at(-2)!.hash)
    expect(certs.issued).toBe(entries.at(-1)!.hash)
  })

  it("has nothing for an idle or blocked vehicle", () => {
    expect(authorizationCertificates(clean, { status: "idle" })).toEqual({})
    expect(authorizationCertificates(exported, { status: "blocked" })).toEqual({})
  })
})

describe("the newborn's chain", () => {
  const registered = {
    status: "registered" as const,
    dealer: "Mercedes-Benz Downtown",
    dealerMobileLast4: "2204",
    nvis: "NVIS 2026-MB-0187342",
    deliveryKm: 12,
    firstOwner: "Léa Tremblay",
    otp: "1",
    link: "k7m2p9xq4tvn8bwz",
    sentAt: "2026-09-15T14:02:00.000Z",
    registrationRef: "FVBL-R-2026-09-15-0417",
    registeredAt: "2026-09-15T14:05:30.000Z",
    office: "Dealer channel · Mercedes-Benz Downtown",
  }

  it("has no entries before registration and two after, the first a dealer submission", () => {
    const unborn = findVehicle(NEW_VIN)!
    expect(historyCertificates(unborn)).toEqual([])
    const born = bornVehicle(unborn, registered)
    const entries = ledgerEntries(born, { status: "idle" })
    expect(entries).toHaveLength(2)
    expect(entries[0].seq).toBe(1)
    expect(entries[0].title).toBe("First registration (dealer submission)")
    expect(entries[0].office).toBe("Dealer channel · Mercedes-Benz Downtown")
    expect(historyCertificates(born)).toEqual(entries.map((e) => e.hash))
  })
})

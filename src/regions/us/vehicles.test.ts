import { describe, expect, it } from "vitest"

import { evaluateChecks, failingChecks } from "@/lib/checks"
import { isValidVin } from "@/lib/format"
import { lifecycleStops } from "@/lib/lifecycle"
import { ownershipPeriods } from "@/lib/owners"
import { bornVehicle, findVehicle, openExport, type VehicleRecords } from "@/lib/vehicles"
import { ca } from "@/regions/ca"
import { us } from "@/regions/us"

import { OWNER } from "./people"
import { CLEAN_VIN, EXPORTED_VIN, NEW_VIN, ONTARIO_VIN, SALVAGE_VIN } from "./vehicles"

const TRANSLIT: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
}
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

/** The ISO 3779 / 49 CFR 565 check digit in position 9, which a US decoder verifies. */
function checkDigit(vin: string): string {
  const sum = [...vin].reduce(
    (total, c, i) => total + (/\d/.test(c) ? Number(c) : TRANSLIT[c]) * WEIGHTS[i],
    0
  )
  return sum % 11 === 10 ? "X" : String(sum % 11)
}

const recordsSet = (records: VehicleRecords) =>
  Object.entries(records)
    .filter(([, value]) => value !== null)
    .map(([key]) => key)

describe("the Ohio demo vehicles", () => {
  it("carry valid VINs with correct check digits, unique across both regions", () => {
    const vins = us.vehicles.map((v) => v.vin)
    for (const vin of vins) {
      expect(isValidVin(vin)).toBe(true)
      expect(vin[8]).toBe(checkDigit(vin))
    }
    for (const row of us.seed.recentLookups) expect(row.vin[8]).toBe(checkDigit(row.vin))
    expect(new Set(vins).size).toBe(vins.length)
    for (const vin of vins) expect(ca.vehicles.map((v) => v.vin)).not.toContain(vin)
  })

  it("use Ohio plates, or none while the Ohio title is the application", () => {
    for (const v of us.vehicles) {
      if (v.plate !== null) expect(v.plate).toMatch(/^[A-Z]{3} \d{4}$/)
    }
    expect(findVehicle(us, ONTARIO_VIN)!.plate).toBeNull()
    expect(findVehicle(us, SALVAGE_VIN)!.plate).toBeNull()
  })

  it("keep the unregistered card for the new vehicle only", () => {
    // The vehicle page shows the Unregistered VIN card for a VIN with no history.
    const unregistered = us.vehicles.filter((v) => v.history.length === 0).map((v) => v.vin)
    expect(unregistered).toEqual([NEW_VIN])
  })

  it("give the happy path to the registered owner the buyer asks", () => {
    expect(findVehicle(us, CLEAN_VIN)!.owner.name).toBe(OWNER.name)
  })

  // The US record checks land in Task 6. Until then each scenario is held to the one
  // record that makes it fail, and the export to the check Canada already runs.
  it("flag each catch with exactly one record", () => {
    expect(recordsSet(findVehicle(us, CLEAN_VIN)!.records)).toEqual([])
    expect(recordsSet(findVehicle(us, EXPORTED_VIN)!.records)).toEqual([])
    expect(recordsSet(findVehicle(us, ONTARIO_VIN)!.records)).toEqual(["otherJurisdiction"])
    expect(recordsSet(findVehicle(us, SALVAGE_VIN)!.records)).toEqual(["brand"])
    expect(recordsSet(findVehicle(us, NEW_VIN)!.records)).toEqual([])
  })

  it("reads a CBP export with no re-entry as open", () => {
    expect(openExport(findVehicle(us, EXPORTED_VIN)!)).toMatchObject({ agency: "CBP" })
    expect(openExport(findVehicle(us, CLEAN_VIN)!)).toBeNull()
    const failing = failingChecks(evaluateChecks(us, findVehicle(us, EXPORTED_VIN)!))
    expect(failing.map((c) => c.id)).toContain("border")
  })

  it("draws the catches on the lifecycle strip", () => {
    const kinds = (vin: string) => lifecycleStops(us, findVehicle(us, vin)!).map((s) => s.kind)
    expect(kinds(CLEAN_VIN)).toEqual(["built", "titled", "titleTransferred", "renewed"])
    expect(kinds(EXPORTED_VIN)).toEqual(["built", "titled", "exported", "renewed", "noReentry"])
    // The Ontario registration the ledger holds becomes the flag itself.
    expect(kinds(ONTARIO_VIN)).toEqual(["built", "otherJurisdiction", "titleTransferred"])
    const salvage = lifecycleStops(us, findVehicle(us, SALVAGE_VIN)!)
    expect(salvage.map((s) => s.kind)).toEqual(["built", "titled", "branded", "titleTransferred"])
    expect(salvage.find((s) => s.kind === "branded")).toMatchObject({
      tone: "bad",
      brokenAfter: true,
    })
  })

  it("notes the brand on the ownership its clean title opened", () => {
    const periods = ownershipPeriods(us, findVehicle(us, SALVAGE_VIN)!, "2026-09-29")
    expect(periods).toHaveLength(2)
    expect(periods[0].notes.map((n) => n.kind)).toEqual(["brand"])
    expect(periods[0].notes[0].text).toContain("Indiana title")
    expect(periods[0].odometerAtStart).toBe("41,190 mi")
  })

  it("opens the new vehicle's record with a first title in Ohio", () => {
    const born = bornVehicle(us, findVehicle(us, NEW_VIN)!, {
      status: "registered",
      dealer: "Scioto Ridge Motorcars",
      dealerMobileLast4: "0155",
      nvis: "MCO 2026-0418826",
      deliveryKm: 11,
      firstOwner: "Jordan Whitfield",
      otp: "482 193",
      link: "k7m2p9xq4tvn8bwz",
      sentAt: "2026-09-15T14:02:00.000Z",
      registrationRef: "FVBL-R-2026-09-15-0417",
      registeredAt: "2026-09-15T14:05:30.000Z",
      office: "Dealer channel · Scioto Ridge Motorcars",
    })
    expect(born.history[0]).toEqual({
      kind: "firstTitle",
      date: "2026-09-15",
      agency: "County clerk",
      office: "Dealer channel · Scioto Ridge Motorcars",
      state: "Ohio",
    })
    expect(born.odometer).toBe(11)
  })
})

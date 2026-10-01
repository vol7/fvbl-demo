import { describe, expect, it } from "vitest"

import { isValidVin } from "./format"
import {
  bornVehicle,
  countryOfOrigin,
  findVehicle,
  odometerEvents,
  openExport,
  vehicleTitle,
} from "./vehicles"
import {
  CLEAN_VIN,
  CLONED_VIN,
  DEMO_VEHICLES,
  EXPORTED_VIN,
  NEW_VIN,
  US_TITLE_VIN,
} from "@/regions/ca/vehicles"
import { ca } from "@/regions/ca"

describe("DEMO_VEHICLES", () => {
  it("contains six vehicles with valid, unique VINs", () => {
    expect(DEMO_VEHICLES).toHaveLength(6)
    const vins = DEMO_VEHICLES.map((v) => v.vin)
    expect(new Set(vins).size).toBe(6)
    for (const vin of vins) expect(isValidVin(vin)).toBe(true)
  })

  it("has a clean Mercedes, a cloned Highlander and an exported Range Rover", () => {
    const clean = findVehicle(ca, CLEAN_VIN)!
    const cloned = findVehicle(ca, CLONED_VIN)!
    const exported = findVehicle(ca, EXPORTED_VIN)!
    expect(clean.make).toBe("Mercedes-AMG")
    expect(Object.values(clean.records).every((r) => r === null)).toBe(true)
    expect(cloned.model).toBe("Highlander")
    expect(cloned.records.writeOff).not.toBeNull()
    expect(cloned.records.collision).not.toBeNull()
    expect(cloned.records.duplicateIdentity).not.toBeNull()
    expect(cloned.records.stolenReport).toBeNull()
    expect(cloned.records.lien).toBeNull()
    expect(exported.model).toBe("Range Rover Sport")
    expect(Object.values(exported.records).every((r) => r === null)).toBe(true)
  })

  it("has a Lexus whose only flag is an active Pennsylvania title", () => {
    const lexus = findVehicle(ca, US_TITLE_VIN)!
    expect(lexus.make).toBe("Lexus")
    const { usTitle, ...rest } = lexus.records
    expect(usTitle).toEqual({ state: "Pennsylvania", issuedOn: "2025-07-22" })
    expect(Object.values(rest).every((r) => r === null)).toBe(true)
  })

  it("carries no names in history", () => {
    for (const v of DEMO_VEHICLES) {
      const text = JSON.stringify(v.history)
      expect(text).not.toContain(v.owner.name.split(" ")[1])
      expect(text).not.toContain(v.plate)
    }
  })

  it("starts every authored history with a Transport Canada import", () => {
    for (const v of DEMO_VEHICLES) {
      if (v.history.length === 0) continue
      const first = [...v.history].sort((a, b) => a.date.localeCompare(b.date))[0]
      expect(first.kind).toBe("import")
    }
  })
})

describe("openExport", () => {
  it("is null unless the last border event is an export", () => {
    expect(openExport(findVehicle(ca, CLEAN_VIN)!)).toBeNull()
    expect(openExport(findVehicle(ca, EXPORTED_VIN)!)).toMatchObject({
      kind: "export",
      port: "Port of Montréal, QC",
    })
  })
})

describe("odometerEvents", () => {
  it("returns readings oldest first", () => {
    const km = odometerEvents(findVehicle(ca, CLEAN_VIN)!).map((e) => e.reading)
    expect(km).toEqual([42, 14880, 31240])
  })
})

describe("countryOfOrigin", () => {
  it("names the country the VIN decode says the vehicle was built in", () => {
    expect(countryOfOrigin(findVehicle(ca, CLEAN_VIN)!)).toBe("United States")
    expect(countryOfOrigin(findVehicle(ca, EXPORTED_VIN)!)).toBe("United Kingdom")
    expect(countryOfOrigin(findVehicle(ca, US_TITLE_VIN)!)).toBe("Japan")
  })
})

describe("findVehicle", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(findVehicle(ca, " 4jgfb8kbxpa812634 ")?.vin).toBe(CLEAN_VIN)
  })
  it("returns undefined for unknown VINs", () => {
    expect(findVehicle(ca, "1HGCM82633A004352")).toBeUndefined()
  })
})

describe("vehicleTitle", () => {
  it("joins year, make, model and trim", () => {
    expect(vehicleTitle(findVehicle(ca, CLEAN_VIN)!)).toBe("2023 Mercedes-AMG GLE 63 S 4MATIC+")
  })
})

describe("the unborn vehicle", () => {
  const T = "2026-09-15T14:05:30.000Z"
  const registered = {
    status: "registered" as const,
    dealer: "Mercedes-Benz Downtown",
    dealerMobileLast4: "2204",
    sourceDocument: { label: "NVIS", number: "NVIS 2026-MB-0187342" },
    deliveryKm: 12,
    titleAlerts: null,
    firstOwner: "Léa Tremblay",
    otp: "482 193",
    link: "k7m2p9xq4tvn8bwz",
    sentAt: "2026-09-15T14:02:00.000Z",
    registrationRef: "FVBL-R-2026-09-15-0417",
    registeredAt: T,
    office: "Dealer channel · Mercedes-Benz Downtown",
  }

  it("decodes but has no plate, no registration and no history", () => {
    const v = findVehicle(ca, NEW_VIN)!
    expect(v.year).toBe(2026)
    expect(v.plate).toBeNull()
    expect(v.registeredOn).toBeNull()
    expect(v.history).toEqual([])
    expect(Object.values(v.records).every((r) => r === null)).toBe(true)
  })

  it("bornVehicle is the identity for authored vehicles and while unregistered", () => {
    const clean = findVehicle(ca, CLEAN_VIN)!
    expect(bornVehicle(ca, clean, { status: "none" })).toBe(clean)
    expect(bornVehicle(ca, clean, registered)).toBe(clean)
    const unborn = findVehicle(ca, NEW_VIN)!
    expect(bornVehicle(ca, unborn, { status: "none" })).toBe(unborn)
  })

  it("bornVehicle gives the newborn its first registration and delivery odometer", () => {
    const born = bornVehicle(ca, findVehicle(ca, NEW_VIN)!, registered)
    expect(born.history).toEqual([
      {
        kind: "firstRegistration",
        date: "2026-09-15",
        agency: "MTO",
        office: "Dealer channel · Mercedes-Benz Downtown",
      },
      { kind: "odometer", date: "2026-09-15", agency: "Dealer", reading: 12, source: "Dealer delivery" },
    ])
    expect(born.registeredOn).toBe("2026-09-15")
    expect(born.odometer).toBe(12)
    expect(born.plate).toBeNull()
    expect(odometerEvents(born)).toHaveLength(1)
  })
})

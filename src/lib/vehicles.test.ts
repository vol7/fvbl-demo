import { describe, expect, it } from "vitest"

import { isValidVin } from "./format"
import {
  CLEAN_VIN,
  CLONED_VIN,
  DEMO_VEHICLES,
  EXPORTED_VIN,
  findVehicle,
  odometerEvents,
  openExport,
  vehicleTitle,
} from "./vehicles"

describe("DEMO_VEHICLES", () => {
  it("contains three vehicles with valid, unique VINs", () => {
    expect(DEMO_VEHICLES).toHaveLength(3)
    const vins = DEMO_VEHICLES.map((v) => v.vin)
    expect(new Set(vins).size).toBe(3)
    for (const vin of vins) expect(isValidVin(vin)).toBe(true)
  })

  it("has a clean Mercedes, a cloned Highlander and an exported Range Rover", () => {
    const clean = findVehicle(CLEAN_VIN)!
    const cloned = findVehicle(CLONED_VIN)!
    const exported = findVehicle(EXPORTED_VIN)!
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

  it("carries no names in history", () => {
    for (const v of DEMO_VEHICLES) {
      const text = JSON.stringify(v.history)
      expect(text).not.toContain(v.owner.name.split(" ")[1])
      expect(text).not.toContain(v.plate)
    }
  })

  it("starts every history with a Transport Canada import", () => {
    for (const v of DEMO_VEHICLES) {
      const first = [...v.history].sort((a, b) => a.date.localeCompare(b.date))[0]
      expect(first.kind).toBe("import")
    }
  })
})

describe("openExport", () => {
  it("is null unless the last border event is an export", () => {
    expect(openExport(findVehicle(CLEAN_VIN)!)).toBeNull()
    expect(openExport(findVehicle(EXPORTED_VIN)!)).toMatchObject({
      kind: "export",
      destination: "Lagos, Nigeria",
    })
  })
})

describe("odometerEvents", () => {
  it("returns readings oldest first", () => {
    const km = odometerEvents(findVehicle(CLEAN_VIN)!).map((e) => e.km)
    expect(km).toEqual([42, 14880, 31240])
  })
})

describe("findVehicle", () => {
  it("is case- and whitespace-insensitive", () => {
    expect(findVehicle(" 4jgfb8kb5pa812634 ")?.vin).toBe(CLEAN_VIN)
  })
  it("returns undefined for unknown VINs", () => {
    expect(findVehicle("1HGCM82633A004352")).toBeUndefined()
  })
})

describe("vehicleTitle", () => {
  it("joins year, make, model and trim", () => {
    expect(vehicleTitle(findVehicle(CLEAN_VIN)!)).toBe("2023 Mercedes-AMG GLE 63 S 4MATIC+")
  })
})

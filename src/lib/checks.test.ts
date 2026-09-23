import { describe, expect, it } from "vitest"

import { allPass, evaluateChecks, failingChecks, highRiskChecks } from "./checks"
import {
  CLEAN_VIN,
  CLONED_VIN,
  EXPORTED_VIN,
  findVehicle,
  NEW_VIN,
  US_TITLE_VIN,
  type Vehicle,
} from "./vehicles"

const clean = findVehicle(CLEAN_VIN)!
const cloned = findVehicle(CLONED_VIN)!
const exported = findVehicle(EXPORTED_VIN)!

describe("evaluateChecks", () => {
  it("returns nine checks in display order when everything passes", () => {
    expect(evaluateChecks(clean).map((c) => c.id)).toEqual([
      "border",
      "decode",
      "stolen",
      "writeOff",
      "duplicate",
      "usTitle",
      "collision",
      "odometer",
      "lien",
    ])
  })

  it("passes everything for the clean vehicle", () => {
    const checks = evaluateChecks(clean)
    expect(checks).toHaveLength(9)
    expect(checks.every((c) => c.status === "pass")).toBe(true)
    expect(allPass(checks)).toBe(true)
    expect(failingChecks(checks)).toEqual([])
  })

  it("fails write-off, duplicate and collision for the cloned vehicle, high before low", () => {
    const checks = evaluateChecks(cloned)
    expect(failingChecks(checks).map((c) => c.id)).toEqual(["writeOff", "duplicate", "collision"])
    expect(checks.slice(0, 3).map((c) => c.status)).toEqual(["fail", "fail", "fail"])
    expect(highRiskChecks(checks).map((c) => c.id)).toEqual(["writeOff", "duplicate"])
    expect(allPass(checks)).toBe(false)
  })

  it("includes the insurer and date in the write-off detail", () => {
    const writeOff = evaluateChecks(cloned).find((c) => c.id === "writeOff")!
    expect(writeOff.detail).toContain("Aviva Canada")
    expect(writeOff.detail).toContain("June 14, 2025")
  })

  it("fails only the border check for the exported vehicle", () => {
    const checks = evaluateChecks(exported)
    expect(failingChecks(checks).map((c) => c.id)).toEqual(["border"])
    expect(checks[0]).toMatchObject({ id: "border", status: "fail", severity: "high" })
    expect(checks[0].result).toBe("Exported, no re-entry")
    expect(checks[0].detail).toBe("Left through Port of Montréal, QC on March 18, 2025")
  })

  it("passes the border check when an export is followed by a re-entry", () => {
    const returned: Vehicle = {
      ...exported,
      history: [
        ...exported.history,
        {
          kind: "import",
          date: "2025-09-01",
          agency: "Transport Canada",
          port: "Halifax, NS",
          from: "United States",
          detail: "Registrar of Imported Vehicles · used vehicle",
        },
      ],
    }
    const border = evaluateChecks(returned).find((c) => c.id === "border")!
    expect(border.status).toBe("pass")
    expect(border.result).toBe("No export on record")
    expect(border.detail).toBe("Entered Canada September 1, 2025 via Halifax, NS")
  })

  it("fails the decode check when the VIN decodes to a different vehicle", () => {
    const mismatch: Vehicle = {
      ...clean,
      decoded: { ...clean.decoded, model: "GLE 450" },
    }
    const decode = evaluateChecks(mismatch).find((c) => c.id === "decode")!
    expect(decode).toMatchObject({ status: "fail", severity: "high" })
    expect(decode.detail).toContain("GLE 450")
    expect(decode.detail).toContain("MTO record says 2023 Mercedes-AMG GLE 63 S")
  })

  it("fails odometer consistency when a later reading is lower", () => {
    const rolledBack: Vehicle = {
      ...clean,
      history: clean.history.map((e) =>
        e.kind === "odometer" && e.date === "2024-05-02" ? { ...e, km: 54000 } : e
      ),
    }
    const odometer = evaluateChecks(rolledBack).find((c) => c.id === "odometer")!
    expect(odometer.status).toBe("fail")
    expect(odometer.severity).toBe("low")
    expect(odometer.detail).toContain("54 000 km")
    expect(odometer.detail).toContain("31 240 km")
  })
})

describe("US title check", () => {
  it("fails only the US title check for the Lexus titled in Pennsylvania", () => {
    const checks = evaluateChecks(findVehicle(US_TITLE_VIN)!)
    expect(failingChecks(checks).map((c) => c.id)).toEqual(["usTitle"])
    expect(checks[0]).toMatchObject({ severity: "high", agencies: ["NMVTIS"] })
    expect(checks[0].result).toBe("Active US title")
    expect(checks[0].detail).toBe("Active Pennsylvania title, issued July 22, 2025")
  })

  it("names Carfax as a source for write-offs and collisions", () => {
    const checks = evaluateChecks(clean)
    expect(checks.find((c) => c.id === "writeOff")!.agencies).toContain("Carfax")
    expect(checks.find((c) => c.id === "collision")!.agencies).toContain("Carfax")
  })
})

describe("check copy", () => {
  it("never uses dot separators in results or details", () => {
    for (const vin of [CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, US_TITLE_VIN, NEW_VIN]) {
      for (const c of evaluateChecks(findVehicle(vin)!)) {
        expect(`${c.result} ${c.detail}`).not.toContain("·")
      }
    }
  })
})

describe("odometer check with no readings", () => {
  it("passes and says so instead of crashing", () => {
    const unborn = findVehicle(NEW_VIN)!
    const odometer = evaluateChecks(unborn).find((c) => c.id === "odometer")!
    expect(odometer.status).toBe("pass")
    expect(odometer.result).toMatch(/no readings/i)
    expect(odometer.detail).toBe("")
  })
})

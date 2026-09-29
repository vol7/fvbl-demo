import { describe, expect, it } from "vitest"

import { lifecycleStops } from "./lifecycle"
import { findVehicle } from "./vehicles"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, US_TITLE_VIN } from "@/regions/ca/vehicles"
import { ca } from "@/regions/ca"

const summary = (vin: string) =>
  lifecycleStops(ca, findVehicle(ca, vin)!).map(
    (s) => `${s.title} [${s.lines.join(" / ")}] ${s.tone}`
  )

describe("lifecycleStops", () => {
  it("tells a clean life from the factory to the last renewal", () => {
    expect(summary(CLEAN_VIN)).toEqual([
      "Built [United States] major",
      "Entered Canada [Feb 2023 / Windsor] major",
      "First registration [Apr 2023 / Toronto] major",
      "Renewed [Apr 2025] minor",
    ])
  })

  it("folds consecutive renewals and ends an open export on the gap", () => {
    const stops = lifecycleStops(ca, findVehicle(ca, EXPORTED_VIN)!)
    expect(stops.map((s) => s.title)).toEqual([
      "Built",
      "Entered Canada",
      "First registration",
      "Renewed ×2",
      "Exported",
      "No re-entry",
    ])
    expect(stops.find((s) => s.kind === "renewed")!.lines).toEqual(["Jan 2024", "Jan 2025"])
    const exported = stops.find((s) => s.kind === "exported")!
    expect(exported).toMatchObject({
      tone: "bad",
      brokenAfter: true,
      lines: ["Mar 2025", "Montréal"],
    })
    expect(stops.at(-1)).toMatchObject({ kind: "noReentry", tone: "open" })
  })

  it("slots the records that flag a vehicle in by date", () => {
    expect(summary(CLONED_VIN)).toEqual([
      "Built [United States] major",
      "Entered Canada [Jan 2025 / Sarnia] major",
      "First registration [Feb 2025 / Whitby] major",
      "Written off [Jun 2025 / Aviva Canada] bad",
      "Transferred [Aug 2025 / Scarborough] major",
      "VIN on CRHM 118 [Aug 2025 / Second plate] bad",
    ])
    expect(summary(US_TITLE_VIN).at(-1)).toBe("Titled in Pennsylvania [Jul 2025 / NMVTIS] bad")
  })
})

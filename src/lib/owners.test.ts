import { describe, expect, it } from "vitest"

import { ownershipPeriods } from "./owners"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, findVehicle } from "./vehicles"

const TODAY = "2026-09-23"

describe("ownershipPeriods", () => {
  it("has one current owner for the clean vehicle, with its renewal", () => {
    const [owner, ...rest] = ownershipPeriods(findVehicle(CLEAN_VIN)!, TODAY)
    expect(rest).toEqual([])
    expect(owner).toMatchObject({
      number: 1,
      current: true,
      since: "2023-04-18",
      until: null,
      duration: "3 yr 5 mo",
      acquired: "New vehicle",
      office: "Toronto office 4412",
      odometerAtStart: "42 km",
    })
    expect(owner.notes).toEqual([
      { tone: "plain", kind: "renewed", text: "Renewed on April 11, 2025." },
    ])
  })

  it("puts the export on the current owner's watch, with no sale on file", () => {
    const [owner] = ownershipPeriods(findVehicle(EXPORTED_VIN)!, TODAY)
    expect(owner.notes).toEqual([
      {
        tone: "bad",
        kind: "exported",
        text: "CBSA recorded a vehicle with this VIN leaving Canada on March 18, 2025, while it was registered to this owner. The MTO has no sale or transfer on file.",
      },
    ])
  })

  it("lists owners newest first and ties the transfer to the write-off", () => {
    const [current, first] = ownershipPeriods(findVehicle(CLONED_VIN)!, TODAY)
    expect(current).toMatchObject({ number: 2, current: true, acquired: "Transfer" })
    expect(current.notes[0].text).toBe(
      "The transfer came 67 days after the insurer write-off. On the same day, this VIN became active on plate CRHM 118."
    )
    expect(first).toMatchObject({
      number: 1,
      current: false,
      until: "2025-08-20",
      duration: "6 mo",
    })
    expect(first.notes[0].text).toBe(
      "Collision on June 12, 2025. Aviva Canada declared it a total loss on June 14, 2025."
    )
  })
})

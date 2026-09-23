import { describe, expect, it } from "vitest"

import { evaluateChecks } from "./checks"
import { recordStory } from "./story"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, findVehicle, US_TITLE_VIN } from "./vehicles"

const storyFor = (vin: string) => {
  const vehicle = findVehicle(vin)!
  return recordStory(vehicle, evaluateChecks(vehicle))
}

describe("recordStory", () => {
  it("has nothing to tell when every check passes", () => {
    expect(storyFor(CLEAN_VIN)).toBeNull()
  })

  it("tells the CBSA and Transport Canada story for an open export", () => {
    const story = storyFor(EXPORTED_VIN)!
    expect(story.title).toBe("A vehicle with this VIN left Canada and has no re-entry on record")
    expect(story.body).toContain("March 18, 2025 via Port of Montréal, QC")
    expect(story.body).toContain("Transport Canada has no re-entry on file")
    expect(story.body).toContain("cloned identity")
    expect(story.foot).toBe(
      "Reported by Transport Canada and CBSA. The MTO record alone would have shown this vehicle as clear."
    )
    expect(story.sharedWith).toBe("RCMP and CBSA")
  })

  it("tells the US title conflict through NMVTIS", () => {
    const story = storyFor(US_TITLE_VIN)!
    expect(story.title).toBe("This VIN also holds an active US title")
    expect(story.body).toContain("active Pennsylvania title for this VIN, issued July 22, 2025")
    expect(story.foot).toContain("The Ontario record alone would have shown this vehicle as clear")
  })

  it("leads with the worst flag and names the rest in a sentence", () => {
    const story = storyFor(CLONED_VIN)!
    expect(story.title).toBe("This vehicle was declared a total loss")
    expect(story.body).toContain("Aviva Canada declared it a total loss on June 14, 2025")
    expect(story.foot).toBe(
      "Reported by IBC and Carfax. Duplicate identity and collision record are also flagged."
    )
    expect(story.sharedWith).toBe("Ontario Provincial Police")
  })

  it("never uses dot separators", () => {
    for (const vin of [EXPORTED_VIN, US_TITLE_VIN, CLONED_VIN]) {
      const story = storyFor(vin)!
      expect(`${story.title} ${story.body} ${story.foot}`).not.toContain("·")
    }
  })
})

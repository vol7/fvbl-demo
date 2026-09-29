import { describe, expect, it } from "vitest"

import { us } from "@/regions/us"

describe("the US pack", () => {
  it("gives the clerk no actions: the card only informs", () => {
    expect(us.copy.decision.actions).toBeNull()
  })

  it("labels the verdict for a county title office", () => {
    expect(us.copy.decision.verdict.blocked).toBe("Hold for review")
  })
})

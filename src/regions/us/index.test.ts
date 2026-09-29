import { describe, expect, it } from "vitest"

import { us } from "@/regions/us"

describe("the US pack", () => {
  it("treats the owner's confirmation as evidence, not a gate", () => {
    expect(us.policy.ownerConfirmation).toBe("optional")
  })

  it("labels the verdict for a county title office", () => {
    expect(us.copy.decision.verdict.issued).toBe("Title issued")
    expect(us.copy.decision.verdict.blocked).toBe("Hold for review")
  })
})

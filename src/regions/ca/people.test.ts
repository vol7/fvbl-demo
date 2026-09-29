import { describe, expect, it } from "vitest"

import { maskLicence } from "@/lib/people"

import { BUYER, OWNER } from "./people"

describe("maskLicence", () => {
  it("keeps the leading letter and the last four characters", () => {
    expect(maskLicence("D6101-40706-60905")).toBe("D••••-•••••-•0905")
  })

  it("leaves separators in place", () => {
    expect(maskLicence("B2947-51083-64712")).toBe("B••••-•••••-•4712")
  })
})

describe("demo people", () => {
  it("gives the owner the licence number printed on the specimen card", () => {
    expect(OWNER.licence).toBe("D6101-40706-60905")
  })

  it("gives the buyer a licence starting with their surname initial", () => {
    expect(BUYER.name).toBe("Marcus Beaulieu")
    expect(BUYER.licence.startsWith("B")).toBe(true)
  })
})

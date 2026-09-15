import { describe, expect, it } from "vitest"

import {
  formatDate,
  formatOdometer,
  formatRelative,
  formatTime,
  isValidVin,
  maskName,
  normalizeVin,
} from "./format"

describe("normalizeVin", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeVin(" 4jgfb8kb5pa 812634 ")).toBe("4JGFB8KB5PA812634")
  })
})

describe("isValidVin", () => {
  it("accepts a 17-character VIN without I, O, Q", () => {
    expect(isValidVin("4JGFB8KB5PA812634")).toBe(true)
  })
  it("accepts lowercase input", () => {
    expect(isValidVin("4jgfb8kb5pa812634")).toBe(true)
  })
  it("rejects wrong length", () => {
    expect(isValidVin("4JGFB8KB5PA81263")).toBe(false)
  })
  it("rejects I, O and Q", () => {
    expect(isValidVin("4JGFB8KB5PA81263I")).toBe(false)
    expect(isValidVin("4JGFB8KB5PA81263O")).toBe(false)
    expect(isValidVin("4JGFB8KB5PA81263Q")).toBe(false)
  })
})

describe("maskName", () => {
  it("keeps the first letter of each part", () => {
    expect(maskName("Daniel Okafor")).toBe("D***** O*****")
  })
  it("handles single-letter parts", () => {
    expect(maskName("A Li")).toBe("A* L*")
  })
  it("returns an empty string for an empty name", () => {
    expect(maskName("")).toBe("")
  })
})

describe("formatOdometer", () => {
  it("groups thousands with a space and appends km", () => {
    expect(formatOdometer(31240)).toBe("31 240 km")
    expect(formatOdometer(8410)).toBe("8 410 km")
    expect(formatOdometer(12)).toBe("12 km")
  })
})

describe("formatDate", () => {
  it("renders a long en-CA date", () => {
    expect(formatDate("2023-04-18")).toBe("April 18, 2023")
  })
})

describe("formatTime", () => {
  it("renders hours and minutes", () => {
    const iso = new Date(2026, 8, 2, 14, 14).toISOString()
    expect(formatTime(iso)).toMatch(/2:14/)
  })
})

describe("formatRelative", () => {
  const now = new Date("2026-09-12T15:00:00.000Z")
  it("rounds to the coarsest sensible unit", () => {
    expect(formatRelative("2026-09-12T14:59:40.000Z", now)).toBe("just now")
    expect(formatRelative("2026-09-12T14:57:00.000Z", now)).toBe("3 minutes ago")
    expect(formatRelative("2026-09-12T14:59:00.000Z", now)).toBe("1 minute ago")
    expect(formatRelative("2026-09-12T13:00:00.000Z", now)).toBe("2 hours ago")
    expect(formatRelative("2026-09-10T15:00:00.000Z", now)).toBe("2 days ago")
  })
})

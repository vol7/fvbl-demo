import { describe, expect, it } from "vitest"

import { isValidVin } from "@/lib/format"

import { BORDER } from "./border"
import { DEMO_VEHICLES, EXPORT_VIN } from "./vehicles"

const TRANSLIT: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
}
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

function vinCheckDigit(vin: string): string {
  const sum = [...vin].reduce(
    (total, c, i) => total + (/\d/.test(c) ? Number(c) : TRANSLIT[c]) * WEIGHTS[i],
    0
  )
  return sum % 11 === 10 ? "X" : String(sum % 11)
}

/** ISO 6346: letters skip multiples of 11, weights double, sum mod 11 mod 10. */
function containerCheckDigit(container: string): string {
  const letters: Record<string, number> = {}
  let value = 10
  for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (value % 11 === 0) value++
    letters[c] = value++
  }
  const sum = [...container.slice(0, 10)].reduce(
    (total, c, i) => total + (/\d/.test(c) ? Number(c) : letters[c]) * 2 ** i,
    0
  )
  return String((sum % 11) % 10)
}

describe("the vehicles declared for export", () => {
  it("carry valid VINs, unique, and only the RAM is also a clerk's demo vehicle", () => {
    const vins = BORDER.declared.map((v) => v.vin)
    for (const vin of vins) {
      expect(isValidVin(vin), vin).toBe(true)
      expect(vin[8], vin).toBe(vinCheckDigit(vin))
    }
    expect(new Set(vins).size).toBe(vins.length)
    const demo = DEMO_VEHICLES.map((v) => v.vin)
    expect(vins.filter((vin) => demo.includes(vin))).toEqual([EXPORT_VIN])
  })

  it("sit in one container each, with valid container numbers", () => {
    const containers = BORDER.declared.map((v) => v.container)
    expect(new Set(containers).size).toBe(containers.length)
    for (const container of containers) {
      expect(container, container).toMatch(/^[A-Z]{3}U\d{7}$/)
      expect(container[10], container).toBe(containerCheckDigit(container))
    }
  })

  it("follow exactly one live declaration: the RAM, catch 4", () => {
    expect(BORDER.declared.filter((v) => v.owner === "live").map((v) => v.vin)).toEqual([
      EXPORT_VIN,
    ])
    expect(BORDER.live.vin).toBe(EXPORT_VIN)
  })

  it("name the registered owner as the exporter: shipped under the seller's name", () => {
    const owner = DEMO_VEHICLES.find((v) => v.vin === EXPORT_VIN)!.owner.name
    expect(BORDER.live.exporter).toBe(owner)
    expect(BORDER.declared.find((v) => v.vin === EXPORT_VIN)!.record.owner).toBe(owner)
  })
})

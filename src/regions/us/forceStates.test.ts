import { describe, expect, it } from "vitest"

import {
  activeAuthorization,
  createSessionStore,
  EMPTY_SESSION,
  storageKey,
} from "@/lib/session"
import { findVehicle } from "@/lib/vehicles"

import { us } from "."
import { FORCE_STATES, forcedSession } from "./forceStates"
import { CLEAN_VIN, EXPORTED_VIN, NEW_VIN } from "./vehicles"

const NOW = new Date("2026-09-29T14:00:00.000Z")

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe("US forcedSession", () => {
  it("produces a session on a US vehicle for every listed control", () => {
    for (const { key } of FORCE_STATES) {
      const s = forcedSession(key, NOW)
      if (key === "idle") {
        expect(s).toEqual(EMPTY_SESSION)
        continue
      }
      expect(s.activeVin, key).not.toBeNull()
      expect(findVehicle(us, s.activeVin!), key).toBeDefined()
      if (key === "dealerSubmitted" || key === "titleRecorded") {
        expect(s.registrations[s.activeVin!], key).toBeDefined()
        continue
      }
      expect(activeAuthorization(s), key).not.toBeNull()
    }
  })

  it("puts the first title on the new car, with title alerts on", () => {
    const s = forcedSession("titleRecorded", NOW)
    expect(s.activeVin).toBe(NEW_VIN)
    expect(s.registrations[NEW_VIN]).toMatchObject({
      status: "registered",
      registrationRef: expect.stringMatching(/^FVBL-T-/),
      titleAlerts: { mobileLast4: us.people.firstOwner.mobileLast4 },
    })
  })

  it("starts every owner request from the buyer, on the happy-path GLE", () => {
    for (const key of ["buyerAsked", "ownerConfirmed", "notMe", "noReply"] as const) {
      const s = forcedSession(key, NOW)
      expect(s.activeVin, key).toBe(CLEAN_VIN)
      expect(activeAuthorization(s)?.state, key).toMatchObject({ origin: "buyer" })
    }
  })

  it("holds the exported vehicle", () => {
    expect(forcedSession("held", NOW).activeVin).toBe(EXPORTED_VIN)
    expect(activeAuthorization(forcedSession("held", NOW))?.state).toEqual({ status: "blocked" })
  })

  it("never forces an issued or referred record: the US card only informs", () => {
    for (const { key } of FORCE_STATES) {
      for (const state of Object.values(forcedSession(key, NOW).authorizations)) {
        expect(state.status, key).not.toBe("escalated")
        expect(state, key).not.toHaveProperty("issued")
      }
    }
  })

  it("never touches the Canadian session", () => {
    const storage = memoryStorage()
    storage.setItem(storageKey("ca"), JSON.stringify({ marker: "ca" }))
    const store = createSessionStore({ storage, channel: null, region: "us" })
    for (const { key } of FORCE_STATES) {
      store.dispatch({ type: "force", session: forcedSession(key, NOW) })
    }
    expect(storage.getItem(storageKey("ca"))).toBe(JSON.stringify({ marker: "ca" }))
    expect(storage.getItem(storageKey("us"))).not.toBeNull()
  })
})

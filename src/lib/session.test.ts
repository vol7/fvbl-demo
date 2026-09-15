import { describe, expect, it } from "vitest"

import {
  activeAuthorization,
  createSessionStore,
  EMPTY_SESSION,
  sessionReducer,
  STORAGE_KEY,
  vehicleState,
} from "./session"

const T0 = "2026-09-09T18:14:00.000Z"
const T1 = "2026-09-09T18:16:30.000Z"
const A = "4JGFB8KB5PA812634"
const B = "5TDEBRCH7SS041927"
const LINK = "k7m2p9xq4tvn8bwz"

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  }
}

function fakeChannel() {
  const posted: unknown[] = []
  const ch = {
    posted,
    onmessage: null as ((e: MessageEvent) => void) | null,
    postMessage(data: unknown) {
      posted.push(data)
    },
    close() {},
  }
  return ch as unknown as BroadcastChannel & { posted: unknown[] }
}

function request(vin = A, canRequest = true) {
  return {
    type: "request" as const,
    vin,
    canRequest,
    otp: "482 193",
    link: LINK,
    requester: "Marcus B.",
    at: T0,
  }
}

describe("sessionReducer", () => {
  it("a clerk request creates the slot and makes it active", () => {
    const s = sessionReducer(EMPTY_SESSION, request())
    expect(s.activeVin).toBe(A)
    expect(s.authorizations[A]).toMatchObject({ status: "pending", origin: "clerk", link: LINK })
  })

  it("keeps independent state for two vehicles at once", () => {
    let s = sessionReducer(EMPTY_SESSION, request(A))
    s = sessionReducer(s, {
      type: "escalate",
      vin: B,
      canRequest: false,
      caseReference: "FVBL-2026-09-09-0001",
      at: T1,
    })
    expect(s.authorizations[A].status).toBe("pending")
    expect(s.authorizations[B].status).toBe("escalated")
    expect(s.activeVin, "escalation does not move the phone").toBe(A)
  })

  it("owner actions target their vehicle and ignore a missing slot", () => {
    const s = sessionReducer(EMPTY_SESSION, request(A))
    const approved = sessionReducer(s, {
      type: "approve",
      vin: A,
      authorizationCode: "OV-AAAA-BBBB",
      at: T1,
    })
    expect(approved.authorizations[A]).toMatchObject({ status: "authorized", link: LINK })
    expect(sessionReducer(s, { type: "approve", vin: B, authorizationCode: "X", at: T1 })).toBe(s)
  })

  it("returns the same object when an action does not apply", () => {
    const s = sessionReducer(EMPTY_SESSION, request(A))
    expect(sessionReducer(s, request(A)), "request on pending").toBe(s)
    expect(sessionReducer(s, { type: "issue", vin: A, packageNumber: "X", at: T1 })).toBe(s)
  })

  it("preapprove and buyerRequest set the slot and the active vehicle", () => {
    const pre = sessionReducer(EMPTY_SESSION, {
      type: "preapprove",
      vin: A,
      owner: "Daniel Okafor",
      authorizationCode: "OV-AAAA-BBBB",
      at: T0,
    })
    expect(pre).toMatchObject({
      activeVin: A,
      authorizations: { [A]: { status: "authorized", origin: "owner" } },
    })
    const buy = sessionReducer(EMPTY_SESSION, {
      type: "buyerRequest",
      vin: A,
      buyer: "Marcus Beaulieu",
      otp: "111 222",
      link: LINK,
      at: T0,
    })
    expect(buy.authorizations[A]).toMatchObject({ status: "pending", origin: "buyer", link: LINK })
  })

  it("clear empties everything; force replaces everything", () => {
    const s = sessionReducer(EMPTY_SESSION, request(A))
    expect(sessionReducer(s, { type: "clear" })).toEqual(EMPTY_SESSION)
    const forced = { authorizations: { [B]: { status: "blocked" as const } }, activeVin: B }
    expect(sessionReducer(s, { type: "force", session: forced })).toBe(forced)
  })
})

describe("selectors", () => {
  it("vehicleState falls back to what the record checks imply", () => {
    expect(vehicleState(EMPTY_SESSION, A, true)).toEqual({ status: "idle" })
    expect(vehicleState(EMPTY_SESSION, B, false)).toEqual({ status: "blocked" })
    const s = sessionReducer(EMPTY_SESSION, request(A))
    expect(vehicleState(s, A, true).status).toBe("pending")
  })

  it("activeAuthorization is null until something is requested", () => {
    expect(activeAuthorization(EMPTY_SESSION)).toBeNull()
    const s = sessionReducer(EMPTY_SESSION, request(A))
    expect(activeAuthorization(s)).toMatchObject({ vin: A, state: { status: "pending" } })
  })
})

describe("createSessionStore", () => {
  it("starts empty, persists on dispatch, and pings the channel", () => {
    const storage = memoryStorage()
    const channel = fakeChannel()
    const store = createSessionStore({ storage, channel, warn: () => {} })
    let notified = 0
    store.subscribe(() => notified++)
    store.dispatch(request(A))
    expect(notified).toBe(1)
    expect(JSON.parse(storage.map.get(STORAGE_KEY)!)).toEqual(store.getState())
    expect(channel.posted).toEqual(["changed"])
  })

  it("treats storage as the source of truth, not its own copy", () => {
    // Two stores share one storage, like two windows. Neither is told about the other.
    const storage = memoryStorage()
    const clerk = createSessionStore({ storage, channel: null, warn: () => {} })
    const phone = createSessionStore({ storage, channel: null, warn: () => {} })
    clerk.dispatch(request(A))
    // The phone's in-memory copy is stale, yet approving computes from storage.
    phone.dispatch({ type: "approve", vin: A, authorizationCode: "OV-AAAA-BBBB", at: T1 })
    expect(phone.getState().authorizations[A].status).toBe("authorized")
    expect(JSON.parse(storage.map.get(STORAGE_KEY)!).authorizations[A].status).toBe("authorized")
  })

  it("re-reads storage when pinged", () => {
    const storage = memoryStorage()
    const channel = fakeChannel()
    const store = createSessionStore({ storage, channel, warn: () => {} })
    storage.setItem(STORAGE_KEY, JSON.stringify(sessionReducer(EMPTY_SESSION, request(A))))
    let notified = 0
    store.subscribe(() => notified++)
    channel.onmessage?.({ data: "changed" } as MessageEvent)
    expect(store.getState().authorizations[A].status).toBe("pending")
    expect(notified).toBe(1)
  })

  it("ignores corrupt or v1 storage", () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, "{nope")
    expect(createSessionStore({ storage, channel: null }).getState()).toEqual(EMPTY_SESSION)
    storage.setItem(STORAGE_KEY, JSON.stringify({ vin: A, authorization: { status: "idle" } }))
    expect(createSessionStore({ storage, channel: null }).getState()).toEqual(EMPTY_SESSION)
  })

  it("says so out loud when an action is ignored", () => {
    const warnings: string[] = []
    const store = createSessionStore({
      storage: memoryStorage(),
      channel: null,
      warn: (m) => warnings.push(m),
    })
    store.dispatch({ type: "approve", vin: A, authorizationCode: "X", at: T1 })
    expect(warnings).toEqual(["[fvbl] ignored approve in no record"])
  })
})

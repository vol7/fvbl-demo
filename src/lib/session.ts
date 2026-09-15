import { useSyncExternalStore } from "react"

import {
  authorizationReducer,
  buyerPendingState,
  initialState,
  preapprovedState,
  type AuthorizationAction,
  type AuthorizationState,
} from "./authorization"

/**
 * Session model v2.
 *
 * Authorizations are keyed by VIN so several vehicles can hold state at once, and
 * browsing a vehicle page never writes. `activeVin` is what the phone follows; only
 * the actions that actually text the owner (or pre-approve) move it.
 */
export type SessionState = {
  authorizations: Record<string, AuthorizationState>
  activeVin: string | null
}

/** Every authorization action names the vehicle it applies to. */
type Targeted<A> = A & { vin: string }

export type SessionAction =
  | { type: "clear" }
  | { type: "force"; session: SessionState }
  | { type: "preapprove"; vin: string; owner: string; authorizationCode: string; at: string }
  | { type: "buyerRequest"; vin: string; buyer: string; otp: string; link: string; at: string }
  | Targeted<Extract<AuthorizationAction, { type: "request" }> & { canRequest: boolean }>
  | Targeted<Extract<AuthorizationAction, { type: "escalate" }> & { canRequest: boolean }>
  | Targeted<Extract<AuthorizationAction, { type: "approve" | "deny" | "timeout" | "issue" }>>

export const EMPTY_SESSION: SessionState = { authorizations: {}, activeVin: null }

/** The state of one vehicle, falling back to what its record checks imply. */
export function vehicleState(
  session: SessionState,
  vin: string,
  canRequest: boolean
): AuthorizationState {
  return session.authorizations[vin] ?? initialState(canRequest)
}

/** The authorization the phone and hub follow, if any. */
export function activeAuthorization(
  session: SessionState
): { vin: string; state: AuthorizationState } | null {
  const vin = session.activeVin
  if (!vin) return null
  const state = session.authorizations[vin]
  return state ? { vin, state } : null
}

function withSlot(
  session: SessionState,
  vin: string,
  next: AuthorizationState,
  activate = false
): SessionState {
  return {
    authorizations: { ...session.authorizations, [vin]: next },
    activeVin: activate ? vin : session.activeVin,
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "clear":
      return EMPTY_SESSION
    case "force":
      return action.session
    case "preapprove":
      return withSlot(state, action.vin, preapprovedState(action), true)
    case "buyerRequest":
      return withSlot(state, action.vin, buyerPendingState(action), true)
    case "request":
    case "escalate": {
      const { vin, canRequest, ...rest } = action
      const base = state.authorizations[vin] ?? initialState(canRequest)
      const next = authorizationReducer(base, rest)
      if (next === base) return state
      return withSlot(state, vin, next, action.type === "request")
    }
    default: {
      const { vin, ...rest } = action
      const base = state.authorizations[vin]
      if (!base) return state
      const next = authorizationReducer(base, rest)
      return next === base ? state : withSlot(state, vin, next)
    }
  }
}

export const STORAGE_KEY = "fvbl-demo:session:v2"
export const CHANNEL_NAME = "fvbl-demo"

type Listener = () => void

export type SessionStore = {
  getState: () => SessionState
  dispatch: (action: SessionAction) => void
  subscribe: (listener: Listener) => () => void
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

function isSession(value: unknown): value is SessionState {
  if (!value || typeof value !== "object") return false
  const v = value as Partial<SessionState>
  return (
    typeof v.authorizations === "object" &&
    v.authorizations !== null &&
    (v.activeVin === null || typeof v.activeVin === "string")
  )
}

function readStorage(storage: StorageLike | null): SessionState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

function safeStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null
    const s = window.localStorage
    s.getItem(STORAGE_KEY)
    return s
  } catch {
    return null
  }
}

function safeChannel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel === "undefined") return null
    return new BroadcastChannel(CHANNEL_NAME)
  } catch {
    return null
  }
}

function describe(state: AuthorizationState | undefined): string {
  return state ? state.status : "no record"
}

export function createSessionStore(
  options: {
    storage?: StorageLike | null
    channel?: BroadcastChannel | null
    warn?: (message: string) => void
  } = {}
): SessionStore {
  const storage = options.storage === undefined ? safeStorage() : options.storage
  const channel = options.channel === undefined ? safeChannel() : options.channel
  const warn =
    options.warn ??
    ((message: string) => {
      if (import.meta.env?.DEV) console.warn(message)
    })

  // Storage is the single source of truth. This is only a cache for render.
  let state: SessionState = readStorage(storage) ?? EMPTY_SESSION
  const listeners = new Set<Listener>()

  function setState(next: SessionState) {
    if (next === state) return
    state = next
    listeners.forEach((l) => l())
  }

  function current(): SessionState {
    return readStorage(storage) ?? state
  }

  function refresh() {
    const latest = readStorage(storage)
    if (latest) setState(latest)
  }

  if (channel) channel.onmessage = refresh
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) refresh()
    })
  }

  return {
    getState: () => state,
    dispatch(action) {
      const before = current()
      const next = sessionReducer(before, action)
      if (next === before) {
        const vin = "vin" in action ? action.vin : before.activeVin
        warn(
          `[fvbl] ignored ${action.type} in ${describe(vin ? before.authorizations[vin] : undefined)}`
        )
        setState(before)
        return
      }
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable: memory only */
      }
      setState(next)
      try {
        channel?.postMessage("changed")
      } catch {
        /* channel unavailable */
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

let defaultStore: SessionStore | null = null

export function getSessionStore(): SessionStore {
  if (!defaultStore) defaultStore = createSessionStore()
  return defaultStore
}

/** Test hook: replace the singleton (pass null to reset). */
export function setSessionStore(store: SessionStore | null) {
  defaultStore = store
}

export function useSession(): [SessionState, (action: SessionAction) => void] {
  const store = getSessionStore()
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  return [state, store.dispatch]
}

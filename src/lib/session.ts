import { useSyncExternalStore } from "react"

import { useRegionId } from "@/regions/context"
import type { RegionId } from "@/regions/types"

import {
  authorizationReducer,
  buyerPendingState,
  initialState,
  preapprovedState,
  type AuthorizationAction,
  type AuthorizationState,
  type Policy,
} from "./authorization"
import {
  NO_REGISTRATION,
  registrationReducer,
  type RegistrationAction,
  type RegistrationState,
  type Submission,
} from "./registration"

/**
 * Session model v2.
 *
 * Authorizations are keyed by VIN so several vehicles can hold state at once, and
 * browsing a vehicle page never writes. `activeVin` is what the phone follows; only
 * the actions that actually text someone (or pre-approve) move it.
 *
 * Registrations (a dealer's first registration of a new VIN) live in their own map
 * with their own machine. A VIN is never in both flows during the demo.
 */
export type SessionState = {
  authorizations: Record<string, AuthorizationState>
  registrations: Record<string, RegistrationState>
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
  | Targeted<Extract<AuthorizationAction, { type: "approve" | "deny" | "timeout" }>>
  | Targeted<
      Extract<AuthorizationAction, { type: "issue" }> & {
        /** The region's rule. Omitted means Canada's: issue only once the owner approved. */
        policy?: Policy
        /** Lets the US clerk issue on a vehicle nobody has acted on yet. */
        canRequest?: boolean
      }
    >
  | {
      type: "submitRegistration"
      vin: string
      submission: Submission
      otp: string
      link: string
      at: string
    }
  | { type: "confirmRegistration"; vin: string; registrationRef: string; at: string }
  | { type: "declineRegistration"; vin: string; at: string }

export const EMPTY_SESSION: SessionState = {
  authorizations: {},
  registrations: {},
  activeVin: null,
}

/** The state of one vehicle, falling back to what its record checks imply. */
export function vehicleState(
  session: SessionState,
  vin: string,
  canRequest: boolean
): AuthorizationState {
  return session.authorizations[vin] ?? initialState(canRequest)
}

/** The registration of one vehicle, `none` until a dealer submits. */
export function registrationState(session: SessionState, vin: string): RegistrationState {
  return session.registrations[vin] ?? NO_REGISTRATION
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
    ...session,
    authorizations: { ...session.authorizations, [vin]: next },
    activeVin: activate ? vin : session.activeVin,
  }
}

function withRegistration(
  session: SessionState,
  vin: string,
  action: RegistrationAction,
  activate = false
): SessionState {
  const base = registrationState(session, vin)
  const next = registrationReducer(base, action)
  if (next === base) return session
  return {
    ...session,
    registrations: { ...session.registrations, [vin]: next },
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
    case "submitRegistration":
      return withRegistration(
        state,
        action.vin,
        {
          type: "submit",
          submission: action.submission,
          otp: action.otp,
          link: action.link,
          at: action.at,
        },
        true
      )
    case "confirmRegistration":
      return withRegistration(state, action.vin, {
        type: "confirm",
        registrationRef: action.registrationRef,
        at: action.at,
      })
    case "declineRegistration":
      return withRegistration(state, action.vin, { type: "decline", at: action.at })
    case "issue": {
      const { vin, canRequest, policy, ...rest } = action
      const base =
        state.authorizations[vin] ??
        (canRequest === undefined ? undefined : initialState(canRequest))
      if (!base) return state
      const next = authorizationReducer(base, rest, policy)
      return next === base ? state : withSlot(state, vin, next)
    }
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

/** One session per region, so resetting a US take never touches a Canadian setup. */
export function storageKey(region: RegionId): string {
  return `fvbl-demo:session:v2:${region}`
}

export function channelName(region: RegionId): string {
  return `fvbl-demo:${region}`
}

/** Where the single session lived before regions. Canada inherits it once. */
export const LEGACY_STORAGE_KEY = "fvbl-demo:session:v2"

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

function readStorage(storage: StorageLike | null, key: string): SessionState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed)) return null
    // Sessions stored before registrations existed are still v2; fill the map.
    const session = parsed.registrations ? parsed : { ...parsed, registrations: {} }
    return withIssuedReferences(session)
  } catch {
    return null
  }
}

/**
 * Issued records stored before the US version call the number `packageNumber`.
 * Renamed to `reference` so an older Canadian session still reads.
 */
function withIssuedReferences(session: SessionState): SessionState {
  let changed = false
  const authorizations: Record<string, AuthorizationState> = {}
  for (const [vin, state] of Object.entries(session.authorizations)) {
    const issued =
      "issued" in state ? (state.issued as Record<string, unknown> | undefined) : undefined
    if (issued && typeof issued.packageNumber === "string" && issued.reference === undefined) {
      const { packageNumber, ...rest } = issued
      authorizations[vin] = {
        ...state,
        issued: { ...rest, reference: packageNumber },
      } as AuthorizationState
      changed = true
    } else {
      authorizations[vin] = state
    }
  }
  return changed ? { ...session, authorizations } : session
}

function safeStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null
    const s = window.localStorage
    s.getItem(LEGACY_STORAGE_KEY)
    return s
  } catch {
    return null
  }
}

function safeChannel(region: RegionId): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel === "undefined") return null
    return new BroadcastChannel(channelName(region))
  } catch {
    return null
  }
}

/** Copies the pre-region session to Canada's key, once, and drops the old key. */
function migrateLegacy(storage: StorageLike | null) {
  if (!storage) return
  try {
    const legacy = storage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === null) return
    if (storage.getItem(storageKey("ca")) === null) storage.setItem(storageKey("ca"), legacy)
    storage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

function describe(state: AuthorizationState | RegistrationState | undefined): string {
  return state ? state.status : "no record"
}

export function createSessionStore(
  options: {
    region?: RegionId
    storage?: StorageLike | null
    channel?: BroadcastChannel | null
    warn?: (message: string) => void
  } = {}
): SessionStore {
  const region = options.region ?? "ca"
  const key = storageKey(region)
  const storage = options.storage === undefined ? safeStorage() : options.storage
  const channel = options.channel === undefined ? safeChannel(region) : options.channel
  const warn =
    options.warn ??
    ((message: string) => {
      if (import.meta.env?.DEV) console.warn(message)
    })

  if (region === "ca") migrateLegacy(storage)

  // Storage is the single source of truth. This is only a cache for render.
  let state: SessionState = readStorage(storage, key) ?? EMPTY_SESSION
  const listeners = new Set<Listener>()

  function setState(next: SessionState) {
    if (next === state) return
    state = next
    listeners.forEach((l) => l())
  }

  function current(): SessionState {
    return readStorage(storage, key) ?? state
  }

  function refresh() {
    const latest = readStorage(storage, key)
    if (latest) setState(latest)
  }

  if (channel) channel.onmessage = refresh
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === key) refresh()
    })
  }

  return {
    getState: () => state,
    dispatch(action) {
      const before = current()
      const next = sessionReducer(before, action)
      if (next === before) {
        const vin = "vin" in action ? action.vin : before.activeVin
        const slot = action.type.endsWith("Registration")
          ? vin && before.registrations[vin]
          : vin && before.authorizations[vin]
        warn(`[fvbl] ignored ${action.type} in ${describe(slot || undefined)}`)
        setState(before)
        return
      }
      try {
        storage?.setItem(key, JSON.stringify(next))
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

const stores = new Map<RegionId, SessionStore>()

/** The region's store, created on first use. */
export function getSessionStore(region: RegionId = "ca"): SessionStore {
  let store = stores.get(region)
  if (!store) {
    store = createSessionStore({ region })
    stores.set(region, store)
  }
  return store
}

/** Test hook: replace one region's store, or pass null to drop every store. */
export function setSessionStore(store: SessionStore | null, region: RegionId = "ca") {
  if (store) stores.set(region, store)
  else stores.clear()
}

/** The session of the region the current route belongs to. */
export function useSession(): [SessionState, (action: SessionAction) => void] {
  const store = getSessionStore(useRegionId())
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  return [state, store.dispatch]
}

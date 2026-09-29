import type { RegionPack } from "@/regions/types"

import type { AuthorizationState } from "./authorization"
import type { Vehicle } from "./vehicles"

export type CheckId =
  | "border"
  | "decode"
  | "stolen"
  | "writeOff"
  | "duplicate"
  | "usTitle"
  | "collision"
  | "odometer"
  | "lien"
  // US only (US plan, Task 6).
  | "nmvtis"
  | "otherJurisdiction"
  | "brand"
  | "ownerConfirmed"

export type CheckStatus = "pass" | "fail"

/**
 * How much weight a failure carries. Displayed only in this round: any failure
 * holds the record. The split is the shape of the future override rule
 * (low may be acknowledged by the clerk, high never).
 */
export type Severity = "high" | "low"

export type Check = {
  id: CheckId
  label: string
  status: CheckStatus
  severity: Severity
  /** The condition in a few words ("No export reported"), set heavier than the detail. */
  result: string
  /** The evidence behind the result. Empty when the result says it all. */
  detail: string
  source: string
  /** Short agency names shown as chips on the row. */
  agencies: string[]
}

/** What a check may read besides the vehicle. */
export type CheckContext = {
  /** The owner's authorization on this vehicle, for checks that report on it. */
  authorization?: AuthorizationState
}

/** One record check, as a region defines it. */
export type CheckDefinition = {
  id: CheckId
  label: string
  severity: Severity
  source: string
  /** Short agency names shown as chips on the row. The long form is `source`. */
  agencies: string[]
  /** The result for this vehicle, or null when the check has nothing to report. */
  evaluate: (
    vehicle: Vehicle,
    context: CheckContext
  ) => { status: CheckStatus; result: string; detail?: string } | null
}

/** All checks, failures first (high before low), then passes in display order. */
export function evaluateChecks(
  pack: RegionPack,
  vehicle: Vehicle,
  context: CheckContext = {}
): Check[] {
  const all = pack.checks.definitions.flatMap((d): Check[] => {
    const outcome = d.evaluate(vehicle, context)
    if (!outcome) return []
    const { id, label, severity, source, agencies } = d
    const { status, result, detail = "" } = outcome
    return [{ id, label, status, severity, result, detail, source, agencies }]
  })
  const rank = (c: Check) => (c.status === "fail" ? (c.severity === "high" ? 0 : 1) : 2)
  return all
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i)
    .map(({ c }) => c)
}

export function allPass(checks: Check[]): boolean {
  return checks.every((c) => c.status === "pass")
}

export function failingChecks(checks: Check[]): Check[] {
  return checks.filter((c) => c.status === "fail")
}

export function highRiskChecks(checks: Check[]): Check[] {
  return failingChecks(checks).filter((c) => c.severity === "high")
}

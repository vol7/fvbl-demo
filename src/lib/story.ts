import type { RegionPack } from "@/regions/types"

import { failingChecks, type Check } from "./checks"
import { joinNames } from "./format"
import type { Vehicle } from "./vehicles"

export type RecordStory = {
  title: string
  body: string
  /** "Reported by Transport Canada and CBSA." plus the other flags, if any. */
  foot: string
  /** Who the investigators notify once they have reviewed a referral. */
  notifyAfterReview: string
}

/** "Collision record" → "collision record", but "US title record" keeps its acronym. */
function inSentence(label: string): string {
  return /^[A-Z][A-Z]/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
}

/**
 * The story for the header card when any check fails. Checks arrive sorted, so the
 * first failure is the most serious; the others are named in the foot.
 */
export function recordStory(
  pack: RegionPack,
  vehicle: Vehicle,
  checks: Check[]
): RecordStory | null {
  const [worst, ...others] = failingChecks(checks)
  if (!worst) return null
  const { footnote, ...story } = pack.story.tell(worst, vehicle)
  const also =
    others.length === 0
      ? ""
      : ` ${joinNames(
          others.map((c) => inSentence(c.label)),
          true
        )} ${others.length === 1 ? "is" : "are"} also flagged.`
  const foot = `Reported by ${joinNames(worst.agencies.map(pack.story.agencyName))}.${footnote ? ` ${footnote}` : ""}${also}`
  return { ...story, foot }
}

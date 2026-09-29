import { ca } from "@/regions/ca"
import type { RegionPack } from "@/regions/types"

import { CHECKS, INTEGRATIONS } from "./checks"
import { DEALER_COPY } from "./copy/dealer"
import { PHONE } from "./copy/phone"
import { PORTAL } from "./copy/portal"
import { STORY } from "./copy/story"
import { OFFICE } from "./office"
import { PEOPLE } from "./people"
import { SEED } from "./seed"
import { DEMO_VEHICLES } from "./vehicles"

/**
 * US-first: an Ohio county title office, the Ohio title search and the dealer's
 * first title. TODO(US plan, Tasks 5–11): checks, story, policy, copy and force
 * states still play Canada's until their owners replace them.
 */
export const us: RegionPack = {
  ...ca,
  id: "us",
  place: {
    country: "the US",
    registry: {
      agency: "County clerk",
      inSentence: "the county title office",
      titles: { state: "Ohio" },
    },
  },
  office: OFFICE,
  people: PEOPLE,
  vehicles: DEMO_VEHICLES,
  seed: SEED,
  checks: { definitions: CHECKS, integrations: INTEGRATIONS },
  story: STORY,
  policy: { ownerConfirmation: "optional" },
  odometerUnit: "mi",
  plate: { label: "Ohio plate", style: "ohio" },
  sms: { link: (token) => `fvbl.us/c/${token}`, domain: "fvbl.us" },
  copy: {
    ...ca.copy,
    // Task 9 replaces the rest of the decision copy.
    decision: {
      ...ca.copy.decision,
      verdict: {
        idle: "Checks clear",
        pending: "Awaiting owner",
        authorized: "Owner confirmed",
        issued: "Title issued",
        denied: "Hold for review",
        timeout: "No reply",
        blocked: "Hold for review",
        escalated: "Referred to investigators",
      },
    },
    phone: PHONE,
    portal: PORTAL,
    dealer: DEALER_COPY,
  },
  references: { issued: "OH-T", registration: "FVBL-T" },
}

import type { RegionPack } from "@/regions/types"

import { CHECKS, INTEGRATIONS } from "./checks"
import { DEALER_COPY } from "./copy/dealer"
import { DECISION } from "./copy/decision"
import { HUB } from "./copy/hub"
import { PHONE } from "./copy/phone"
import { PORTAL } from "./copy/portal"
import { SIGN_IN } from "./copy/signin"
import { STORY } from "./copy/story"
import { FORCE_STATES, forcedSession, type ForceKey } from "./forceStates"
import { OFFICE } from "./office"
import { PEOPLE } from "./people"
import { SEED } from "./seed"
import { DEMO_VEHICLES } from "./vehicles"

/**
 * US-first: an Ohio county title office, the Ohio title search and the dealer's
 * first title.
 */
export const us: RegionPack = {
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
  forceStates: FORCE_STATES,
  forcedSession: (key, now) => forcedSession(key as ForceKey, now),
  odometerUnit: "mi",
  plate: { label: "Ohio plate", style: "ohio", state: "OH", missing: "N/A" },
  sms: { link: (token) => `fvbl.us/c/${token}`, domain: "fvbl.us" },
  copy: {
    decision: DECISION,
    signIn: SIGN_IN,
    hub: HUB,
    phone: PHONE,
    portal: PORTAL,
    dealer: DEALER_COPY,
  },
  references: { issued: "OH-T", registration: "FVBL-T" },
}

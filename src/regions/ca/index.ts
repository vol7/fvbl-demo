import type { RegionPack } from "@/regions/types"

import { CHECKS, INTEGRATIONS } from "./checks"
import { DECISION } from "./copy/decision"
import { DEALER_COPY } from "./copy/dealer"
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

/** Canada-first: Ontario's MTO counter, ServiceOntario and the dealer's first registration. */
export const ca: RegionPack = {
  id: "ca",
  place: { country: "Canada", registry: { agency: "MTO", inSentence: "the MTO" } },
  office: OFFICE,
  people: PEOPLE,
  vehicles: DEMO_VEHICLES,
  seed: SEED,
  checks: { definitions: CHECKS, integrations: INTEGRATIONS },
  policy: { ownerConfirmation: "required" },
  odometerUnit: "km",
  plate: { label: "Ontario plate", style: "ontario" },
  sms: { link: (token) => `fvbl.on.ca/c/${token}`, domain: "fvbl.on.ca" },
  references: { issued: "UVIP", registration: "FVBL-R" },
  forceStates: FORCE_STATES,
  forcedSession: (key, now) => forcedSession(key as ForceKey, now),
  story: STORY,
  copy: {
    decision: DECISION,
    phone: PHONE,
    dealer: DEALER_COPY,
    signIn: SIGN_IN,
    hub: HUB,
    portal: PORTAL,
  },
}

import { ca } from "@/regions/ca"
import type { RegionPack } from "@/regions/types"

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
  odometerUnit: "mi",
  plate: { label: "Ohio plate", style: "ohio" },
  sms: { link: (token) => `fvbl.us/c/${token}`, domain: "fvbl.us" },
  references: { issued: "OH-T" },
}

import { paths } from "@/lib/paths"
import type { HubCopy } from "@/regions/types"

import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, NEW_VIN, US_TITLE_VIN } from "../vehicles"

export const HUB: HubCopy = {
  heading: "FVBL demo · Canada",
  intro:
    "Open each surface in its own window. All windows share one session, so a request from ServiceOntario or the counter shows up on the phone, and the owner’s answer shows up in the portal.",
  /** The README's scenarios, in the README's order. */
  scenarios: [
    { n: 1, title: "Clean vehicle", vin: CLEAN_VIN, route: "Clerk lookup", outcome: "Clear" },
    {
      n: 2,
      title: "Cloned VIN",
      vin: CLONED_VIN,
      route: "Clerk lookup → escalate",
      outcome: "Blocked",
    },
    {
      n: 3,
      title: "Buyer pre-request",
      vin: CLEAN_VIN,
      route: "ServiceOntario → owner approves on phone → clerk lookup",
      outcome: "Authorized",
    },
    {
      n: 4,
      title: "Exported vehicle",
      vin: EXPORTED_VIN,
      route: "Clerk lookup",
      outcome: "Blocked",
    },
    {
      n: 5,
      title: "US title conflict",
      vin: US_TITLE_VIN,
      route: "Clerk lookup",
      outcome: "Blocked",
    },
    {
      n: 6,
      title: "New vehicle · dealer first registration",
      vin: NEW_VIN,
      route: "Dealer portal → dealership confirms on phone → clerk lookup",
      outcome: "Registered",
    },
  ],
  publicSurface: {
    title: "ServiceOntario (public)",
    description: "Owner or buyer pre-approval. Record at 1440×900.",
    href: paths.serviceOntario,
  },
  dealerSurface: {
    description: "Day one: first registration of a new vehicle. Record at 1440×900.",
  },
  scenariosNote:
    "The registered VINs are listed under recent lookups in the clerk portal; the new one joins them once the dealer's submission is confirmed.",
}

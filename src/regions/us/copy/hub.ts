import { regionPaths } from "@/lib/paths"
import type { HubCopy } from "@/regions/types"

import { CLEAN_VIN, EXPORTED_VIN, NEW_VIN, ONTARIO_VIN, SALVAGE_VIN } from "../vehicles"

export const HUB: HubCopy = {
  heading: "FVBL demo · United States",
  intro:
    "Open each surface in its own window. All windows share the US session, so a buyer’s request from the Ohio title search shows up on the owner’s phone, and the owner’s answer shows up at the county title office.",
  /** The README's US scenarios, in the README's order. */
  scenarios: [
    {
      n: 1,
      title: "Owner confirms the sale",
      vin: CLEAN_VIN,
      route: "Ohio title search → owner approves on phone → clerk issues the title",
      outcome: "Clear",
    },
    {
      n: 2,
      title: "“Not me”",
      vin: CLEAN_VIN,
      route: "Ohio title search → owner taps Not me → clerk lookup",
      outcome: "Held for review",
    },
    {
      n: 3,
      title: "Exported, no re-entry",
      vin: EXPORTED_VIN,
      route: "Clerk lookup → refer to investigators",
      outcome: "Held for review",
    },
    {
      n: 4,
      title: "One VIN, two countries",
      vin: ONTARIO_VIN,
      route: "Clerk lookup",
      outcome: "Held for review",
    },
    {
      n: 5,
      title: "Salvage re-titled clean",
      vin: SALVAGE_VIN,
      route: "Clerk lookup",
      outcome: "Held for review",
    },
    {
      n: 6,
      title: "New vehicle · dealer first title",
      vin: NEW_VIN,
      route: "Dealer portal → dealership confirms on phone → clerk lookup",
      outcome: "Title recorded",
    },
  ],
  publicSurface: {
    title: "Ohio title search (public)",
    description: "The buyer asks the owner to confirm. Record at 1440×900.",
    href: regionPaths("us").ohio,
  },
  dealerSurface: {
    description: "Day one: first title of a new vehicle, with title alerts. Record at 1440×900.",
  },
  scenariosNote:
    "The titled VINs are listed under recent lookups at the county title office; the new one joins them once the dealer's submission is confirmed.",
}

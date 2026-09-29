import type { People } from "@/regions/types"

/** Demo people for the Canadian flows. Invented. */
export const OWNER = {
  name: "Daniel Okafor",
  licence: "D6101-40706-60905",
  mobile: "(416) 555-0917",
  mobileLast4: "0917",
} as const

export const BUYER = {
  name: "Marcus Beaulieu",
  shortName: "Marcus B.",
  licence: "B2947-51083-64712",
  mobile: "(647) 555-4410",
  mobileLast4: "4410",
} as const

/** The dealership that registers the new vehicle. */
export const DEALER = {
  name: "Mercedes-Benz Downtown",
  principal: "Sofia Marchetti",
  principalInitials: "SM",
  number: "47-1182",
  mobile: "(416) 555-2204",
  mobileLast4: "2204",
  nvis: "NVIS 2026-MB-0187342",
} as const

/** First registered owner of the new vehicle. Not the GLE 63's owner. */
export const FIRST_OWNER = {
  name: "Léa Tremblay",
  licence: "T4418-22067-90315",
  mobile: "(438) 555-7731",
  mobileLast4: "7731",
} as const

export const PEOPLE: People = {
  owner: OWNER,
  buyer: BUYER,
  dealer: DEALER,
  firstOwner: FIRST_OWNER,
}

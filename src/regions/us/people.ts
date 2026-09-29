import type { People } from "@/regions/types"

/**
 * Demo people for the Ohio flows. Invented; the dealership's name was checked
 * against Ohio dealers so it matches none of them. Ohio licenses read two letters
 * and six digits.
 */
export const OWNER = {
  name: "Rachel Novak",
  licence: "RN482917",
  mobile: "(614) 555-0138",
  mobileLast4: "0138",
} as const

/** The buyer at the seller's driveway. The owner sees "Tyler B." only. */
export const BUYER = {
  name: "Tyler Brooks",
  shortName: "Tyler B.",
  licence: "TB730164",
  mobile: "(614) 555-0172",
  mobileLast4: "0172",
} as const

/** The dealership that submits the first title. */
export const DEALER = {
  name: "Scioto Ridge Motorcars",
  principal: "Maria Delgado",
  principalInitials: "MD",
  number: "OH-D 20417",
  mobile: "(614) 555-0155",
  mobileLast4: "0155",
  /** The manufacturer's certificate of origin. */
  nvis: "MCO 2026-0418826",
} as const

/** First owner of the new GLE 450; turns on title alerts at delivery. */
export const FIRST_OWNER = {
  name: "Jordan Whitfield",
  licence: "JW551208",
  mobile: "(614) 555-0193",
  mobileLast4: "0193",
} as const

export const PEOPLE: People = {
  owner: OWNER,
  buyer: BUYER,
  dealer: DEALER,
  firstOwner: FIRST_OWNER,
}

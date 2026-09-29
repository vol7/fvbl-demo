import type { SignInCopy } from "@/regions/types"

/** Two entrances, one form: the clerk's ministry portal and the dealer's. */
export const SIGN_IN: SignInCopy = {
  clerk: {
    headline: "Vehicle identity, verified at the counter.",
    lede: "Look up a registration, run record checks across police, insurer and ministry sources, and confirm every transfer with the registered owner before a package is issued.",
    points: ["Six record checks in one lookup", "Owner authorization by one-time code"],
    audience: "Ontario Ministry of Transportation · Authorized users only",
    title: "Authorized User Portal",
    subtitle: "Sign in with your ministry credentials to look up vehicle records.",
  },
  dealer: {
    headline: "Every vehicle's record begins the day you register it.",
    lede: "Register new vehicles with the ministry from the dealership, with the New Vehicle Information Statement in hand. Each submission opens the vehicle's ledger.",
    points: [
      "First registration in one submission",
      "Confirmed from the dealership's registered mobile",
    ],
    audience: "Ontario Ministry of Transportation · Registered dealers only",
    title: "Dealer Portal",
    subtitle: "Sign in with your dealer credentials to register new vehicles.",
  },
}

import type { SignInCopy } from "@/regions/types"

/** Two entrances, one form: the county title office's portal and the dealer's. */
export const SIGN_IN: SignInCopy = {
  clerk: {
    headline: "Vehicle identity, verified at the title counter.",
    lede: "Look up a VIN before you issue a title. Record checks run alongside the NMVTIS check your office already runs, across state lines and the border.",
    points: ["Nine record checks in one lookup", "The owner's confirmation, when there is one"],
    audience: "County title office · Authorized users only",
    title: "Title Office Portal",
    subtitle: "Sign in with your office credentials to look up vehicle records.",
  },
  dealer: {
    headline: "Every vehicle's record begins the day you title it.",
    lede: "Apply for a new vehicle's first title from the dealership, with the manufacturer's certificate of origin in hand. Each application opens the vehicle's ledger.",
    points: [
      "First title application in one submission",
      "Confirmed from the dealership's registered mobile",
    ],
    audience: "Ohio title dealers · Registered dealers only",
    title: "Dealer Portal",
    subtitle: "Sign in with your dealer credentials to apply for first titles.",
  },
}

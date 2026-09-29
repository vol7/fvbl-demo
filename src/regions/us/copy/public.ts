/**
 * The buyer's page at `/us/ohio`: a mock of Ohio's title search with one added
 * step, asking the owner to confirm. It shows title status only; the owner's name
 * and number, the vehicle's history and NMVTIS data never reach the buyer.
 */
export const TITLE_SEARCH = {
  watermark: "Concept mock-up. Not a government page.",
  shell: {
    state: "Ohio",
    service: "Vehicle titles",
    nav: ["Titles", "Registration", "Help"],
    footer: ["Accessibility", "Privacy", "Contact"],
    footnote: "Concept mock-up for a product demonstration.",
  },
  crumbs: ["Vehicle titles", "Title search"],

  title: "Look up a vehicle title",
  lede: "Check the title status of a vehicle before you buy it. We show the status only, not the owner or the vehicle's history.",

  vin: {
    label: "Vehicle Identification Number (VIN)",
    placeholder: "17 characters",
    hint: "On the title, the driver-side dashboard or the door jamb.",
    invalid: "Enter the 17-character VIN. VINs don't use the letters I, O or Q.",
    notFound:
      "We couldn't find a title record for this VIN. Check it against the title and the vehicle.",
    search: "Search",
  },

  active: {
    status: "Title active in Ohio",
    detail: "An Ohio title is on record for this VIN.",
  },
  notOhio: {
    status: "No active Ohio title",
    detail:
      "We have no active Ohio title for this VIN. If the seller holds a title from another state, a county title office transfers it when you title the vehicle in Ohio.",
  },

  ask: {
    heading: "Ask the owner to confirm",
    text: "Buying from a private seller? Before you pay, ask the registered owner to confirm the sale. They get an Ohio title alert and decide. We never show you their name or number.",
    start: "Ask the owner to confirm",
    name: "Your name",
    nameHint: "The owner sees your first name and last initial.",
    mobile: "Your mobile number",
    mobileHint: "We text you when the owner answers.",
    send: "Send request",
    back: "Back",
  },

  waiting: {
    heading: "Waiting for the owner",
    text: "We sent the registered owner an Ohio title alert. Their answer shows here as soon as they reply. The request expires in 24 hours.",
  },
  confirmed: {
    heading: "Owner confirmed",
    text: (time: string) =>
      `The registered owner confirmed this sale at ${time}. The seller signs the title over to you in front of a notary, and you title the vehicle at any county title office.`,
  },
  notMe: {
    heading: "The owner said this isn't their sale",
    text: "Don't pay for this vehicle. Contact your county title office before you go any further.",
  },
  noReply: {
    heading: "No reply from the owner",
    text: "The owner didn't answer within 24 hours. That's common and isn't a warning on its own. You can ask again or go ahead as you normally would.",
    again: "Ask again",
  },
  searchAgain: "Search another VIN",
} as const

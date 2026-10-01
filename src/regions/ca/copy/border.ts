import type { BorderCopy } from "@/regions/types"

/**
 * The CBSA officer's list of vehicles declared for export, the card for each, the
 * owner's text about an export, and the hub's entry for all three (2026-09-30).
 * "Examination" throughout: CBSA's word for opening a container. A car that
 * doesn't clear is a reason to open its container, not a verdict on the exporter.
 */
export const BORDER_COPY: BorderCopy = {
  workspace: "CBSA · Port of Montréal",
  navItem: "Declared for export",
  list: {
    title: "Declared for export",
    vessel: (name, to, cutoff) => `${name} to ${to} · Loading cut-off ${cutoff}`,
    lede: "FVBL checks each declared permit against the Ontario registration for the VIN, and asks the registered owner to confirm the export.",
    columns: { vehicle: "Vehicle", container: "Container", exporter: "Exporter", status: "Status" },
    reason: {
      otherVehicle: "Another car's permit",
      notOnFile: "Permit not on file",
      stolen: "Reported stolen",
      denied: "Owner said no",
      expired: "No answer before cut-off",
      pending: "Owner texted",
      noReply: "Owner texted",
      confirmed: "Owner confirmed",
    },
    empty: "No vehicles are declared for export.",
  },
  status: {
    hold: "Doesn't clear",
    awaiting: "Awaiting owner",
    cleared: "Clear to load",
    held: "Held for examination",
  },
  card: {
    ariaLabel: "Export decision",
    story: {
      otherVehicle: (permit, belongsTo) => ({
        title: "The permit belongs to another vehicle.",
        body: `Permit ${permit} is on file for a ${belongsTo}, not this VIN. Either the paperwork is for another car, or the car in this container isn't the one declared.`,
      }),
      notOnFile: (permit) => ({
        title: "No Ontario registration has this permit number.",
        body: `Permit ${permit} matches no Ontario registration, and the VIN is registered under a different permit.`,
      }),
      stolen: {
        title: "This vehicle is reported stolen.",
        body: "CPIC lists this VIN as stolen.",
      },
      denied: {
        title: "The registered owner did not authorize this export.",
        body: "The permit is genuine and the vehicle isn't reported stolen. But the owner answered the text and said no. The sale may not be complete, or the vehicle may have been taken without their consent.",
      },
      expired: {
        title: "The registered owner didn't answer before cut-off.",
        body: "The permit matches and the vehicle isn't reported stolen, but no one confirmed the export.",
      },
      pending: {
        title: "The registered owner hasn't answered yet.",
        body: "The permit matches and the vehicle isn't reported stolen. It clears once the owner confirms the export.",
      },
      noReply: {
        title: "The registered owner hasn't answered yet.",
        body: "It clears once the owner confirms the export.",
      },
      confirmed: {
        title: "Clear to load.",
        body: "The permit matches, the vehicle isn't reported stolen, and the registered owner confirmed the export.",
      },
    },
    containerLabel: "Container",
    ownerLabel: "Registered owner",
    exporterLabel: "Exporter on the declaration",
    exporterIsOwner: "The declaration names the registered owner.",
    ownerNote:
      "MTO texts the owner at the mobile on the registration, never a number from the declaration.",
    hold: {
      action: "Hold for examination",
      text: "The terminal won't load this container until an officer has examined it.",
    },
  },
  strip: {
    permit: "Permit number",
    stolen: "Stolen report",
    owner: "Registered owner",
    permitValue: {
      match: "Matches",
      notPresented: "Bill of sale only",
      notOnFile: "Not on file",
      otherVehicle: "Another car's",
    },
    permitDetail: (permit, { declared, onFile, belongsTo }) => {
      switch (permit) {
        case "match":
          return `${onFile}, on file`
        case "notPresented":
          return "Owner found by VIN"
        case "otherVehicle":
          return `Belongs to a ${belongsTo}`
        case "notOnFile":
          return `${declared} declared, ${onFile} on file`
      }
    },
    stolenValue: { clear: "None", reported: "Reported stolen", source: "CPIC" },
    ownerValue: (owner) => {
      if (!owner) return { value: "Not texted yet", detail: "" }
      switch (owner.status) {
        case "confirmed":
          return { value: "Confirmed", detail: `At ${owner.at}` }
        case "noReply":
          return { value: "No reply yet", detail: `Texted at ${owner.at}` }
        case "pending":
          return { value: "Awaiting reply", detail: `Texted at ${owner.sentAt}` }
        case "denied":
          return { value: "Said no", detail: `At ${owner.at}` }
        case "expired":
          return { value: "No answer", detail: `Cut-off passed at ${owner.at}` }
      }
    },
  },
  signIn: {
    headline: "Know which container to open.",
    lede: "Check each vehicle declared for export against its Ontario registration, and see whether its registered owner agreed to ship it.",
    points: ["Permits matched to the Ontario registry", "Every registered owner confirms by text"],
    audience: "Canada Border Services Agency · Authorized officers only",
    title: "Border Officer Portal",
    subtitle: "Sign in with your CBSA credentials to review export declarations.",
  },
  hub: {
    title: "Border officer (CBSA)",
    description: "Vehicles declared for export at the Port of Montréal. Record at 1440×900.",
    declare: "Declare the RAM 1500 for export",
    scenario: {
      title: "Export · owner didn't authorize",
      route: "Hub: declare the export → owner answers on phone → border officer",
      outcome: "Doesn't clear",
    },
  },
  phone: {
    request: ({ vehicle, plate, port, deadline }) =>
      `MTO: CBSA received an export declaration for your ${vehicle} (plate ${plate}), leaving the ${port}. Did you authorize it? Answer by ${deadline}: {link}`,
    confirmed: "Thanks. Your confirmation is recorded. Reference {code}.",
    denied:
      "Understood. Border officers have been alerted. Keep any sale papers you have. If the vehicle was taken, give police reference {ref}.",
    expired:
      "This request expired with no answer. Border officers have been told the export wasn't confirmed.",
    confirm: {
      header: "Export confirmation",
      askTitle: "Did you authorize this export?",
      askLede:
        "CBSA received an export declaration for a vehicle registered to you. Say yes only if you are shipping it or agreed to its export.",
      portLabel: "Leaving from",
      toLabel: "Bound for",
      exporterLabel: "Exporter on the declaration",
      exporterIsYou: "The name on your registration",
      deadlineLabel: "Answer by",
      approve: "Yes, I authorized it",
      decline: "No, I didn't",
      recorded: "Your response is recorded with the Federal VIN Blockchain Ledger.",
      approvedTitle: "Export confirmed",
      approvedText: (vehicle) => `The export of your ${vehicle} can go ahead.`,
      declinedTitle: "Export refused",
      declinedText: (vehicle) =>
        `Border officers have been alerted. Keep any sale papers you have. If your ${vehicle} was taken, report it to police with this reference.`,
      referenceLabel: "Reference for police",
    },
  },
}

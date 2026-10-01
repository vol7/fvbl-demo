import type { PortalCopy } from "@/regions/types"

export const PORTAL: PortalCopy = {
  outcomes: { clear: "Clear", blocked: "Held for review", pending: "Pending", frozen: "Not me" },
  homeLede: (sources) =>
    `Every lookup checks the VIN with ${sources} sources, alongside the NMVTIS check your office already runs.`,
  casesDescription: "Title applications this office referred to state investigators.",
  liveCase: {
    reason: "Record held in another jurisdiction",
    routedTo: "State investigators",
  },
  unregistered: {
    title: "no title on file",
    text: "in Ohio or any other jurisdiction on the ledger. Record checks run once it is titled.",
  },
  request: { licenceLabel: "Driver's license" },
  historyTitle: {
    import: "Entered the US",
    customsEntry: "Cleared customs",
    export: "Exported",
    firstRegistration: "First registration",
    transfer: "Ownership transferred",
    firstTitle: "First title",
    titleTransfer: "Title transferred",
    titleBrand: "Title branded",
    renewal: "Registration renewed",
    odometer: "Odometer reading",
    exportDeclared: "Declared for export",
  },
  timeline: {
    entered: (from) => `Entered the US from ${from}`,
    exported: "Exported from the US",
    notBackSince: "Not back in the US since",
    // A US record never carries an export declaration; the kinds are shared.
    exportAnswer: {
      denied: {
        title: "Export not authorized",
        detail: (port) =>
          `Declared for export at ${port}. The owner said they didn't authorize it.`,
      },
      confirmed: {
        title: "Export confirmed",
        detail: (port) => `Declared for export at ${port}. The owner confirmed it.`,
      },
      expired: {
        title: "Export not confirmed",
        detail: (port) => `Declared for export at ${port}. The owner didn't answer before loading.`,
      },
    },
  },
  ownersExported: (date, noTransfer) =>
    `CBP recorded a vehicle with this VIN leaving the US on ${date}, while it was titled to this owner.${noTransfer ? " No sale or transfer is on file." : ""}`,
  activity: {
    requested: { buyer: "Buyer asked the owner to confirm", clerk: "Owner confirmation requested" },
    preapprovedDetail: (code) => `From the owner's title alert, reference ${code}`,
    issuedTitle: "Title issued",
    approvedTitle: "Owner confirmed the sale",
    frozen: {
      denied: "Owner said “Not me”",
      timeout: "No reply within 24 hours",
      detail: (reason) =>
        reason === "denied" ? "Held for review" : "The title doesn't wait on a reply",
    },
    escalatedTitle: "Referred to state investigators",
  },
  requests: {
    title: "Owner confirmations",
    description:
      "Confirmations asked of registered owners for this office's title applications, last 7 days.",
    online: (name) => `${name} (title search)`,
    preapproval: "Registered owner",
    status: {
      pending: "Pending",
      authorized: "Confirmed",
      issued: "Issued",
      frozen: "Not me",
      expired: "No reply",
    },
  },
  ledger: { name: "FVBL Ohio", issuedKind: "title.issued", issuedTitle: "Title issued" },
}

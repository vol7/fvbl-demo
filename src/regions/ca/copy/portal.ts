import type { PortalCopy } from "@/regions/types"

export const PORTAL: PortalCopy = {
  homeLede: (sources) =>
    `Every lookup checks the VIN with ${sources} sources, including Transport Canada, CBSA and NMVTIS, before a package can be issued.`,
  casesDescription: "Transactions referred to MTO Investigations from this office.",
  liveCase: { reason: "Duplicate identity · insurer write-off", routedTo: "OPP Auto Theft Unit" },
  unregistered: {
    title: "no registration on file",
    text: "with the ministry or any other jurisdiction. Record checks run once it is registered.",
  },
  request: { licenceLabel: "Driver's licence" },
  historyTitle: {
    import: "Entered Canada",
    customsEntry: "Cleared customs",
    export: "Exported",
    firstRegistration: "First registration",
    transfer: "Ownership transferred",
    // A Canadian record never carries these; the kinds are shared with the US.
    firstTitle: "First title",
    titleTransfer: "Title transferred",
    titleBrand: "Title branded",
    renewal: "Registration renewed",
    odometer: "Odometer reading",
  },
  timeline: {
    entered: (from) => `Entered Canada from ${from}`,
    exported: "Exported from Canada",
    notBackSince: "Not back in Canada since",
  },
  ownersExported: (date, noTransfer) =>
    `CBSA recorded a vehicle with this VIN leaving Canada on ${date}, while it was registered to this owner.${noTransfer ? " The MTO has no sale or transfer on file." : ""}`,
  activity: {
    preapprovedDetail: (code) => `Online through ServiceOntario, reference ${code}`,
    issuedTitle: "Package issued",
    afterReview: "after review",
    approvedTitle: "Owner approved",
    frozen: {
      denied: "Owner denied",
      timeout: "No response within 24h",
      detail: () => "Transaction frozen and flagged for security review",
    },
    escalatedTitle: "Referred for investigation",
  },
  requests: {
    title: "Authorization requests",
    description: "Owner authorizations requested from this office in the last 7 days.",
    online: (name) => `${name} (online)`,
    preapproval: "Registered owner (pre-approval)",
    status: {
      pending: "Pending",
      authorized: "Authorized",
      issued: "Issued",
      frozen: "Frozen",
      expired: "Expired",
    },
  },
  ledger: { name: "FVBL Ontario", issuedKind: "package.issued", issuedTitle: "Package issued" },
}

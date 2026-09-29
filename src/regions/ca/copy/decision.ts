import type { DecisionCopy } from "@/regions/types"

export const DECISION: DecisionCopy = {
  ariaLabel: "Package decision",
  idle: {
    label: "Checks clear",
    title: "Ready to request owner authorization",
    text: (checks, last4) =>
      `All ${checks} record checks passed. The registered owner gets a text at the phone ending in ${last4} with a link to approve or decline.`,
  },
  pending: {
    label: "Awaiting owner",
    title: "Waiting for the registered owner",
    fromBuyer: (requester, time) =>
      `${requester} requested it online through ServiceOntario at ${time}.`,
    fromCounter: (last4, time) => `A text went to the phone ending in ${last4} at ${time}.`,
  },
  issued: {
    label: "Package issued",
    title: "Used Vehicle Information Package issued",
    text: (clerk, time, code) =>
      `${clerk} issued the package at ${time} under authorization ${code}.`,
  },
  authorized: {
    label: "Authorized to issue",
    titleOwner: "The registered owner pre-approved this sale",
    titleOther: "The registered owner approved this request",
    textOwner: (approvedOn, validUntil) =>
      `The owner pre-approved it online through ServiceOntario on ${approvedOn}. The approval is valid until ${validUntil}.`,
    textBuyer: (requester, time) =>
      `${requester} requested it online through ServiceOntario. The owner approved it at ${time} from the link in the text message.`,
    textCounter: (time) => `The owner approved it at ${time} from the link in the text message.`,
    issueAction: "Issue package",
  },
  frozen: {
    labelDenied: "Owner denied",
    labelTimeout: "Request expired",
    titleDenied: "The registered owner denied this request",
    titleTimeout: "The owner did not respond within 24 hours",
    text: (time) =>
      `The transaction is frozen and flagged for security review. Recorded at ${time}.`,
  },
  blocked: {
    label: "Hold, do not issue",
    fallbackTitle: "A record check failed",
    referAction: "Refer for investigation",
  },
  escalated: {
    label: "Referred, do not issue",
    title: "Referred to MTO Investigations",
    // Who and when once, what happens next once.
    text: ({ story, clerk, time, counter, notifyAfterReview }) =>
      `${story}. ${clerk} referred it at ${time} from ${counter}.${notifyAfterReview ? ` MTO Investigations notifies ${notifyAfterReview} after review.` : ""}`,
    customerNote: "Tell the customer the record needs verifying. Do not share the reason.",
    sentWith: (checks, certificates) =>
      `Sent with the file: the vehicle record and history, ${checks} record check results and ${certificates} ledger certificates.`,
  },
  strip: {
    checks: "Record checks",
    authorization: "Owner authorization",
    lastEvent: "Last recorded event",
    idle: { value: "Not yet requested", detail: (last4) => `Texts the phone ending in ${last4}` },
    unavailable: { value: "Unavailable", detail: "Until the checks clear" },
  },
}

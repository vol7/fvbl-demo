import { endsSentence } from "@/lib/format"
import type { DecisionCopy } from "@/regions/types"

export const DECISION: DecisionCopy = {
  ariaLabel: "Package decision",
  verdict: {
    idle: "Checks clear",
    pending: "Awaiting owner",
    authorized: "Authorized to issue",
    issued: "Package issued",
    denied: "Owner denied",
    timeout: "Request expired",
    blocked: "Cannot be issued",
    escalated: "Escalated",
  },
  highValueNote: "High-value model, owner authorization required",
  actions: {
    issue: "Issue package",
    request: {
      action: "Request owner authorization",
      title: "Request owner authorization",
      description: (last4) =>
        `The registered owner gets a text at the phone ending in ${last4} with a link to approve or decline.`,
      applicantLabel: "Applicant",
      send: "Send request",
    },
    issued: {
      label: "Package issued",
      title: "Used Vehicle Information Package issued",
      text: ({ clerk, time, authorizationCode }) =>
        `${clerk} issued the package at ${time} under authorization ${authorizationCode}.`,
    },
    refer: "Refer for investigation",
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
  },
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
      `${requester} requested it online through ServiceOntario at ${endsSentence(time)}`,
    fromCounter: (last4, time) =>
      `A text went to the phone ending in ${last4} at ${endsSentence(time)}`,
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
  },
  frozen: {
    labelDenied: "Owner denied",
    labelTimeout: "Request expired",
    titleDenied: "The registered owner denied this request",
    titleTimeout: "The owner did not respond within 24 hours",
    text: (time) =>
      `The transaction is frozen and flagged for security review. Recorded at ${endsSentence(time)}`,
  },
  blocked: {
    label: "Hold, do not issue",
    fallbackTitle: "A record check failed",
  },
  strip: {
    checks: "Record checks",
    authorization: "Owner authorization",
    lastEvent: "Last recorded event",
    idle: { value: "Not yet requested", detail: (last4) => `Texts the phone ending in ${last4}` },
    pending: "Awaiting reply",
    approved: "Approved",
    preapproved: "Pre-approved",
    approvedEvent: "Owner approved",
    denied: "Denied",
    expired: { value: "Expired", detail: "No response in 24 hours" },
    unavailable: { value: "Unavailable", detail: "Until the checks clear" },
  },
}

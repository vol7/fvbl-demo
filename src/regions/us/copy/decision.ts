import { endsSentence as at } from "@/lib/format"
import type { DecisionCopy } from "@/regions/types"

/**
 * The county title clerk's card. FVBL informs; the clerk decides (docs/us-version.md):
 * green is "Checks clear", never an approval; red is a hold the clerk reviews, never
 * a block. The owner's confirmation is evidence, not a gate.
 */
export const DECISION: DecisionCopy = {
  ariaLabel: "Title decision",
  verdict: {
    idle: "Checks clear",
    pending: "Awaiting owner",
    authorized: "Owner confirmed",
    issued: "Title issued",
    denied: "Hold for review",
    timeout: "No reply",
    blocked: "Hold for review",
    escalated: "Referred to investigators",
  },
  // The US confirmation is optional, so the note claims nothing about it.
  highValueNote: "High-value model",
  issueAction: "Issue title",
  idle: {
    label: "Checks clear",
    title: "No conflicts found for this VIN",
    text: (checks) =>
      `All ${checks} record checks passed. No owner confirmation is on file, which is usual for most sales.`,
  },
  request: {
    action: "Ask the owner to confirm",
    title: "Ask the owner to confirm",
    description: (last4) =>
      `The registered owner gets a title alert at the phone ending in ${last4} and decides. You can issue the title without it.`,
    applicantLabel: "Buyer",
    send: "Send title alert",
  },
  pending: {
    label: "Awaiting owner",
    title: "Waiting for the registered owner",
    fromBuyer: (requester, time) =>
      `${requester} asked the owner to confirm through the Ohio title search at ${at(time)}`,
    fromCounter: (last4, time) =>
      `A title alert went to the phone ending in ${last4} at ${at(time)}`,
  },
  issued: {
    label: "Title issued",
    title: "Ohio title issued",
    text: ({ clerk, time, authorizationCode }) =>
      `${clerk} issued the title at ${at(time)}${authorizationCode ? ` The owner's confirmation ${authorizationCode} is on file.` : ""}`,
  },
  authorized: {
    label: "Owner confirmed",
    titleOwner: "The registered owner confirmed this sale",
    titleOther: "The registered owner confirmed this sale",
    textOwner: (approvedOn) => `The owner confirmed it from their title alert on ${approvedOn}.`,
    textBuyer: (requester, time) =>
      `${requester} asked through the Ohio title search. The owner confirmed at ${time} from their title alert.`,
    textCounter: (time) => `The owner confirmed at ${time} from their title alert.`,
  },
  frozen: {
    labelDenied: "Hold for review",
    labelTimeout: "No reply",
    titleDenied: "The registered owner said this sale isn't theirs",
    titleTimeout: "The owner didn't reply within 24 hours",
    text: (time, reason) =>
      reason === "denied"
        ? `Recorded at ${at(time)} Your office decides whether to issue.`
        : `That's common, and a missing reply doesn't hold the title. Recorded at ${at(time)}`,
  },
  blocked: {
    label: "Hold for review",
    fallbackTitle: "A record check needs review",
    referAction: "Refer to investigators",
  },
  escalated: {
    label: "Referred to investigators",
    title: "Referred to state investigators",
    text: ({ story, clerk, time, counter, notifyAfterReview }) =>
      `${story}. ${clerk} referred it at ${time} from ${counter}.${notifyAfterReview ? ` State investigators contact ${notifyAfterReview} after review.` : ""}`,
    customerNote: "Tell the customer the record needs verifying. Don't share the reason.",
    sentWith: (checks, certificates) =>
      `Sent with the file: the vehicle record and history, ${checks} record check results and ${certificates} ledger certificates.`,
  },
  strip: {
    checks: "Record checks",
    authorization: "Owner confirmation",
    lastEvent: "Last recorded event",
    idle: { value: "None on file", detail: () => "Optional for most sales" },
    pending: "Awaiting reply",
    approved: "Confirmed",
    preapproved: "Confirmed",
    approvedEvent: "Owner confirmed the sale",
    denied: "Not me",
    expired: { value: "No reply", detail: "Doesn't hold the title" },
    unavailable: { value: "Not asked", detail: "The review comes first" },
  },
}

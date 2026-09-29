import { endsSentence as at } from "@/lib/format"
import type { DecisionCopy } from "@/regions/types"

/**
 * The county title clerk's card. FVBL informs; the clerk decides (docs/us-version.md):
 * green is "Checks clear", never an approval; red is a hold the clerk reviews, never
 * a block. The owner's confirmation is evidence, not a gate. The card has no buttons:
 * the clerk issues or refers in their own office's system.
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
  // The county clerk issues or refers in their own office's system.
  actions: null,
  idle: {
    label: "Checks clear",
    title: "No conflicts found for this VIN",
    text: (checks) =>
      `All ${checks} record checks passed. No owner confirmation is on file, which is usual for most sales.`,
  },
  pending: {
    label: "Awaiting owner",
    title: "Waiting for the registered owner",
    fromBuyer: (requester, time) =>
      `${requester} asked the owner to confirm through the Ohio title search at ${at(time)}`,
    fromCounter: (last4, time) =>
      `A title alert went to the phone ending in ${last4} at ${at(time)}`,
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

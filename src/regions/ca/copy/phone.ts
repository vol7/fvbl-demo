import type { PhoneCopy } from "@/regions/types"

export const PHONE: PhoneCopy = {
  // The texts come from MTO, a name the owner already trusts; an unfamiliar "FVBL"
  // reads as phishing (2026-09-18 review).
  sender: "MTO",
  senderIcon: "MTO",
  ownerHistory: (plate, date) =>
    `MTO: Your Ontario registration for plate ${plate} was renewed on ${date}. No action is needed. Reply STOP to opt out of service messages.`,
  dealerHistory: {
    date: "2026-09-08",
    text: "MTO: Registration FVBL-R-2026-09-08-2291 for a 2026 Mercedes-Benz GLC 300 4MATIC was recorded on {date}. Reply STOP to opt out of service messages.",
  },
  registrationRequest: (dealer, vehicle, vinLast4) =>
    `MTO: ${dealer} submitted the first registration of a ${vehicle} (VIN …${vinLast4}) to the ministry. Confirm this submission: {link}. Expires in 24 hours.`,
  registrationConfirmed:
    "Confirmed. Registration {ref} is recorded and the vehicle's ledger has been opened.",
  registrationDeclined: "Understood. The submission has been withdrawn. Nothing was recorded.",
  authorizationRequest: (vehicle, plate, requester) =>
    `MTO: A Used Vehicle Information Package was requested for your ${vehicle} (plate ${plate}) by ${requester}. Review and approve or decline: {link}. Expires in 24 hours.`,
  authorized:
    "Thanks — your authorization has been recorded. Reference {code}. It is valid for 30 days.",
  denied:
    "Understood. The request was declined and the transaction has been flagged for review. No package will be issued.",
  timeout:
    "This request expired with no response. The transaction has been frozen and flagged for review.",

  confirm: {
    headerOwner: "Owner authorization",
    headerDealer: "Dealer confirmation",
    askTitle: "Approve a Used Vehicle Information Package?",
    askLede:
      "Someone is asking for the UVIP for a vehicle registered to you. Only approve if you are selling it.",
    approve: "Approve",
    decline: "Decline",
    recorded: "Your response is recorded with the Federal VIN Blockchain Ledger.",
    approvedTitle: "Authorization recorded",
    approvedText: (vehicle, validUntil) =>
      `The UVIP for your ${vehicle} can now be issued. This authorization is valid until ${validUntil}.`,
    declinedTitle: "Request declined",
    declinedText: (vehicle) =>
      `No package will be issued for your ${vehicle}. The transaction has been flagged for security review.`,
    registration: {
      askTitle: "Confirm a first registration?",
      askLede: (dealer) =>
        `${dealer} is registering a new vehicle with the ministry. Confirm only if the New Vehicle Information Statement is in hand.`,
      documentLabel: "NVIS",
      firstOwnerLabel: "First registered owner",
      recorded: "Your confirmation is recorded with the Federal VIN Blockchain Ledger.",
      recordedTitle: "Registration recorded",
      recordedText: (vehicle) =>
        `The ministry has recorded the first registration of the ${vehicle}. The vehicle's ledger is open.`,
      declinedTitle: "Submission declined",
      declinedText: (vehicle) =>
        `Nothing was recorded for the ${vehicle}. The submission has been withdrawn.`,
    },
  },
}

import type { PhoneCopy } from "@/regions/types"

/** "Tyler Brooks" → "Tyler B.": the owner learns who asked, not their full name. */
function firstNameAndInitial(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/)
  const last = rest.at(-1)
  return last ? `${first} ${last.charAt(0)}.` : first
}

export const PHONE: PhoneCopy = {
  // The sender is the state, never FVBL, and the texts ask for nothing: Ohio BMV warned
  // about look-alike scam texts in June 2025. Which state body sends them is open
  // (docs/us-version.md).
  sender: "Ohio Title Alert",
  senderIcon: "OH",
  // The owner turned title alerts on when the title was issued to them; that text is
  // what the thread opens on, so the opt-in is on screen before the request arrives.
  ownerHistory: ({ vehicle, vinLast4 }) =>
    `Ohio Title Alert: You turned on title alerts for your ${vehicle} (VIN …${vinLast4}). We'll text you if someone asks to transfer it. We never ask for personal information by text. Reply STOP to turn alerts off.`,
  ownerHistoryAt: "ownershipStart",
  dealerHistory: {
    date: "2026-09-08",
    text: "Ohio Title Alert: First title application FVBL-T-2026-09-08-2291 for a 2026 Mercedes-Benz GLC 300 4MATIC was recorded on {date}. Reply STOP to opt out of service messages.",
  },
  registrationRequest: ({ dealer, vehicle, vinLast4, firstOwner, alertsLast4 }) =>
    `Ohio Title Alert: ${dealer} submitted the first title application for a ${vehicle} (VIN …${vinLast4}) for ${firstOwner}${alertsLast4 ? `, with title alerts on for mobile ending ${alertsLast4}` : ""}. Confirm this submission: {link}. Expires in 24 hours.`,
  registrationConfirmed:
    "Confirmed. First title application {ref} is recorded and the vehicle's ledger has been opened.",
  registrationDeclined: "Understood. The submission has been withdrawn. Nothing was recorded.",
  authorizationRequest: ({ vehicle, vinLast4, requester }) =>
    `Ohio Title Alert: A buyer, ${requester}, asked you to confirm the sale of your ${vehicle} (VIN …${vinLast4}). Review: {link}. Expires in 24 hours.`,
  requesterName: firstNameAndInitial,
  authorized:
    "Thanks. You confirmed the sale. Reference {code}. The buyer sees that you confirmed; your name and number stay private.",
  denied:
    "Thanks for telling us. The buyer sees that the sale isn't confirmed. Nothing changes on your title.",
  timeout: "This request expired with no reply. Nothing changes on your title.",

  confirm: {
    headerOwner: "Title alert",
    headerDealer: "Dealer confirmation",
    askTitle: "Confirm the sale of your vehicle?",
    askLede:
      "A buyer asked us to confirm they're buying this vehicle from you. Approve only if you're selling it to them.",
    asksNothing: "This page never asks you to log in, show ID or pay.",
    identifier: "vinLast4",
    approve: "Approve",
    decline: "Not me",
    recorded: "Your answer is recorded with the Federal VIN Blockchain Ledger.",
    approvedTitle: "Sale confirmed",
    approvedText: (vehicle) =>
      `You confirmed the sale of your ${vehicle}. The buyer can see that you confirmed. Your name and number stay private.`,
    declinedTitle: "Thanks for telling us",
    declinedText: (vehicle) =>
      `The buyer sees that the sale isn't confirmed. If a transfer of your ${vehicle} reaches a county title office, the clerk will see that you said this sale isn't yours.`,
    registration: {
      askTitle: "Confirm a first title application?",
      askLede: (dealer) =>
        `${dealer} is applying for the first Ohio title of a new vehicle. Confirm only if the manufacturer's certificate of origin is in hand.`,
      documentLabel: "Certificate of origin",
      firstOwnerLabel: "First owner",
      alertsLabel: "Title alerts",
      recorded: "Your confirmation is recorded with the Federal VIN Blockchain Ledger.",
      recordedTitle: "Title application recorded",
      recordedText: (vehicle) =>
        `The first title application for the ${vehicle} is recorded. The vehicle's ledger is open.`,
      declinedTitle: "Submission declined",
      declinedText: (vehicle) =>
        `Nothing was recorded for the ${vehicle}. The submission has been withdrawn.`,
    },
  },
}

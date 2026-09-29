import type { DealerCopy } from "@/regions/types"

export const DEALER_COPY: DealerCopy = {
  title: "Register a new vehicle",
  lede: "First registration with the ministry, from the New Vehicle Information Statement. You confirm the submission from the dealership's registered mobile.",
  vinHint: "As printed on the New Vehicle Information Statement.",
  unknownVin: "This VIN does not decode. Check the NVIS and try again.",
  pending: {
    title: "Submitted to the ministry",
    text: (last4) =>
      `A text went to the dealership's registered mobile ending ${last4}. The registration is recorded once it is confirmed there; the link expires in 24 hours.`,
  },
  registered: {
    label: "Confirmed from the dealership's mobile",
    title: "Registration recorded",
    text: "The ministry has the first registration and the vehicle's ledger is open.",
    ledger: "First registration and delivery odometer",
    ledgerEvent: "First registration",
  },
  declined: {
    label: "Declined from the dealership's mobile",
    title: "Submission withdrawn",
    text: "Nothing was recorded with the ministry.",
  },
  statement: {
    title: "NVIS and delivery",
    lede: "Confirm the statement that came with the vehicle. Delivery details are from your dealer management system.",
    confirm:
      "I confirm the New Vehicle Information Statement for this VIN is in hand and matches the vehicle.",
    documentLabel: "NVIS number",
    firstOwnerLabel: "First registered owner",
  },
  review: {
    title: "Review and submit",
    text: (last4) =>
      `The registration is pushed to the ministry as a dealer submission and must be confirmed from the dealership's registered mobile ending ${last4}.`,
    documentLabel: "NVIS",
    submit: "Submit to ministry",
  },
  navLabel: "Registrations",
  navItem: "Register a new vehicle",
}

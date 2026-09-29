import type { DealerCopy } from "@/regions/types"

export const DEALER_COPY: DealerCopy = {
  title: "Apply for a first title",
  lede: "First title application, from the manufacturer's certificate of origin. You confirm the submission from the dealership's registered mobile.",
  vinHint: "As printed on the manufacturer's certificate of origin.",
  unknownVin: "This VIN does not decode. Check the certificate of origin and try again.",
  already: "This VIN already has a title on file. Use a title transfer, not a first title.",
  vinClear: {
    title: "No title on file.",
    text: "This VIN has not been titled or registered in any jurisdiction.",
  },
  pending: {
    title: "Submitted to the county title office",
    text: (last4) =>
      `A text went to the dealership's registered mobile ending ${last4}. The title application is recorded once it's confirmed there; the link expires in 24 hours.`,
  },
  registered: {
    label: "Confirmed from the dealership's mobile",
    title: "Title application recorded",
    text: "The county title office has the first title application and the vehicle's ledger is open.",
    ledger: "First title and delivery odometer",
    ledgerEvent: "First title",
    dateLabel: "Recorded",
    again: "Start another title",
  },
  declined: {
    label: "Declined from the dealership's mobile",
    title: "Submission withdrawn",
    text: "Nothing was recorded with the county title office.",
  },
  statement: {
    title: "Certificate of origin",
    lede: "Confirm the certificate that came with the vehicle. Delivery details are from your dealer management system.",
    confirm:
      "I confirm the manufacturer's certificate of origin for this VIN is in hand and matches the vehicle.",
    documentLabel: "Certificate of origin",
    firstOwnerLabel: "First owner",
  },
  review: {
    title: "Review and submit",
    text: (last4) =>
      `The first title application goes to the county title office as a dealer submission and must be confirmed from the dealership's registered mobile ending ${last4}.`,
    documentLabel: "Certificate of origin",
    submit: "Submit title application",
  },
  titleAlerts: {
    confirm: (last4) => `The first owner turned on title alerts for mobile ending ${last4}.`,
    note: "They get a text if anyone asks to transfer this title, and can turn alerts off any time.",
    reviewLabel: "Title alerts",
    reviewValue: (last4) => `On, mobile ending ${last4}`,
  },
  navLabel: "Titles",
  navItem: "Apply for a first title",
}

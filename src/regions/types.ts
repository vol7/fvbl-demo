import type { Check, CheckDefinition } from "@/lib/checks"
import type { CaseRow, RecentLookup, RequestRow } from "@/lib/seed"
import type { SessionState } from "@/lib/session"
import type { EventKind, RegistryAgency, Vehicle } from "@/lib/vehicles"

/** Which country's demo a surface plays: the first segment of every route. */
export type RegionId = "ca" | "us"

export const REGION_IDS: readonly RegionId[] = ["ca", "us"]

export function isRegionId(value: string | undefined): value is RegionId {
  return REGION_IDS.includes(value as RegionId)
}

/**
 * Everything that differs between the Canadian and the US demo: data, copy and the
 * few rules that change. Shared components read it with `useRegion()`; pure `lib`
 * functions take it as their first argument.
 *
 * Each pack lives in `src/regions/<id>/`, one file per concern so separate people
 * can own them:
 *
 *   index.ts          assembles the pack
 *   office.ts         the counter the clerk portal signs into
 *   people.ts         owner, buyer, dealer, first owner
 *   vehicles.ts       demo vehicles and their VINs
 *   seed.ts           the static rows that make the portal look in use
 *   checks.ts         record checks: labels, sources, agencies, evaluation
 *   forceStates.ts    the hub's Force state shortcuts
 *   copy/decision.ts  the decision card on the vehicle page
 *   copy/phone.ts     the SMS thread and the confirm page
 *   copy/dealer.ts    the dealer's first registration (or first title)
 *   copy/signin.ts    both sign-in pages
 *   copy/hub.ts       the recording hub
 *   copy/story.ts     the worst flag's story on a failed record
 *   copy/portal.ts    everything else in the clerk portal: home, cases, history,
 *                     activity, ledger and certificate wording
 */
export type RegionPack = {
  id: RegionId

  place: {
    /** The country the portal stands in: "Entered Canada", "Not back in Canada since". */
    country: string
    /** The registry that owns the record, as its chip on an event and in a sentence. */
    registry: {
      agency: RegistryAgency
      inSentence: string
      /**
       * Set where vehicles are titled (the US): a dealer's submission opens the
       * record with a first title in this state instead of a first registration.
       */
      titles?: { state: string }
    }
  }

  office: Office
  people: People
  /** Demo vehicles, in the order the portal's Recent lists them. */
  vehicles: Vehicle[]
  seed: Seed

  checks: {
    /** In display order when nothing fails. Failures are pulled to the front. */
    definitions: CheckDefinition[]
    /** Every integration the portal consults, in the order the header lists them. */
    integrations: { name: string; detail: string }[]
  }

  policy: {
    /**
     * Canada needs the owner's approval before the package is issued. In the US
     * the owner's confirmation is evidence, not a gate (US plan, Task 5).
     */
    ownerConfirmation: "required" | "optional"
  }

  odometerUnit: OdometerUnit
  plate: {
    /** Read out for the plate chip: "Ontario plate". */
    label: string
    style: "ontario" | "ohio"
  }
  sms: {
    /** Owner-facing link shown in the text and the confirm page's address bar. */
    link: (token: string) => string
    /** Shown in the address bar when no request is live. */
    domain: string
  }
  references: {
    /** Prefix of the issued document's number: "UVIP" for UVIP-2026-09-09-4821. */
    issued: string
    /** Prefix of a dealer submission's reference: "FVBL-R" (registration), "FVBL-T" (title). */
    registration: string
  }

  forceStates: { key: string; label: string }[]
  forcedSession: (key: string, now?: Date) => SessionState

  story: StoryCopy
  copy: {
    decision: DecisionCopy
    phone: PhoneCopy
    dealer: DealerCopy
    signIn: SignInCopy
    hub: HubCopy
    portal: PortalCopy
  }
}

export type OdometerUnit = "km" | "mi"

export type Office = {
  name: string
  shortName: string
  clerk: string
  clerkFullName: string
  initials: string
  role: string
  counter: string
}

export type People = {
  owner: { name: string; licence: string; mobile: string; mobileLast4: string }
  buyer: { name: string; shortName: string; licence: string; mobile: string; mobileLast4: string }
  dealer: {
    name: string
    principal: string
    principalInitials: string
    number: string
    mobile: string
    mobileLast4: string
    /** The source document's number: the NVIS in Canada. */
    nvis: string
  }
  firstOwner: { name: string; licence: string; mobile: string; mobileLast4: string }
}

export type Seed = {
  recentLookups: RecentLookup[]
  requestRows: RequestRow[]
  caseRows: CaseRow[]
  todayStats: { lookups: number; casesOpened: number }
  /** "Today, 9:41 a.m." for each demo vehicle under Recent lookups, in order. */
  demoLookupTimes: string[]
}

/** What `recordStory` needs from a region to tell the worst flag. */
export type StoryCopy = {
  tell: (check: Check, vehicle: Vehicle) => StoryTelling
  /** Agencies as a clerk says them: "the MTO", everything else by name. */
  agencyName: (agency: string) => string
  /**
   * The last sentence of every story, after the other flags: the US says who
   * decides ("Your office decides whether to issue.").
   */
  closing?: string
}

export type StoryTelling = {
  title: string
  body: string
  /** Said after the reporting agencies, e.g. what the local record alone would show. */
  footnote?: string
  /** Who reported the flag, when it is not every agency on the check's row. */
  reportedBy?: string[]
  /** Who the investigators notify once they have reviewed a referral. */
  notifyAfterReview: string
}

/**
 * Templates may carry `{slot}` placeholders that the component fills with a node
 * (a link, a bold reference). See `fill` in `@/lib/fill`.
 */
export type Template = string

/** The verdict pill: one label for the whole record, per state. */
export type VerdictLabels = {
  idle: string
  pending: string
  authorized: string
  issued: string
  denied: string
  timeout: string
  blocked: string
  escalated: string
}

export type DecisionCopy = {
  /** The card's accessible name: "Package decision". */
  ariaLabel: string
  verdict: VerdictLabels
  /** Beside the plate for a high-value model. */
  highValueNote: string
  /** The clerk's button that hands over the document: "Issue package", "Issue title". */
  issueAction: string
  idle: { label: string; title: string; text: (checks: number, last4: string) => string }
  /** The dialog that texts the owner from the counter. */
  request: {
    action: string
    title: string
    description: (last4: string) => string
    applicantLabel: string
    send: string
  }
  pending: {
    label: string
    title: string
    /** Before "The link expires in …". */
    fromBuyer: (requester: string, time: string) => string
    fromCounter: (last4: string, time: string) => string
  }
  issued: {
    label: string
    title: string
    /** `authorizationCode` is null when the clerk issued without an owner's approval (US). */
    text: (p: { clerk: string; time: string; authorizationCode: string | null }) => string
  }
  authorized: {
    label: string
    titleOwner: string
    titleOther: string
    textOwner: (approvedOn: string, validUntil: string) => string
    textBuyer: (requester: string, time: string) => string
    textCounter: (time: string) => string
  }
  frozen: {
    labelDenied: string
    labelTimeout: string
    titleDenied: string
    titleTimeout: string
    text: (time: string, reason: "denied" | "timeout") => string
  }
  blocked: {
    label: string
    fallbackTitle: string
    referAction: string
  }
  escalated: {
    label: string
    title: string
    text: (p: {
      story: string
      clerk: string
      time: string
      counter: string
      notifyAfterReview: string | null
    }) => string
    customerNote: string
    sentWith: (checks: number, certificates: number) => string
  }
  strip: {
    checks: string
    authorization: string
    lastEvent: string
    idle: { value: string; detail: (last4: string) => string }
    pending: string
    approved: string
    preapproved: string
    /** The certificate's event name for the owner's approval. */
    approvedEvent: string
    denied: string
    expired: { value: string; detail: string }
    unavailable: { value: string; detail: string }
  }
}

/** What the owner's older service message can mention. */
export type OwnerHistoryContext = {
  plate: string
  date: string
  vehicle: string
  vinLast4: string
}

/** What the text carrying a live request can mention. */
export type AuthorizationRequestContext = {
  vehicle: string
  plate: string
  vinLast4: string
  /** As the region shows it to the owner: the full name, or first name and initial. */
  requester: string
}

/** What the dealership's text about its own submission can read back. */
export type RegistrationRequestContext = {
  dealer: string
  vehicle: string
  vinLast4: string
  firstOwner: string
  /** The first owner's mobile for title alerts, when they turned them on. */
  alertsLast4: string | null
}

export type PhoneCopy = {
  /** The business sender's name and the letters on its icon. */
  sender: string
  senderIcon: string
  /**
   * The owner's older service message, so the thread does not start with the live
   * request. Dated from the last renewal (Canada) or the start of the current
   * ownership, when the owner turned on title alerts (US).
   */
  ownerHistory: (ctx: OwnerHistoryContext) => string
  ownerHistoryAt: "lastRenewal" | "ownershipStart"
  /** The dealership's older service message, with its date. */
  dealerHistory: { date: string; text: string }
  /** `{link}` is the tappable link. */
  registrationRequest: (ctx: RegistrationRequestContext) => Template
  /** `{ref}` is the registration reference. */
  registrationConfirmed: Template
  registrationDeclined: string
  /** `{link}` is the tappable link. */
  authorizationRequest: (ctx: AuthorizationRequestContext) => Template
  /** How the requester's name is shown to the owner. */
  requesterName: (name: string) => string
  /** `{code}` is the authorization code. */
  authorized: Template
  denied: string
  timeout: string

  confirm: {
    headerOwner: string
    headerDealer: string
    askTitle: string
    askLede: string
    /** Says what the page never asks for. Shown under the lede when set. */
    asksNothing?: string
    /** What identifies the vehicle on the page: its plate, or the VIN's last four. */
    identifier: "plate" | "vinLast4"
    approve: string
    decline: string
    recorded: string
    approvedTitle: string
    approvedText: (vehicle: string, validUntil: string) => string
    declinedTitle: string
    declinedText: (vehicle: string) => string
    registration: {
      askTitle: string
      askLede: (dealer: string) => string
      /** Row label for the source document's number: "NVIS". */
      documentLabel: string
      firstOwnerLabel: string
      /** Row label for the first owner's title alerts, where the region has them. */
      alertsLabel?: string
      recorded: string
      recordedTitle: string
      recordedText: (vehicle: string) => string
      declinedTitle: string
      declinedText: (vehicle: string) => string
    }
  }
}

export type DealerCopy = {
  title: string
  lede: string
  vinHint: string
  /** The VIN does not decode. */
  unknownVin: string
  /** The VIN already has a record on file. */
  already: string
  /** Under the decoded vehicle: nothing on file anywhere yet. */
  vinClear: { title: string; text: string }
  pending: { title: string; text: (last4: string) => string }
  registered: {
    label: string
    title: string
    text: string
    ledger: string
    ledgerEvent: string
    /** Label of the row with the time it was recorded. */
    dateLabel: string
    /** The button that starts another submission. */
    again: string
  }
  declined: { label: string; title: string; text: string }
  statement: {
    title: string
    lede: string
    confirm: string
    documentLabel: string
    firstOwnerLabel: string
  }
  review: { title: string; text: (last4: string) => string; documentLabel: string; submit: string }
  /**
   * The first owner's title-alert opt-in (US): a pre-ticked row on the statement
   * step. Absent where the registry doesn't text owners about transfers.
   */
  titleAlerts?: {
    confirm: (last4: string) => string
    note: string
    reviewLabel: string
    reviewValue: (last4: string) => string
  }
  navLabel: string
  navItem: string
}

export type SignInVariant = {
  headline: string
  lede: string
  points: [string, string]
  audience: string
  title: string
  subtitle: string
}

export type SignInCopy = { clerk: SignInVariant; dealer: SignInVariant }

export type HubCopy = {
  /** "FVBL demo · Canada". */
  heading: string
  intro: string
  scenarios: { n: number; title: string; vin: string; route: string; outcome: string }[]
  /** The buyer-facing surface, which differs per country. */
  publicSurface: { title: string; description: string; href: string }
  /** What the dealer card says the dealer does on day one. */
  dealerSurface: { description: string }
  /** Under the scenarios table's title. */
  scenariosNote: string
}

export type PortalCopy = {
  homeLede: (sources: number) => string
  casesDescription: string
  /** The live row a referral adds to Cases. */
  liveCase: { reason: string; routedTo: string }
  unregistered: { title: string; text: string }
  request: { licenceLabel: string }
  /** Titles of history events, keyed by event kind. */
  historyTitle: Record<EventKind, string>
  timeline: { entered: (from: string) => string; exported: string; notBackSince: string }
  ownersExported: (date: string, noTransfer: boolean) => string
  activity: {
    preapprovedDetail: (code: string) => string
    issuedTitle: string
    approvedTitle: string
    frozen: { denied: string; timeout: string; detail: (reason: "denied" | "timeout") => string }
    escalatedTitle: string
  }
  /** The Requests page: requests sent to owners from this office. */
  requests: {
    title: string
    description: string
    online: (name: string) => string
    preapproval: string
    status: { pending: string; authorized: string; issued: string; frozen: string; expired: string }
  }
  ledger: {
    /** The chain's name on a certificate: "FVBL Ontario". */
    name: string
    /** The kind is hashed into the certificate, so it never changes for a region. */
    issuedKind: string
    issuedTitle: string
  }
}

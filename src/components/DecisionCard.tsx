import {
  CircleCheck,
  Clock,
  FileCheck,
  History,
  ListChecks,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Snowflake,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { Countdown } from "@/components/Countdown"
import { LedgerMark } from "@/components/LedgerMark"
import { RequestDialog, type ApplicantDetails } from "@/components/RequestDialog"
import { Button } from "@/components/ui/button"
import type { AuthorizationState } from "@/lib/authorization"
import { failingChecks, highRiskChecks, INTEGRATIONS, type Check } from "@/lib/checks"
import { formatDate, formatTime } from "@/lib/format"
import { authorizationCertificates, HISTORY_TITLE, ledgerEntries } from "@/lib/ledger"
import { OFFICE } from "@/lib/office"
import { recordStory } from "@/lib/story"
import { cn } from "@/lib/utils"
import { sortedHistory, type Vehicle } from "@/lib/vehicles"

type Tone = "neutral" | "success" | "info" | "warning" | "danger"

const TONE: Record<Tone, { card: string; label: string }> = {
  neutral: {
    card: "border-border bg-muted/40",
    label: "text-muted-foreground",
  },
  success: {
    card: "border-emerald-600/25 bg-emerald-50/70 dark:bg-emerald-950/30",
    label: "text-emerald-700 dark:text-emerald-400",
  },
  info: {
    card: "border-primary/25 bg-primary/[0.04]",
    label: "text-primary",
  },
  warning: {
    card: "border-amber-500/35 bg-amber-50/70 dark:bg-amber-950/30",
    label: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    card: "border-destructive/25 bg-destructive/[0.04]",
    label: "text-destructive",
  },
}

type Props = {
  vehicle: Vehicle
  checks: Check[]
  state: AuthorizationState
  onRequest: (applicant: ApplicantDetails) => void
  onIssue: () => void
  onEscalate: () => void
}

type Body = {
  tone: Tone
  icon: LucideIcon
  label: string
  title: string
  text: React.ReactNode
  reference?: string
  /** A word before the reference, e.g. "Case". */
  referenceLabel?: string
  foot?: string
  extra?: React.ReactNode
  action?: React.ReactNode
}

/**
 * The answer to "can this package be issued?", with the reason and the one thing the
 * clerk does next. The strip underneath names what the platform checked: the record
 * checks, the owner's consent, and the vehicle's last recorded event.
 */
export function DecisionCard({ vehicle, checks, state, onRequest, onIssue, onEscalate }: Props) {
  const n = checks.length
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  const story = recordStory(vehicle, checks)
  const certificates = authorizationCertificates(vehicle, state)
  const last4 = vehicle.owner.phoneLast4

  const body = ((): Body => {
    switch (state.status) {
      case "idle":
        return {
          tone: "success",
          icon: CircleCheck,
          label: "Checks clear",
          title: "Ready to request owner authorization",
          text: `All ${n} record checks passed. The registered owner gets a text at the phone ending in ${last4} with a link to approve or decline.`,
          action: <RequestDialog ownerPhoneLast4={last4} onRequest={onRequest} />,
        }
      case "pending":
        return {
          tone: "info",
          icon: Clock,
          label: "Awaiting owner",
          title: "Waiting for the registered owner",
          text: (
            <>
              {state.origin === "buyer"
                ? `${state.requester} requested it online through ServiceOntario at ${formatTime(state.sentAt)}.`
                : `A text went to the phone ending in ${last4} at ${formatTime(state.sentAt)}.`}{" "}
              The link expires in <Countdown expiresAt={state.expiresAt} />.
            </>
          ),
        }
      case "authorized": {
        if (state.issued) {
          return {
            tone: "success",
            icon: CircleCheck,
            label: "Package issued",
            title: "Used Vehicle Information Package issued",
            text: `${OFFICE.clerkFullName} issued the package at ${formatTime(state.issued.at)} under authorization ${state.authorizationCode}.`,
            reference: state.issued.packageNumber,
          }
        }
        return {
          tone: "success",
          icon: ShieldCheck,
          label: "Authorized to issue",
          title:
            state.origin === "owner"
              ? "The registered owner pre-approved this sale"
              : "The registered owner approved this request",
          text:
            state.origin === "owner"
              ? `The owner pre-approved it online through ServiceOntario on ${formatDate(state.approvedAt.slice(0, 10))}. The approval is valid until ${formatDate(state.validUntil.slice(0, 10))}.`
              : state.origin === "buyer"
                ? `${state.requester} requested it online through ServiceOntario. The owner approved it at ${formatTime(state.approvedAt)} from the link in the text message.`
                : `The owner approved it at ${formatTime(state.approvedAt)} from the link in the text message.`,
          reference: state.authorizationCode,
          action: (
            <Button
              size="lg"
              className="bg-emerald-700 px-4 text-white hover:bg-emerald-700/90 has-data-[icon=inline-start]:pl-3.5"
              onClick={onIssue}
            >
              <FileCheck data-icon="inline-start" aria-hidden />
              Issue package
            </Button>
          ),
        }
      }
      case "frozen":
        return {
          tone: "warning",
          icon: Snowflake,
          label: state.reason === "denied" ? "Owner denied" : "Request expired",
          title:
            state.reason === "denied"
              ? "The registered owner denied this request"
              : "The owner did not respond within 24 hours",
          text: `The transaction is frozen and flagged for security review. Recorded at ${formatTime(state.frozenAt)}.`,
        }
      case "blocked":
        return {
          tone: "danger",
          icon: ShieldAlert,
          label: "Hold, do not issue",
          title: story?.title ?? "A record check failed",
          text: story?.body ?? "",
          foot: story?.foot,
          action: (
            <Button
              size="lg"
              className="bg-destructive px-4 text-white hover:bg-destructive/90 has-data-[icon=inline-start]:pl-3.5"
              onClick={onEscalate}
            >
              <Siren data-icon="inline-start" aria-hidden />
              Refer for investigation
            </Button>
          ),
        }
      case "escalated":
        return {
          tone: "danger",
          icon: ShieldAlert,
          label: "Referred, do not issue",
          title: "Referred to MTO Investigations",
          // Who and when once, what happens next once.
          text: `${story?.title ?? "A record check failed"}. ${OFFICE.clerkFullName} referred it at ${formatTime(state.escalatedAt)} from ${OFFICE.counter.replace(" ", "\u00a0")}.${story ? ` MTO Investigations notifies ${story.notifyAfterReview} after review.` : ""}`,
          referenceLabel: "Case",
          reference: state.caseReference,
          extra: (
            <div className="mt-4 flex flex-col gap-1.5 border-t border-destructive/20 pt-3 text-sm">
              <p className="flex items-start gap-2 font-medium">
                <MessageSquareWarning
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden
                />
                Tell the customer the record needs verifying. Do not share the reason.
              </p>
              <p className="pl-6 text-muted-foreground">
                Sent with the file: the vehicle record and history, {n} record check results and{" "}
                {ledgerEntries(vehicle, state).length} ledger certificates.
              </p>
            </div>
          ),
        }
    }
  })()

  const t = TONE[body.tone]
  const Icon = body.icon

  // The strip: checks, the owner's consent, the last event on the vehicle's own record.
  // The cells look the same in every state; only what they say changes. Each says
  // one short value and one line of detail, so every cell is three lines tall.
  const checksCell: Cell =
    failing.length > 0
      ? {
          value: `${failing.length} of ${n} failed`,
          detail: high.length ? `${high.length} high risk` : `${failing.length} low risk`,
        }
      : { value: `All ${n} passed`, detail: `${INTEGRATIONS.length} sources answered` }

  const approval = certificates.approved ?? certificates.preapproved
  const authCell = ((): Cell => {
    switch (state.status) {
      case "idle":
        return { value: "Not yet requested", detail: `Texts the phone ending in ${last4}` }
      case "pending":
        return {
          value: "Awaiting reply",
          detail: (
            <>
              Expires in <Countdown expiresAt={state.expiresAt} />
            </>
          ),
        }
      case "authorized": {
        const owner = state.origin === "owner"
        return {
          value: owner ? "Pre-approved" : "Approved",
          detail: (
            <>
              {owner
                ? formatDate(state.approvedAt.slice(0, 10))
                : `At ${formatTime(state.approvedAt)}`}
              {approval ? (
                <LedgerMark
                  hash={approval}
                  event={owner ? "Pre-approved by registered owner" : "Owner approved"}
                  source="FVBL"
                  recordedAt={state.approvedAt}
                  className="ml-1 align-[-3px]"
                />
              ) : null}
            </>
          ),
        }
      }
      case "frozen":
        return state.reason === "denied"
          ? { value: "Denied", detail: `At ${formatTime(state.frozenAt)}` }
          : { value: "Expired", detail: "No response in 24 hours" }
      case "blocked":
      case "escalated":
        return { value: "Unavailable", detail: "Until the checks clear" }
    }
  })()

  const lastEvent = sortedHistory(vehicle)
    .filter((e) => e.kind !== "odometer")
    .at(-1)

  return (
    <section aria-label="Package decision" className="flex flex-col gap-3">
      <div
        role="status"
        className={cn(
          "grid gap-5 rounded-xl border p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6",
          t.card
        )}
      >
        <div className="min-w-0">
          <p className={cn("flex items-center gap-2 text-sm font-semibold", t.label)}>
            <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
            {body.label}
          </p>
          <h2 className="mt-2 max-w-[46ch] text-lg leading-snug font-semibold tracking-tight text-balance">
            {body.title}
          </h2>
          <p className="mt-1.5 max-w-[68ch] text-sm text-foreground/80">{body.text}</p>
          {body.reference ? (
            <p className="mt-2.5 flex items-baseline gap-2">
              {body.referenceLabel ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {body.referenceLabel}
                </span>
              ) : null}
              <span className="font-mono text-[15px] font-medium tracking-wider">
                {body.reference}
              </span>
            </p>
          ) : null}
          {body.foot ? <p className="mt-2.5 text-xs text-muted-foreground">{body.foot}</p> : null}
          {body.extra}
        </div>
        {body.action ? <div className="flex items-start">{body.action}</div> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StripCell icon={ListChecks} label="Record checks" {...checksCell} />
        <StripCell icon={UserRound} label="Owner authorization" {...authCell} />
        <StripCell
          icon={History}
          label="Last recorded event"
          value={lastEvent ? HISTORY_TITLE[lastEvent.kind] : "Nothing recorded"}
          detail={lastEvent ? formatDate(lastEvent.date) : "No events on the ledger yet"}
        />
      </div>
    </section>
  )
}

type Cell = { value: React.ReactNode; detail: React.ReactNode }

function StripCell({
  icon: Icon,
  label,
  value,
  detail,
}: Cell & { icon: LucideIcon; label: string }) {
  return (
    <div className="flex gap-2.5 rounded-xl border bg-card px-4 py-3.5">
      <Icon className="mt-px size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {/* The category is fixed, so it steps back; the value is what the clerk reads. */}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-1 truncate text-sm font-semibold">{value}</span>
        <span className="truncate text-[13px] text-muted-foreground">{detail}</span>
      </span>
    </div>
  )
}

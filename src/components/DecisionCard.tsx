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
import { failingChecks, highRiskChecks, type Check } from "@/lib/checks"
import { formatDate, formatTime } from "@/lib/format"
import { authorizationCertificates, ledgerEntries } from "@/lib/ledger"
import { recordStory } from "@/lib/story"
import { cn } from "@/lib/utils"
import { sortedHistory, type Vehicle } from "@/lib/vehicles"
import { useRegion } from "@/regions"

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
 * The answer to "can this be issued?", with the reason and the one thing the
 * clerk does next. The strip underneath names what the platform checked: the record
 * checks, the owner's consent, and the vehicle's last recorded event.
 */
export function DecisionCard({ vehicle, checks, state, onRequest, onIssue, onEscalate }: Props) {
  const pack = useRegion()
  const copy = pack.copy.decision
  const { office } = pack
  const n = checks.length
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  const story = recordStory(pack, vehicle, checks)
  const certificates = authorizationCertificates(pack, vehicle, state)
  const last4 = vehicle.owner.phoneLast4

  // Canada's clerk acts from the card. The US card only informs: the county clerk
  // issues or refers in their own office's system, so it has no buttons at all.
  const actions = copy.actions
  const informational = actions === null
  const issueButton = actions ? (
    <Button
      size="lg"
      className="bg-emerald-700 px-4 text-white hover:bg-emerald-700/90 has-data-[icon=inline-start]:pl-3.5"
      onClick={() => onIssue()}
    >
      <FileCheck data-icon="inline-start" aria-hidden />
      {actions.issue}
    </Button>
  ) : undefined
  const hold = (label: string): Body => ({
    tone: "danger",
    icon: ShieldAlert,
    label,
    title: story?.title ?? copy.blocked.fallbackTitle,
    text: story?.body ?? "",
    foot: story?.foot,
    action: actions ? (
      <Button
        size="lg"
        className="bg-destructive px-4 text-white hover:bg-destructive/90 has-data-[icon=inline-start]:pl-3.5"
        onClick={onEscalate}
      >
        <Siren data-icon="inline-start" aria-hidden />
        {actions.refer}
      </Button>
    ) : undefined,
  })

  const body = ((): Body => {
    if (actions && state.status === "authorized" && state.issued) {
      return {
        tone: "success",
        icon: CircleCheck,
        label: actions.issued.label,
        title: actions.issued.title,
        text: actions.issued.text({
          clerk: office.clerkFullName,
          time: formatTime(state.issued.at),
          authorizationCode: state.authorizationCode,
        }),
        reference: state.issued.reference,
      }
    }
    switch (state.status) {
      case "idle":
        return {
          tone: "success",
          icon: CircleCheck,
          label: copy.idle.label,
          title: copy.idle.title,
          text: copy.idle.text(n, last4),
          action: actions ? (
            <RequestDialog copy={actions.request} ownerPhoneLast4={last4} onRequest={onRequest} />
          ) : undefined,
        }
      case "pending":
        return {
          tone: "info",
          icon: Clock,
          label: copy.pending.label,
          title: copy.pending.title,
          text: (
            <>
              {state.origin === "buyer"
                ? copy.pending.fromBuyer(state.requester, formatTime(state.sentAt))
                : copy.pending.fromCounter(last4, formatTime(state.sentAt))}{" "}
              The link expires in <Countdown expiresAt={state.expiresAt} />.
            </>
          ),
        }
      case "authorized":
        return {
          tone: "success",
          icon: ShieldCheck,
          label: copy.authorized.label,
          title: state.origin === "owner" ? copy.authorized.titleOwner : copy.authorized.titleOther,
          text:
            state.origin === "owner"
              ? copy.authorized.textOwner(
                  formatDate(state.approvedAt.slice(0, 10)),
                  formatDate(state.validUntil.slice(0, 10))
                )
              : state.origin === "buyer"
                ? copy.authorized.textBuyer(state.requester, formatTime(state.approvedAt))
                : copy.authorized.textCounter(formatTime(state.approvedAt)),
          reference: state.authorizationCode,
          action: issueButton,
        }
      case "frozen":
        // The owner's "Not me" is a hold the US clerk reviews like a failed check.
        if (informational && state.reason === "denied") return hold(copy.frozen.labelDenied)
        return {
          tone: informational ? "neutral" : "warning",
          icon: informational ? Clock : Snowflake,
          label: state.reason === "denied" ? copy.frozen.labelDenied : copy.frozen.labelTimeout,
          title: state.reason === "denied" ? copy.frozen.titleDenied : copy.frozen.titleTimeout,
          text: copy.frozen.text(formatTime(state.frozenAt), state.reason),
        }
      case "blocked":
        return hold(copy.blocked.label)
      case "escalated":
        if (!actions) return hold(copy.blocked.label)
        return {
          tone: "danger",
          icon: ShieldAlert,
          label: actions.escalated.label,
          title: actions.escalated.title,
          text: actions.escalated.text({
            story: story?.title ?? copy.blocked.fallbackTitle,
            clerk: office.clerkFullName,
            time: formatTime(state.escalatedAt),
            counter: office.counter.replace(" ", "\u00a0"),
            notifyAfterReview: story?.notifyAfterReview ?? null,
          }),
          referenceLabel: "Case",
          reference: state.caseReference,
          extra: (
            <div className="mt-4 flex flex-col gap-1.5 border-t border-destructive/20 pt-3 text-sm">
              <p className="flex items-start gap-2 font-medium">
                <MessageSquareWarning
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden
                />
                {actions.escalated.customerNote}
              </p>
              <p className="pl-6 text-muted-foreground">
                {actions.escalated.sentWith(n, ledgerEntries(pack, vehicle, state).length)}
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
      : { value: `All ${n} passed`, detail: `${pack.checks.integrations.length} sources answered` }

  const approval = certificates.approved ?? certificates.preapproved
  const authCell = ((): Cell => {
    switch (state.status) {
      case "idle":
        return { value: copy.strip.idle.value, detail: copy.strip.idle.detail(last4) }
      case "pending":
        return {
          value: copy.strip.pending,
          detail: (
            <>
              Expires in <Countdown expiresAt={state.expiresAt} />
            </>
          ),
        }
      case "authorized": {
        const owner = state.origin === "owner"
        return {
          value: owner ? copy.strip.preapproved : copy.strip.approved,
          detail: (
            <>
              {owner
                ? formatDate(state.approvedAt.slice(0, 10))
                : `At ${formatTime(state.approvedAt)}`}
              {approval ? (
                <LedgerMark
                  hash={approval}
                  event={owner ? "Pre-approved by registered owner" : copy.strip.approvedEvent}
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
          ? { value: copy.strip.denied, detail: `At ${formatTime(state.frozenAt)}` }
          : copy.strip.expired
      case "blocked":
      case "escalated":
        return copy.strip.unavailable
    }
  })()

  const lastEvent = sortedHistory(vehicle)
    .filter((e) => e.kind !== "odometer")
    .at(-1)

  return (
    <section aria-label={copy.ariaLabel} className="flex flex-col gap-3">
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
        <StripCell icon={ListChecks} label={copy.strip.checks} {...checksCell} />
        <StripCell icon={UserRound} label={copy.strip.authorization} {...authCell} />
        <StripCell
          icon={History}
          label={copy.strip.lastEvent}
          value={lastEvent ? pack.copy.portal.historyTitle[lastEvent.kind] : "Nothing recorded"}
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

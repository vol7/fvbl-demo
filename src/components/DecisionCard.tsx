import {
  CircleCheck,
  CircleX,
  Clock,
  FileCheck,
  History,
  LoaderCircle,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Snowflake,
  type LucideIcon,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Countdown } from "@/components/Countdown"
import { LedgerMark } from "@/components/LedgerMark"
import { RequestDialog, type ApplicantDetails } from "@/components/RequestDialog"
import { Button } from "@/components/ui/button"
import type { VehicleTab } from "@/components/VehicleSummary"
import type { AuthorizationState } from "@/lib/authorization"
import { failingChecks, highRiskChecks, INTEGRATIONS, type Check } from "@/lib/checks"
import { formatDate, formatTime } from "@/lib/format"
import { authorizationCertificates, HISTORY_TITLE, ledgerEntries } from "@/lib/ledger"
import { OFFICE } from "@/lib/office"
import { recordStory } from "@/lib/story"
import { cn } from "@/lib/utils"
import { openExport, sortedHistory, type Vehicle } from "@/lib/vehicles"

type Tone = "neutral" | "success" | "info" | "warning" | "danger"

const TONE: Record<Tone, { card: string; line: string; divide: string; label: string }> = {
  neutral: {
    card: "border-border bg-muted/40",
    line: "border-border",
    divide: "divide-border",
    label: "text-muted-foreground",
  },
  success: {
    card: "border-emerald-600/25 bg-emerald-50/70 dark:bg-emerald-950/30",
    line: "border-emerald-600/20",
    divide: "divide-emerald-600/20",
    label: "text-emerald-700 dark:text-emerald-400",
  },
  info: {
    card: "border-primary/25 bg-primary/[0.04]",
    line: "border-primary/20",
    divide: "divide-primary/20",
    label: "text-primary",
  },
  warning: {
    card: "border-amber-500/35 bg-amber-50/70 dark:bg-amber-950/30",
    line: "border-amber-500/25",
    divide: "divide-amber-500/25",
    label: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    card: "border-destructive/25 bg-destructive/[0.04]",
    line: "border-destructive/20",
    divide: "divide-destructive/20",
    label: "text-destructive",
  },
}

type Props = {
  vehicle: Vehicle
  checks: Check[]
  state: AuthorizationState
  /** False while the record checks are still coming in: the card holds its verdict. */
  settled: boolean
  onRequest: (applicant: ApplicantDetails) => void
  onIssue: () => void
  onEscalate: () => void
  onOpenTab: (tab: VehicleTab) => void
}

type Body = {
  tone: Tone
  icon: LucideIcon
  label: string
  title: string
  text: React.ReactNode
  reference?: string
  foot?: string
  extra?: React.ReactNode
  action?: React.ReactNode
}

/**
 * The answer to "can this package be issued?", with the reason and the one thing the
 * clerk does next. The strip underneath names what the platform checked: the record
 * checks, the owner's consent, and the vehicle's last recorded event.
 */
export function DecisionCard({
  vehicle,
  checks,
  state,
  settled,
  onRequest,
  onIssue,
  onEscalate,
  onOpenTab,
}: Props) {
  const reduceMotion = useReducedMotion()
  const n = checks.length
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  const story = recordStory(vehicle, checks)
  const certificates = authorizationCertificates(vehicle, state)
  const last4 = vehicle.owner.phoneLast4

  const body = ((): Body => {
    if (!settled) {
      return {
        tone: "neutral",
        icon: LoaderCircle,
        label: "Running record checks",
        title: `Querying ${INTEGRATIONS.length} sources`,
        text: "The result shows here once every source has answered.",
      }
    }
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
              className="bg-emerald-700 px-3.5 text-white hover:bg-emerald-700/90"
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
          label: "Package cannot be issued",
          title: story?.title ?? "A record check failed",
          text: story?.body ?? "",
          foot: story?.foot,
          action: (
            <Button
              size="lg"
              className="bg-destructive px-3.5 text-white hover:bg-destructive/90"
              onClick={onEscalate}
            >
              <Siren data-icon="inline-start" aria-hidden />
              Escalate to law enforcement
            </Button>
          ),
        }
      case "escalated":
        return {
          tone: "danger",
          icon: ShieldAlert,
          label: "Escalated, do not issue",
          title: "Sent to law enforcement for review",
          text: `${story?.title ?? "A record check failed"}. ${OFFICE.clerkFullName} opened the case at ${formatTime(state.escalatedAt)} from ${OFFICE.counter}.`,
          reference: state.caseReference,
          extra: (
            <div className="mt-4 border-t border-destructive/20 pt-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Send className="size-4 text-destructive" aria-hidden />
                Shared with {story?.sharedWith ?? "law enforcement"} at{" "}
                {formatTime(state.escalatedAt)}
              </p>
              <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm text-foreground/80 sm:grid-cols-2">
                {[
                  "Vehicle record and history",
                  `${n} record check results`,
                  `${ledgerEntries(vehicle, state).length} ledger certificates`,
                  `Clerk ${OFFICE.clerkFullName}, ${OFFICE.counter}`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CircleCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ),
        }
    }
  })()

  const t = TONE[body.tone]
  const Icon = body.icon

  // The strip: checks, the owner's consent, the last event on the vehicle's own record.
  const checksCell = !settled
    ? { icon: LoaderCircle, iconClass: "animate-spin", value: "Running" }
    : failing.length > 0
      ? {
          icon: CircleX,
          iconClass: "text-destructive",
          value: `${failing.length} of ${n} failed${high.length ? `, ${high.length} high risk` : ""}`,
        }
      : { icon: CircleCheck, iconClass: "text-emerald-700", value: `All ${n} passed` }

  const approval = certificates.approved ?? certificates.preapproved
  const authCell = ((): {
    icon: LucideIcon
    tone: string
    value: React.ReactNode
    off?: boolean
  } => {
    switch (state.status) {
      case "idle":
        return { icon: Clock, tone: "text-primary", value: "Not yet requested" }
      case "pending":
        return {
          icon: Clock,
          tone: "text-primary",
          value: (
            <>
              Awaiting reply, expires in <Countdown expiresAt={state.expiresAt} />
            </>
          ),
        }
      case "authorized":
        return {
          icon: CircleCheck,
          tone: "text-emerald-700",
          value: (
            <>
              {state.origin === "owner"
                ? `Pre-approved on ${formatDate(state.approvedAt.slice(0, 10))}`
                : `Approved at ${formatTime(state.approvedAt)}`}
              {approval ? (
                <LedgerMark
                  hash={approval}
                  event={
                    state.origin === "owner" ? "Pre-approved by registered owner" : "Owner approved"
                  }
                  source="FVBL"
                  recordedAt={state.approvedAt}
                  className="ml-1 align-[-3px]"
                />
              ) : null}
            </>
          ),
        }
      case "frozen":
        return {
          icon: Snowflake,
          tone: "text-amber-600",
          value:
            state.reason === "denied"
              ? `Denied at ${formatTime(state.frozenAt)}`
              : "No response in 24 hours",
        }
      case "blocked":
      case "escalated":
        return { icon: Clock, tone: "", value: "Unavailable until checks clear", off: true }
    }
  })()

  const lastEvent = sortedHistory(vehicle)
    .filter((e) => e.kind !== "odometer")
    .at(-1)
  const lastFlagged = lastEvent !== undefined && lastEvent === openExport(vehicle)

  return (
    <section
      aria-label="Package decision"
      className={cn("overflow-hidden rounded-xl border", t.card)}
    >
      <motion.div
        key={`${settled}-${state.status}-${state.status === "authorized" && Boolean(state.issued)}`}
        role="status"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6"
      >
        <div className="min-w-0">
          <p className={cn("flex items-center gap-2 text-sm font-semibold", t.label)}>
            <Icon
              className={cn("size-[18px]", !settled && "animate-spin")}
              strokeWidth={2}
              aria-hidden
            />
            {body.label}
          </p>
          <h2 className="mt-2 max-w-[46ch] text-lg leading-snug font-semibold tracking-tight text-balance">
            {body.title}
          </h2>
          <p className="mt-1.5 max-w-[68ch] text-sm text-foreground/80">{body.text}</p>
          {body.reference ? (
            <p className="mt-2.5 font-mono text-[15px] font-medium tracking-wider">
              {body.reference}
            </p>
          ) : null}
          {body.foot ? <p className="mt-2.5 text-xs text-muted-foreground">{body.foot}</p> : null}
          {body.extra}
        </div>
        {body.action ? <div className="flex items-start">{body.action}</div> : null}
      </motion.div>

      <div
        className={cn(
          "grid divide-y border-t bg-background/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0",
          t.line,
          t.divide
        )}
      >
        <StripCell
          icon={checksCell.icon}
          iconClass={checksCell.iconClass}
          label="Record checks"
          labelClass={failing.length > 0 && settled ? "text-destructive" : undefined}
          onClick={() => onOpenTab("checks")}
        >
          {checksCell.value}
        </StripCell>
        <StripCell
          icon={authCell.icon}
          iconClass={authCell.tone}
          label="Owner authorization"
          off={authCell.off}
        >
          {authCell.value}
        </StripCell>
        <StripCell
          icon={History}
          iconClass={lastFlagged ? "text-destructive" : undefined}
          label="Last recorded event"
          labelClass={lastFlagged ? "text-destructive" : undefined}
          onClick={() => onOpenTab("history")}
        >
          {lastEvent
            ? `${HISTORY_TITLE[lastEvent.kind]} on ${formatDate(lastEvent.date)}`
            : "Nothing recorded yet"}
        </StripCell>
      </div>
    </section>
  )
}

function StripCell({
  icon: Icon,
  iconClass,
  label,
  labelClass,
  children,
  onClick,
  off,
}: {
  icon: LucideIcon
  iconClass?: string
  label: string
  labelClass?: string
  children: React.ReactNode
  onClick?: () => void
  off?: boolean
}) {
  const inner = (
    <>
      <Icon className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground", iconClass)} aria-hidden />
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-[13px] font-semibold", labelClass)}>{label}</span>
        <span className="text-[13px] text-muted-foreground">{children}</span>
      </span>
    </>
  )
  const className = cn("flex gap-2.5 px-5 py-3 text-left sm:px-6", off && "opacity-60")
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "transition-colors outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
      )}
    >
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  )
}

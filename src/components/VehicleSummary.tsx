import {
  Car,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  Copy,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  UserCheck,
} from "lucide-react"
import { useState } from "react"

import { Countdown } from "@/components/Countdown"
import { OutcomeBadge } from "@/components/OutcomeBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useClock } from "@/hooks/useClock"
import type { AuthorizationState } from "@/lib/authorization"
import {
  failingChecks,
  highRiskChecks,
  INTEGRATIONS,
  type Check as RecordCheck,
} from "@/lib/checks"
import { formatDate, formatOdometer, formatRelative, maskName, plateLabel } from "@/lib/format"
import { ledgerEntries } from "@/lib/ledger"
import type { Tone } from "@/lib/tone"
import { verdictLabel } from "@/lib/verdict"
import { cn } from "@/lib/utils"
import { vehicleTitle, type Vehicle } from "@/lib/vehicles"

export type VehicleTab = "checks" | "history" | "ownership"

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm tracking-wider" : "text-sm"}>{value}</dd>
    </div>
  )
}

function CopyVin({ vin }: { vin: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard?.writeText(vin)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "VIN copied" : "Copy VIN"}
      onClick={copy}
      className="text-muted-foreground"
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  )
}

const TILE_TONE: Record<Tone, { ring: string; icon: string; value: string }> = {
  success: {
    ring: "border-emerald-600/25 bg-emerald-50/60",
    icon: "text-emerald-600",
    value: "text-emerald-800",
  },
  danger: {
    ring: "border-destructive/30 bg-destructive/5",
    icon: "text-destructive",
    value: "text-destructive",
  },
  info: { ring: "border-primary/25 bg-primary/5", icon: "text-primary", value: "text-primary" },
  warning: {
    ring: "border-amber-500/40 bg-amber-50/70",
    icon: "text-amber-600",
    value: "text-amber-800",
  },
  neutral: {
    ring: "border-border bg-muted/30",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
}

/**
 * One concern, one line. Clickable tiles jump to the tab that has the detail.
 */
function VerdictTile({
  label,
  tone,
  icon,
  value,
  hint,
  onClick,
}: {
  label: string
  tone: Tone
  icon: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  onClick?: () => void
}) {
  const t = TILE_TONE[tone]
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("[&>svg]:size-4", t.icon)}>{icon}</span>
      </div>
      <div className={cn("text-base font-semibold tracking-tight", t.value)}>{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </>
  )
  const className = cn(
    "flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border p-4 text-left",
    t.ring,
    onClick &&
      "transition-colors outline-none hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50"
  )
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}

function checksTile(checks: RecordCheck[], onOpen: () => void) {
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  if (failing.length === 0) {
    return (
      <VerdictTile
        label="Record checks"
        tone="success"
        icon={<CircleCheck aria-hidden />}
        value={`All ${checks.length} checks passed`}
        hint="Nothing to report from any source"
        onClick={onOpen}
      />
    )
  }
  const first = failing[0]
  return (
    <VerdictTile
      label="Record checks"
      tone="danger"
      icon={<CircleX aria-hidden />}
      value={
        high.length > 0
          ? `${high.length} high-risk ${high.length === 1 ? "flag" : "flags"}`
          : `${failing.length} ${failing.length === 1 ? "flag" : "flags"}`
      }
      hint={`${first.label} · ${first.agencies.join(", ")}${failing.length > 1 ? ` · +${failing.length - 1} more` : ""}`}
      onClick={onOpen}
    />
  )
}

function authorizationTile(state: AuthorizationState, vehicle: Vehicle) {
  switch (state.status) {
    case "idle":
      return (
        <VerdictTile
          label="Owner authorization"
          tone="neutral"
          icon={<UserCheck aria-hidden />}
          value="Not yet requested"
          hint={`Owner will be texted at ••• ••• ${vehicle.owner.phoneLast4}`}
        />
      )
    case "blocked":
    case "escalated":
      return (
        <VerdictTile
          label="Owner authorization"
          tone="neutral"
          icon={<UserCheck aria-hidden />}
          value="Unavailable"
          hint="Record checks must clear first"
        />
      )
    case "pending":
      return (
        <VerdictTile
          label="Owner authorization"
          tone="info"
          icon={<Clock aria-hidden />}
          value="Awaiting owner"
          hint={
            <>
              Expires in <Countdown expiresAt={state.expiresAt} />
            </>
          }
        />
      )
    case "authorized":
      return (
        <VerdictTile
          label="Owner authorization"
          tone="success"
          icon={<UserCheck aria-hidden />}
          value={state.origin === "owner" ? "Pre-approved" : "Authorized"}
          hint={`Valid until ${formatDate(state.validUntil.slice(0, 10))}`}
        />
      )
    case "frozen":
      return (
        <VerdictTile
          label="Owner authorization"
          tone="warning"
          icon={<Snowflake aria-hidden />}
          value={state.reason === "denied" ? "Denied by owner" : "No response"}
          hint="Frozen for security review"
        />
      )
  }
}

export function VehicleSummary({
  vehicle,
  checks,
  state,
  openedAt,
  onOpenTab,
}: {
  vehicle: Vehicle
  checks: RecordCheck[]
  state: AuthorizationState
  /** When the page opened; the ledger "verified … ago" counts from a few minutes before. */
  openedAt: string
  onOpenTab: (tab: VehicleTab) => void
}) {
  const now = useClock()
  const verdict = verdictLabel(state)
  const blocked = state.status === "blocked" || state.status === "escalated"
  const entries = ledgerEntries(vehicle, state)
  const anchoredAt = new Date(new Date(openedAt).getTime() - 3 * 60_000)

  return (
    <Card>
      <CardContent className="gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-lg",
                blocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              )}
            >
              <Car className="size-6" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight">{vehicleTitle(vehicle)}</h1>
              <p className="text-sm text-muted-foreground">
                {vehicle.colour} · {vehicle.bodyStyle} ·{" "}
                {vehicle.plate ? (
                  <>
                    Ontario plate{" "}
                    <span className="font-mono tracking-wider text-foreground">
                      {vehicle.plate}
                    </span>
                  </>
                ) : (
                  plateLabel(vehicle.plate)
                )}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">VIN</span>
                <span className="font-mono tracking-wider">{vehicle.vin}</span>
                <CopyVin vin={vehicle.vin} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OutcomeBadge label={verdict} className="h-7 px-3 text-sm" />
            {vehicle.riskTier === "high-value" ? (
              <Badge variant="outline" className="gap-1.5">
                {blocked ? (
                  <ShieldAlert className="text-destructive" aria-hidden />
                ) : (
                  <ShieldCheck className="text-primary" aria-hidden />
                )}
                High-value model · owner authorization required
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {checksTile(checks, () => onOpenTab("checks"))}
          {authorizationTile(state, vehicle)}
          <VerdictTile
            label="Ledger"
            tone="success"
            icon={<ShieldCheck aria-hidden />}
            value="Blockchain certified"
            hint={`${entries.length} events · no tampering detected · verified ${formatRelative(anchoredAt, now)}`}
            onClick={() => onOpenTab("history")}
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-t pt-5 md:grid-cols-3 xl:grid-cols-6">
          <Field
            label="Registered on"
            value={vehicle.registeredOn ? formatDate(vehicle.registeredOn) : "Not registered"}
          />
          <Field label="Odometer at registration" value={formatOdometer(vehicle.odometerKm)} />
          <Field label="Registered owner" value={maskName(vehicle.owner.name)} />
          <Field label="Owner phone" value={`••• ••• ${vehicle.owner.phoneLast4}`} mono />
          <Field label="Last inspection" value={formatDate(vehicle.lastInspection)} />
          <Field
            label="Active lien"
            value={vehicle.records.lien ? vehicle.records.lien.holder : "None"}
          />
        </dl>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t pt-4 text-xs text-muted-foreground">
          <span className="mr-1 font-medium">Sources consulted</span>
          {INTEGRATIONS.map((source) => (
            <span
              key={source.name}
              title={source.detail}
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              {source.name}
            </span>
          ))}
          <span className="ml-auto">Queried just now</span>
        </div>
      </CardContent>
    </Card>
  )
}

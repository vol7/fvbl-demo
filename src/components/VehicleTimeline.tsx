import {
  ArrowLeftRight,
  Copy,
  Factory,
  Gauge,
  Globe,
  Landmark,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useContext } from "react"

import { LedgerCheckedAt } from "@/components/ledgerClock"
import { LedgerMark } from "@/components/LedgerMark"
import { useClock } from "@/hooks/useClock"
import { formatOdometer, formatRelative } from "@/lib/format"
import { historyCertificates, isDealerChannel, officeLabel } from "@/lib/ledger"
import { lifecycleStops, type LifecycleStop, type StopKind } from "@/lib/lifecycle"
import { cn } from "@/lib/utils"
import {
  countryOfOrigin,
  isBorderEvent,
  MILESTONES,
  openExport,
  sortedHistory,
  type Vehicle,
  type VehicleEvent,
} from "@/lib/vehicles"

const EVENT_ICON: Record<VehicleEvent["kind"], LucideIcon> = {
  import: PlaneLanding,
  customsEntry: Globe,
  export: PlaneTakeoff,
  firstRegistration: Landmark,
  transfer: ArrowLeftRight,
  renewal: RefreshCw,
  odometer: Gauge,
}

const STOP_ICON: Record<StopKind, LucideIcon> = {
  built: Factory,
  entered: PlaneLanding,
  exported: PlaneTakeoff,
  noReentry: PlaneLanding,
  registered: Landmark,
  renewed: RefreshCw,
  transferred: ArrowLeftRight,
  writtenOff: Siren,
  secondPlate: Copy,
  usTitle: Globe,
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function titleFor(event: VehicleEvent): string {
  switch (event.kind) {
    case "import":
      return `Entered Canada from ${event.from}`
    case "customsEntry":
      return "Cleared customs"
    case "export":
      return "Exported from Canada"
    case "firstRegistration":
      return "First registration"
    case "transfer":
      return "Ownership transferred"
    case "renewal":
      return "Registration renewed"
    case "odometer":
      return `Odometer ${formatOdometer(event.km)}`
  }
}

function detailFor(event: VehicleEvent, flagged: boolean): string {
  switch (event.kind) {
    case "import":
      return `${event.port}, through the ${event.detail.split(" · ")[0]}`
    case "customsEntry":
      return event.port
    case "export":
      return flagged ? `${event.port}, with no re-entry on record` : event.port
    case "firstRegistration":
    case "transfer":
    case "renewal":
      return isDealerChannel(event.office)
        ? `Submitted by ${officeLabel(event.office)}`
        : officeLabel(event.office)
    case "odometer":
      return event.source
  }
}

function Stop({ stop }: { stop: LifecycleStop }) {
  const Icon = STOP_ICON[stop.kind]
  const bad = stop.tone === "bad" || stop.tone === "open"
  return (
    <li className="group/stop relative flex flex-col gap-px pt-8 pr-3">
      {/* The link to the next stop; the last stop has none. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-[11px] right-[-12px] left-3 h-0.5 group-last/stop:hidden",
          stop.brokenAfter
            ? "bg-[repeating-linear-gradient(90deg,var(--color-destructive)_0_5px,transparent_5px_9px)]"
            : "bg-border"
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-0 left-0 z-10 grid size-6 place-items-center rounded-full border-[1.5px] bg-card",
          stop.tone === "major" && "border-foreground text-foreground",
          stop.tone === "minor" && "border-border text-muted-foreground",
          stop.tone === "bad" && "border-destructive bg-destructive text-white",
          stop.tone === "open" && "border-dashed border-destructive text-destructive"
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className={cn("text-[13px] leading-snug font-semibold", bad && "text-destructive")}>
        {stop.title}
      </span>
      {stop.lines.map((line, i) => (
        <span
          key={line}
          className={cn(
            "text-xs leading-snug",
            i === 0 ? "text-muted-foreground" : "text-muted-foreground/70"
          )}
        >
          {line}
        </span>
      ))}
    </li>
  )
}

const ROW = {
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
} as const

/**
 * The vehicle's chronology across Transport Canada, CBSA and the MTO. The strip on top
 * is the life at a glance; the list is every event, newest first, grouped by year.
 * Milestones get an icon tile, renewals and readings are lighter lines, and every
 * entry carries its ledger certificate. The list ends on where the vehicle was built,
 * from the VIN decode, which is not on the ledger.
 */
export function VehicleTimeline({ vehicle }: { vehicle: Vehicle }) {
  const reduceMotion = useReducedMotion()
  const checkedAt = useContext(LedgerCheckedAt)
  const now = useClock()
  const history = sortedHistory(vehicle)
  const certificates = historyCertificates(vehicle)
  const flagged = openExport(vehicle)
  const stops = lifecycleStops(vehicle)

  const rows = history
    .map((event, index) => ({ event, index, hash: certificates[index] }))
    .reverse()
  const years = Array.from(new Set(rows.map((r) => r.event.date.slice(0, 4))))

  return (
    <div className="flex flex-col gap-7">
      <section
        aria-label="Lifecycle"
        className="rounded-xl border bg-card px-5 pt-5 pb-4 shadow-xs"
      >
        <div className="overflow-x-auto">
          <ol className="grid min-w-[34rem] auto-cols-[minmax(6.5rem,1fr)] grid-flow-col">
            {stops.map((stop, i) => (
              <Stop key={`${stop.kind}-${i}`} stop={stop} />
            ))}
          </ol>
        </div>
        <p className="mt-4 flex items-center gap-2 border-t pt-3 text-[13px] text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
          All {history.length} events match their ledger certificates. Last checked{" "}
          {formatRelative(checkedAt ?? now, now)}.
        </p>
      </section>

      <motion.div
        className="flex flex-col gap-1.5"
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
      >
        {years.map((year, y) => (
          <section
            key={year}
            aria-label={year}
            className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-4"
          >
            <h3 className="pt-2.5 text-[13px] font-semibold tabular-nums">{year}</h3>
            <ol className="divide-y border-l">
              {rows
                .filter((r) => r.event.date.startsWith(year))
                .map(({ event, index, hash }) => {
                  const Icon = EVENT_ICON[event.kind]
                  const major = MILESTONES.has(event.kind)
                  const border = isBorderEvent(event)
                  const bad = flagged !== null && event === flagged
                  // A vehicle born on the ledger: its first entry is the registration itself.
                  const opened = index === 0 && event.kind === "firstRegistration"
                  const [, m, d] = event.date.split("-")
                  return (
                    <motion.li
                      key={`${event.kind}-${event.date}-${index}`}
                      variants={ROW}
                      className={cn(
                        "grid grid-cols-[3.25rem_1.75rem_minmax(0,1fr)_auto_1.25rem] items-center gap-x-2.5 py-2 pl-3.5",
                        major ? "min-h-11" : "min-h-9 py-1.5",
                        bad && "bg-destructive/[0.05]"
                      )}
                    >
                      <span className="text-[12.5px] text-muted-foreground tabular-nums">
                        {MONTHS[Number(m) - 1]} {Number(d)}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-7 place-items-center rounded-lg",
                          bad
                            ? "bg-destructive text-white"
                            : border
                              ? "bg-primary/10 text-primary"
                              : major
                                ? "bg-muted text-foreground/80"
                                : "text-muted-foreground/70"
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <span
                          className={cn(
                            major ? "text-sm font-medium" : "text-[13.5px] text-foreground/80",
                            bad && "text-destructive"
                          )}
                        >
                          {titleFor(event)}
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                          {detailFor(event, bad)}
                        </span>
                        {opened ? (
                          <span className="text-xs font-medium text-primary">
                            Ledger opened, first entry for this VIN
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden text-[12.5px] whitespace-nowrap text-muted-foreground/80 sm:inline">
                        {event.agency}
                      </span>
                      <LedgerMark
                        hash={hash}
                        event={titleFor(event)}
                        source={event.agency}
                        recordedAt={event.date}
                      />
                    </motion.li>
                  )
                })}
              {y === years.length - 1 ? (
                <motion.li
                  variants={ROW}
                  className="grid min-h-11 grid-cols-[3.25rem_1.75rem_minmax(0,1fr)_auto_1.25rem] items-center gap-x-2.5 py-2 pl-3.5"
                >
                  <span />
                  <span
                    aria-hidden
                    className="grid size-7 place-items-center rounded-lg border border-dashed text-muted-foreground"
                  >
                    <Factory className="size-3.5" />
                  </span>
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium">Built in {countryOfOrigin(vehicle)}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {vehicle.decoded.plant}, from the VIN decode
                    </span>
                  </span>
                  <span className="hidden text-[12.5px] text-muted-foreground/80 sm:inline">
                    NHTSA
                  </span>
                  <span />
                </motion.li>
              ) : null}
            </ol>
          </section>
        ))}
      </motion.div>
    </div>
  )
}

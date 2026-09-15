import { motion, useReducedMotion } from "motion/react"

import { LedgerMark } from "@/components/LedgerMark"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatOdometer } from "@/lib/format"
import { historyCertificates, isDealerChannel } from "@/lib/ledger"
import { cn } from "@/lib/utils"
import {
  MILESTONES,
  openExport,
  sortedHistory,
  type Vehicle,
  type VehicleEvent,
} from "@/lib/vehicles"

const TIMELINE_TITLE: Record<VehicleEvent["kind"], string> = {
  import: "Entered Canada",
  customsEntry: "Cleared customs",
  export: "Exported",
  firstRegistration: "First registration",
  transfer: "Ownership transferred",
  renewal: "Registration renewed",
  odometer: "Odometer reading",
}

function detailFor(event: VehicleEvent): string {
  switch (event.kind) {
    case "import":
      return `${event.port} · ${event.detail}`
    case "customsEntry":
      return event.port
    case "export":
      return event.port
    case "firstRegistration":
    case "transfer":
    case "renewal":
      return isDealerChannel(event.office) ? event.office : `MTO office ${event.office}`
    case "odometer":
      return `${formatOdometer(event.km)} · ${event.source}`
  }
}

/**
 * The vehicle's chronology across Transport Canada, CBSA and the MTO, every event,
 * newest first. Milestones are weighted heavier than renewals and odometer readings
 * so the record still scans; there is no collapsed view.
 */
export function VehicleTimeline({ vehicle }: { vehicle: Vehicle }) {
  const reduceMotion = useReducedMotion()
  const history = sortedHistory(vehicle)
  const certificates = historyCertificates(vehicle)
  const flagged = openExport(vehicle)
  const rows = history
    .map((event, i) => ({ event, hash: certificates[i], index: i }))
    .reverse()
  const agencies = Array.from(new Set(history.map((e) => e.agency))).filter(
    (a) => a === "Transport Canada" || a === "CBSA" || a === "MTO"
  )

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Vehicle history</span>
          <span className="text-xs font-normal text-muted-foreground">
            {history.length} events · {agencies.join(", ")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-4 py-5">
        <motion.ol
          className="relative flex flex-col gap-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-px before:bg-border"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {rows.map(({ event, hash, index }) => {
            const danger = flagged !== null && event === flagged
            // A vehicle born on the ledger: its first entry is the registration itself.
            const opened = index === 0 && event.kind === "firstRegistration"
            return (
              <motion.li
                key={`${event.kind}-${event.date}-${index}`}
                className="relative flex gap-3 pl-5"
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
                }}
              >
                <span
                  className={cn(
                    "absolute top-1.5 left-0 size-[11px] rounded-full ring-2 ring-card",
                    danger
                      ? "bg-destructive"
                      : MILESTONES.has(event.kind)
                        ? "bg-primary"
                        : "bg-muted-foreground/40"
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        danger && "text-destructive"
                      )}
                    >
                      {TIMELINE_TITLE[event.kind]}
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-4 px-1.5 text-[10px] font-medium text-muted-foreground",
                          danger && "border-destructive/40 text-destructive"
                        )}
                      >
                        {event.agency}
                      </Badge>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <span
                    className={cn("text-xs text-muted-foreground", danger && "text-destructive/80")}
                  >
                    {detailFor(event)}
                    {danger ? " · no re-entry on record" : null}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <LedgerMark hash={hash} />
                    {opened ? (
                      <span className="text-xs text-primary">
                        Ledger opened · first entry for this VIN
                      </span>
                    ) : null}
                  </span>
                </div>
              </motion.li>
            )
          })}
        </motion.ol>
      </CardContent>
    </Card>
  )
}

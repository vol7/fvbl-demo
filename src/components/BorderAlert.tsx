import { PlaneTakeoff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { openExport, type Vehicle } from "@/lib/vehicles"

/**
 * The CBSA and Transport Canada story in one sentence. Shown only when the
 * vehicle's last border event is an export with no re-entry.
 */
export function BorderAlert({ vehicle }: { vehicle: Vehicle }) {
  const exported = openExport(vehicle)
  if (!exported) return null
  return (
    <div
      role="alert"
      className="flex gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <PlaneTakeoff className="size-5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-destructive">
            This vehicle is recorded as having left Canada
          </span>
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            High risk
          </Badge>
        </div>
        <p className="text-sm text-foreground">
          CBSA recorded an export on {formatDate(exported.date)} via {exported.port}, bound for{" "}
          {exported.destination}. Transport Canada has no re-entry on file. A used vehicle
          information package cannot be issued for a vehicle that is not in the country, and this
          flag cannot be overridden.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {["CBSA", "Transport Canada"].map((agency) => (
            <Badge key={agency} variant="outline" className="h-5 text-[11px] text-muted-foreground">
              {agency}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">
            · The MTO record alone would have shown this vehicle as clear.
          </span>
        </div>
      </div>
    </div>
  )
}

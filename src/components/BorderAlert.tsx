import { PlaneTakeoff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { openExport, type Vehicle } from "@/lib/vehicles"

/**
 * The CBSA and Transport Canada story in one sentence. Shown only when the
 * vehicle's last border event is an export with no re-entry.
 *
 * The copy names an identity conflict, not a verdict on the car at the counter.
 * Either the exported vehicle was travelling under this VIN as a clone and the
 * original is still here, or the original left and the one presented is the
 * clone. A clerk cannot tell which, so the package is held, not refused.
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
            A vehicle carrying this VIN has left Canada
          </span>
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            High risk
          </Badge>
        </div>
        <p className="text-sm text-foreground">
          CBSA recorded an export on {formatDate(exported.date)} via {exported.port}. Transport
          Canada has no re-entry on file. One VIN cannot be abroad and at this counter at once:
          either the vehicle presented is not the one on record, or the exported one was carrying
          a cloned identity. The package is held for investigation and this flag cannot be
          overridden at the counter.
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

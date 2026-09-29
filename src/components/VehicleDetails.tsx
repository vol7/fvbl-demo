import { ShieldCheck } from "lucide-react"

import { SecretValue } from "@/components/SecretValue"
import { formatDate, formatOdometer, formatRelative } from "@/lib/format"
import { officeLabel } from "@/lib/ledger"
import { isOwnershipStart, sortedHistory, type Vehicle } from "@/lib/vehicles"
import { useRegion } from "@/regions"

/**
 * The record's facts as a property list for the rail. Owner details stay hidden
 * until the clerk reveals them; the ledger line says how many entries back the record.
 */
export function VehicleDetails({
  vehicle,
  ledgerEvents,
  verifiedAt,
  now,
}: {
  vehicle: Vehicle
  ledgerEvents: number
  verifiedAt: Date
  now: Date
}) {
  const pack = useRegion()
  const registration = sortedHistory(vehicle).filter(isOwnershipStart).at(-1)
  const rows: [string, React.ReactNode][] = [
    ["Owner", <SecretValue value={vehicle.owner.name} label="owner name" width="5.5rem" />],
    [
      "Owner phone",
      <SecretValue value={vehicle.owner.phone} label="owner phone" width="6.5rem" mono />,
    ],
    ["Registered", vehicle.registeredOn ? formatDate(vehicle.registeredOn) : "Not registered"],
    ["Office", registration ? officeLabel(registration.office) : "None"],
    ["Odometer", formatOdometer(vehicle.odometer, pack.odometerUnit)],
    ["Last inspection", vehicle.lastInspection ? formatDate(vehicle.lastInspection) : "None yet"],
    ["Active lien", vehicle.records.lien ? vehicle.records.lien.holder : "None"],
  ]
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="details-heading" className="flex flex-col gap-2.5">
        <h2
          id="details-heading"
          className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
        >
          Details
        </h2>
        <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground/80">
          FVBL logs each reveal against your badge.
        </p>
      </section>
      <div className="flex gap-2.5 border-t pt-4 text-[13px]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="flex flex-col">
          <span className="font-medium">Blockchain certified</span>
          <span className="text-muted-foreground">{ledgerEvents} events, all unchanged</span>
          <span className="text-muted-foreground">Checked {formatRelative(verifiedAt, now)}</span>
        </div>
      </div>
    </div>
  )
}

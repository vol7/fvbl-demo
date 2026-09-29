import { Check, Copy } from "lucide-react"
import { useState } from "react"

import { DecisionCard } from "@/components/DecisionCard"
import { Plate } from "@/components/Plate"
import type { ApplicantDetails } from "@/components/RequestDialog"
import { Button } from "@/components/ui/button"
import type { AuthorizationState } from "@/lib/authorization"
import type { Check as RecordCheck } from "@/lib/checks"
import { plateLabel } from "@/lib/format"
import { vehicleTitle, type Vehicle } from "@/lib/vehicles"

export type VehicleTab = "checks" | "history" | "ownership"

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

/**
 * The top of the vehicle page: who the vehicle is, then the decision card. Identity
 * only here; the facts live in the details rail and the detail in the tabs.
 */
export function VehicleSummary({
  vehicle,
  checks,
  state,
  onRequest,
  onIssue,
  onEscalate,
}: {
  vehicle: Vehicle
  checks: RecordCheck[]
  state: AuthorizationState
  onRequest: (applicant: ApplicantDetails) => void
  onIssue: () => void
  onEscalate: () => void
}) {
  const title = vehicleTitle(vehicle)
  const trimAt = title.lastIndexOf(vehicle.trim)
  return (
    <div className="flex flex-col gap-9">
      {/* The plate row introduces the vehicle; the title and its meta line read as one unit. */}
      <header className="flex flex-col gap-1">
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          {vehicle.plate ? (
            <Plate plate={vehicle.plate} />
          ) : (
            <span className="text-sm font-medium">{plateLabel(vehicle.plate)}</span>
          )}
          {vehicle.riskTier === "high-value" ? (
            <span className="text-[13px] text-muted-foreground">
              High-value model, owner authorization required
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
          {trimAt > 0 ? (
            <>
              {title.slice(0, trimAt).trimEnd()}{" "}
              <span className="font-medium text-muted-foreground">{vehicle.trim}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            {vehicle.colour} {vehicle.bodyStyle}
          </span>
          <span className="flex items-center gap-1">
            VIN <span className="font-mono tracking-wider text-foreground/80">{vehicle.vin}</span>
            <CopyVin vin={vehicle.vin} />
          </span>
        </div>
      </header>
      <DecisionCard
        vehicle={vehicle}
        checks={checks}
        state={state}
        onRequest={onRequest}
        onIssue={onIssue}
        onEscalate={onEscalate}
      />
    </div>
  )
}

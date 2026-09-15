import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, maskName, plateLabel } from "@/lib/format"
import { isDealerChannel } from "@/lib/ledger"
import { sortedHistory, type Vehicle } from "@/lib/vehicles"

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono tracking-wider" : "text-right"}>{value}</dd>
    </div>
  )
}

export function OwnershipCard({ vehicle }: { vehicle: Vehicle }) {
  const first = sortedHistory(vehicle)[0]
  const bornHere = first?.kind === "firstRegistration" && isDealerChannel(first.office)
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Ownership and registration</CardTitle>
      </CardHeader>
      <CardContent className="gap-0 py-3">
        <dl className="divide-y">
          <Row label="Registered owner" value={maskName(vehicle.owner.name)} />
          <Row label="Owner address" value={vehicle.owner.city} />
          <Row label="Phone on file" value={`••• ••• ${vehicle.owner.phoneLast4}`} mono />
          <Row label="Plate" value={plateLabel(vehicle.plate)} mono />
          <Row
            label="Registration date"
            value={vehicle.registeredOn ? formatDate(vehicle.registeredOn) : "Not registered"}
          />
          <Row label="Registration class" value="Passenger · PSGR" />
          {bornHere ? <Row label="Registered via" value="Dealer submission (NVIS)" /> : null}
          <Row label="Previous owners" value={bornHere ? "None · first owner" : "1 (dealer)"} />
        </dl>
      </CardContent>
    </Card>
  )
}

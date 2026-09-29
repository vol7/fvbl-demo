import { OutcomeBadge } from "@/components/OutcomeBadge"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AuthorizationState } from "@/lib/authorization"
import { formatTime, plateLabel } from "@/lib/format"
import type { RequestRow } from "@/lib/seed"
import { useSession } from "@/lib/session"
import { findVehicle, vehicleTitle } from "@/lib/vehicles"
import { useRegion } from "@/regions"
import type { RegionPack } from "@/regions/types"

function liveRow(pack: RegionPack, vin: string, auth: AuthorizationState): RequestRow | null {
  const vehicle = findVehicle(pack, vin)
  if (!vehicle) return null
  const copy = pack.copy.portal.requests
  const online = (name: string, origin: string) => (origin === "buyer" ? copy.online(name) : name)
  switch (auth.status) {
    case "pending":
      return {
        reference: "—",
        vehicle: vehicleTitle(vehicle),
        plate: vehicle.plate,
        applicant: online(auth.requester, auth.origin),
        status: copy.status.pending,
        when: `Today, ${formatTime(auth.sentAt)}`,
      }
    case "authorized":
      return {
        reference: auth.authorizationCode,
        vehicle: vehicleTitle(vehicle),
        plate: vehicle.plate,
        applicant: auth.origin === "owner" ? copy.preapproval : online(auth.requester, auth.origin),
        status: auth.issued ? copy.status.issued : copy.status.authorized,
        when: `Today, ${formatTime(auth.approvedAt)}`,
      }
    case "frozen":
      return {
        reference: "—",
        vehicle: vehicleTitle(vehicle),
        plate: vehicle.plate,
        applicant: online(auth.requester, auth.origin),
        status: auth.reason === "timeout" ? copy.status.expired : copy.status.frozen,
        when: `Today, ${formatTime(auth.frozenAt)}`,
      }
    default:
      return null
  }
}

export function Requests() {
  const pack = useRegion()
  const [session] = useSession()
  const live = Object.entries(session.authorizations).flatMap(([vin, auth]) => {
    const row = liveRow(pack, vin, auth)
    return row ? [row] : []
  })
  const rows = [...live, ...pack.seed.requestRows]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={pack.copy.portal.requests.title}
        description={pack.copy.portal.requests.description}
      />
      <Card className="gap-0 py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Reference</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={`${row.plate}-${i}`}
                  className={i < live.length ? "bg-primary/[0.03]" : undefined}
                >
                  <TableCell className="pl-6 font-mono text-xs tracking-wider">
                    {row.reference}
                  </TableCell>
                  <TableCell className="font-medium">{row.vehicle}</TableCell>
                  <TableCell className="font-mono tracking-wider">
                    {plateLabel(pack.plate, row.plate)}
                  </TableCell>
                  <TableCell>{row.applicant}</TableCell>
                  <TableCell>
                    <OutcomeBadge label={row.status} />
                  </TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground">
                    {row.when}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

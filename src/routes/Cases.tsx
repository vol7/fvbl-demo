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
import { formatTime, plateLabel } from "@/lib/format"
import { CASE_ROWS, type CaseRow } from "@/lib/seed"
import { useSession } from "@/lib/session"
import { findVehicle, vehicleTitle } from "@/lib/vehicles"

export function Cases() {
  const [session] = useSession()
  const live: CaseRow[] = Object.entries(session.authorizations).flatMap(([vin, auth]) => {
    const vehicle = findVehicle(vin)
    if (auth.status !== "escalated" || !vehicle) return []
    return [
      {
        reference: auth.caseReference,
        vehicle: vehicleTitle(vehicle),
        plate: plateLabel(vehicle.plate),
        reason: "Duplicate identity · insurer write-off",
        routedTo: "OPP Auto Theft Unit",
        status: "Open" as const,
        when: `Today, ${formatTime(auth.escalatedAt)}`,
      },
    ]
  })
  const rows = [...live, ...CASE_ROWS]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cases"
        description="Transactions escalated to law enforcement from this office."
      />
      <Card className="gap-0 py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Case</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Routed to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={row.reference}
                  className={i < live.length ? "bg-primary/[0.03]" : undefined}
                >
                  <TableCell className="pl-6 font-mono text-xs tracking-wider">
                    {row.reference}
                  </TableCell>
                  <TableCell className="font-medium">{row.vehicle}</TableCell>
                  <TableCell className="font-mono tracking-wider">{row.plate}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{row.routedTo}</TableCell>
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

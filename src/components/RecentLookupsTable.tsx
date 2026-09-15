import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"

import { OutcomeBadge } from "@/components/OutcomeBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OUTCOME_LABEL, recentRows } from "@/lib/seed"
import { paths } from "@/lib/paths"
import { useSession } from "@/lib/session"

export function RecentLookupsTable({
  limit,
  compact = false,
}: {
  limit?: number
  compact?: boolean
}) {
  const navigate = useNavigate()
  const [session] = useSession()
  const rows = recentRows(session).slice(0, limit)
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6">Plate</TableHead>
          <TableHead>Vehicle</TableHead>
          {compact ? null : <TableHead>VIN</TableHead>}
          <TableHead>Outcome</TableHead>
          <TableHead className="text-right">Looked up</TableHead>
          <TableHead className="w-10 pr-6" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.vin}
            className={row.live ? "cursor-pointer" : "cursor-default text-muted-foreground"}
            onClick={row.live ? () => navigate(paths.portal.vehicle(row.vin)) : undefined}
          >
            <TableCell className="pl-6 font-mono tracking-wider">{row.plate}</TableCell>
            <TableCell className={row.live ? "font-medium" : undefined}>{row.vehicle}</TableCell>
            {compact ? null : (
              <TableCell className="font-mono text-xs tracking-wider">
                {row.live ? (
                  <button
                    type="button"
                    className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => navigate(paths.portal.vehicle(row.vin))}
                  >
                    {row.vin}
                  </button>
                ) : (
                  row.vin
                )}
              </TableCell>
            )}
            <TableCell>
              <OutcomeBadge label={OUTCOME_LABEL[row.outcome]} />
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{row.when}</TableCell>
            <TableCell className="pr-6 text-right">
              {row.live ? (
                <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

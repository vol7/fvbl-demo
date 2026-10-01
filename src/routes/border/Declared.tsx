import { ChevronRight } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { BorderDemoControls } from "@/components/border/BorderDemoControls"
import { OutcomeBadge } from "@/components/OutcomeBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { declaredViews, formatContainer, statusLabel } from "@/lib/border"
import { loadingCutoff } from "@/lib/exports"
import { formatDateTime } from "@/lib/format"
import { useSession } from "@/lib/session"
import { useRegionPaths } from "@/regions/context"
import { useRegion } from "@/regions"
import { NotFound } from "@/routes/NotFound"

/**
 * The officer's landing: every vehicle declared for export, the ones that don't
 * clear first. One click opens the card for that vehicle.
 */
export function Declared() {
  const pack = useRegion()
  const paths = useRegionPaths()
  const navigate = useNavigate()
  const [session] = useSession()
  const border = pack.border
  if (!border) return <NotFound />
  const { copy, vessel } = border
  const views = declaredViews(border, session)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.list.title}</h1>
        <p className="text-sm text-muted-foreground">
          {copy.list.vessel(vessel.name, vessel.to, formatDateTime(loadingCutoff(new Date())))}
        </p>
        <p className="mt-1 max-w-[80ch] text-sm text-foreground/80">{copy.list.lede}</p>
      </header>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">{copy.list.columns.vehicle}</TableHead>
              <TableHead>{copy.list.columns.container}</TableHead>
              <TableHead>{copy.list.columns.exporter}</TableHead>
              <TableHead>{copy.list.columns.status}</TableHead>
              <TableHead className="w-10 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view) => {
              const { vehicle } = view
              const to = paths.border.vehicle(vehicle.vin)
              return (
                <TableRow key={vehicle.vin} className="cursor-pointer" onClick={() => navigate(to)}>
                  <TableCell className="py-3 pl-5">
                    <Link
                      to={to}
                      className="block rounded-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Link>
                    <span className="font-mono text-xs tracking-wider text-muted-foreground">
                      {vehicle.vin}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="block font-mono text-[13px] tracking-wider">
                      {formatContainer(vehicle.container)}
                    </span>
                    <span className="text-xs text-muted-foreground">{vehicle.position}</span>
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground">
                    {vehicle.declared.exporter}
                  </TableCell>
                  <TableCell className="py-3">
                    <OutcomeBadge label={statusLabel(copy, view)} />
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {copy.list.reason[view.reason]}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-muted-foreground">
                    <ChevronRight className="size-4" aria-hidden />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {views.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">{copy.list.empty}</p>
        ) : null}
      </div>

      <BorderDemoControls />
    </div>
  )
}

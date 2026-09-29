import { Outlet, useLocation, useMatches } from "react-router"

import { Sidebar } from "@/components/shell/Sidebar"
import { TopBar, type Crumb } from "@/components/shell/TopBar"
import { isActive, navItems } from "@/lib/nav"
import { registrationState, useSession } from "@/lib/session"
import { bornVehicle, findVehicle } from "@/lib/vehicles"
import { useRegionPaths } from "@/regions/context"
import { useRegion } from "@/regions"

function useCrumbs(): Crumb[] {
  const pack = useRegion()
  const { pathname } = useLocation()
  const matches = useMatches()
  const [session] = useSession()
  const paths = useRegionPaths()
  const nav = navItems(paths, pack.copy.portal.requests.title).find((item) =>
    isActive(item, pathname)
  )
  const crumbs: Crumb[] = nav ? [{ label: nav.label, to: nav.to }] : []
  const vehicleMatch = matches.find((m) => m.params.vin)
  if (vehicleMatch?.params.vin) {
    const found = findVehicle(pack, vehicleMatch.params.vin)
    const vehicle = found
      ? bornVehicle(pack, found, registrationState(session, found.vin))
      : undefined
    crumbs.push({
      label: !vehicle
        ? "Not found"
        : vehicle.plate
          ? `Plate ${vehicle.plate}`
          : vehicle.history.length > 0
            ? "Not yet plated"
            : "Unregistered VIN",
    })
  }
  return crumbs
}

export function PortalShell() {
  const crumbs = useCrumbs()
  return (
    // Inset frame: the sidebar sits on the canvas and the page is the one raised surface.
    <div className="flex h-svh overflow-hidden bg-muted/70">
      <Sidebar />
      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-foreground/[0.06]">
        <TopBar crumbs={crumbs} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

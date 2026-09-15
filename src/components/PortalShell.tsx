import { Outlet, useLocation, useMatches } from "react-router"

import { Sidebar } from "@/components/shell/Sidebar"
import { TopBar, type Crumb } from "@/components/shell/TopBar"
import { NAV_ITEMS, isActive } from "@/lib/nav"
import { findVehicle } from "@/lib/vehicles"

function useCrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const matches = useMatches()
  const nav = NAV_ITEMS.find((item) => isActive(item, pathname))
  const crumbs: Crumb[] = nav ? [{ label: nav.label, to: nav.to }] : []
  const vehicleMatch = matches.find((m) => m.params.vin)
  if (vehicleMatch?.params.vin) {
    const vehicle = findVehicle(vehicleMatch.params.vin)
    crumbs.push({
      label: vehicle
        ? vehicle.plate
          ? `Plate ${vehicle.plate}`
          : "Unregistered VIN"
        : "Not found",
    })
  }
  return crumbs
}

export function PortalShell() {
  const crumbs = useCrumbs()
  return (
    <div className="flex h-svh overflow-hidden bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
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

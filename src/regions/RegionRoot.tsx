import { Outlet, useParams } from "react-router"

import { NotFound } from "@/routes/NotFound"

import { RegionContext, useRegionId } from "./context"
import { isRegionId, type RegionId } from "./types"

/** Route element for `/:region`: provides the region, or a 404 for anything else. */
export function RegionRoot() {
  const { region } = useParams()
  if (!isRegionId(region)) return <NotFound />
  return (
    <RegionContext.Provider value={region}>
      <Outlet />
    </RegionContext.Provider>
  )
}

export function RegionProvider({
  region,
  children,
}: {
  region: RegionId
  children: React.ReactNode
}) {
  return <RegionContext.Provider value={region}>{children}</RegionContext.Provider>
}

/** For surfaces that exist in one region only, such as the UVIP pages behind ServiceOntario. */
export function OnlyIn({ region, children }: { region: RegionId; children: React.ReactNode }) {
  return useRegionId() === region ? children : <NotFound />
}

import { createContext, useContext } from "react"

import { regionPaths, type RegionPaths } from "@/lib/paths"

import type { RegionId } from "./types"

/**
 * The region the current route belongs to. Defaults to Canada outside a region
 * route, so components render in tests without a provider.
 */
export const RegionContext = createContext<RegionId>("ca")

export function useRegionId(): RegionId {
  return useContext(RegionContext)
}

export function useRegionPaths(): RegionPaths {
  return regionPaths(useRegionId())
}

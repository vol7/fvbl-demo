import { useContext } from "react"

import { ca } from "./ca"
import { RegionContext } from "./context"
import type { RegionId, RegionPack } from "./types"
import { us } from "./us"

export const PACKS: Record<RegionId, RegionPack> = { ca, us }

/** The pack of the region the current route belongs to. */
export function useRegion(): RegionPack {
  return PACKS[useContext(RegionContext)]
}

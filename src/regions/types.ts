/** Which country's demo a surface plays: the first segment of every route. */
export type RegionId = "ca" | "us"

export const REGION_IDS: readonly RegionId[] = ["ca", "us"]

export function isRegionId(value: string | undefined): value is RegionId {
  return REGION_IDS.includes(value as RegionId)
}

import { ca } from "@/regions/ca"
import type { RegionPack } from "@/regions/types"

/**
 * TODO(US plan, Tasks 4–11): a stand-in so `/us` renders. It plays Canada's data
 * and copy until the Ohio pack replaces each field.
 */
export const us: RegionPack = { ...ca, id: "us" }

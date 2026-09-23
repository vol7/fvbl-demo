import { createContext } from "react"

/**
 * When the ledger last verified this record. The vehicle page provides it so every
 * certificate popover on the page says the same "last checked" time.
 */
export const LedgerCheckedAt = createContext<Date | null>(null)

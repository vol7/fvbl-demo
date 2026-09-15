import { ShieldCheck } from "lucide-react"

import { shortHash } from "@/lib/ledger"
import { cn } from "@/lib/utils"

/**
 * "Blockchain certified" plus the short certificate. One label for every entry;
 * whether the underlying record is public or private is a ledger-page detail.
 */
export function LedgerMark({ hash, className }: { hash: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground/80", className)}
      title={hash}
    >
      <ShieldCheck className="size-3 shrink-0 text-primary/70" aria-hidden />
      <span>Blockchain certified</span>
      <span className="font-mono tracking-wide">{shortHash(hash)}</span>
    </span>
  )
}

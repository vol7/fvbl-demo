import { Check, CircleCheck, Copy, ShieldCheck } from "lucide-react"
import { useContext, useState } from "react"

import { LedgerCheckedAt } from "@/components/ledgerClock"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClock } from "@/hooks/useClock"
import { formatDate, formatRelative, formatTime } from "@/lib/format"
import { shortHash } from "@/lib/ledger"
import { cn } from "@/lib/utils"

type Props = {
  hash: string
  /** What was certified: "First registration", "Owner approved". */
  event: string
  /** Who recorded it: "MTO", "CBSA", "FVBL". */
  source: string
  /** ISO date or timestamp of the entry. */
  recordedAt: string
  /** Text beside the shield. Without it the mark is the shield alone. */
  label?: string
  className?: string
}

function recorded(iso: string): string {
  return iso.length <= 10
    ? formatDate(iso)
    : `${formatDate(iso.slice(0, 10))} at ${formatTime(iso)}`
}

/**
 * The "Blockchain certified" mark. Clicking it opens the certificate: what was
 * recorded, by whom and when, and that the record still matches it.
 */
export function LedgerMark({ hash, event, source, recordedAt, label, className }: Props) {
  const checkedAt = useContext(LedgerCheckedAt)
  const now = useClock()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard?.writeText(hash)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label ? undefined : `Blockchain certificate for ${event}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-md text-primary outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-primary/10",
          label ? "-mx-1 px-1 py-px text-xs text-muted-foreground" : "-m-0.5 p-0.5",
          className
        )}
      >
        <ShieldCheck
          className={cn("shrink-0 text-primary", label ? "size-3" : "size-3.5")}
          aria-hidden
        />
        {label ? <span>{label}</span> : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 rounded-xl p-4">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          Blockchain certified
        </div>
        <p className="mt-0.5 text-muted-foreground">{event}</p>
        <dl className="mt-3 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5">
          <dt className="text-muted-foreground">Source</dt>
          <dd>{source}</dd>
          <dt className="text-muted-foreground">Recorded</dt>
          <dd>{recorded(recordedAt)}</dd>
          <dt className="text-muted-foreground">Certificate</dt>
          <dd className="flex items-center gap-1">
            <span className="font-mono text-xs tracking-wide" title={hash}>
              {shortHash(hash)}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Certificate copied" : "Copy certificate"}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
            </button>
          </dd>
          <dt className="text-muted-foreground">Ledger</dt>
          <dd>FVBL Ontario</dd>
        </dl>
        <p className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-2 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          Matches the record. No changes since it was recorded.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last checked against the ledger {formatRelative(checkedAt ?? now, now)}
        </p>
      </PopoverContent>
    </Popover>
  )
}

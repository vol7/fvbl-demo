import { Check, CircleAlert, CircleX, type LucideIcon } from "lucide-react"

import { failingChecks, INTEGRATIONS, type Check as RecordCheck } from "@/lib/checks"
import { cn } from "@/lib/utils"

type Tone = "high" | "low" | "pass"

/**
 * Each group speaks in its own colour: high risk in reds, low risk in ambers. The
 * result carries the full colour and the rest of the row a darker shade of it, so
 * a row reads as one unit and the result still leads. The reds mix into the theme's
 * text tokens, so they hold in dark mode too.
 */
const TONE: Record<
  Tone,
  {
    icon: LucideIcon
    iconClass: string
    row?: string
    list?: string
    heading: string
    text: string
    result?: string
    muted: string
  }
> = {
  high: {
    icon: CircleX,
    iconClass: "text-destructive",
    row: "bg-destructive/[0.04] py-3.5",
    list: "divide-destructive/15 border-destructive/25",
    heading: "text-destructive",
    text: "text-[color-mix(in_oklch,var(--color-destructive)_40%,var(--color-foreground))]",
    result: "text-destructive",
    muted: "text-[color-mix(in_oklch,var(--color-destructive)_45%,var(--color-muted-foreground))]",
  },
  low: {
    icon: CircleAlert,
    iconClass: "text-amber-600 dark:text-amber-400",
    row: "bg-amber-500/[0.06] py-3.5",
    list: "divide-amber-700/20 border-amber-700/35",
    heading: "text-amber-700 dark:text-amber-400",
    text: "text-amber-950/80 dark:text-amber-100/80",
    result: "text-amber-700 dark:text-amber-400",
    muted: "text-amber-900/60 dark:text-amber-200/60",
  },
  pass: {
    icon: Check,
    iconClass: "text-emerald-600",
    heading: "text-muted-foreground",
    text: "text-foreground/80",
    muted: "text-muted-foreground/80",
  },
}

/**
 * The sources that answered, then the nine checks in three groups: high risk, low
 * risk, passed. The pills only say that a source answered; what it found is in the rows.
 */
export function RecordChecks({ checks }: { checks: RecordCheck[] }) {
  const failing = failingChecks(checks)
  const high = failing.filter((c) => c.severity === "high")
  const low = failing.filter((c) => c.severity === "low")
  const passing = checks.filter((c) => c.status === "pass")

  const row = (tone: Tone) => (check: RecordCheck) => {
    const t = TONE[tone]
    const Icon = t.icon
    return (
      <li
        key={check.id}
        className={cn(
          "grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1 px-4 py-3 sm:grid-cols-[18px_minmax(8rem,11rem)_minmax(0,1fr)_9.5rem]",
          t.row
        )}
      >
        <Icon
          className={cn("mt-0.5 size-4", t.iconClass)}
          strokeWidth={tone === "pass" ? 2.25 : 2}
          aria-hidden
        />
        <span className={cn("text-sm", t.text)}>{check.label}</span>
        <div className="col-start-2 flex flex-col sm:col-start-auto">
          <span className={cn("text-sm font-semibold", t.result)}>{check.result}</span>
          {check.detail ? (
            <span className={cn("text-[13px]", tone === "pass" ? "text-muted-foreground" : t.text)}>
              {check.detail}
            </span>
          ) : null}
        </div>
        <span
          title={check.source}
          className={cn("col-start-2 text-[12.5px] sm:col-start-auto sm:text-right", t.muted)}
        >
          {check.agencies.join(", ")}
        </span>
      </li>
    )
  }

  const group = (label: string, items: RecordCheck[], tone: Tone) => (
    <section aria-label={label} className="flex flex-col gap-2">
      <h3
        className={cn(
          "text-[11.5px] font-semibold tracking-[0.07em] uppercase",
          TONE[tone].heading
        )}
      >
        {label}
      </h3>
      <ul className={cn("divide-y overflow-hidden rounded-xl border bg-card", TONE[tone].list)}>
        {items.map(row(tone))}
      </ul>
    </section>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-foreground">
          All {INTEGRATIONS.length} sources answered
        </p>
        <ul aria-label="Sources" className="flex flex-wrap gap-1.5">
          {INTEGRATIONS.map((source) => (
            <li
              key={source.name}
              title={source.detail}
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-1.5 text-[12.5px] text-foreground/80"
            >
              <Check className="size-3 text-muted-foreground" strokeWidth={2.5} aria-hidden />
              {source.name}
            </li>
          ))}
        </ul>
      </div>
      {high.length > 0 ? group("High risk", high, "high") : null}
      {low.length > 0 ? group("Low risk", low, "low") : null}
      {group("Passed", passing, "pass")}
    </div>
  )
}

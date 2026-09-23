import { Check, CircleX } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect } from "react"

import { failingChecks, INTEGRATIONS, type Check as RecordCheck } from "@/lib/checks"
import { cn } from "@/lib/utils"

/** When each source answers, in seconds after the record opens, in INTEGRATIONS order. */
const ANSWERED_AT = [0.3, 0.45, 0.55, 0.8, 0.95, 1.15, 1.3, 1.55, 1.8]
/** The last source has answered; the rows start coming in. */
export const SOURCES_DONE_S = 1.95
export const CHECK_STAGGER_S = 0.08

const fade = (delay: number) => ({ duration: 0.18, ease: "easeOut" as const, delay })

/**
 * Every source answering, then the nine checks. The pills only say that a source
 * answered; what it found is in the rows. `boot` plays the sequence, which happens
 * once per record: coming back to the tab shows the settled list.
 */
export function RecordChecks({
  checks,
  boot = true,
  onSettled,
}: {
  checks: RecordCheck[]
  boot?: boolean
  onSettled?: () => void
}) {
  const reduceMotion = useReducedMotion()
  const play = boot && !reduceMotion
  const failing = failingChecks(checks)
  const passing = checks.filter((c) => c.status === "pass")

  // Without the sequence there is nothing to wait for.
  useEffect(() => {
    if (!play) onSettled?.()
    // Settles once per mount; the callback identity does not matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play])

  let index = 0
  const row = (check: RecordCheck) => {
    const i = index++
    const pass = check.status === "pass"
    return (
      <motion.li
        key={check.id}
        initial={play ? { opacity: 0, y: 5 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
          delay: SOURCES_DONE_S + i * CHECK_STAGGER_S,
        }}
        className={cn(
          "grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1 px-4 py-3 sm:grid-cols-[18px_minmax(8rem,11rem)_minmax(0,1fr)_9.5rem]",
          !pass && "bg-destructive/[0.04] py-3.5"
        )}
      >
        {pass ? (
          <Check className="mt-0.5 size-4 text-emerald-600" strokeWidth={2.25} aria-hidden />
        ) : (
          <CircleX className="mt-0.5 size-4 text-destructive" aria-hidden />
        )}
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm text-foreground/80">{check.label}</span>
          {pass ? null : (
            <span
              className={cn(
                "rounded px-1.5 text-[11.5px] leading-[18px] font-semibold",
                check.severity === "high"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              )}
            >
              {check.severity === "high" ? "High risk" : "Low risk"}
            </span>
          )}
        </div>
        <div className="col-start-2 flex flex-col sm:col-start-auto">
          <span className={cn("text-sm font-semibold", !pass && "text-destructive")}>
            {check.result}
          </span>
          {check.detail ? (
            <span
              className={cn("text-[13px]", pass ? "text-muted-foreground" : "text-foreground/80")}
            >
              {check.detail}
            </span>
          ) : null}
        </div>
        <span
          title={check.source}
          className="col-start-2 text-[12.5px] text-muted-foreground/80 sm:col-start-auto sm:text-right"
        >
          {check.agencies.join(", ")}
        </span>
      </motion.li>
    )
  }

  const group = (label: string, items: RecordCheck[], danger = false) => (
    <section aria-label={label} className="flex flex-col gap-2">
      <motion.h3
        initial={play ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={fade(SOURCES_DONE_S + index * CHECK_STAGGER_S)}
        className={cn(
          "text-[11.5px] font-semibold tracking-[0.07em] uppercase",
          danger ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {label}
      </motion.h3>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
        {items.map(row)}
      </ul>
    </section>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="grid text-[13px] text-muted-foreground" aria-live="polite">
          <motion.span
            className="[grid-area:1/1]"
            initial={{ opacity: play ? 1 : 0 }}
            animate={{ opacity: 0 }}
            transition={fade(play ? SOURCES_DONE_S : 0)}
            aria-hidden={!play}
          >
            Querying {INTEGRATIONS.length} sources…
          </motion.span>
          <motion.span
            className="font-medium text-foreground [grid-area:1/1]"
            initial={play ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={fade(SOURCES_DONE_S)}
            // Settled when the caption lands, on the same clock as the pills: a stalled
            // frame never shows the verdict before the sources have visibly answered.
            onAnimationComplete={play ? onSettled : undefined}
          >
            All {INTEGRATIONS.length} sources answered in 1.8 s
          </motion.span>
        </p>
        <ul aria-label="Sources" className="flex flex-wrap gap-1.5">
          {INTEGRATIONS.map((source, i) => (
            <li
              key={source.name}
              title={source.detail}
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-1.5 text-[12.5px] text-foreground/80"
            >
              <span className="grid size-3.5 place-items-center" aria-hidden>
                {play ? (
                  <motion.span
                    className="size-[11px] rounded-full border-[1.5px] border-muted-foreground/30 border-t-muted-foreground [grid-area:1/1]"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0, rotate: 360 * 3 }}
                    transition={{
                      opacity: fade(ANSWERED_AT[i] ?? 0),
                      rotate: { duration: 2, ease: "linear" },
                    }}
                  />
                ) : null}
                <motion.span
                  className="grid [grid-area:1/1]"
                  initial={play ? { opacity: 0, scale: 0.6 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={fade(ANSWERED_AT[i] ?? 0)}
                >
                  <Check className="size-3 text-muted-foreground" strokeWidth={2.5} />
                </motion.span>
              </span>
              {source.name}
            </li>
          ))}
        </ul>
      </div>
      {failing.length > 0 ? group("Flagged", failing, true) : null}
      {group("Passed", passing)}
    </div>
  )
}

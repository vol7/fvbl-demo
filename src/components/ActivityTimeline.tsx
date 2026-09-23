import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { LedgerMark } from "@/components/LedgerMark"
import type { ActivityEvent } from "@/lib/activity"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const DOT: Record<ActivityEvent["tone"], string> = {
  neutral: "bg-muted-foreground/50",
  info: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
}

/** The session's events on this record, oldest first. On-chain events carry a certificate. */
export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  const reduceMotion = useReducedMotion()
  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-3">
      <h2
        id="activity-heading"
        className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
      >
        Activity
      </h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity on this record yet.</p>
      ) : (
        <ol className="flex flex-col gap-3.5">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.li
                key={event.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid grid-cols-[0.625rem_minmax(0,1fr)_auto] items-baseline gap-x-2.5 text-[13px]"
              >
                <span
                  className={cn("size-[7px] -translate-y-px rounded-full", DOT[event.tone])}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span>{event.title}</span>
                  {event.detail ? (
                    <span className="text-xs text-muted-foreground">{event.detail}</span>
                  ) : null}
                  {event.certificate ? (
                    <span>
                      <LedgerMark
                        hash={event.certificate}
                        event={event.title}
                        source="FVBL"
                        recordedAt={event.at}
                        label="Blockchain certified"
                      />
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground/80 tabular-nums">
                  {formatTime(event.at)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  )
}

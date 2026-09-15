import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { LedgerMark } from "@/components/LedgerMark"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  const reduceMotion = useReducedMotion()
  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="border-b py-3.5">
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity on this record yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-px before:bg-border">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.li
                  key={event.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative flex gap-3 pl-5"
                >
                  <span
                    className={cn(
                      "absolute top-1.5 left-0 size-[11px] rounded-full ring-2 ring-card",
                      DOT[event.tone]
                    )}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatTime(event.at)}
                      </span>
                    </div>
                    {event.detail ? (
                      <span className="text-xs text-muted-foreground">{event.detail}</span>
                    ) : null}
                    {event.certificate ? (
                      <LedgerMark hash={event.certificate} className="mt-0.5" />
                    ) : null}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

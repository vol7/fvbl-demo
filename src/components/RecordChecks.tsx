import { CircleCheck, CircleX } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { failingChecks, highRiskChecks, type Check } from "@/lib/checks"
import { cn } from "@/lib/utils"

export const CHECK_STAGGER_S = 0.08
export const CHECKS_SETTLE_MS = 700

export function RecordChecks({ checks, onSettled }: { checks: Check[]; onSettled?: () => void }) {
  const reduceMotion = useReducedMotion()
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  const failed = failing.length > 0
  const summary = failed
    ? `${failing.length} of ${checks.length} checks failed · ${high.length > 0 ? "high" : "low"} risk`
    : `${checks.length} of ${checks.length} checks passed`
  const asOf = new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" })

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Record checks</span>
          <span className="text-xs font-normal text-muted-foreground">
            {checks.length} checks · as of {asOf}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-0 px-0 pb-0">
        <motion.div
          role="status"
          className={cn(
            "flex items-center gap-2.5 border-b px-6 py-3 text-sm font-medium",
            failed ? "bg-destructive/5 text-destructive" : "bg-emerald-50 text-emerald-700"
          )}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : CHECKS_SETTLE_MS / 1000, duration: 0.25 }}
          onAnimationComplete={onSettled}
        >
          {failed ? (
            <CircleX className="size-4" aria-hidden />
          ) : (
            <CircleCheck className="size-4" aria-hidden />
          )}
          {summary}
        </motion.div>
        <motion.ul
          className="flex flex-col divide-y"
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: CHECK_STAGGER_S } } }}
        >
          {checks.map((check) => {
            const pass = check.status === "pass"
            const highRisk = !pass && check.severity === "high"
            return (
              <motion.li
                key={check.id}
                className="flex items-start gap-3 px-6 py-3.5"
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
                }}
              >
                {pass ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{check.label}</span>
                    <span className="flex items-center gap-1.5">
                      {pass ? null : (
                        <Badge
                          variant="outline"
                          className={cn(
                            highRisk
                              ? "border-destructive/40 text-destructive"
                              : "border-amber-500/50 text-amber-700"
                          )}
                        >
                          {highRisk ? "High risk" : "Low risk"}
                        </Badge>
                      )}
                      <Badge variant={pass ? "secondary" : "destructive"}>
                        {pass ? "Pass" : "Fail"}
                      </Badge>
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{check.detail}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    {check.agencies.map((agency) => (
                      <Badge
                        key={agency}
                        variant="outline"
                        title={check.source}
                        className="h-4 px-1.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {agency}
                      </Badge>
                    ))}
                    {highRisk ? (
                      <span className="text-xs text-destructive/80">Cannot be overridden</span>
                    ) : null}
                  </span>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </CardContent>
    </Card>
  )
}

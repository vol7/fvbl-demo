import { ChevronRight } from "lucide-react"
import { Link } from "react-router"

import { Countdown } from "@/components/Countdown"
import { LookupForm } from "@/components/LookupForm"
import { Plate } from "@/components/Plate"
import { formatTime } from "@/lib/format"
import { OFFICE } from "@/lib/office"
import { OUTCOME_LABEL, recentRows, TODAY_STATS, type Outcome } from "@/lib/seed"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { findVehicle, vehicleTitle } from "@/lib/vehicles"
import { useRegionPaths } from "@/regions/context"

const OUTCOME_DOT: Record<Outcome, string> = {
  clear: "bg-emerald-500",
  blocked: "bg-destructive",
  pending: "bg-primary",
  frozen: "bg-amber-500",
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function SectionTitle({
  id,
  children,
  action,
}: {
  id: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2
        id={id}
        className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"
      >
        {children}
      </h2>
      {action}
    </div>
  )
}

/**
 * The counter's start page: look a vehicle up, see the day at a glance, pick up where
 * you left off. The demo vehicles are the first rows under Recent lookups.
 */
export function Home() {
  const paths = useRegionPaths()
  const [session] = useSession()
  const slots = Object.entries(session.authorizations)
  const pending = slots.flatMap(([vin, auth]) => {
    const vehicle = findVehicle(vin)
    return auth.status === "pending" && vehicle
      ? [{ vehicle, sentAt: auth.sentAt, expiresAt: auth.expiresAt, requester: auth.requester }]
      : []
  })
  const casesOpened =
    TODAY_STATS.casesOpened + slots.filter(([, a]) => a.status === "escalated").length
  const rows = recentRows(session).slice(0, 6)

  const stats: [string, number, string][] = [
    ["Lookups today", TODAY_STATS.lookups, "Across this office"],
    [
      "Awaiting an owner",
      pending.length,
      pending.length ? "Texts out, not yet answered" : "Nothing waiting",
    ],
    ["Cases opened", casesOpened, "Referred for investigation"],
  ]

  return (
    <div className="mx-auto flex w-full max-w-[66rem] flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Good day, {OFFICE.clerkFullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {todayLabel()} at {OFFICE.name}, {OFFICE.counter}
        </p>
      </header>

      <section aria-labelledby="lookup-heading" className="flex flex-col gap-3">
        <h2 id="lookup-heading" className="text-base font-semibold">
          Look up a vehicle
        </h2>
        <LookupForm size="lg" hideLabel />
        <p className="text-[13px] text-muted-foreground">
          Every lookup checks the VIN with 9 sources, including Transport Canada, CBSA and NMVTIS,
          before a package can be issued.
        </p>
      </section>

      <section aria-label="Today" className="grid grid-cols-1 gap-6 border-y py-6 sm:grid-cols-3">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[13px] text-muted-foreground">{label}</span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
            <span className="text-xs text-muted-foreground/80">{hint}</span>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
          <SectionTitle
            id="recent-heading"
            action={
              <Link
                to={paths.portal.lookup}
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                See all
              </Link>
            }
          >
            Recent lookups
          </SectionTitle>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
            {rows.map((row) => {
              const plated = findVehicle(row.vin)?.plate ?? (row.live ? null : row.plate)
              const inner = (
                <>
                  <span className="w-[5.5rem] shrink-0">
                    {plated ? (
                      <Plate plate={plated} size="sm" />
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.plate}</span>
                    )}
                  </span>
                  <span
                    className={cn("min-w-0 flex-1 truncate text-sm", row.live && "font-medium")}
                  >
                    {row.vehicle}
                  </span>
                  <span className="flex w-20 shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span
                      className={cn("size-1.5 rounded-full", OUTCOME_DOT[row.outcome])}
                      aria-hidden
                    />
                    {OUTCOME_LABEL[row.outcome]}
                  </span>
                  <span className="hidden w-32 shrink-0 text-right text-[13px] whitespace-nowrap text-muted-foreground sm:inline">
                    {row.when}
                  </span>
                  <span className="w-4 shrink-0">
                    {row.live ? (
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    ) : null}
                  </span>
                </>
              )
              const className = "flex items-center gap-4 px-4 py-2.5"
              return (
                <li key={row.vin}>
                  {row.live ? (
                    <Link
                      to={paths.portal.vehicle(row.vin)}
                      className={cn(
                        className,
                        "transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className={cn(className, "text-muted-foreground")}>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="waiting-heading" className="flex flex-col gap-3">
          <SectionTitle id="waiting-heading">Waiting on owners</SectionTitle>
          {pending.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {pending.map(({ vehicle, sentAt, expiresAt, requester }) => (
                <li key={vehicle.vin}>
                  <Link
                    to={paths.portal.vehicle(vehicle.vin)}
                    className="flex flex-col gap-1.5 rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2">
                      {vehicle.plate ? <Plate plate={vehicle.plate} size="sm" /> : null}
                      <span className="truncate text-sm font-medium">{vehicleTitle(vehicle)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      For {requester}, texted at {formatTime(sentAt)}. Expires in{" "}
                      <Countdown expiresAt={expiresAt} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No request is waiting on a registered owner.{" "}
              <Link
                to={paths.portal.requests}
                className="text-foreground underline-offset-4 hover:underline"
              >
                View all requests
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

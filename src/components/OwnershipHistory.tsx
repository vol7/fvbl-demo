import {
  ArrowLeftRight,
  FileBadge,
  Globe,
  PlaneTakeoff,
  RefreshCw,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react"

import { SecretValue } from "@/components/SecretValue"
import { formatDate } from "@/lib/format"
import { ownershipPeriods, type OwnerNote } from "@/lib/owners"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/lib/vehicles"
import { useRegion } from "@/regions"

const NOTE_ICON: Record<OwnerNote["kind"], LucideIcon> = {
  renewed: RefreshCw,
  exported: PlaneTakeoff,
  loss: Siren,
  transfer: ArrowLeftRight,
  usTitle: Globe,
  brand: FileBadge,
  otherJurisdiction: Globe,
}

const NOTE_TONE: Record<OwnerNote["tone"], string> = {
  plain: "bg-muted/60 text-foreground/80",
  warn: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  bad: "bg-destructive/[0.06] text-destructive",
}

const shortDate = (iso: string) => formatDate(iso).replace(/^(\w{3})\w*/, "$1")

/**
 * Every registered owner, newest first, with what happened on each one's watch.
 * Only the current owner can be revealed; previous owners stay redacted.
 */
export function OwnershipHistory({ vehicle, today }: { vehicle: Vehicle; today: string }) {
  const pack = useRegion()
  const owners = ownershipPeriods(pack, vehicle, today)
  return (
    <ol className="relative flex flex-col gap-3.5 before:absolute before:top-6 before:bottom-6 before:left-[11px] before:w-[1.5px] before:bg-border">
      {owners.map((owner) => (
        <li key={owner.since} className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3.5">
          <span
            aria-hidden
            className={cn(
              "z-10 mt-4 grid size-6 place-items-center rounded-full border-[1.5px] text-[11px] font-bold",
              owner.current
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {owner.number}
          </span>
          <article className="rounded-xl border bg-card px-5 py-4 shadow-xs">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-sm font-semibold">
                {owner.current ? "Registered owner" : `Owner ${owner.number}`}
              </h3>
              {owner.current ? (
                <span className="rounded bg-muted px-1.5 text-[11.5px] leading-[18px] font-semibold text-foreground/80">
                  Current
                </span>
              ) : null}
              <span className="ml-auto text-[13px] text-muted-foreground tabular-nums">
                {owner.until
                  ? `${shortDate(owner.since)} to ${shortDate(owner.until)}`
                  : `Since ${shortDate(owner.since)}`}
                <span className="ml-2.5 text-muted-foreground/70">{owner.duration}</span>
              </span>
            </header>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
              {owner.current ? (
                <SecretValue value={vehicle.owner.name} label="owner name" width="5.5rem" />
              ) : (
                <>
                  <span
                    className="inline-block h-3 w-24 rounded-sm bg-muted-foreground/20"
                    role="img"
                    aria-label="Previous owner hidden"
                  />
                  <ShieldCheck className="size-3.5 text-muted-foreground/70" aria-hidden />
                  FVBL never shows previous owners
                </>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t pt-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Acquired by</dt>
                <dd>{owner.acquired}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Registered at</dt>
                <dd>{owner.office}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Odometer at start</dt>
                <dd>{owner.odometerAtStart ?? "No reading"}</dd>
              </div>
            </dl>
            {owner.notes.map((note) => {
              const Icon = NOTE_ICON[note.kind]
              return (
                <p
                  key={note.kind}
                  className={cn(
                    "mt-3 flex gap-2 rounded-md px-2.5 py-2 text-[13px]",
                    NOTE_TONE[note.tone]
                  )}
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {note.text}
                </p>
              )
            })}
          </article>
        </li>
      ))}
    </ol>
  )
}

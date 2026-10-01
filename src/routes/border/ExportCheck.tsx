import { CircleCheck, Clock, FileCheck2, Lock, ShieldAlert, Siren, UserRound } from "lucide-react"
import { Link, useParams } from "react-router"

import { BorderDemoControls } from "@/components/border/BorderDemoControls"
import { Countdown } from "@/components/Countdown"
import { StripCell } from "@/components/DecisionCard"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  declaredView,
  formatContainer,
  permitPasses,
  statusLabel,
  type DeclaredView,
} from "@/lib/border"
import { generateExportRef } from "@/lib/exports"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import type { BorderCopy, BorderStory } from "@/regions/types"
import { useRegionPaths } from "@/regions/context"
import { useRegion } from "@/regions"
import { NotFound } from "@/routes/NotFound"

const TONE = {
  danger: {
    card: "border-destructive/25 bg-destructive/[0.04]",
    label: "text-destructive",
    rule: "border-destructive/20",
  },
  info: {
    card: "border-primary/25 bg-primary/[0.04]",
    label: "text-primary",
    rule: "border-primary/20",
  },
  success: {
    card: "border-emerald-600/25 bg-emerald-50/70 dark:bg-emerald-950/30",
    label: "text-emerald-700 dark:text-emerald-400",
    rule: "border-emerald-600/20",
  },
} as const

function storyFor(copy: BorderCopy, view: DeclaredView): BorderStory {
  const { declared, record } = view.vehicle
  const { story } = copy.card
  switch (view.reason) {
    case "otherVehicle":
      return story.otherVehicle(declared.permit ?? "", record.declaredPermitBelongsTo ?? "")
    case "notOnFile":
      return story.notOnFile(declared.permit ?? "")
    default:
      return story[view.reason]
  }
}

/**
 * One declared vehicle, as the border officer needs it and no more: whether it
 * clears, why, which container to open and where it sits, the registered owner
 * against the exporter, and three answers underneath (permit, stolen report, the
 * owner). The same card and strip as the clerk's decision card, so it reads at
 * once; none of the clerk's record below it.
 */
export function ExportCheck() {
  const pack = useRegion()
  const paths = useRegionPaths()
  const { vin = "" } = useParams<{ vin: string }>()
  const [session, dispatch] = useSession()
  const border = pack.border
  if (!border) return <NotFound />
  const { copy, vessel } = border
  const view = declaredView(border, session, vin)

  if (!view) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="items-start gap-4">
          <p className="text-sm">{copy.list.empty}</p>
          <Link to={paths.border.list} className={buttonVariants({ variant: "outline" })}>
            {copy.navItem}
          </Link>
        </CardContent>
      </Card>
    )
  }

  const { vehicle, verdict, hold, owner, permit } = view
  const story = storyFor(copy, view)
  const tone = verdict === "hold" ? "danger" : verdict === "awaiting" ? "info" : "success"
  const t = TONE[tone]
  const Icon = hold
    ? Lock
    : verdict === "hold"
      ? ShieldAlert
      : verdict === "awaiting"
        ? Clock
        : CircleCheck
  const ownerCell = copy.strip.ownerValue(owner)

  const onHold = () => {
    const now = new Date()
    dispatch({
      type: "holdContainer",
      container: vehicle.container,
      reference: generateExportRef(border.holdPrefix, now),
      at: now.toISOString(),
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-[60rem] flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{copy.list.title}</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          <span className="font-mono tracking-wider">{vehicle.vin}</span>
          <span aria-hidden>·</span>
          <span>
            {vessel.name} to {vessel.to}
          </span>
        </p>
      </header>

      <section aria-label={copy.card.ariaLabel} className="flex flex-col gap-3">
        <div role="status" className={cn("rounded-xl border p-5 sm:px-6", t.card)}>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className={cn("flex items-center gap-2 text-sm font-semibold", t.label)}>
                <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
                {statusLabel(copy, view)}
              </p>
              <h2 className="mt-2 max-w-[46ch] text-lg leading-snug font-semibold tracking-tight text-balance">
                {story.title}
              </h2>
              <p className="mt-1.5 max-w-[68ch] text-sm text-foreground/80">{story.body}</p>
            </div>
            {verdict === "hold" && !hold ? (
              <div className="flex items-start">
                <Button
                  size="lg"
                  className="bg-destructive px-4 text-white hover:bg-destructive/90 has-data-[icon=inline-start]:pl-3.5"
                  onClick={onHold}
                >
                  <Siren data-icon="inline-start" aria-hidden />
                  {copy.card.hold.action}
                </Button>
              </div>
            ) : null}
          </div>

          <dl
            className={cn("mt-4 grid gap-x-8 gap-y-3 border-t pt-4 text-sm sm:grid-cols-3", t.rule)}
          >
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-muted-foreground">
                {copy.card.containerLabel}
              </dt>
              <dd className="font-mono text-[17px] font-semibold tracking-wider">
                {formatContainer(vehicle.container)}
              </dd>
              <dd className="text-[13px] text-muted-foreground">{vehicle.position}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{copy.card.ownerLabel}</dt>
              <dd className="font-medium">{vehicle.record.owner}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-muted-foreground">
                {copy.card.exporterLabel}
              </dt>
              <dd className="font-medium">{vehicle.declared.exporter}</dd>
              {view.exporterIsOwner ? (
                <dd className="text-[13px] text-muted-foreground">{copy.card.exporterIsOwner}</dd>
              ) : null}
            </div>
          </dl>

          {hold ? (
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="text-muted-foreground">{copy.card.hold.text}</span>
              <span className="font-mono text-[15px] font-medium tracking-wider">
                {hold.reference}
              </span>
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">{copy.card.ownerNote}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StripCell
            icon={FileCheck2}
            label={copy.strip.permit}
            value={copy.strip.permitValue[permit]}
            failed={!permitPasses(permit)}
            detail={copy.strip.permitDetail(permit, {
              declared: vehicle.declared.permit,
              onFile: vehicle.record.permit,
              belongsTo: vehicle.record.declaredPermitBelongsTo,
            })}
          />
          <StripCell
            icon={ShieldAlert}
            label={copy.strip.stolen}
            value={
              vehicle.record.stolen ? copy.strip.stolenValue.reported : copy.strip.stolenValue.clear
            }
            failed={vehicle.record.stolen}
            detail={copy.strip.stolenValue.source}
          />
          <StripCell
            icon={UserRound}
            label={copy.strip.owner}
            value={ownerCell.value}
            failed={owner?.status === "denied" || owner?.status === "expired"}
            detail={
              owner?.status === "pending" ? (
                <>
                  {ownerCell.detail} · <Countdown expiresAt={owner.expiresAt} />
                </>
              ) : (
                ownerCell.detail
              )
            }
          />
        </div>
      </section>

      <BorderDemoControls />
    </div>
  )
}

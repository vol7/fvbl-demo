import { CarFront, Check, Copy, ExternalLink, Globe, Monitor, Smartphone } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

import { OutcomeBadge } from "@/components/OutcomeBadge"
import { OwnerActionButtons } from "@/components/DemoControls"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { plateLabel } from "@/lib/format"
import { paths as rootPaths } from "@/lib/paths"
import { activeAuthorization, registrationState, useSession } from "@/lib/session"
import { findVehicle, vehicleTitle } from "@/lib/vehicles"
import { useRegion } from "@/regions"
import { useRegionPaths } from "@/regions/context"

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : `Copy ${value}`}
      onClick={async () => {
        try {
          await navigator.clipboard?.writeText(value)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  )
}

function open(path: string, w: number, h: number) {
  window.open(path, `fvbl-${path}`, `popup=yes,width=${w},height=${h}`)
}

const REGISTRATION_LABEL: Record<string, string> = {
  pending: "Pending",
  registered: "Registered",
  declined: "Declined",
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  blocked: "Blocked",
  pending: "Pending",
  authorized: "Authorized",
  frozen: "Frozen",
  escalated: "Escalated",
}

export function Hub() {
  const pack = useRegion()
  const { hub } = pack.copy
  const paths = useRegionPaths()
  const [session, dispatch] = useSession()
  const active = activeAuthorization(session)
  const vehicle = session.activeVin ? findVehicle(pack, session.activeVin) : undefined
  const auth = active?.state
  const registration = session.activeVin ? registrationState(session, session.activeVin) : null

  return (
    <main className="min-h-svh bg-muted/40 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">
            <Link to={rootPaths.picker} className="underline-offset-4 hover:underline">
              All demos
            </Link>{" "}
            · Recording hub · not part of the product
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{hub.heading}</h1>
          <p className="text-sm text-muted-foreground">{hub.intro}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CarFront className="size-5" aria-hidden />
              </div>
              <CardTitle>Dealer portal</CardTitle>
              <CardDescription>{hub.dealerSurface.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-row flex-wrap gap-2">
              <Button onClick={() => open(paths.dealer.signIn, 1440, 900)}>
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open window
              </Button>
              <a href={paths.dealer.signIn} className={buttonVariants({ variant: "outline" })}>
                Open here
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="size-5" aria-hidden />
              </div>
              <CardTitle>{hub.publicSurface.title}</CardTitle>
              <CardDescription>{hub.publicSurface.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-row flex-wrap gap-2">
              <Button onClick={() => open(hub.publicSurface.href, 1440, 900)}>
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open window
              </Button>
              <a href={hub.publicSurface.href} className={buttonVariants({ variant: "outline" })}>
                Open here
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Monitor className="size-5" aria-hidden />
              </div>
              <CardTitle>Clerk portal</CardTitle>
              <CardDescription>Starts at sign-in. Record at 1440×900.</CardDescription>
            </CardHeader>
            <CardContent className="flex-row flex-wrap gap-2">
              <Button onClick={() => open(paths.portal.signIn, 1440, 900)}>
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open window
              </Button>
              <a href={paths.portal.signIn} className={buttonVariants({ variant: "outline" })}>
                Open here
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Smartphone className="size-5" aria-hidden />
              </div>
              <CardTitle>Phone</CardTitle>
              <CardDescription>
                Owner's or dealership's messages, follows the latest request. Record at 390×844.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-row flex-wrap gap-2">
              <Button onClick={() => open(paths.phone, 390, 844)}>
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open window
              </Button>
              <a href={paths.phone} className={buttonVariants({ variant: "outline" })}>
                Open here
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Scenarios</CardTitle>
            <CardDescription>{hub.scenariosNote}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Scenario</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="pr-6">Expected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hub.scenarios.map((s) => {
                  const v = findVehicle(pack, s.vin)!
                  return (
                    <TableRow key={s.n}>
                      <TableCell className="pl-6 font-medium whitespace-normal">
                        {s.n} · {s.title}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {s.route}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-normal">{vehicleTitle(v)}</TableCell>
                      <TableCell className="font-mono text-xs tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          {v.vin}
                          <CopyButton value={v.vin} />
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <OutcomeBadge label={s.outcome} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live session</CardTitle>
            <CardDescription>
              {vehicle ? (
                <>
                  {vehicleTitle(vehicle)} ·{" "}
                  <span className="font-mono tracking-wider">{plateLabel(vehicle.plate)}</span>
                </>
              ) : (
                "No request in flight."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {registration && registration.status !== "none" ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Registration</span>
                <OutcomeBadge label={REGISTRATION_LABEL[registration.status]} />
                <span className="text-muted-foreground">· submitted by {registration.dealer}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Authorization</span>
                <OutcomeBadge label={STATUS_LABEL[auth?.status ?? "idle"]} />
                {auth && "origin" in auth ? (
                  <span className="text-muted-foreground">
                    · started by {auth.origin} ({auth.requester})
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <OwnerActionButtons size="default" />
            </div>
            <div className="flex flex-col gap-2 border-t pt-4">
              <span className="text-sm font-medium">Force state</span>
              <p className="text-sm text-muted-foreground">
                Jump straight to any state, whatever the session is doing now. Useful for
                re-shooting one beat without replaying the whole flow.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {pack.forceStates.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "force", session: pack.forcedSession(key) })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

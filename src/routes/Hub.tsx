import { Check, Copy, ExternalLink, Globe, Monitor, Smartphone } from "lucide-react"
import { useState } from "react"

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
import { allPass, evaluateChecks } from "@/lib/checks"
import { activeAuthorization, useSession } from "@/lib/session"
import { FORCE_STATES, forcedSession } from "@/lib/forceStates"
import { DEMO_VEHICLES, findVehicle, vehicleTitle } from "@/lib/vehicles"
import { paths } from "@/lib/paths"

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

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  blocked: "Blocked",
  pending: "Pending",
  authorized: "Authorized",
  frozen: "Frozen",
  escalated: "Escalated",
}

export function Hub() {
  const [session, dispatch] = useSession()
  const active = activeAuthorization(session)
  const vehicle = active ? findVehicle(active.vin) : undefined
  const auth = active?.state

  return (
    <main className="min-h-svh bg-muted/40 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">
            Recording hub · not part of the product
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">FVBL demo</h1>
          <p className="text-sm text-muted-foreground">
            Open each surface in its own window. All windows share one session, so a request from
            ServiceOntario or the counter shows up on the phone, and the owner&rsquo;s answer shows
            up in the portal.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="size-5" aria-hidden />
              </div>
              <CardTitle>ServiceOntario (public)</CardTitle>
              <CardDescription>Owner or buyer pre-approval. Record at 1440×900.</CardDescription>
            </CardHeader>
            <CardContent className="flex-row flex-wrap gap-2">
              <Button onClick={() => open(paths.serviceOntario, 1440, 900)}>
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open window
              </Button>
              <a href={paths.serviceOntario} className={buttonVariants({ variant: "outline" })}>
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
              <CardTitle>Registered owner phone</CardTitle>
              <CardDescription>
                Messages thread and confirm page. Record at 390×844.
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
            <CardDescription>
              Both VINs are listed under recent lookups in the clerk portal.
            </CardDescription>
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
                {DEMO_VEHICLES.map((v, i) => {
                  const clear = allPass(evaluateChecks(v))
                  return (
                    <TableRow key={v.vin}>
                      <TableCell className="pl-6 font-medium">
                        {i + 1} · {clear ? "Clean vehicle" : "Cloned VIN"}
                      </TableCell>
                      <TableCell>{vehicleTitle(v)}</TableCell>
                      <TableCell className="font-mono text-xs tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          {v.vin}
                          <CopyButton value={v.vin} />
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <OutcomeBadge label={clear ? "Clear" : "Blocked"} />
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell className="pl-6 font-medium">3 · Buyer pre-request</TableCell>
                  <TableCell>{vehicleTitle(DEMO_VEHICLES[0])}</TableCell>
                  <TableCell className="max-w-56 text-xs whitespace-normal text-muted-foreground">
                    ServiceOntario → owner approves on phone → clerk lookup
                  </TableCell>
                  <TableCell className="pr-6">
                    <OutcomeBadge label="Authorized" />
                  </TableCell>
                </TableRow>
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
                  {vehicleTitle(vehicle)} · plate{" "}
                  <span className="font-mono tracking-wider">{vehicle.plate}</span>
                </>
              ) : (
                "No request in flight."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Authorization</span>
              <OutcomeBadge label={STATUS_LABEL[auth?.status ?? "idle"]} />
              {auth && "origin" in auth ? (
                <span className="text-muted-foreground">
                  · started by {auth.origin} ({auth.requester})
                </span>
              ) : null}
            </div>
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
                {FORCE_STATES.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: "force", session: forcedSession(key) })}
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

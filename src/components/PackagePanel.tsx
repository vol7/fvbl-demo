import { CircleCheck, Clock, ShieldAlert, Snowflake } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"

import { Countdown } from "@/components/Countdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthorizationState } from "@/lib/authorization"
import { allPass, failingChecks, highRiskChecks, type Check } from "@/lib/checks"
import { formatDate, formatTime } from "@/lib/format"
import { BUYER } from "@/lib/people"
import type { Vehicle } from "@/lib/vehicles"

/** What the clerk types before requesting owner authorization. */
export type ApplicantDetails = { name: string; licence: string; mobile: string }

type Props = {
  vehicle: Vehicle
  checks: Check[]
  state: AuthorizationState
  onRequest: (applicant: ApplicantDetails) => void
  onEscalate: () => void
  onIssue: () => void
  /** While false, the verdict (helper + blocked box) is held back until checks settle. */
  settled?: boolean
}

function StatusBox({
  tone,
  icon,
  title,
  children,
}: {
  tone: "info" | "success" | "danger" | "warning"
  icon: React.ReactNode
  title: string
  children?: React.ReactNode
}) {
  const tones = {
    info: "border-primary/30 bg-primary/5",
    success: "border-emerald-600/30 bg-emerald-50",
    danger: "border-destructive/30 bg-destructive/5",
    warning: "border-amber-500/40 bg-amber-50",
  } as const
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl border p-4 text-foreground ${tones[tone]}`}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        {children}
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  mono,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={mono ? "font-mono tracking-wider" : undefined}
        autoComplete="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      />
    </div>
  )
}

/** Who the request was for, once it exists. */
function applicantLabel(state: AuthorizationState, typed: string): string {
  if ("requester" in state) {
    if (state.origin === "owner") return "Any buyer · pre-approved by the owner"
    return state.origin === "buyer" ? `${state.requester} · requested online` : state.requester
  }
  return typed
}

export function PackagePanel({
  vehicle,
  checks,
  state,
  onRequest,
  onEscalate,
  onIssue,
  settled = true,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [name, setName] = useState<string>(BUYER.name)
  const [licence, setLicence] = useState<string>(BUYER.licence)
  const [mobile, setMobile] = useState<string>(BUYER.mobile)
  const canRequest = allPass(checks)
  const failing = failingChecks(checks)
  const high = highRiskChecks(checks)
  const editable = state.status === "idle" || state.status === "blocked"
  const showStatus = state.status !== "idle" && (state.status !== "blocked" || settled)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Used vehicle package</CardTitle>
        <CardDescription>
          Owner authorization is required before a package is issued for this vehicle.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        {editable ? (
          <div className="flex flex-col gap-4">
            <Field id="applicant-name" label="Applicant" value={name} onChange={setName} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="applicant-licence"
                label="Driver's licence"
                value={licence}
                onChange={setLicence}
                mono
              />
              <Field
                id="applicant-mobile"
                label="Mobile number"
                value={mobile}
                onChange={setMobile}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="applicant">Applicant</Label>
            <div
              id="applicant"
              className="flex h-9 items-center rounded-md border border-dashed px-2.5 text-sm"
            >
              {applicantLabel(state, name)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {state.status === "authorized" ? null : (
            <Button
              size="lg"
              disabled={state.status !== "idle"}
              onClick={() => onRequest({ name, licence, mobile })}
            >
              Request owner authorization
            </Button>
          )}
          {canRequest && state.status === "idle" ? (
            <p className="text-sm text-muted-foreground">
              The registered owner will receive a text at the phone ending in{" "}
              {vehicle.owner.phoneLast4} with a link to approve or decline.
            </p>
          ) : null}
          {!canRequest && settled && state.status !== "blocked" && state.status !== "escalated" ? (
            <p className="text-sm text-destructive">
              Authorization unavailable: {failing.length} record{" "}
              {failing.length === 1 ? "check" : "checks"} failed.
            </p>
          ) : null}
        </div>

        {/*
          Keyed remount, deliberately without AnimatePresence: an exit animation here
          never settled, which left the panel showing a stale status. Correct state
          beats a fade-out.
        */}
        {showStatus ? (
          <motion.div
            key={state.status}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {state.status === "blocked" ? (
              <StatusBox
                tone="danger"
                icon={<ShieldAlert className="size-4 text-destructive" aria-hidden />}
                title="Package cannot be issued"
              >
                <p className="text-sm text-muted-foreground">
                  {failing.length} record {failing.length === 1 ? "check" : "checks"} failed
                  {high.length > 0 ? `, ${high.length} high risk` : ""}. This package cannot be
                  issued until the flagged records are resolved.
                </p>
                <div className="mt-2">
                  <Button variant="destructive" onClick={onEscalate}>
                    Escalate to law enforcement
                  </Button>
                </div>
              </StatusBox>
            ) : null}

            {state.status === "escalated" ? (
              <StatusBox
                tone="danger"
                icon={<ShieldAlert className="size-4 text-destructive" aria-hidden />}
                title="Escalated for review"
              >
                <p className="text-sm text-muted-foreground">
                  Do not issue the package. Case opened at {formatTime(state.escalatedAt)}
                </p>
                <p className="font-mono text-sm tracking-wider">{state.caseReference}</p>
              </StatusBox>
            ) : null}

            {state.status === "pending" ? (
              <StatusBox
                tone="info"
                icon={<Clock className="size-4 text-primary" aria-hidden />}
                title={
                  state.origin === "buyer"
                    ? "Awaiting registered owner"
                    : "Request sent to registered owner"
                }
              >
                {state.origin === "buyer" ? (
                  <p className="text-sm text-muted-foreground">
                    Requested online by {state.requester} at {formatTime(state.sentAt)} via
                    ServiceOntario.
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Expires in <Countdown expiresAt={state.expiresAt} />
                </p>
                <p className="text-sm text-muted-foreground">Waiting for response…</p>
              </StatusBox>
            ) : null}

            {state.status === "authorized" ? (
              <StatusBox
                tone="success"
                icon={<CircleCheck className="size-4 text-emerald-600" aria-hidden />}
                title={
                  state.origin === "owner"
                    ? "Authorization on file"
                    : "Authorized by registered owner"
                }
              >
                {state.origin === "owner" ? (
                  <p className="text-sm text-muted-foreground">
                    Pre-approved online by the registered owner on{" "}
                    {formatDate(state.approvedAt.slice(0, 10))} via ServiceOntario · valid until{" "}
                    {formatDate(state.validUntil.slice(0, 10))}
                  </p>
                ) : state.origin === "buyer" ? (
                  <p className="text-sm text-muted-foreground">
                    Requested online by {state.requester} · approved by the owner at{" "}
                    {formatTime(state.approvedAt)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Approved by the owner at {formatTime(state.approvedAt)} from the confirmation
                    link
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Authorization reference</p>
                <p className="font-mono text-base tracking-wider">{state.authorizationCode}</p>
                {state.issued ? (
                  <div className="mt-2 flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-emerald-700">
                      Package issued at {formatTime(state.issued.at)}
                    </p>
                    <p className="font-mono text-sm tracking-wider">{state.issued.packageNumber}</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Button onClick={onIssue}>Issue Used Vehicle Information Package</Button>
                  </div>
                )}
              </StatusBox>
            ) : null}

            {state.status === "frozen" ? (
              <StatusBox
                tone="warning"
                icon={<Snowflake className="size-4 text-amber-600" aria-hidden />}
                title="Frozen — flagged for security review"
              >
                <p className="text-sm text-muted-foreground">
                  {state.reason === "denied"
                    ? "Owner denied the request."
                    : "No response within 24 hours."}{" "}
                  Recorded at {formatTime(state.frozenAt)}
                </p>
              </StatusBox>
            ) : null}
          </motion.div>
        ) : null}
      </CardContent>
    </Card>
  )
}

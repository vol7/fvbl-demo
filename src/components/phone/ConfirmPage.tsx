import { Check, ChevronLeft, Lock, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"

import { FvblMark } from "@/components/FvblMark"
import { StatusBar } from "@/components/phone/PhoneChrome"
import { Button } from "@/components/ui/button"
import { generateAuthorizationCode } from "@/lib/authorization"
import { generateExportRef } from "@/lib/exports"
import { formatDate, formatDateTime, formatTime } from "@/lib/format"
import { generateRegistrationRef } from "@/lib/registration"
import { useSession } from "@/lib/session"
import { liveThread, type Thread } from "@/lib/thread"
import { vehicleTitle } from "@/lib/vehicles"
import { useRegion } from "@/regions"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-[15px] text-neutral-900">{value}</dd>
    </div>
  )
}

function ResultIcon({ ok }: { ok: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { scale: 0.25, opacity: 0, filter: "blur(4px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      className={`flex size-16 items-center justify-center rounded-full ${ok ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-700"}`}
    >
      {ok ? (
        <Check className="size-8" strokeWidth={2.5} aria-hidden />
      ) : (
        <X className="size-8" strokeWidth={2.5} aria-hidden />
      )}
    </motion.div>
  )
}

/** The dealership confirms its own first-registration submission. */
function RegistrationConfirm({
  thread,
  onConfirm,
  onDecline,
}: {
  thread: Extract<Thread, { kind: "registration" }>
  onConfirm: () => void
  onDecline: () => void
}) {
  const reduceMotion = useReducedMotion()
  const copy = useRegion().copy.phone.confirm.registration
  const { vehicle, state } = thread
  if (state.status === "pending") {
    return (
      <motion.section
        key="ask-registration"
        className="flex flex-col gap-5 p-5"
        exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{copy.askTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.askLede(state.dealer)}</p>
        </div>

        <dl className="divide-y divide-black/10 rounded-2xl bg-white px-4 ring-1 ring-black/10">
          <Row
            label="Vehicle"
            value={<span className="font-medium">{vehicleTitle(vehicle)}</span>}
          />
          <Row
            label="VIN"
            value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
          />
          <Row label="Submitted by" value={state.dealer} />
          <Row label={copy.firstOwnerLabel} value={state.firstOwner} />
          {copy.alertsLabel && state.titleAlerts ? (
            <Row
              label={copy.alertsLabel}
              value={`On for mobile ending ${state.titleAlerts.mobileLast4}`}
            />
          ) : null}
          <Row
            label={copy.documentLabel}
            value={
              <span className="font-mono tracking-wider">{state.sourceDocument.number}</span>
            }
          />
          <Row label="Submitted" value={`Today at ${formatTime(state.sentAt)}`} />
          <Row
            label="Expires"
            value={`${formatDate(state.expiresAt.slice(0, 10))} at ${formatTime(state.expiresAt)}`}
          />
        </dl>

        <div className="mt-1 flex flex-col gap-2.5">
          <Button size="lg" className="h-12 rounded-xl text-[15px]" onClick={onConfirm}>
            Confirm
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-xl bg-white text-[15px]"
            onClick={onDecline}
          >
            Decline
          </Button>
        </div>
        <p className="text-center text-xs text-neutral-500">{copy.recorded}</p>
      </motion.section>
    )
  }
  return (
    <motion.section
      key={`result-registration-${state.status}`}
      className="flex flex-col items-center gap-4 px-5 pt-10 text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <ResultIcon ok={state.status === "registered"} />
      {state.status === "registered" ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight">{copy.recordedTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.recordedText(vehicleTitle(vehicle))}</p>
          <div className="mt-1 flex flex-col items-center gap-0.5 rounded-2xl bg-white px-6 py-3 ring-1 ring-black/10">
            <span className="text-xs text-neutral-500">Reference</span>
            <span className="font-mono text-lg tracking-wider">{state.registrationRef}</span>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight">{copy.declinedTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.declinedText(vehicleTitle(vehicle))}</p>
        </>
      )}
      <p className="mt-2 text-xs text-neutral-500">You can close this page.</p>
    </motion.section>
  )
}

/** The owner answers whether they authorized their car's export. */
function ExportConfirm({
  thread,
  onConfirm,
  onDecline,
}: {
  thread: Extract<Thread, { kind: "export" }>
  onConfirm: () => void
  onDecline: () => void
}) {
  const reduceMotion = useReducedMotion()
  const border = useRegion().border
  if (!border) return null
  const copy = border.copy.phone.confirm
  const { vehicle, state } = thread
  if (state.status === "pending") {
    return (
      <motion.section
        key="ask-export"
        className="flex flex-col gap-5 p-5"
        exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{copy.askTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.askLede}</p>
        </div>

        <dl className="divide-y divide-black/10 rounded-2xl bg-white px-4 ring-1 ring-black/10">
          <Row
            label="Vehicle"
            value={<span className="font-medium">{vehicleTitle(vehicle)}</span>}
          />
          <Row
            label="Plate"
            value={<span className="font-mono tracking-wider">{vehicle.plate}</span>}
          />
          <Row label={copy.portLabel} value={border.vessel.from} />
          <Row label={copy.toLabel} value={border.vessel.to} />
          <Row
            label={copy.exporterLabel}
            value={
              <>
                {state.exporter}
                {state.exporter === vehicle.owner.name ? (
                  <span className="block text-xs text-neutral-500">{copy.exporterIsYou}</span>
                ) : null}
              </>
            }
          />
          <Row label={copy.deadlineLabel} value={formatDateTime(state.expiresAt)} />
        </dl>

        <div className="mt-1 flex flex-col gap-2.5">
          <Button size="lg" className="h-12 rounded-xl text-[15px]" onClick={onConfirm}>
            {copy.approve}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-xl bg-white text-[15px]"
            onClick={onDecline}
          >
            {copy.decline}
          </Button>
        </div>
        <p className="text-center text-xs text-neutral-500">{copy.recorded}</p>
      </motion.section>
    )
  }
  const ok = state.status === "confirmed"
  return (
    <motion.section
      key={`result-export-${state.status}`}
      className="flex flex-col items-center gap-4 px-5 pt-10 text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <ResultIcon ok={ok} />
      {ok ? (
        <>
          <h1 className="text-xl font-semibold tracking-tight">{copy.approvedTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.approvedText(vehicleTitle(vehicle))}</p>
          <div className="mt-1 flex flex-col items-center gap-0.5 rounded-2xl bg-white px-6 py-3 ring-1 ring-black/10">
            <span className="text-xs text-neutral-500">Reference</span>
            <span className="font-mono text-lg tracking-wider">{state.confirmationCode}</span>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight">{copy.declinedTitle}</h1>
          <p className="text-[15px] text-neutral-600">{copy.declinedText(vehicleTitle(vehicle))}</p>
          {state.status === "denied" ? (
            <div className="mt-1 flex flex-col items-center gap-0.5 rounded-2xl bg-white px-6 py-3 ring-1 ring-black/10">
              <span className="text-xs text-neutral-500">{copy.referenceLabel}</span>
              <span className="font-mono text-lg tracking-wider">{state.reference}</span>
            </div>
          ) : null}
        </>
      )}
      <p className="mt-2 text-xs text-neutral-500">You can close this page.</p>
    </motion.section>
  )
}

/** One-page yes/no opened from the SMS link. Rendered inside the phone frame. */
export function ConfirmPage() {
  const pack = useRegion()
  const copy = pack.copy.phone.confirm
  const [session, dispatch] = useSession()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const thread = liveThread(pack, session)
  const vin = session.activeVin
  const at = () => new Date().toISOString()
  const registration = thread?.kind === "registration"

  const approve = () =>
    vin &&
    dispatch({ type: "approve", vin, authorizationCode: generateAuthorizationCode(), at: at() })
  const decline = () => vin && dispatch({ type: "deny", vin, at: at() })
  const confirmRegistration = () =>
    vin &&
    dispatch({
      type: "confirmRegistration",
      vin,
      registrationRef: generateRegistrationRef(
        new Date(),
        Math.random,
        pack.references.registration
      ),
      at: at(),
    })
  const declineRegistration = () => vin && dispatch({ type: "declineRegistration", vin, at: at() })
  const confirmExport = () =>
    vin &&
    dispatch({
      type: "confirmExport",
      vin,
      confirmationCode: generateAuthorizationCode(),
      at: at(),
    })
  const denyExport = () =>
    vin &&
    pack.border &&
    dispatch({
      type: "denyExport",
      vin,
      reference: generateExportRef(pack.border.refusalPrefix, new Date()),
      at: at(),
    })
  const header =
    thread?.kind === "registration"
      ? copy.headerDealer
      : thread?.kind === "export" && pack.border
        ? pack.border.copy.phone.confirm.header
        : copy.headerOwner

  return (
    <div
      role="region"
      aria-label={registration ? "Dealer confirmation page" : "Owner confirmation page"}
      className="flex h-full w-full flex-col bg-[#f7f7f8] text-neutral-900"
    >
      <StatusBar />
      {/* Browser chrome. The back chevron is the browser's, which is the only way back. */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <button
          type="button"
          onClick={() => navigate("..", { relative: "path" })}
          className="flex size-8 items-center justify-center rounded-full text-[#0a84ff]"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        <div className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[13px] text-neutral-700 ring-1 ring-black/10">
          <Lock className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {thread ? pack.sms.link(thread.state.link) : pack.sms.domain}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center gap-2 border-b border-black/10 bg-white px-5 py-3">
          <FvblMark className="h-6 w-auto" />
          <span className="text-sm font-semibold tracking-wide">FVBL</span>
          <span className="ml-auto text-xs text-neutral-500">
            {header}
          </span>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {!thread ? (
            <motion.section key="expired" className="flex flex-col gap-3 p-5">
              <h1 className="text-xl font-semibold tracking-tight">
                This link is no longer active
              </h1>
              <p className="text-[15px] text-neutral-600">
                The request it pointed to has expired or was already answered.
              </p>
            </motion.section>
          ) : thread.kind === "registration" ? (
            <RegistrationConfirm
              thread={thread}
              onConfirm={confirmRegistration}
              onDecline={declineRegistration}
            />
          ) : thread.kind === "export" ? (
            <ExportConfirm thread={thread} onConfirm={confirmExport} onDecline={denyExport} />
          ) : thread.state.status === "pending" ? (
            <motion.section
              key="ask"
              className="flex flex-col gap-5 p-5"
              exit={
                reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }
              }
            >
              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl font-semibold tracking-tight">{copy.askTitle}</h1>
                <p className="text-[15px] text-neutral-600">{copy.askLede}</p>
                {copy.asksNothing ? (
                  <p className="text-[13px] font-medium text-neutral-700">{copy.asksNothing}</p>
                ) : null}
              </div>

              <dl className="divide-y divide-black/10 rounded-2xl bg-white px-4 ring-1 ring-black/10">
                <Row
                  label="Vehicle"
                  value={<span className="font-medium">{vehicleTitle(thread.vehicle)}</span>}
                />
                {copy.identifier === "plate" ? (
                  <Row
                    label="Plate"
                    value={<span className="font-mono tracking-wider">{thread.vehicle.plate}</span>}
                  />
                ) : (
                  <Row
                    label="VIN"
                    value={
                      <span className="font-mono tracking-wider">
                        …{thread.vehicle.vin.slice(-4)}
                      </span>
                    }
                  />
                )}
                <Row
                  label="Requested by"
                  value={pack.copy.phone.requesterName(thread.state.requester)}
                />
                <Row label="Requested" value={`Today at ${formatTime(thread.state.sentAt)}`} />
                <Row
                  label="Expires"
                  value={`${formatDate(thread.state.expiresAt.slice(0, 10))} at ${formatTime(thread.state.expiresAt)}`}
                />
              </dl>

              <div className="mt-1 flex flex-col gap-2.5">
                <Button size="lg" className="h-12 rounded-xl text-[15px]" onClick={approve}>
                  {copy.approve}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl bg-white text-[15px]"
                  onClick={decline}
                >
                  {copy.decline}
                </Button>
              </div>
              <p className="text-center text-xs text-neutral-500">{copy.recorded}</p>
            </motion.section>
          ) : (
            <motion.section
              key={`result-${thread.state.status}`}
              className="flex flex-col items-center gap-4 px-5 pt-10 text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ResultIcon ok={thread.state.status === "authorized"} />
              {thread.state.status === "authorized" ? (
                <>
                  <h1 className="text-xl font-semibold tracking-tight">{copy.approvedTitle}</h1>
                  <p className="text-[15px] text-neutral-600">
                    {copy.approvedText(
                      vehicleTitle(thread.vehicle),
                      formatDate(thread.state.validUntil.slice(0, 10))
                    )}
                  </p>
                  <div className="mt-1 flex flex-col items-center gap-0.5 rounded-2xl bg-white px-6 py-3 ring-1 ring-black/10">
                    <span className="text-xs text-neutral-500">Reference</span>
                    <span className="font-mono text-lg tracking-wider">
                      {thread.state.authorizationCode}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-semibold tracking-tight">{copy.declinedTitle}</h1>
                  <p className="text-[15px] text-neutral-600">
                    {copy.declinedText(vehicleTitle(thread.vehicle))}
                  </p>
                </>
              )}
              <p className="mt-2 text-xs text-neutral-500">You can close this page.</p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

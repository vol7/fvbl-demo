import { Check, ChevronLeft, Lock, ShieldCheck, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"

import { StatusBar } from "@/components/phone/PhoneChrome"
import { Button } from "@/components/ui/button"
import { generateAuthorizationCode } from "@/lib/authorization"
import { formatDate, formatTime } from "@/lib/format"
import { generateRegistrationRef } from "@/lib/registration"
import { useSession } from "@/lib/session"
import { smsLink } from "@/lib/sms"
import { liveThread, type Thread } from "@/lib/thread"
import { vehicleTitle } from "@/lib/vehicles"

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
  const { vehicle, state } = thread
  if (state.status === "pending") {
    return (
      <motion.section
        key="ask-registration"
        className="flex flex-col gap-5 p-5"
        exit={reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Confirm a first registration?</h1>
          <p className="text-[15px] text-neutral-600">
            {state.dealer} is registering a new vehicle with the ministry. Confirm only if the New
            Vehicle Information Statement is in hand.
          </p>
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
          <Row label="First registered owner" value={state.firstOwner} />
          <Row
            label="NVIS"
            value={<span className="font-mono tracking-wider">{state.nvis}</span>}
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
        <p className="text-center text-xs text-neutral-500">
          Your confirmation is recorded with the Federal VIN Blockchain Ledger.
        </p>
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
          <h1 className="text-xl font-semibold tracking-tight">Registration recorded</h1>
          <p className="text-[15px] text-neutral-600">
            The ministry has recorded the first registration of the {vehicleTitle(vehicle)}. The
            vehicle's ledger is open.
          </p>
          <div className="mt-1 flex flex-col items-center gap-0.5 rounded-2xl bg-white px-6 py-3 ring-1 ring-black/10">
            <span className="text-xs text-neutral-500">Reference</span>
            <span className="font-mono text-lg tracking-wider">{state.registrationRef}</span>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight">Submission declined</h1>
          <p className="text-[15px] text-neutral-600">
            Nothing was recorded for the {vehicleTitle(vehicle)}. The submission has been withdrawn.
          </p>
        </>
      )}
      <p className="mt-2 text-xs text-neutral-500">You can close this page.</p>
    </motion.section>
  )
}

/** One-page yes/no opened from the SMS link. Rendered inside the phone frame. */
export function ConfirmPage() {
  const [session, dispatch] = useSession()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const thread = liveThread(session)
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
      registrationRef: generateRegistrationRef(new Date()),
      at: at(),
    })
  const declineRegistration = () => vin && dispatch({ type: "declineRegistration", vin, at: at() })

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
          onClick={() => navigate("/phone")}
          className="flex size-8 items-center justify-center rounded-full text-[#0a84ff]"
          aria-label="Back"
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        <div className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[13px] text-neutral-700 ring-1 ring-black/10">
          <Lock className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{thread ? smsLink(thread.state.link) : "fvbl.on.ca"}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center gap-2 border-b border-black/10 bg-white px-5 py-3">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-wide">FVBL</span>
          <span className="ml-auto text-xs text-neutral-500">
            {registration ? "Dealer confirmation" : "Owner authorization"}
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
          ) : thread.state.status === "pending" ? (
            <motion.section
              key="ask"
              className="flex flex-col gap-5 p-5"
              exit={
                reduceMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }
              }
            >
              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl font-semibold tracking-tight">
                  Approve a Used Vehicle Information Package?
                </h1>
                <p className="text-[15px] text-neutral-600">
                  Someone is asking for the UVIP for a vehicle registered to you. Only approve if
                  you are selling it.
                </p>
              </div>

              <dl className="divide-y divide-black/10 rounded-2xl bg-white px-4 ring-1 ring-black/10">
                <Row
                  label="Vehicle"
                  value={<span className="font-medium">{vehicleTitle(thread.vehicle)}</span>}
                />
                <Row
                  label="Plate"
                  value={<span className="font-mono tracking-wider">{thread.vehicle.plate}</span>}
                />
                <Row label="Requested by" value={thread.state.requester} />
                <Row label="Requested" value={`Today at ${formatTime(thread.state.sentAt)}`} />
                <Row
                  label="Expires"
                  value={`${formatDate(thread.state.expiresAt.slice(0, 10))} at ${formatTime(thread.state.expiresAt)}`}
                />
              </dl>

              <div className="mt-1 flex flex-col gap-2.5">
                <Button size="lg" className="h-12 rounded-xl text-[15px]" onClick={approve}>
                  Approve
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl bg-white text-[15px]"
                  onClick={decline}
                >
                  Decline
                </Button>
              </div>
              <p className="text-center text-xs text-neutral-500">
                Your response is recorded with the Federal VIN Blockchain Ledger.
              </p>
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
                  <h1 className="text-xl font-semibold tracking-tight">Authorization recorded</h1>
                  <p className="text-[15px] text-neutral-600">
                    The UVIP for your {vehicleTitle(thread.vehicle)} can now be issued. This
                    authorization is valid until {formatDate(thread.state.validUntil.slice(0, 10))}.
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
                  <h1 className="text-xl font-semibold tracking-tight">Request declined</h1>
                  <p className="text-[15px] text-neutral-600">
                    No package will be issued for your {vehicleTitle(thread.vehicle)}. The
                    transaction has been flagged for security review.
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

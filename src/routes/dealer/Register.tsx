import { CircleCheck, Clock, Undo2, type LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"
import { Link } from "react-router"

import { LedgerMark } from "@/components/LedgerMark"
import { StepHeader, StepPanel } from "@/components/public/Stepper"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateLinkToken, generateOtp } from "@/lib/authorization"
import { formatOdometer, formatTime, isValidVin, normalizeVin } from "@/lib/format"
import { historyCertificates } from "@/lib/ledger"
import { DEALER, FIRST_OWNER, maskLicence } from "@/lib/people"
import { NO_REGISTRATION, type Submission } from "@/lib/registration"
import { registrationState, useSession } from "@/lib/session"
import { smsLink } from "@/lib/sms"
import { cn } from "@/lib/utils"
import { submitOnEnter } from "@/lib/submitOnEnter"
import {
  bornVehicle,
  countryOfOrigin,
  findVehicle,
  NEW_VIN,
  vehicleTitle,
  type Vehicle,
} from "@/lib/vehicles"
import { ReviewRow } from "@/routes/public/UvipOwner"
import { useRegionPaths } from "@/regions/context"

const STEPS = ["Vehicle", "NVIS and delivery", "Review"]

const INVALID = "Enter the 17-character VIN (letters I, O and Q are not used)."
const UNKNOWN = "This VIN does not decode. Check the NVIS and try again."
const ALREADY =
  "This VIN already has a registration on file. Use a transfer, not a first registration."

const SUBMISSION: Submission = {
  dealer: DEALER.name,
  dealerMobileLast4: DEALER.mobileLast4,
  nvis: DEALER.nvis,
  deliveryKm: 12,
  firstOwner: FIRST_OWNER.name,
}

const TONE = {
  info: { card: "border-primary/25 bg-primary/[0.04]", label: "text-primary" },
  success: {
    card: "border-emerald-600/25 bg-emerald-50/70 dark:bg-emerald-950/30",
    label: "text-emerald-700 dark:text-emerald-400",
  },
  neutral: { card: "border-border bg-muted/40", label: "text-muted-foreground" },
} as const

/** The submission's state, in the same card as the clerk portal's decision. */
function StatusCard({
  tone,
  icon: Icon,
  label,
  title,
  text,
  reference,
  children,
}: {
  tone: keyof typeof TONE
  icon: LucideIcon
  label: string
  title: string
  text: React.ReactNode
  reference?: string
  children?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      role="status"
      className={cn("overflow-hidden rounded-xl border", TONE[tone].card)}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="p-5 sm:px-6">
        <p className={cn("flex items-center gap-2 text-sm font-semibold", TONE[tone].label)}>
          <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
          {label}
        </p>
        <h2 className="mt-2 text-lg leading-snug font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-foreground/80">{text}</p>
        {reference ? (
          <p className="mt-2.5 font-mono text-[15px] font-medium tracking-wider">{reference}</p>
        ) : null}
      </div>
      {children ? <div className="border-t bg-background/70 px-5 sm:px-6">{children}</div> : null}
    </motion.section>
  )
}

/** First registration of a brand-new vehicle: the birth of the VIN, from the dealer's side. */
export function Register() {
  const paths = useRegionPaths()
  const [session, dispatch] = useSession()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [vin, setVin] = useState<string>(NEW_VIN)
  const [error, setError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [nvisConfirmed, setNvisConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const registration = submitted ? registrationState(session, submitted) : NO_REGISTRATION

  function decode() {
    const normalized = normalizeVin(vin)
    if (!isValidVin(normalized)) return setError(INVALID)
    const found = findVehicle(normalized)
    if (!found) return setError(UNKNOWN)
    if (found.history.length > 0 || registrationState(session, found.vin).status === "registered") {
      return setError(ALREADY)
    }
    setError(null)
    setVehicle(found)
  }

  function submit() {
    if (!vehicle) return
    dispatch({
      type: "submitRegistration",
      vin: vehicle.vin,
      submission: SUBMISSION,
      otp: generateOtp(),
      link: generateLinkToken(),
      at: new Date().toISOString(),
    })
    setSubmitted(vehicle.vin)
  }

  function startOver() {
    setSubmitted(null)
    setVehicle(null)
    setNvisConfirmed(false)
    setStep(0)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Register a new vehicle</h1>
        <p className="text-sm text-muted-foreground">
          First registration with the ministry, from the New Vehicle Information Statement. You
          confirm the submission from the dealership's registered mobile.
        </p>
      </div>

      {submitted && vehicle && registration.status !== "none" ? (
        <>
          {registration.status === "pending" ? (
            <StatusCard
              tone="info"
              icon={Clock}
              label="Awaiting confirmation"
              title="Submitted to the ministry"
              text={`A text went to the dealership's registered mobile ending ${registration.dealerMobileLast4}. The registration is recorded once it is confirmed there; the link expires in 24 hours.`}
            >
              <dl className="divide-y">
                <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                <ReviewRow
                  label="VIN"
                  value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                />
                <ReviewRow label="Submitted as" value={registration.dealer} />
                <ReviewRow
                  label="Link"
                  value={<span className="font-mono">{smsLink(registration.link)}</span>}
                />
              </dl>
            </StatusCard>
          ) : null}

          {registration.status === "registered" ? (
            <StatusCard
              tone="success"
              icon={CircleCheck}
              label="Confirmed from the dealership's mobile"
              title="Registration recorded"
              text="The ministry has the first registration and the vehicle's ledger is open."
              reference={registration.registrationRef}
            >
              <dl className="divide-y">
                <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                <ReviewRow
                  label="VIN"
                  value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                />
                <ReviewRow
                  label="Registered"
                  value={`Today, ${formatTime(registration.registeredAt)}`}
                />
                <ReviewRow label="Office" value={registration.office.split(" · ").at(-1)} />
                <ReviewRow
                  label="Ledger"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      First registration and delivery odometer
                      <LedgerMark
                        hash={historyCertificates(bornVehicle(vehicle, registration))[0]}
                        event="First registration"
                        source="MTO"
                        recordedAt={registration.registeredAt}
                      />
                    </span>
                  }
                />
              </dl>
              <div className="flex gap-2 border-t py-4">
                <Link to={paths.portal.vehicle(vehicle.vin)} className={buttonVariants()}>
                  View in FVBL
                </Link>
                <Button type="button" variant="outline" onClick={startOver}>
                  Register another
                </Button>
              </div>
            </StatusCard>
          ) : null}

          {registration.status === "declined" ? (
            <StatusCard
              tone="neutral"
              icon={Undo2}
              label="Declined from the dealership's mobile"
              title="Submission withdrawn"
              text="Nothing was recorded with the ministry."
            >
              <div className="py-4">
                <Button type="button" variant="outline" onClick={startOver}>
                  Start over
                </Button>
              </div>
            </StatusCard>
          ) : null}
        </>
      ) : (
        <>
          <StepHeader steps={STEPS} current={step} />
          <StepPanel step={step}>
            {step === 0 ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dealer-vin">Vehicle Identification Number (VIN)</Label>
                  <Input
                    id="dealer-vin"
                    size="lg"
                    className="font-mono tracking-wider uppercase"
                    maxLength={17}
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    value={vin}
                    aria-invalid={error ? true : undefined}
                    aria-describedby="dealer-vin-hint"
                    onKeyDown={submitOnEnter(() => (vehicle ? setStep(1) : decode()))}
                    onChange={(e) => {
                      setVin(e.target.value.toUpperCase())
                      setError(null)
                      setVehicle(null)
                    }}
                  />
                  <p
                    id="dealer-vin-hint"
                    className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {error ?? "As printed on the New Vehicle Information Statement."}
                  </p>
                </div>

                {vehicle ? (
                  <motion.div
                    role="status"
                    className="overflow-hidden rounded-xl border bg-card shadow-xs"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="flex flex-col gap-1 p-5">
                      <span className="text-xs text-muted-foreground">VIN decodes to</span>
                      <span className="text-lg leading-snug font-semibold tracking-tight">
                        {vehicleTitle(vehicle)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {vehicle.colour} {vehicle.bodyStyle}, built in {countryOfOrigin(vehicle)} (
                        {vehicle.decoded.plant.split(",")[0]})
                      </span>
                    </div>
                    <p className="flex items-center gap-2 border-t bg-emerald-50/60 px-5 py-3 text-sm dark:bg-emerald-950/20">
                      <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>
                        <span className="font-medium">No registration on file.</span> This VIN has
                        not been registered in any jurisdiction.
                      </span>
                    </p>
                  </motion.div>
                ) : null}

                <div className="flex gap-2">
                  {vehicle ? (
                    <Button type="button" size="lg" onClick={() => setStep(1)}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="button" size="lg" onClick={decode}>
                      Decode VIN
                    </Button>
                  )}
                </div>
              </div>
            ) : null}

            {step === 1 && vehicle ? (
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (nvisConfirmed) setStep(2)
                }}
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">NVIS and delivery</h2>
                  <p className="text-sm text-muted-foreground">
                    Confirm the statement that came with the vehicle. Delivery details are from your
                    dealer management system.
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                    checked={nvisConfirmed}
                    onChange={(e) => setNvisConfirmed(e.target.checked)}
                  />
                  <span className="font-medium">
                    I confirm the New Vehicle Information Statement for this VIN is in hand and
                    matches the vehicle.
                  </span>
                </label>

                <dl className="divide-y rounded-xl border bg-card px-5">
                  <ReviewRow
                    label="NVIS number"
                    value={<span className="font-mono tracking-wider">{SUBMISSION.nvis}</span>}
                  />
                  <ReviewRow
                    label="Delivery odometer"
                    value={formatOdometer(SUBMISSION.deliveryKm)}
                  />
                  <ReviewRow
                    label="First registered owner"
                    value={
                      <span className="flex flex-col items-end">
                        <span>{FIRST_OWNER.name}</span>
                        <span className="font-mono text-xs tracking-wider text-muted-foreground">
                          {maskLicence(FIRST_OWNER.licence)}
                        </span>
                      </span>
                    }
                  />
                  <ReviewRow
                    label="Submitting as"
                    value={`${DEALER.name}, dealer no. ${DEALER.number}`}
                  />
                </dl>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button type="submit" size="lg" disabled={!nvisConfirmed}>
                    Continue
                  </Button>
                </div>
              </form>
            ) : null}

            {step === 2 && vehicle ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Review and submit</h2>
                  <p className="text-sm text-muted-foreground">
                    The registration is pushed to the ministry as a dealer submission and must be
                    confirmed from the dealership's registered mobile ending{" "}
                    {SUBMISSION.dealerMobileLast4}.
                  </p>
                </div>
                <dl className="divide-y rounded-xl border bg-card px-5">
                  <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                  <ReviewRow
                    label="VIN"
                    value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                  />
                  <ReviewRow
                    label="NVIS"
                    value={<span className="font-mono tracking-wider">{SUBMISSION.nvis}</span>}
                  />
                  <ReviewRow
                    label="Delivery odometer"
                    value={formatOdometer(SUBMISSION.deliveryKm)}
                  />
                  <ReviewRow label="First registered owner" value={FIRST_OWNER.name} />
                  <ReviewRow label="Submitted by" value={DEALER.name} />
                </dl>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" size="lg" onClick={submit}>
                    Submit to ministry
                  </Button>
                </div>
              </div>
            ) : null}
          </StepPanel>
        </>
      )}
    </div>
  )
}

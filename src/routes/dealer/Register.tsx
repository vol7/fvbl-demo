import { Check, MessageSquareText, ShieldCheck } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"
import { Link } from "react-router"

import { StepHeader, StepPanel } from "@/components/public/Stepper"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateLinkToken, generateOtp } from "@/lib/authorization"
import { formatOdometer, formatTime, isValidVin, normalizeVin } from "@/lib/format"
import { paths } from "@/lib/paths"
import { DEALER, FIRST_OWNER, maskLicence } from "@/lib/people"
import { NO_REGISTRATION, type Submission } from "@/lib/registration"
import { registrationState, useSession } from "@/lib/session"
import { smsLink } from "@/lib/sms"
import { submitOnEnter } from "@/lib/submitOnEnter"
import { findVehicle, NEW_VIN, vehicleTitle, type Vehicle } from "@/lib/vehicles"
import { ReviewRow } from "@/routes/public/UvipOwner"

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

/** First registration of a brand-new vehicle: the birth of the VIN, from the dealer's side. */
export function Register() {
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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Register a new vehicle</h1>
        <p className="text-base text-muted-foreground">
          First registration with the ministry, from the New Vehicle Information Statement. The
          submission is confirmed from the dealership's registered mobile.
        </p>
      </div>

      {submitted && vehicle && registration.status !== "none" ? (
        <motion.section
          role="status"
          className="flex flex-col gap-5 rounded-xl border bg-card p-6"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {registration.status === "pending" ? (
            <>
              <div className="flex items-center gap-3">
                <motion.span
                  className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  initial={reduceMotion ? false : { scale: 0.25, filter: "blur(4px)" }}
                  animate={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                >
                  <MessageSquareText className="size-5" aria-hidden />
                </motion.span>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Submitted to the ministry
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Awaiting confirmation from the dealership's registered mobile ending{" "}
                    {registration.dealerMobileLast4}.
                  </p>
                </div>
              </div>
              <dl className="divide-y">
                <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                <ReviewRow
                  label="VIN"
                  value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                />
                <ReviewRow label="Submitted as" value={registration.dealer} />
                <ReviewRow
                  label="Text sent to"
                  value={`Mobile ending ${registration.dealerMobileLast4}`}
                />
                <ReviewRow
                  label="Link"
                  value={<span className="font-mono">{smsLink(registration.link)}</span>}
                />
                <ReviewRow label="Expires" value="24 hours" />
              </dl>
            </>
          ) : null}

          {registration.status === "registered" ? (
            <>
              <div className="flex items-center gap-3">
                <motion.span
                  className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white"
                  initial={reduceMotion ? false : { scale: 0.25, filter: "blur(4px)" }}
                  animate={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                >
                  <Check className="size-5" strokeWidth={3} aria-hidden />
                </motion.span>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold tracking-tight">Registration recorded</h2>
                  <p className="text-sm text-muted-foreground">
                    Confirmed from the dealership's mobile. The vehicle's ledger is open.
                  </p>
                </div>
              </div>
              <dl className="divide-y">
                <ReviewRow
                  label="Reference"
                  value={
                    <span className="font-mono tracking-wider">{registration.registrationRef}</span>
                  }
                />
                <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                <ReviewRow
                  label="VIN"
                  value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                />
                <ReviewRow
                  label="Registered"
                  value={`Today, ${formatTime(registration.registeredAt)}`}
                />
                <ReviewRow label="Office" value={registration.office} />
              </dl>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
                First registration and delivery odometer are on the ledger, Blockchain certified.
              </div>
              <div className="flex gap-2">
                <Link to={paths.portal.vehicle(vehicle.vin)} className={buttonVariants()}>
                  View in FVBL
                </Link>
                <Button type="button" variant="outline" onClick={startOver}>
                  Register another
                </Button>
              </div>
            </>
          ) : null}

          {registration.status === "declined" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MessageSquareText className="size-5" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold tracking-tight">Submission withdrawn</h2>
                  <p className="text-sm text-muted-foreground">
                    The confirmation was declined from the dealership's mobile. Nothing was
                    recorded.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={startOver}>
                  Start over
                </Button>
              </div>
            </>
          ) : null}
        </motion.section>
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
                    className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">VIN decodes to</span>
                      <span className="text-base font-medium">{vehicleTitle(vehicle)}</span>
                      <span className="text-sm text-muted-foreground">
                        {vehicle.colour} · {vehicle.bodyStyle} · built {vehicle.decoded.plant}
                      </span>
                    </div>
                    <p className="border-t pt-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">No registration on file.</span>{" "}
                      This VIN has not been registered in any jurisdiction.
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
                    value={`${DEALER.name} · Dealer no. ${DEALER.number}`}
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

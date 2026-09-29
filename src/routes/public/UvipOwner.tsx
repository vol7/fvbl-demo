import { Check } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"

import { PhotoCapture } from "@/components/public/PhotoCapture"
import { PublicShell } from "@/components/public/PublicShell"
import { StepHeader, StepPanel } from "@/components/public/Stepper"
import { VinStep } from "@/components/public/VinStep"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateAuthorizationCode } from "@/lib/authorization"
import { formatDate, maskName } from "@/lib/format"
import { OWNER } from "@/regions/ca/people"
import { useSession } from "@/lib/session"
import { vehicleTitle, type Vehicle } from "@/lib/vehicles"
import { regionPaths } from "@/lib/paths"

const STEPS = ["Vehicle", "Identity", "Review"]
const CRUMBS = [
  { label: "ServiceOntario", to: "/serviceontario/" },
  { label: "Used Vehicle Information Package", to: regionPaths("ca").uvip },
  { label: "Registered owner" },
]

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  mono,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="lg"
        className={mono ? "font-mono tracking-wider" : undefined}
        autoComplete="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
      />
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

export function UvipOwner() {
  const [, dispatch] = useSession()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [licence, setLicence] = useState<string>(OWNER.licence)
  const [mobile, setMobile] = useState<string>(OWNER.mobile)
  const [photoOk, setPhotoOk] = useState(false)
  const [result, setResult] = useState<{ code: string; validUntil: string } | null>(null)

  function submit() {
    if (!vehicle) return
    const at = new Date()
    const code = generateAuthorizationCode()
    dispatch({
      type: "preapprove",
      vin: vehicle.vin,
      owner: vehicle.owner.name,
      authorizationCode: code,
      at: at.toISOString(),
    })
    const validUntil = new Date(at.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    setResult({ code, validUntil })
  }

  return (
    <PublicShell crumbs={CRUMBS}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Pre-approve a UVIP for your vehicle
          </h1>
          <p className="text-base text-muted-foreground">
            Confirm you are the registered owner and we will hold an authorization on file for 30
            days.
          </p>
        </div>

        {result && vehicle ? (
          <motion.section
            role="status"
            className="flex flex-col gap-5 rounded-xl border bg-card p-6"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white"
                initial={reduceMotion ? false : { scale: 0.25, filter: "blur(4px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              >
                <Check className="size-5" strokeWidth={3} aria-hidden />
              </motion.span>
              <h2 className="text-xl font-semibold tracking-tight">Pre-approval on file</h2>
            </div>
            <dl className="divide-y">
              <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
              <ReviewRow
                label="VIN"
                value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
              />
              <ReviewRow
                label="Reference"
                value={<span className="font-mono tracking-wider">{result.code}</span>}
              />
              <ReviewRow label="Valid until" value={formatDate(result.validUntil)} />
            </dl>
            <p className="text-sm text-muted-foreground">
              The buyer can now request the Used Vehicle Information Package at any ServiceOntario
              centre. The clerk will see this authorization when they look up the vehicle. We have
              sent a copy of this reference to your phone ending in {OWNER.mobileLast4}.
            </p>
            <a href="/serviceontario/" className={buttonVariants({ variant: "outline" })}>
              Back to ServiceOntario
            </a>
          </motion.section>
        ) : (
          <>
            <StepHeader steps={STEPS} current={step} />
            <StepPanel step={step}>
              {step === 0 ? (
                <VinStep
                  onFound={(v) => {
                    setVehicle(v)
                    setStep(1)
                  }}
                />
              ) : null}

              {step === 1 && vehicle ? (
                <form
                  className="flex flex-col gap-5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (photoOk) setStep(2)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Verify your identity</h2>
                    <p className="text-sm text-muted-foreground">
                      Your licence must match the registered owner of the {vehicleTitle(vehicle)}.
                    </p>
                  </div>
                  <Field
                    id="owner-licence"
                    label="Ontario driver's licence number"
                    value={licence}
                    onChange={setLicence}
                    hint="As printed on the front of your licence."
                    mono
                  />
                  <Field
                    id="owner-mobile"
                    label="Mobile number"
                    value={mobile}
                    onChange={setMobile}
                    hint="We will text your confirmation reference to this number."
                  />
                  <PhotoCapture onVerified={() => setPhotoOk(true)} />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button type="submit" size="lg" disabled={!photoOk}>
                      Continue
                    </Button>
                  </div>
                </form>
              ) : null}

              {step === 2 && vehicle ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Review and confirm</h2>
                    <p className="text-sm text-muted-foreground">
                      By confirming, you authorize ServiceOntario to issue a UVIP for this vehicle
                      to a buyer within the next 30 days.
                    </p>
                  </div>
                  <dl className="divide-y rounded-xl border bg-card px-5">
                    <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                    <ReviewRow
                      label="VIN"
                      value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                    />
                    <ReviewRow label="Registered owner" value={maskName(vehicle.owner.name)} />
                    <ReviewRow
                      label="Driver's licence"
                      value={<span className="font-mono tracking-wider">{licence}</span>}
                    />
                    <ReviewRow
                      label="Identity"
                      value={<span className="text-emerald-700">Verified</span>}
                    />
                    <ReviewRow label="Valid for" value="30 days" />
                  </dl>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" size="lg" onClick={submit}>
                      Confirm and pre-approve
                    </Button>
                  </div>
                </div>
              ) : null}
            </StepPanel>
          </>
        )}
      </div>
    </PublicShell>
  )
}

import { MessageSquareText } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"

import { PublicShell } from "@/components/public/PublicShell"
import { StepHeader, StepPanel } from "@/components/public/Stepper"
import { VinStep } from "@/components/public/VinStep"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateLinkToken, generateOtp } from "@/lib/authorization"
import { BUYER } from "@/regions/ca/people"
import { useSession } from "@/lib/session"
import { maskName } from "@/lib/format"
import { vehicleTitle, type Vehicle } from "@/lib/vehicles"
import { ReviewRow } from "./UvipOwner"
import { regionPaths } from "@/lib/paths"

const STEPS = ["Vehicle", "Your details", "Review"]
const CRUMBS = [
  { label: "ServiceOntario", to: "/serviceontario/" },
  { label: "Used Vehicle Information Package", to: regionPaths("ca").uvip },
  { label: "Buyer" },
]

export function UvipBuyer() {
  const [, dispatch] = useSession()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [name, setName] = useState<string>(BUYER.name)
  const [licence, setLicence] = useState<string>(BUYER.licence)
  const [mobile, setMobile] = useState<string>(BUYER.mobile)
  const [sent, setSent] = useState(false)

  function submit() {
    if (!vehicle) return
    dispatch({
      type: "buyerRequest",
      vin: vehicle.vin,
      buyer: name,
      otp: generateOtp(),
      link: generateLinkToken(),
      at: new Date().toISOString(),
    })
    setSent(true)
  }

  return (
    <PublicShell crumbs={CRUMBS}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Ask the owner to authorize a UVIP
          </h1>
          <p className="text-base text-muted-foreground">
            We will text the registered owner. Once they approve, the package can be issued to you
            at any ServiceOntario centre.
          </p>
        </div>

        {sent && vehicle ? (
          <motion.section
            role="status"
            className="flex flex-col gap-5 rounded-xl border bg-card p-6"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
                initial={reduceMotion ? false : { scale: 0.25, filter: "blur(4px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              >
                <MessageSquareText className="size-5" aria-hidden />
              </motion.span>
              <h2 className="text-xl font-semibold tracking-tight">Request sent to the owner</h2>
            </div>
            <dl className="divide-y">
              <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
              <ReviewRow
                label="VIN"
                value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
              />
              <ReviewRow label="Registered owner" value={maskName(vehicle.owner.name)} />
              <ReviewRow label="Texted to" value={`Phone ending in ${vehicle.owner.phoneLast4}`} />
              <ReviewRow label="Expires" value="24 hours" />
            </dl>
            <p className="text-sm text-muted-foreground">
              We will text you at {mobile} as soon as the owner responds. If they approve, bring
              your driver's licence to a ServiceOntario centre and the clerk will issue the package.
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
                    setStep(2)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Your details</h2>
                    <p className="text-sm text-muted-foreground">
                      The owner will see your name. Bring this licence to the counter.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="buyer-name">Full legal name</Label>
                    <Input
                      id="buyer-name"
                      autoComplete="off"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      size="lg"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="buyer-licence">Ontario driver's licence number</Label>
                    <Input
                      id="buyer-licence"
                      autoComplete="off"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      value={licence}
                      onChange={(e) => setLicence(e.target.value)}
                      size="lg"
                      className="font-mono tracking-wider"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="buyer-mobile">Mobile number</Label>
                    <Input
                      id="buyer-mobile"
                      autoComplete="off"
                      spellCheck={false}
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      size="lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      We will text you when the owner responds.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button type="submit" size="lg">
                      Continue
                    </Button>
                  </div>
                </form>
              ) : null}

              {step === 2 && vehicle ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Review and send</h2>
                    <p className="text-sm text-muted-foreground">
                      The registered owner will receive a text message with a link to approve or
                      decline. It expires in 24 hours.
                    </p>
                  </div>
                  <dl className="divide-y rounded-xl border bg-card px-5">
                    <ReviewRow label="Vehicle" value={vehicleTitle(vehicle)} />
                    <ReviewRow
                      label="VIN"
                      value={<span className="font-mono tracking-wider">{vehicle.vin}</span>}
                    />
                    <ReviewRow label="Registered owner" value={maskName(vehicle.owner.name)} />
                    <ReviewRow label="Your name" value={name} />
                    <ReviewRow
                      label="Driver's licence"
                      value={<span className="font-mono tracking-wider">{licence}</span>}
                    />
                    <ReviewRow label="Mobile" value={mobile} />
                  </dl>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" size="lg" onClick={submit}>
                      Send request to owner
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

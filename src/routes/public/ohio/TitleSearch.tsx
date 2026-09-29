import { CircleAlert, CircleCheck, Clock, FileCheck2, FileX2 } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useState } from "react"

import { StateShell } from "@/components/public/StateShell"
import { StepPanel } from "@/components/public/Stepper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateLinkToken, generateOtp, type AuthorizationState } from "@/lib/authorization"
import { formatTime, isValidVin, normalizeVin } from "@/lib/format"
import { useSession } from "@/lib/session"
import { submitOnEnter } from "@/lib/submitOnEnter"
import { cn } from "@/lib/utils"
import { findVehicle, sortedHistory, type Vehicle } from "@/lib/vehicles"
import { useRegion } from "@/regions"
import { TITLE_SEARCH as copy } from "@/regions/us/copy/public"

/** Title status only: the state of the vehicle's latest title, if it is Ohio's. */
function hasOhioTitle(vehicle: Vehicle): boolean {
  const titles = sortedHistory(vehicle).filter(
    (e) => e.kind === "firstTitle" || e.kind === "titleTransfer"
  )
  const latest = titles.at(-1)
  return latest?.state === "Ohio"
}

const INPUT_PROPS = {
  autoComplete: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
  size: "lg",
} as const

/**
 * The buyer's page (US shot 1a): look up a VIN on a mock of Ohio's title search,
 * then ask the registered owner to confirm the sale. The answer arrives live from
 * the owner's phone through the US session.
 */
export function TitleSearch() {
  const pack = useRegion()
  const [session, dispatch] = useSession()
  const [vin, setVin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [asking, setAsking] = useState(false)
  const [name, setName] = useState<string>(pack.people.buyer.name)
  const [mobile, setMobile] = useState<string>(pack.people.buyer.mobile)
  const [sentVin, setSentVin] = useState<string | null>(null)

  // A reset from the hub clears the request; the page goes back to its search.
  const request = sentVin ? session.authorizations[sentVin] : undefined

  function search() {
    if (!isValidVin(vin)) {
      setVehicle(null)
      return setError(copy.vin.invalid)
    }
    setError(null)
    setAsking(false)
    const found = findVehicle(pack, normalizeVin(vin))
    setVehicle(found ?? null)
    if (!found) setError(copy.vin.notFound)
    setSentVin(null)
  }

  function send() {
    if (!vehicle) return
    dispatch({
      type: "buyerRequest",
      vin: vehicle.vin,
      buyer: name,
      otp: generateOtp(),
      link: generateLinkToken(),
      at: new Date().toISOString(),
    })
    setSentVin(vehicle.vin)
    setAsking(false)
  }

  function startOver() {
    setVin("")
    setVehicle(null)
    setSentVin(null)
    setAsking(false)
  }

  const active = vehicle ? hasOhioTitle(vehicle) : false

  return (
    <StateShell crumbs={copy.crumbs}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-base text-muted-foreground">{copy.lede}</p>
        </div>

        {request && vehicle ? (
          <Answer state={request} vehicle={vehicle} onAgain={send} onSearch={startOver} />
        ) : (
          <StepPanel step={asking ? "ask" : "search"}>
            {!asking ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title-vin">{copy.vin.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="title-vin"
                      {...INPUT_PROPS}
                      className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                      maxLength={17}
                      placeholder={copy.vin.placeholder}
                      value={vin}
                      aria-invalid={error ? true : undefined}
                      aria-describedby="title-vin-hint"
                      onKeyDown={submitOnEnter(search)}
                      onChange={(e) => {
                        setVin(e.target.value.toUpperCase())
                        setError(null)
                        setVehicle(null)
                      }}
                    />
                    <Button type="button" size="lg" onClick={search}>
                      {copy.vin.search}
                    </Button>
                  </div>
                  <p
                    id="title-vin-hint"
                    className={cn("text-sm", error ? "text-destructive" : "text-muted-foreground")}
                  >
                    {error ?? copy.vin.hint}
                  </p>
                </div>

                {vehicle ? <TitleResult vehicle={vehicle} active={active} /> : null}

                {vehicle && active ? (
                  <section className="flex flex-col gap-3 rounded-lg border p-5">
                    <h2 className="text-lg font-semibold">{copy.ask.heading}</h2>
                    <p className="text-sm text-muted-foreground">{copy.ask.text}</p>
                    <div>
                      <Button type="button" size="lg" onClick={() => setAsking(true)}>
                        {copy.ask.start}
                      </Button>
                    </div>
                  </section>
                ) : null}
              </>
            ) : vehicle ? (
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">{copy.ask.heading}</h2>
                  <p className="text-sm text-muted-foreground">{copy.ask.text}</p>
                </div>
                <TitleResult vehicle={vehicle} active />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="buyer-name">{copy.ask.name}</Label>
                  <Input
                    id="buyer-name"
                    {...INPUT_PROPS}
                    value={name}
                    aria-describedby="buyer-name-hint"
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p id="buyer-name-hint" className="text-sm text-muted-foreground">
                    {copy.ask.nameHint}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="buyer-mobile">{copy.ask.mobile}</Label>
                  <Input
                    id="buyer-mobile"
                    {...INPUT_PROPS}
                    value={mobile}
                    aria-describedby="buyer-mobile-hint"
                    onChange={(e) => setMobile(e.target.value)}
                  />
                  <p id="buyer-mobile-hint" className="text-sm text-muted-foreground">
                    {copy.ask.mobileHint}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setAsking(false)}
                  >
                    {copy.ask.back}
                  </Button>
                  <Button type="submit" size="lg" disabled={!name.trim() || !mobile.trim()}>
                    {copy.ask.send}
                  </Button>
                </div>
              </form>
            ) : null}
          </StepPanel>
        )}
      </div>
    </StateShell>
  )
}

/** Year, make and model, and whether an Ohio title is active. Nothing else. */
function TitleResult({ vehicle, active }: { vehicle: Vehicle; active: boolean }) {
  const status = active ? copy.active : copy.notOhio
  const Icon = active ? FileCheck2 : FileX2
  return (
    <div role="status" className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
      <Icon
        className={cn("mt-0.5 size-5 shrink-0", active ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">{status.status}</span>
        <span className="text-sm">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </span>
        <span className="font-mono text-xs tracking-wider text-muted-foreground">
          {vehicle.vin}
        </span>
        <span className="text-sm text-muted-foreground">{status.detail}</span>
      </div>
    </div>
  )
}

/** The owner's answer, live. A missing answer is neutral, "Not me" is red. */
function Answer({
  state,
  vehicle,
  onAgain,
  onSearch,
}: {
  state: AuthorizationState
  vehicle: Vehicle
  onAgain: () => void
  onSearch: () => void
}) {
  const reduceMotion = useReducedMotion()

  let tone: "wait" | "good" | "bad" | "neutral" = "wait"
  let heading: string = copy.waiting.heading
  let text: string = copy.waiting.text
  let Icon = Clock
  if (state.status === "authorized") {
    tone = "good"
    heading = copy.confirmed.heading
    text = copy.confirmed.text(formatTime(state.approvedAt))
    Icon = CircleCheck
  } else if (state.status === "frozen" && state.reason === "denied") {
    tone = "bad"
    heading = copy.notMe.heading
    text = copy.notMe.text
    Icon = CircleAlert
  } else if (state.status === "frozen") {
    tone = "neutral"
    heading = copy.noReply.heading
    text = copy.noReply.text
  }

  return (
    <motion.section
      key={tone}
      role="status"
      aria-live="polite"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-6",
        tone === "good" && "border-emerald-600/40 bg-emerald-50",
        tone === "bad" && "border-destructive/40 bg-destructive/5"
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "good" && "bg-emerald-600 text-white",
            tone === "bad" && "bg-destructive text-white",
            (tone === "wait" || tone === "neutral") && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      </div>
      <p className="text-sm">
        {vehicle.year} {vehicle.make} {vehicle.model} ·{" "}
        <span className="font-mono tracking-wider">{vehicle.vin}</span>
      </p>
      <p className="text-sm text-muted-foreground">{text}</p>
      <div className="flex gap-2">
        {tone === "neutral" ? (
          <Button type="button" size="lg" onClick={onAgain}>
            {copy.noReply.again}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="lg" onClick={onSearch}>
          {copy.searchAgain}
        </Button>
      </div>
    </motion.section>
  )
}

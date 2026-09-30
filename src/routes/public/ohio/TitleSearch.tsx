import { ArrowRight, CircleAlert, CircleCheck, Clock, Info } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { FvblMark } from "@/components/FvblMark"
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
} as const

/**
 * The buyer's page (US shot 1a). The host is a generic state title search, the
 * service Ohio already runs: VIN in, title status out. FVBL adds one embedded module
 * under an active Ohio title, in its own style, where the buyer asks the
 * registered owner to confirm the sale. The answer arrives live from the owner's
 * phone through the US session.
 */
export function TitleSearch() {
  const pack = useRegion()
  const [vin, setVin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)

  function search() {
    if (!isValidVin(vin)) {
      setVehicle(null)
      return setError(copy.vin.invalid)
    }
    setError(null)
    const found = findVehicle(pack, normalizeVin(vin))
    setVehicle(found ?? null)
    if (!found) setError(copy.vin.notFound)
  }

  const active = vehicle ? hasOhioTitle(vehicle) : false

  // The result and the module sit below the fold at 1440x900: bring the search
  // box to the top once there is a result, as a real site would.
  const searchRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (!vehicle) return
    searchRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    })
  }, [vehicle, reduceMotion])

  return (
    <StateShell>
      <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-8 pt-14">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {copy.eyebrow}
          </span>
          <h1 className="font-display text-[64px] leading-[1.02] tracking-[-0.035em] text-balance lg:whitespace-nowrap">
            {copy.title}
          </h1>
          <p className="max-w-[34rem] text-xl leading-relaxed text-pretty text-muted-foreground">
            {copy.lede}
          </p>
        </div>

        <div ref={searchRef} className="flex scroll-mt-6 flex-col gap-3">
          <label htmlFor="title-vin" className="sr-only">
            {copy.vin.label}
          </label>
          <div
            className={cn(
              "flex h-[72px] items-center gap-2 rounded-full border bg-white pr-2 pl-7 shadow-[0_12px_40px_-12px_rgb(0_12_31/0.18)] transition-shadow focus-within:ring-4 focus-within:ring-ring/25",
              error ? "border-destructive" : "border-border"
            )}
          >
            <input
              id="title-vin"
              {...INPUT_PROPS}
              className="h-full min-w-0 flex-1 bg-transparent text-xl tracking-[0.06em] uppercase outline-none placeholder:tracking-normal placeholder:text-muted-foreground placeholder:normal-case"
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
            <Button
              type="button"
              aria-label={copy.vin.search}
              className="size-14 rounded-full hover:bg-primary/90"
              onClick={search}
            >
              <ArrowRight className="size-6" aria-hidden />
            </Button>
          </div>
          <p
            id="title-vin-hint"
            className={cn(
              "text-center",
              error ? "font-medium text-destructive" : "text-muted-foreground"
            )}
          >
            {error ?? copy.vin.hint}
          </p>
        </div>

        {vehicle ? <TitleResult vehicle={vehicle} active={active} /> : null}
        {vehicle && active ? <ConfirmEmbed key={vehicle.vin} vehicle={vehicle} /> : null}
      </div>
    </StateShell>
  )
}

/** The state's own result: whether an Ohio title is active, and the car. */
function TitleResult({ vehicle, active }: { vehicle: Vehicle; active: boolean }) {
  const status = active ? copy.active : copy.notOhio
  const Icon = active ? CircleCheck : Info
  return (
    <section
      role="status"
      className="flex flex-col gap-5 rounded-[1.75rem] border bg-white p-7 shadow-[0_12px_40px_-16px_rgb(0_12_31/0.14)]"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            active ? "bg-[#e3f1e6] text-[#1a7f37]" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="font-display text-[28px] leading-tight tracking-[-0.02em]">
          {status.status}
        </h2>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-t pt-5">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{copy.result.vehicle}</dt>
          <dd className="text-lg">{`${vehicle.year} ${vehicle.make} ${vehicle.model}`}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{copy.result.vin}</dt>
          <dd className="text-lg tracking-[0.06em]">{vehicle.vin}</dd>
        </div>
      </dl>
      {active ? null : <p className="text-muted-foreground">{copy.notOhio.detail}</p>}
    </section>
  )
}

/**
 * FVBL's module inside the state's page: the app's own tokens and type, a
 * "Powered by FVBL" foot. Closed, it's one offer; opened, it holds the whole ask.
 */
function ConfirmEmbed({ vehicle }: { vehicle: Vehicle }) {
  const pack = useRegion()
  const [session, dispatch] = useSession()
  const [asking, setAsking] = useState(false)
  const [sent, setSent] = useState(false)
  const [name, setName] = useState<string>(pack.people.buyer.name)
  const [mobile, setMobile] = useState<string>(pack.people.buyer.mobile)

  // A reset from the hub clears the request; the module goes back to its offer.
  const request = sent ? session.authorizations[vehicle.vin] : undefined

  function send() {
    dispatch({
      type: "buyerRequest",
      vin: vehicle.vin,
      buyer: name,
      otp: generateOtp(),
      link: generateLinkToken(),
      at: new Date().toISOString(),
    })
    setSent(true)
    setAsking(false)
  }

  const step = request ? "answer" : asking ? "ask" : "offer"

  return (
    <section
      aria-label={copy.embed.label}
      className="theme-fvbl overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      {/* The mark's own gradient, so the module reads as FVBL's, not the state's. */}
      <div className="h-1 bg-linear-to-r from-[#082F55] via-[#1F6FB2] to-[#6DBBF0]" aria-hidden />
      <div className="p-5">
        <StepPanel step={step}>
          {request ? (
            <Answer state={request} onAgain={send} />
          ) : asking ? (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <h2 className="text-lg font-semibold tracking-tight">{copy.ask.heading}</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="buyer-name">{copy.ask.name}</Label>
                <Input
                  id="buyer-name"
                  {...INPUT_PROPS}
                  size="lg"
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
                  size="lg"
                  value={mobile}
                  aria-describedby="buyer-mobile-hint"
                  onChange={(e) => setMobile(e.target.value)}
                />
                <p id="buyer-mobile-hint" className="text-sm text-muted-foreground">
                  {copy.ask.mobileHint}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setAsking(false)}>
                  {copy.ask.back}
                </Button>
                <Button type="submit" size="lg" disabled={!name.trim() || !mobile.trim()}>
                  {copy.ask.send}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold tracking-tight">{copy.ask.teaser}</h2>
                <p className="text-sm text-muted-foreground">{copy.ask.text}</p>
              </div>
              <div>
                <Button type="button" size="lg" onClick={() => setAsking(true)}>
                  {copy.ask.start}
                </Button>
              </div>
            </div>
          )}
        </StepPanel>
      </div>
      <footer className="flex items-center gap-1.5 border-t bg-muted/60 px-5 py-2.5 text-xs text-muted-foreground">
        <FvblMark className="h-4 w-auto" />
        {copy.embed.poweredBy}
      </footer>
    </section>
  )
}

/** The owner's answer, live. A missing answer is neutral, "Not me" is red. */
function Answer({ state, onAgain }: { state: AuthorizationState; onAgain: () => void }) {
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
    <motion.div
      key={tone}
      role="status"
      aria-live="polite"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-3 rounded-lg",
        tone === "good" && "-m-2 bg-emerald-50 p-2",
        tone === "bad" && "-m-2 bg-destructive/5 p-2"
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            tone === "good" && "bg-emerald-600 text-white",
            tone === "bad" && "bg-destructive text-white",
            (tone === "wait" || tone === "neutral") && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {tone === "neutral" ? (
        <div>
          <Button type="button" size="lg" onClick={onAgain}>
            {copy.noReply.again}
          </Button>
        </div>
      ) : null}
    </motion.div>
  )
}

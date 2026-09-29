import { ChevronLeft, Mic, Plus } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"

import { StatusBar } from "@/components/phone/PhoneChrome"
import { formatDate, formatTime } from "@/lib/format"
import { useSession } from "@/lib/session"
import { liveThread, type Thread } from "@/lib/thread"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import { vehicleTitle } from "@/lib/vehicles"
import { useRegion } from "@/regions"

const BUBBLE_ENTER = { duration: 0.22, ease: "easeOut" } as const

function Bubble({
  from,
  children,
  caption,
  delay = 0,
}: {
  /** The sender's messages sit left; whoever holds the phone (owner or dealership) sits right. */
  from: "sender" | "them"
  children: React.ReactNode
  caption?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  const them = from === "them"
  return (
    <motion.div
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...BUBBLE_ENTER, delay }}
      className={cn("flex flex-col gap-1", them ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[82%] px-3.5 py-2 text-[15px] leading-snug",
          them
            ? "rounded-[18px] rounded-br-[4px] bg-[#34c759] text-white"
            : "rounded-[18px] rounded-bl-[4px] bg-[#e9e9eb] text-black"
        )}
      >
        {children}
      </div>
      {caption ? <span className="px-1 text-[11px] text-neutral-500">{caption}</span> : null}
    </motion.div>
  )
}

function Separator({ children }: { children: React.ReactNode }) {
  return <div className="py-1 text-center text-[11px] font-medium text-neutral-500">{children}</div>
}

function Header() {
  const { phone } = useRegion().copy
  return (
    <div className="flex flex-col items-center gap-1 border-b border-black/10 bg-[#f6f6f7]/95 px-4 pt-1 pb-2.5 backdrop-blur">
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center text-[#0a84ff]">
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
          <span className="-ml-1 text-[15px]">Messages</span>
        </span>
        <span className="w-14" />
      </div>
      <div className="-mt-5 flex flex-col items-center gap-1">
        {/* Business sender: iOS shows the sender's icon, not a contact initial. The texts come
            from a name the owner already trusts; an unfamiliar "FVBL" reads as phishing. */}
        <span className="flex size-12 items-center justify-center rounded-[11px] bg-gradient-to-b from-[#0b3a6b] to-[#081527] text-[15px] font-bold tracking-wide text-white shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.18)]">
          {phone.senderIcon}
        </span>
        <span className="text-[12px] text-black">{phone.sender} ›</span>
      </div>
    </div>
  )
}

/** An older service message, so the thread does not start with the live request. */
function ContextBubble({ thread }: { thread: Thread | null }) {
  const { phone } = useRegion().copy
  if (thread?.kind === "registration") {
    // The dealership's phone: its previous registration, another vehicle.
    const { date, text } = phone.dealerHistory
    return (
      <>
        <Separator>{formatDate(date)}</Separator>
        <Bubble from="sender">{fill(text, { date: formatDate(date) })}</Bubble>
      </>
    )
  }
  const vehicle = thread?.vehicle
  const plate = vehicle?.plate ?? "CKXR 214"
  const renewed =
    vehicle?.history.filter((e) => e.kind === "renewal").at(-1)?.date ??
    vehicle?.registeredOn ??
    "2025-04-11"
  return (
    <>
      <Separator>{formatDate(renewed)}</Separator>
      <Bubble from="sender">{phone.ownerHistory(plate, formatDate(renewed))}</Bubble>
    </>
  )
}

/** The dealership is texted about its own submission and confirms it from the same link. */
function RegistrationThread({
  thread,
  onOpen,
}: {
  thread: Extract<Thread, { kind: "registration" }>
  onOpen: () => void
}) {
  const { vehicle, state } = thread
  const pack = useRegion()
  const { phone } = pack.copy
  return (
    <>
      <Separator>Today {formatTime(state.sentAt)}</Separator>
      <Bubble from="sender">
        {fill(
          phone.registrationRequest(state.dealer, vehicleTitle(vehicle), vehicle.vin.slice(-4)),
          {
            link: <SmsLink onClick={onOpen}>{pack.sms.link(state.link)}</SmsLink>,
          }
        )}
      </Bubble>

      {state.status === "registered" ? (
        <Bubble from="sender" delay={0.3}>
          {fill(phone.registrationConfirmed, {
            ref: <span className="font-semibold tracking-wide">{state.registrationRef}</span>,
          })}
        </Bubble>
      ) : null}

      {state.status === "declined" ? (
        <Bubble from="sender" delay={0.3}>
          {phone.registrationDeclined}
        </Bubble>
      ) : null}
    </>
  )
}

/** The tappable link inside a text. */
function SmsLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-normal break-all text-[#0a84ff] underline decoration-[#0a84ff]/60 underline-offset-2"
    >
      {children}
    </button>
  )
}

export function PhoneScreen() {
  const pack = useRegion()
  const { phone } = pack.copy
  const [session] = useSession()
  const navigate = useNavigate()
  const thread = liveThread(pack, session)

  return (
    <div
      aria-label={thread?.kind === "registration" ? "Dealership phone" : "Registered owner's phone"}
      role="region"
      className="flex h-full w-full flex-col bg-white text-black"
    >
      <StatusBar />
      <Header />

      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2.5 pt-3">
          <ContextBubble thread={thread} />

          <AnimatePresence initial={false}>
            {thread?.kind === "registration" ? (
              <motion.div
                key={`registration-${thread.state.sentAt}`}
                className="flex flex-col gap-2.5"
                initial={false}
              >
                <RegistrationThread thread={thread} onOpen={() => navigate("confirm")} />
              </motion.div>
            ) : null}

            {thread?.kind === "authorization" ? (
              <motion.div
                key={`thread-${thread.state.sentAt}`}
                className="flex flex-col gap-2.5"
                initial={false}
              >
                <Separator>Today {formatTime(thread.state.sentAt)}</Separator>
                <Bubble from="sender">
                  {fill(
                    phone.authorizationRequest(
                      vehicleTitle(thread.vehicle),
                      thread.vehicle.plate ?? "",
                      thread.state.requester
                    ),
                    {
                      link: (
                        <SmsLink onClick={() => navigate("confirm")}>
                          {pack.sms.link(thread.state.link)}
                        </SmsLink>
                      ),
                    }
                  )}
                </Bubble>

                {thread.state.status === "authorized" ? (
                  <Bubble from="sender" delay={0.3}>
                    {fill(phone.authorized, {
                      code: (
                        <span className="font-semibold tracking-wide">
                          {thread.state.authorizationCode}
                        </span>
                      ),
                    })}
                  </Bubble>
                ) : null}

                {thread.state.status === "frozen" && thread.state.reason === "denied" ? (
                  <Bubble from="sender" delay={0.3}>
                    {phone.denied}
                  </Bubble>
                ) : null}

                {thread.state.status === "frozen" && thread.state.reason === "timeout" ? (
                  <Bubble from="sender" delay={0.2}>
                    {phone.timeout}
                  </Bubble>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-black/10 bg-[#f6f6f7] px-3 pt-2.5 pb-7">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#e9e9eb] text-neutral-500">
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="flex h-9 flex-1 items-center justify-between rounded-full bg-white px-3.5 text-[15px] text-neutral-400 ring-1 ring-black/10">
            Text Message
            <Mic className="size-4 text-neutral-400" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}

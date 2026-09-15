import { ChevronLeft, Mic, Plus } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"

import { StatusBar } from "@/components/phone/PhoneChrome"
import { formatDate, formatTime } from "@/lib/format"
import { useSession } from "@/lib/session"
import { liveThread } from "@/lib/thread"
import { smsLink } from "@/lib/sms"
import { cn } from "@/lib/utils"
import { vehicleTitle, type Vehicle } from "@/lib/vehicles"

const BUBBLE_ENTER = { duration: 0.22, ease: "easeOut" } as const

function Bubble({
  from,
  children,
  caption,
  delay = 0,
}: {
  from: "fvbl" | "owner"
  children: React.ReactNode
  caption?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()
  const owner = from === "owner"
  return (
    <motion.div
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...BUBBLE_ENTER, delay }}
      className={cn("flex flex-col gap-1", owner ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[82%] px-3.5 py-2 text-[15px] leading-snug",
          owner
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
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-[#9a9ba0] to-[#7a7b80] text-[17px] font-semibold text-white">
          O
        </span>
        <span className="text-[12px] text-black">FVBL ›</span>
      </div>
    </div>
  )
}

function ContextBubble({ vehicle }: { vehicle: Vehicle | undefined }) {
  const plate = vehicle?.plate ?? "CKXR 214"
  const renewed =
    vehicle?.history.filter((e) => e.kind === "renewal").at(-1)?.date ??
    vehicle?.registeredOn ??
    "2025-04-11"
  return (
    <>
      <Separator>{formatDate(renewed)}</Separator>
      <Bubble from="fvbl">
        FVBL: Your Ontario registration for plate {plate} was renewed on {formatDate(renewed)}. No
        action is needed. Reply STOP to opt out of service messages.
      </Bubble>
    </>
  )
}

export function PhoneScreen() {
  const [session] = useSession()
  const navigate = useNavigate()
  const thread = liveThread(session)

  return (
    <div
      aria-label="Registered owner's phone"
      role="region"
      className="flex h-full w-full flex-col bg-white text-black"
    >
      <StatusBar />
      <Header />

      <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2.5 pt-3">
          <ContextBubble vehicle={thread?.vehicle} />

          <AnimatePresence initial={false}>
            {thread ? (
              <motion.div
                key={`thread-${thread.state.sentAt}`}
                className="flex flex-col gap-2.5"
                initial={false}
              >
                <Separator>Today {formatTime(thread.state.sentAt)}</Separator>
                <Bubble from="fvbl">
                  FVBL: A Used Vehicle Information Package was requested for your{" "}
                  {vehicleTitle(thread.vehicle)} (plate {thread.vehicle.plate}) by{" "}
                  {thread.state.requester}. Review and approve or decline:{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/phone/confirm")}
                    className="font-normal break-all text-[#0a84ff] underline decoration-[#0a84ff]/60 underline-offset-2"
                  >
                    {smsLink(thread.state.link)}
                  </button>
                  . Expires in 24 hours.
                </Bubble>

                {thread.state.status === "authorized" ? (
                  <Bubble from="fvbl" delay={0.3}>
                    Thanks — your authorization has been recorded. Reference{" "}
                    <span className="font-semibold tracking-wide">
                      {thread.state.authorizationCode}
                    </span>
                    . It is valid for 30 days.
                  </Bubble>
                ) : null}

                {thread.state.status === "frozen" && thread.state.reason === "denied" ? (
                  <Bubble from="fvbl" delay={0.3}>
                    Understood. The request was declined and the transaction has been flagged for
                    review. No package will be issued.
                  </Bubble>
                ) : null}

                {thread.state.status === "frozen" && thread.state.reason === "timeout" ? (
                  <Bubble from="fvbl" delay={0.2}>
                    This request expired with no response. The transaction has been frozen and
                    flagged for review.
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

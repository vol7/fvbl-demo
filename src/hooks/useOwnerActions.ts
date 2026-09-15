import { generateAuthorizationCode } from "@/lib/authorization"
import { generateRegistrationRef } from "@/lib/registration"
import { useSession } from "@/lib/session"
import { liveThread } from "@/lib/thread"

/**
 * Phone-side actions against the active request, for the hidden panel and the hub.
 * Approve and deny act on whatever the phone is showing: the owner's UVIP request
 * or the dealership's registration. Only a UVIP request can time out.
 */
export function useOwnerActions() {
  const [session, dispatch] = useSession()
  const thread = liveThread(session)
  const vin = thread?.vehicle.vin
  const registration = thread?.kind === "registration"
  const now = () => new Date().toISOString()
  return {
    session,
    thread,
    pending: thread?.state.status === "pending",
    canTimeout: thread?.kind === "authorization" && thread.state.status === "pending",
    approve: () => {
      if (!vin) return
      if (registration) {
        dispatch({
          type: "confirmRegistration",
          vin,
          registrationRef: generateRegistrationRef(new Date()),
          at: now(),
        })
      } else {
        dispatch({
          type: "approve",
          vin,
          authorizationCode: generateAuthorizationCode(),
          at: now(),
        })
      }
    },
    deny: () => {
      if (!vin) return
      if (registration) dispatch({ type: "declineRegistration", vin, at: now() })
      else dispatch({ type: "deny", vin, at: now() })
    },
    timeout: () => vin && !registration && dispatch({ type: "timeout", vin, at: now() }),
    reset: () => dispatch({ type: "clear" }),
  }
}

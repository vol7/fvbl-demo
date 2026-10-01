import { generateAuthorizationCode } from "@/lib/authorization"
import { generateExportRef } from "@/lib/exports"
import { generateRegistrationRef } from "@/lib/registration"
import { useSession } from "@/lib/session"
import { liveThread } from "@/lib/thread"
import { useRegion } from "@/regions"

/**
 * Phone-side actions against the active request, for the hidden panel and the hub.
 * Approve and deny act on whatever the phone is showing: the owner's UVIP request,
 * the dealership's registration, or the owner's answer about an export. A UVIP
 * request and an export can time out; a registration can't.
 */
export function useOwnerActions() {
  const pack = useRegion()
  const [session, dispatch] = useSession()
  const thread = liveThread(pack, session)
  const vin = thread?.vehicle.vin
  const registration = thread?.kind === "registration"
  const declared = thread?.kind === "export"
  const now = () => new Date().toISOString()
  return {
    session,
    thread,
    pending: thread?.state.status === "pending",
    canTimeout: thread?.kind !== "registration" && thread?.state.status === "pending",
    approve: () => {
      if (!vin) return
      if (declared) {
        dispatch({
          type: "confirmExport",
          vin,
          confirmationCode: generateAuthorizationCode(),
          at: now(),
        })
      } else if (registration) {
        dispatch({
          type: "confirmRegistration",
          vin,
          registrationRef: generateRegistrationRef(
            new Date(),
            Math.random,
            pack.references.registration
          ),
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
      if (declared) {
        if (!pack.border) return
        dispatch({
          type: "denyExport",
          vin,
          reference: generateExportRef(pack.border.refusalPrefix, new Date()),
          at: now(),
        })
      } else if (registration) {
        dispatch({ type: "declineRegistration", vin, at: now() })
      } else {
        dispatch({ type: "deny", vin, at: now() })
      }
    },
    timeout: () => {
      if (!vin || registration) return
      if (declared) dispatch({ type: "expireExport", vin, at: now() })
      else dispatch({ type: "timeout", vin, at: now() })
    },
    reset: () => dispatch({ type: "clear" }),
  }
}

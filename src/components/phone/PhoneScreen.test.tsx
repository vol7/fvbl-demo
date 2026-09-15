import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, NEW_VIN } from "@/lib/vehicles"
import { PhoneScreen } from "./PhoneScreen"

const T0 = "2026-09-09T18:14:00.000Z"
const LINK = "k7m2p9xq4tvn8bwz"

function openPending() {
  const store = getSessionStore()
  store.dispatch({
    type: "request",
    vin: CLEAN_VIN,
    canRequest: true,
    otp: "482 193",
    link: LINK,
    requester: "Marcus Beaulieu",
    at: T0,
  })
  return store
}

function renderPhone() {
  const router = createMemoryRouter(
    [
      { path: "/phone", element: <PhoneScreen /> },
      { path: "/phone/confirm", element: <div>confirm page</div> },
    ],
    { initialEntries: ["/phone"] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("PhoneScreen", () => {
  it("shows only the older context message while nothing is requested", () => {
    renderPhone()
    expect(screen.getByRole("region", { name: /registered owner/i })).toBeInTheDocument()
    expect(screen.getByText(/registration for plate/i)).toBeInTheDocument()
    expect(screen.queryByText(/used vehicle information package/i)).not.toBeInTheDocument()
  })

  it("names the requester, keeps the plate, and links with the alphanumeric token", async () => {
    openPending()
    const router = renderPhone()
    expect(screen.getByText(/\(plate CKXR 214\) by Marcus Beaulieu/)).toBeInTheDocument()
    const link = screen.getByRole("button", { name: `fvbl.on.ca/c/${LINK}` })
    await userEvent.click(link)
    expect(router.state.location.pathname).toBe("/phone/confirm")
  })

  it("uses the same wording for a request that came from ServiceOntario", () => {
    getSessionStore().dispatch({
      type: "buyerRequest",
      vin: CLEAN_VIN,
      buyer: "Marcus Beaulieu",
      otp: "111 222",
      link: LINK,
      at: T0,
    })
    renderPhone()
    expect(screen.getByText(/by Marcus Beaulieu/)).toBeInTheDocument()
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
  })

  it("shows the confirmation bubble with the reference once authorized", () => {
    const store = openPending()
    store.dispatch({ type: "approve", vin: CLEAN_VIN, authorizationCode: "OV-7K2M-9Q3F", at: T0 })
    renderPhone()
    expect(screen.getByText("OV-7K2M-9Q3F")).toBeInTheDocument()
    expect(screen.getByText(/authorization has been recorded/i)).toBeInTheDocument()
  })

  it("shows nothing new for an owner pre-approval, since no SMS was sent", () => {
    getSessionStore().dispatch({
      type: "preapprove",
      vin: CLEAN_VIN,
      owner: "Daniel Okafor",
      authorizationCode: "OV-AAAA-BBBB",
      at: T0,
    })
    renderPhone()
    expect(screen.queryByText(/used vehicle information package/i)).not.toBeInTheDocument()
  })
})

describe("PhoneScreen during a first registration", () => {
  const submission = {
    dealer: "Mercedes-Benz Downtown",
    dealerMobileLast4: "2204",
    nvis: "NVIS 2026-MB-0187342",
    deliveryKm: 12,
    firstOwner: "Léa Tremblay",
  }
  function submitRegistration() {
    const store = getSessionStore()
    store.dispatch({
      type: "submitRegistration",
      vin: NEW_VIN,
      submission,
      otp: "111 222",
      link: LINK,
      at: T0,
    })
    return store
  }

  it("becomes the dealership's phone and reads the submission back", async () => {
    submitRegistration()
    const router = renderPhone()
    expect(screen.getByRole("region", { name: /dealership phone/i })).toBeInTheDocument()
    expect(screen.queryByText(/registration for plate/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        /Mercedes-Benz Downtown submitted the first registration of a 2026 Mercedes-Benz GLE 450/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/used vehicle information package/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: `fvbl.on.ca/c/${LINK}` }))
    expect(router.state.location.pathname).toBe("/phone/confirm")
  })

  it("confirms with the reference and says the ledger is open", () => {
    const store = submitRegistration()
    store.dispatch({
      type: "confirmRegistration",
      vin: NEW_VIN,
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: T0,
    })
    renderPhone()
    expect(screen.getByText("FVBL-R-2026-09-15-0417")).toBeInTheDocument()
    expect(screen.getByText(/ledger has been opened/i)).toBeInTheDocument()
  })

  it("acknowledges a declined submission", () => {
    const store = submitRegistration()
    store.dispatch({ type: "declineRegistration", vin: NEW_VIN, at: T0 })
    renderPhone()
    expect(screen.getByText(/submission has been withdrawn/i)).toBeInTheDocument()
  })
})

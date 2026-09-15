import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN } from "@/lib/vehicles"
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

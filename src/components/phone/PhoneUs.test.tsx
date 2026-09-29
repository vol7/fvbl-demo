import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { RegionProvider } from "@/regions/RegionRoot"
import { CLEAN_VIN, NEW_VIN } from "@/regions/us/vehicles"
import { ConfirmPage } from "./ConfirmPage"
import { PhoneScreen } from "./PhoneScreen"

const T0 = "2026-09-29T18:14:00.000Z"
const LINK = "q4tvn8bwzk7m2p9x"

/** Anything that asks the owner for personal information, a login or money. */
const ASKS_FOR = /\b(enter|password|sign in|log in to|ssn|social security|card number|pay now)\b/i

function renderUsPhone(path: "/phone" | "/phone/confirm") {
  const router = createMemoryRouter(
    [
      { path: "/phone", element: <PhoneScreen /> },
      { path: "/phone/confirm", element: <ConfirmPage /> },
    ],
    { initialEntries: [path] }
  )
  render(
    <RegionProvider region="us">
      <RouterProvider router={router} />
    </RegionProvider>
  )
  return router
}

function buyerAsks() {
  const store = getSessionStore("us")
  store.dispatch({
    type: "buyerRequest",
    vin: CLEAN_VIN,
    buyer: "Tyler Brooks",
    otp: "482 193",
    link: LINK,
    at: T0,
  })
  return store
}

describe("US phone: the owner's title alert", () => {
  it("opens on the title-alert opt-in, from the state, not FVBL", () => {
    renderUsPhone("/phone")
    expect(screen.getByText("Ohio Title Alert ›")).toBeInTheDocument()
    expect(screen.getByText(/You turned on title alerts for your 2023 Mercedes-AMG GLE 53/)).toBeInTheDocument()
    expect(screen.getByText(/VIN …5518/)).toBeInTheDocument()
  })

  it("names the car, the VIN's last four and the buyer by first name and initial", async () => {
    buyerAsks()
    const router = renderUsPhone("/phone")
    expect(
      screen.getByText(/A buyer, Tyler B\., asked you to confirm the sale of your 2023 Mercedes-AMG GLE 53 .*\(VIN …5518\)/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Tyler Brooks/)).not.toBeInTheDocument()
    expect(screen.queryByText(ASKS_FOR)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: `fvbl.us/c/${LINK}` }))
    expect(router.state.location.pathname).toBe("/phone/confirm")
  })

  it("asks for nothing on the confirm page and approves", async () => {
    const store = buyerAsks()
    renderUsPhone("/phone/confirm")
    expect(screen.getByRole("heading", { name: "Confirm the sale of your vehicle?" })).toBeInTheDocument()
    expect(screen.getByText("This page never asks you to log in, show ID or pay.")).toBeInTheDocument()
    expect(screen.getByText("…5518")).toBeInTheDocument()
    expect(screen.getByText("Tyler B.")).toBeInTheDocument()
    expect(screen.queryByText(/plate/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Approve" }))
    expect(store.getState().authorizations[CLEAN_VIN]?.status).toBe("authorized")
    expect(await screen.findByRole("heading", { name: "Sale confirmed" })).toBeInTheDocument()
  })

  it("'Not me' declines, and says the clerk will see it", async () => {
    const store = buyerAsks()
    renderUsPhone("/phone/confirm")
    await userEvent.click(screen.getByRole("button", { name: "Not me" }))
    const state = store.getState().authorizations[CLEAN_VIN]
    expect(state?.status === "frozen" && state.reason).toBe("denied")
    expect(await screen.findByRole("heading", { name: "Thanks for telling us" })).toBeInTheDocument()
    expect(screen.getByText(/the clerk will see that you said this sale isn't yours/)).toBeInTheDocument()
  })
})

describe("US phone: the dealership confirms a first title", () => {
  function submit() {
    const store = getSessionStore("us")
    store.dispatch({
      type: "submitRegistration",
      vin: NEW_VIN,
      submission: {
        dealer: "Scioto Ridge Motorcars",
        dealerMobileLast4: "0155",
        sourceDocument: { label: "Manufacturer's certificate of origin", number: "MCO 2026-0418826" },
        deliveryKm: 12,
        firstOwner: "Jordan Whitfield",
        titleAlerts: { mobileLast4: "0193" },
      },
      otp: "111 222",
      link: LINK,
      at: T0,
    })
    return store
  }

  it("reads back the first owner and the title alerts in the text", () => {
    submit()
    renderUsPhone("/phone")
    expect(
      screen.getByText(/first title application for a .* for Jordan Whitfield, with title alerts on for mobile ending 0193/)
    ).toBeInTheDocument()
  })

  it("shows the certificate of origin and title alerts on the confirm page", () => {
    submit()
    renderUsPhone("/phone/confirm")
    expect(screen.getByRole("heading", { name: "Confirm a first title application?" })).toBeInTheDocument()
    expect(screen.getByText("MCO 2026-0418826")).toBeInTheDocument()
    expect(screen.getByText("On for mobile ending 0193")).toBeInTheDocument()
  })
})

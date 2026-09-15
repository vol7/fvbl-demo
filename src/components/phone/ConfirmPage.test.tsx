import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, NEW_VIN } from "@/lib/vehicles"
import { ConfirmPage } from "./ConfirmPage"

const T0 = "2026-09-09T18:14:00.000Z"
const LINK = "k7m2p9xq4tvn8bwz"

function renderConfirm() {
  const router = createMemoryRouter(
    [
      { path: "/phone/confirm", element: <ConfirmPage /> },
      { path: "/phone", element: <div>thread</div> },
    ],
    { initialEntries: ["/phone/confirm"] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("ConfirmPage", () => {
  it("explains an inactive link when nothing is pending", () => {
    renderConfirm()
    expect(screen.getByText(/no longer active/i)).toBeInTheDocument()
  })

  it("shows the requester by name only, then approves the active vehicle", async () => {
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
    renderConfirm()
    expect(screen.getByText("2023 Mercedes-AMG GLE 63 S 4MATIC+")).toBeInTheDocument()
    expect(screen.getByText("Marcus Beaulieu")).toBeInTheDocument()
    expect(screen.queryByText(/in person|online via/i)).not.toBeInTheDocument()
    expect(screen.getByText(`fvbl.on.ca/c/${LINK}`)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Approve" }))
    expect(store.getState().authorizations[CLEAN_VIN].status).toBe("authorized")
    expect(await screen.findByText("Authorization recorded")).toBeInTheDocument()
  })

  it("declines, and offers no in-page way back to Messages", async () => {
    const store = getSessionStore()
    store.dispatch({
      type: "buyerRequest",
      vin: CLEAN_VIN,
      buyer: "Marcus Beaulieu",
      otp: "1",
      link: LINK,
      at: T0,
    })
    renderConfirm()
    await userEvent.click(screen.getByRole("button", { name: "Decline" }))
    expect(store.getState().authorizations[CLEAN_VIN]).toMatchObject({
      status: "frozen",
      reason: "denied",
    })
    expect(await screen.findByText("Request declined")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /back to messages/i })).not.toBeInTheDocument()
  })

  it("the browser back chevron still returns to the thread", async () => {
    const router = renderConfirm()
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(router.state.location.pathname).toBe("/phone")
  })
})

describe("ConfirmPage for a first registration", () => {
  function submitRegistration() {
    const store = getSessionStore()
    store.dispatch({
      type: "submitRegistration",
      vin: NEW_VIN,
      submission: {
        dealer: "Mercedes-Benz Downtown",
        dealerMobileLast4: "2204",
        nvis: "NVIS 2026-MB-0187342",
        deliveryKm: 12,
        firstOwner: "Léa Tremblay",
      },
      otp: "111 222",
      link: LINK,
      at: T0,
    })
    return store
  }

  it("asks the dealership to confirm, showing NVIS and first owner, then records it", async () => {
    const store = submitRegistration()
    renderConfirm()
    expect(screen.getByRole("region", { name: /dealer confirmation/i })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /confirm a first registration/i })
    ).toBeInTheDocument()
    expect(screen.getByText("2026 Mercedes-Benz GLE 450 4MATIC")).toBeInTheDocument()
    expect(screen.getByText("Mercedes-Benz Downtown")).toBeInTheDocument()
    expect(screen.getByText("Léa Tremblay")).toBeInTheDocument()
    expect(screen.getByText("NVIS 2026-MB-0187342")).toBeInTheDocument()
    expect(screen.queryByText(/plate/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(store.getState().registrations[NEW_VIN].status).toBe("registered")
    expect(await screen.findByText("Registration recorded")).toBeInTheDocument()
    expect(screen.getByText(/^FVBL-R-\d{4}-\d{2}-\d{2}-\d{4}$/)).toBeInTheDocument()
  })

  it("declines the submission", async () => {
    const store = submitRegistration()
    renderConfirm()
    await userEvent.click(screen.getByRole("button", { name: "Decline" }))
    expect(store.getState().registrations[NEW_VIN].status).toBe("declined")
    expect(await screen.findByText("Submission declined")).toBeInTheDocument()
  })
})

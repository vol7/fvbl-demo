import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN } from "@/lib/vehicles"
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

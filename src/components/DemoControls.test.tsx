import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, NEW_VIN } from "@/lib/vehicles"
import { DemoControls, OwnerActionButtons } from "./DemoControls"

function openPending() {
  const store = getSessionStore()
  store.dispatch({
    type: "request",
    vin: CLEAN_VIN,
    canRequest: true,
    otp: "482 193",
    link: "k7m2p9xq4tvn8bwz",
    requester: "Marcus B.",
    at: new Date().toISOString(),
  })
  return store
}

describe("DemoControls", () => {
  it("is hidden until Shift+D is pressed, and toggles back off", async () => {
    render(<DemoControls />)
    expect(screen.queryByRole("region", { name: /demo controls/i })).not.toBeInTheDocument()
    await userEvent.keyboard("{Shift>}D{/Shift}")
    expect(screen.getByRole("region", { name: /demo controls/i })).toBeInTheDocument()
    await userEvent.keyboard("{Shift>}D{/Shift}")
    expect(screen.queryByRole("region", { name: /demo controls/i })).not.toBeInTheDocument()
  })

  it("does not toggle when typing in an input", async () => {
    render(<input aria-label="field" />)
    render(<DemoControls />)
    await userEvent.click(screen.getByLabelText("field"))
    await userEvent.keyboard("{Shift>}D{/Shift}")
    expect(screen.queryByRole("region", { name: /demo controls/i })).not.toBeInTheDocument()
  })

  it("approves the active request through the shared session", async () => {
    const store = openPending()
    render(<DemoControls />)
    await userEvent.keyboard("{Shift>}D{/Shift}")
    await userEvent.click(screen.getByRole("button", { name: /owner approves/i }))
    expect(store.getState().authorizations[CLEAN_VIN].status).toBe("authorized")
  })

  it("denies, then resets everything", async () => {
    const store = openPending()
    render(<DemoControls />)
    await userEvent.keyboard("{Shift>}D{/Shift}")
    await userEvent.click(screen.getByRole("button", { name: /owner denies/i }))
    expect(store.getState().authorizations[CLEAN_VIN]).toMatchObject({
      status: "frozen",
      reason: "denied",
    })
    await userEvent.click(screen.getByRole("button", { name: /reset session/i }))
    expect(store.getState()).toEqual({ authorizations: {}, registrations: {}, activeVin: null })
  })

  it("disables owner actions when nothing is pending", async () => {
    render(<DemoControls />)
    await userEvent.keyboard("{Shift>}D{/Shift}")
    expect(screen.getByRole("button", { name: /owner approves/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /owner denies/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /simulate 24h timeout/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /reset session/i })).toBeEnabled()
  })
})

describe("OwnerActionButtons during a first registration", () => {
  it("approves and denies the dealer submission through the same buttons", async () => {
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
      otp: "1",
      link: "k7m2p9xq4tvn8bwz",
      at: "2026-09-15T14:02:00.000Z",
    })
    render(<OwnerActionButtons />)
    expect(screen.getByRole("button", { name: /simulate 24h timeout/i })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: /owner approves/i }))
    expect(store.getState().registrations[NEW_VIN].status).toBe("registered")
  })
})

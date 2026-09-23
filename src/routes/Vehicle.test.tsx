import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, NEW_VIN } from "@/lib/vehicles"
import { Vehicle } from "./Vehicle"
import { paths } from "@/lib/paths"

function renderVehicle(vin: string) {
  const router = createMemoryRouter(
    [
      { path: paths.portal.vehiclePattern, element: <Vehicle /> },
      { path: paths.portal.lookup, element: <div>lookup page</div> },
    ],
    { initialEntries: [paths.portal.vehicle(vin)] }
  )
  render(<RouterProvider router={router} />)
  return router
}

// The page runs the record checks when it opens; the verdict shows once every source has answered.
const settle = () =>
  waitFor(() => expect(screen.queryByText("Running record checks")).not.toBeInTheDocument(), {
    timeout: 4000,
  })

async function request() {
  await userEvent.click(screen.getByRole("button", { name: /request owner authorization/i }))
  await userEvent.click(await screen.findByRole("button", { name: "Send request" }))
}

describe("Vehicle route", () => {
  it("shows the identity and keeps the owner hidden until revealed", async () => {
    renderVehicle(CLEAN_VIN)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2023 Mercedes-AMG GLE 63 S 4MATIC+"
    )
    expect(screen.getAllByText("CKXR 214").length).toBeGreaterThan(0)
    expect(screen.queryByText("Daniel Okafor")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Show owner name" }))
    expect(screen.getByText("Daniel Okafor")).toBeInTheDocument()
  })

  it("opens on record checks and switches tabs through the URL", async () => {
    const router = renderVehicle(CLEAN_VIN)
    expect(screen.getByRole("tab", { name: /record checks/i })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByText("Import and export record")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("tab", { name: /vehicle history/i }))
    expect(router.state.location.search).toBe("?tab=history")
    expect(await screen.findByText("Entered Canada from United States")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText("Import and export record")).not.toBeInTheDocument()
    )
    await userEvent.click(screen.getByRole("tab", { name: /ownership/i }))
    expect(await screen.findByRole("heading", { name: "Registered owner" })).toBeInTheDocument()
  })

  it("runs the checks, then summarises the record in the header card", async () => {
    renderVehicle(CLEAN_VIN)
    expect(screen.getByText("Running record checks")).toBeInTheDocument()
    await settle()
    const card = screen.getByRole("region", { name: "Package decision" })
    expect(within(card).getByText("Checks clear")).toBeInTheDocument()
    expect(within(card).getByText("All 9 passed")).toBeInTheDocument()
    expect(within(card).getByText("Not yet requested")).toBeInTheDocument()
    expect(screen.getByText("All 9 sources answered in 1.8 s")).toBeInTheDocument()
    expect(screen.getAllByText("Blockchain certified").length).toBeGreaterThan(0)
    expect(screen.getAllByText("CBSA").length).toBeGreaterThan(0)
  })

  it("tells the border story for the exported vehicle", async () => {
    renderVehicle(EXPORTED_VIN)
    await settle()
    const card = screen.getByRole("region", { name: "Package decision" })
    expect(within(card).getByText("Package cannot be issued")).toBeInTheDocument()
    expect(within(card).getByText("1 of 9 failed, 1 high risk")).toBeInTheDocument()
    expect(card).toHaveTextContent(/CBSA recorded an export on March 18, 2025/)
    expect(card).toHaveTextContent(/Transport Canada has no re-entry/)
    expect(
      screen.queryByRole("button", { name: /request owner authorization/i })
    ).not.toBeInTheDocument()
  })

  it("verdict follows the session: pending shows awaiting owner", async () => {
    renderVehicle(CLEAN_VIN)
    await settle()
    await request()
    expect(await screen.findByText("Awaiting owner")).toBeInTheDocument()
    expect(screen.getByText(/Awaiting reply, expires in/)).toBeInTheDocument()
  })

  it("shows not-found for an unknown VIN with a way back", () => {
    renderVehicle("1HGCM82633A004352")
    expect(screen.getByText(/no record found/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /back to lookup/i })).toHaveAttribute(
      "href",
      paths.portal.lookup
    )
  })

  it("opening a vehicle writes nothing to the session", () => {
    renderVehicle(CLEAN_VIN)
    expect(getSessionStore().getState()).toEqual({
      authorizations: {},
      registrations: {},
      activeVin: null,
    })
  })

  it("requesting records the applicant and makes this vehicle the active one", async () => {
    renderVehicle(CLEAN_VIN)
    await settle()
    await request()
    const s = getSessionStore().getState()
    expect(s.activeVin).toBe(CLEAN_VIN)
    expect(s.authorizations[CLEAN_VIN]).toMatchObject({
      status: "pending",
      origin: "clerk",
      requester: "Marcus Beaulieu",
    })
    expect(s.authorizations[CLEAN_VIN]).toHaveProperty(
      "link",
      expect.stringMatching(/^[a-z2-9]{16}$/)
    )
    expect(await screen.findByText("Waiting for the registered owner")).toBeInTheDocument()
  })

  it("REGRESSION: a pending request survives opening another vehicle and coming back", async () => {
    const router = renderVehicle(CLEAN_VIN)
    await settle()
    await request()
    await router.navigate(paths.portal.vehicle(CLONED_VIN))
    expect(await screen.findByRole("heading", { name: /highlander/i })).toBeInTheDocument()
    await router.navigate(paths.portal.vehicle(CLEAN_VIN))
    await settle()
    expect(await screen.findByText("Waiting for the registered owner")).toBeInTheDocument()
    expect(getSessionStore().getState().authorizations[CLEAN_VIN].status).toBe("pending")
  })

  it("REGRESSION: two vehicles hold state independently", async () => {
    const router = renderVehicle(CLONED_VIN)
    await settle()
    await userEvent.click(screen.getByRole("button", { name: /escalate to law enforcement/i }))
    await router.navigate(paths.portal.vehicle(CLEAN_VIN))
    expect(await screen.findByRole("heading", { name: /mercedes/i })).toBeInTheDocument()
    await settle()
    await request()
    const s = getSessionStore().getState()
    expect(s.authorizations[CLONED_VIN].status).toBe("escalated")
    expect(s.authorizations[CLEAN_VIN].status).toBe("pending")
  })

  it("starts blocked for the cloned vehicle and can escalate", async () => {
    renderVehicle(CLONED_VIN)
    await settle()
    await userEvent.click(screen.getByRole("button", { name: /escalate to law enforcement/i }))
    expect(await screen.findByText("Sent to law enforcement for review")).toBeInTheDocument()
    expect(screen.getAllByText(/^FVBL-\d{4}-\d{2}-\d{2}-\d{4}$/).length).toBeGreaterThan(0)
  })

  it("reflects an approval made from another surface, then issues the package", async () => {
    renderVehicle(CLEAN_VIN)
    await settle()
    await request()
    getSessionStore().dispatch({
      type: "approve",
      vin: CLEAN_VIN,
      authorizationCode: "OV-7K2M-9Q3F",
      at: new Date().toISOString(),
    })
    expect(
      await screen.findByText("The registered owner approved this request")
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Issue package" }))
    // The number shows in the card and again in the activity feed.
    expect(await screen.findAllByText(/^UVIP-\d{4}-\d{2}-\d{2}-\d{4}$/)).not.toHaveLength(0)
  })

  it("freezes when the owner denies", async () => {
    renderVehicle(CLEAN_VIN)
    await settle()
    await request()
    getSessionStore().dispatch({ type: "deny", vin: CLEAN_VIN, at: new Date().toISOString() })
    expect(await screen.findByText("The registered owner denied this request")).toBeInTheDocument()
  })
})

describe("Vehicle route for a brand-new VIN", () => {
  const submission = {
    dealer: "Mercedes-Benz Downtown",
    dealerMobileLast4: "2204",
    nvis: "NVIS 2026-MB-0187342",
    deliveryKm: 12,
    firstOwner: "Léa Tremblay",
  }
  const T0 = "2026-09-15T14:02:00.000Z"

  it("shows an unregistered card, not a record, before any submission", () => {
    renderVehicle(NEW_VIN)
    expect(screen.getByText(/no registration on file/i)).toBeInTheDocument()
    expect(screen.getByText("2026 Mercedes-Benz GLE 450 4MATIC")).toBeInTheDocument()
    expect(screen.queryByRole("tab")).not.toBeInTheDocument()
    expect(screen.queryByText("Checks clear")).not.toBeInTheDocument()
    expect(screen.queryByText("Running record checks")).not.toBeInTheDocument()
    expect(screen.queryByText(/awaiting confirmation/i)).not.toBeInTheDocument()
  })

  it("mentions a pending dealer submission, then resolves into the full record live", async () => {
    const store = getSessionStore()
    store.dispatch({
      type: "submitRegistration",
      vin: NEW_VIN,
      submission,
      otp: "1",
      link: "k7m2p9xq4tvn8bwz",
      at: T0,
    })
    renderVehicle(NEW_VIN)
    expect(screen.getByText(/dealer submission is awaiting confirmation/i)).toBeInTheDocument()

    // Confirmed now, as it is in the demo: the ledger line must read "Checked just now".
    store.dispatch({
      type: "confirmRegistration",
      vin: NEW_VIN,
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: new Date().toISOString(),
    })
    // The record replaces the card, then runs its checks.
    expect(await screen.findByText("Running record checks")).toBeInTheDocument()
    await settle()
    expect(screen.getByText("Checks clear")).toBeInTheDocument()
    expect(screen.getByText("All 9 passed")).toBeInTheDocument()
    expect(screen.getAllByText("Not yet plated").length).toBeGreaterThan(0)
    expect(screen.getByRole("tab", { name: /vehicle history/i })).toHaveTextContent("2")
    // A vehicle born seconds ago has no inspection yet and was verified just now.
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument()
    expect(screen.getByText("None yet")).toBeInTheDocument()
    expect(screen.getByText("Checked just now")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: /vehicle history/i }))
    // Once in the lifecycle strip, once in the list.
    expect(await screen.findAllByText("First registration")).toHaveLength(2)
    expect(screen.getByText(/ledger opened/i)).toBeInTheDocument()
    expect(screen.getByText("Submitted by Mercedes-Benz Downtown")).toBeInTheDocument()
    expect(screen.getByText("First registration recorded")).toBeInTheDocument()
  })
})

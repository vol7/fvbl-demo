import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN } from "@/lib/vehicles"
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

const requestButton = () => screen.getByRole("button", { name: /request owner authorization/i })

describe("Vehicle route", () => {
  it("shows the vehicle identity and masked owner", () => {
    renderVehicle(CLEAN_VIN)
    expect(
      screen.getByRole("heading", { name: "2023 Mercedes-AMG GLE 63 S 4MATIC+" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("D***** O*****").length).toBeGreaterThan(0)
    expect(screen.getAllByText("CKXR 214").length).toBeGreaterThan(0)
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
    expect(await screen.findByText("Entered Canada")).toBeInTheDocument()
    expect(screen.queryByText("Import and export record")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("tab", { name: /ownership/i }))
    expect(await screen.findByText("Registration class")).toBeInTheDocument()
  })

  it("summarises the record in the header: verdict, tiles, sources", () => {
    renderVehicle(CLEAN_VIN)
    expect(screen.getByText("Checks clear")).toBeInTheDocument()
    expect(screen.getByText("All 8 checks passed")).toBeInTheDocument()
    expect(screen.getByText("Not yet requested")).toBeInTheDocument()
    expect(screen.getByText("Blockchain certified")).toBeInTheDocument()
    expect(screen.getByText("Sources consulted")).toBeInTheDocument()
    expect(screen.getAllByText("CBSA").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Transport Canada").length).toBeGreaterThan(0)
  })

  it("tells the border story for the exported vehicle", () => {
    renderVehicle(EXPORTED_VIN)
    expect(screen.getByText("Cannot be issued")).toBeInTheDocument()
    expect(screen.getByText("1 high-risk flag")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(/recorded as having left Canada/)
    expect(screen.getByRole("alert")).toHaveTextContent(/CBSA recorded an export on March 18, 2025/)
    expect(screen.getByRole("alert")).toHaveTextContent(/Transport Canada has no re-entry/)
    expect(screen.queryByRole("button", { name: /request owner authorization/i })).toBeDisabled()
  })

  it("verdict follows the session: pending shows awaiting owner", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(requestButton())
    // Once in the verdict pill, once in the authorization tile.
    expect(screen.getAllByText("Awaiting owner")).toHaveLength(2)
    expect(screen.getAllByText(/expires in/i).length).toBeGreaterThan(0)
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
    expect(getSessionStore().getState()).toEqual({ authorizations: {}, activeVin: null })
  })

  it("requesting records the applicant and makes this vehicle the active one", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(requestButton())
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
    expect(screen.getByText("Request sent to registered owner")).toBeInTheDocument()
  })

  it("REGRESSION: a pending request survives opening another vehicle and coming back", async () => {
    const router = renderVehicle(CLEAN_VIN)
    await userEvent.click(requestButton())
    await router.navigate(paths.portal.vehicle(CLONED_VIN))
    expect(await screen.findByRole("heading", { name: /highlander/i })).toBeInTheDocument()
    await router.navigate(paths.portal.vehicle(CLEAN_VIN))
    expect(await screen.findByText("Request sent to registered owner")).toBeInTheDocument()
    expect(getSessionStore().getState().authorizations[CLEAN_VIN].status).toBe("pending")
  })

  it("REGRESSION: two vehicles hold state independently", async () => {
    const router = renderVehicle(CLONED_VIN)
    await userEvent.click(
      await screen.findByRole("button", { name: /escalate to law enforcement/i }, { timeout: 3000 })
    )
    await router.navigate(paths.portal.vehicle(CLEAN_VIN))
    // Wait for the new page; the previous one's disabled button matches the same name.
    expect(await screen.findByRole("heading", { name: /mercedes/i })).toBeInTheDocument()
    const request = screen.getByRole("button", { name: /request owner authorization/i })
    expect(request).toBeEnabled()
    await userEvent.click(request)
    const s = getSessionStore().getState()
    expect(s.authorizations[CLONED_VIN].status).toBe("escalated")
    expect(s.authorizations[CLEAN_VIN].status).toBe("pending")
  })

  it("starts blocked for the cloned vehicle and can escalate", async () => {
    renderVehicle(CLONED_VIN)
    expect(requestButton()).toBeDisabled()
    await userEvent.click(
      await screen.findByRole("button", { name: /escalate to law enforcement/i }, { timeout: 3000 })
    )
    const boxes = screen.getAllByRole("status")
    expect(boxes.some((b) => b.textContent?.includes("Escalated for review"))).toBe(true)
    expect(await screen.findByText(/^OVIL-\d{4}-\d{2}-\d{2}-\d{4}$/)).toBeInTheDocument()
  })

  it("reflects an approval made from another surface, then issues the package", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(requestButton())
    getSessionStore().dispatch({
      type: "approve",
      vin: CLEAN_VIN,
      authorizationCode: "OV-7K2M-9Q3F",
      at: new Date().toISOString(),
    })
    expect(await screen.findByText("Authorized by registered owner")).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: /issue used vehicle information package/i })
    )
    // The number shows in the panel and again in the activity timeline.
    expect(await screen.findAllByText(/^UVIP-\d{4}-\d{2}-\d{2}-\d{4}$/)).not.toHaveLength(0)
  })

  it("freezes when the owner denies", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(requestButton())
    getSessionStore().dispatch({ type: "deny", vin: CLEAN_VIN, at: new Date().toISOString() })
    expect(await screen.findByText(/owner denied the request/i)).toBeInTheDocument()
  })
})

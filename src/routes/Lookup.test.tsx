import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { regionPaths } from "@/lib/paths"
import { Lookup } from "./Lookup"
import { CLEAN_VIN, CLONED_VIN } from "@/regions/ca/vehicles"

const paths = regionPaths("ca")

function renderLookup() {
  const router = createMemoryRouter(
    [
      { path: paths.portal.lookup, element: <Lookup /> },
      { path: paths.portal.vehiclePattern, element: <div>vehicle page</div> },
    ],
    { initialEntries: [paths.portal.lookup] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("Lookup", () => {
  it("rejects a malformed VIN without navigating", async () => {
    const router = renderLookup()
    await userEvent.type(screen.getByLabelText(/vin/i), "ABC123")
    await userEvent.click(screen.getByRole("button", { name: /look up/i }))
    expect(screen.getByText(/17-character VIN/i)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(paths.portal.lookup)
  })

  it("reports an unknown VIN", async () => {
    renderLookup()
    await userEvent.type(screen.getByLabelText(/vin/i), "1HGCM82633A004352")
    await userEvent.click(screen.getByRole("button", { name: /look up/i }))
    expect(screen.getByText(/no record found/i)).toBeInTheDocument()
  })

  it("navigates to the vehicle for a known VIN, normalizing case", async () => {
    const router = renderLookup()
    await userEvent.type(screen.getByLabelText(/vin/i), CLEAN_VIN.toLowerCase())
    await userEvent.click(screen.getByRole("button", { name: /look up/i }))
    expect(router.state.location.pathname).toBe(paths.portal.vehicle(CLEAN_VIN))
  })

  it("lists recent lookups that navigate on click", async () => {
    const router = renderLookup()
    await userEvent.click(screen.getByRole("button", { name: new RegExp(CLONED_VIN) }))
    expect(router.state.location.pathname).toBe(paths.portal.vehicle(CLONED_VIN))
  })

  it("submits on Enter, since the field deliberately has no form", async () => {
    const router = renderLookup()
    await userEvent.type(screen.getByLabelText(/vin/i), `${CLEAN_VIN}{Enter}`)
    expect(router.state.location.pathname).toBe(paths.portal.vehicle(CLEAN_VIN))
  })
})

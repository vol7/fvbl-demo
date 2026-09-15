import { render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { forcedSession } from "@/lib/forceStates"
import { paths } from "@/lib/paths"
import { getSessionStore } from "@/lib/session"
import { CLEAN_VIN, NEW_VIN } from "@/lib/vehicles"
import { PortalShell } from "./PortalShell"

function renderShellAt(vin: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PortalShell />,
        children: [{ path: paths.portal.vehiclePattern, element: <div>vehicle page</div> }],
      },
    ],
    { initialEntries: [paths.portal.vehicle(vin)] }
  )
  render(<RouterProvider router={router} />)
}

describe("PortalShell breadcrumb", () => {
  it("names the plate for a registered vehicle", () => {
    renderShellAt(CLEAN_VIN)
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toHaveTextContent(
      "Plate CKXR 214"
    )
  })

  it("says Unregistered VIN before birth and Not yet plated after", async () => {
    renderShellAt(NEW_VIN)
    const crumbs = screen.getByRole("navigation", { name: /breadcrumb/i })
    expect(crumbs).toHaveTextContent("Unregistered VIN")
    getSessionStore().dispatch({ type: "force", session: forcedSession("vehicleRegistered") })
    await waitFor(() => expect(crumbs).toHaveTextContent("Not yet plated"))
    expect(crumbs).not.toHaveTextContent("Unregistered")
  })
})

import { render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { useRegionPaths } from "@/regions/context"
import { RegionRoot } from "@/regions/RegionRoot"
import { routes } from "@/router"

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe("routes", () => {
  it("redirects a legacy path to the same path under /ca, keeping the query", async () => {
    const router = renderAt("/portal/vehicle/4JGFB8KB5PA812634?tab=history")
    await screen.findByRole("heading", { level: 1 })
    expect(router.state.location.pathname).toBe("/ca/portal/vehicle/4JGFB8KB5PA812634")
    expect(router.state.location.search).toBe("?tab=history")
  })

  it("redirects the legacy phone route", () => {
    const router = renderAt("/phone")
    expect(router.state.location.pathname).toBe("/ca/phone")
  })

  it("renders not-found for an unknown region", () => {
    renderAt("/fr/portal")
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
  })

  it("keeps the UVIP pages to Canada", () => {
    renderAt("/us/uvip")
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
  })

  it("offers both countries at /", () => {
    renderAt("/")
    expect(screen.getByRole("link", { name: /Canada/ })).toHaveAttribute("href", "/ca")
    expect(screen.getByRole("link", { name: /United States/ })).toHaveAttribute("href", "/us")
  })
})

describe("useRegionPaths", () => {
  function Probe() {
    return <span>{useRegionPaths().portal.home}</span>
  }

  it("gives Canada's paths outside a region route", () => {
    render(<Probe />)
    expect(screen.getByText("/ca/portal/home")).toBeInTheDocument()
  })

  it("follows the region in the URL", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/:region",
          element: <RegionRoot />,
          children: [{ index: true, element: <Probe /> }],
        },
      ],
      { initialEntries: ["/us"] }
    )
    render(<RouterProvider router={router} />)
    expect(screen.getByText("/us/portal/home")).toBeInTheDocument()
  })
})

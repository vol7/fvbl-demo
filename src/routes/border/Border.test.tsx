import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { BORDER } from "@/regions/ca/border"
import { EXPORT_VIN } from "@/regions/ca/vehicles"
import { routes } from "@/router"

const T0 = "2026-10-01T13:02:00.000Z"

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

function declare() {
  getSessionStore().dispatch({
    type: "declareExport",
    vin: EXPORT_VIN,
    exporter: BORDER.live.exporter,
    otp: "1",
    link: "k7m2p9xq4tvn8bwz",
    at: T0,
    expiresAt: "2026-10-03T10:00:00.000Z",
  })
}

function deny() {
  getSessionStore().dispatch({
    type: "denyExport",
    vin: EXPORT_VIN,
    reference: "EXR-2026-10-01-2291",
    at: T0,
  })
}

describe("the border officer's list", () => {
  it("opens on the vehicles that don't clear, and leaves the RAM off until declared", async () => {
    renderAt("/ca/border/exports")
    const rows = await screen.findAllByRole("row")
    expect(within(rows[1]).getByText("2023 Acura MDX A-Spec")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Doesn't clear")).toBeInTheDocument()
    expect(within(rows[1]).getByText("Another car's permit")).toBeInTheDocument()
    expect(screen.queryByText("2024 RAM 1500 Limited")).toBeNull()
  })

  it("puts the RAM first once its owner says no, and opens its card", async () => {
    declare()
    deny()
    const router = renderAt("/ca/border/exports")
    const rows = await screen.findAllByRole("row")
    expect(within(rows[1]).getByText("Owner said no")).toBeInTheDocument()
    await userEvent.click(within(rows[1]).getByRole("link", { name: "2024 RAM 1500 Limited" }))
    expect(router.state.location.pathname).toBe(`/ca/border/exports/${EXPORT_VIN}`)
  })

  it("isn't there in the US", () => {
    renderAt("/us/border/exports")
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
  })
})

describe("the card for one declared vehicle", () => {
  it("says why the RAM doesn't clear, which container to open, and holds it", async () => {
    declare()
    deny()
    renderAt(`/ca/border/exports/${EXPORT_VIN}`)
    const card = await screen.findByRole("region", { name: "Export decision" })
    expect(
      within(card).getByRole("heading", {
        name: "The registered owner did not authorize this export.",
      })
    ).toBeInTheDocument()
    expect(within(card).getByText("HBLU 420517 4")).toBeInTheDocument()
    expect(
      within(card).getByText("The declaration names the registered owner.")
    ).toBeInTheDocument()
    expect(within(card).getByText("Matches")).toBeInTheDocument()
    expect(within(card).getByText("Said no")).toBeInTheDocument()
    // Need to know: nothing from the clerk's record.
    expect(screen.queryByRole("tab")).toBeNull()
    expect(screen.queryByText(/odometer|write-off|lien/i)).toBeNull()

    await userEvent.click(within(card).getByRole("button", { name: "Hold for examination" }))
    expect(within(card).getByText("Held for examination")).toBeInTheDocument()
    expect(within(card).getByText(/^EX-\d{4}-\d{2}-\d{2}-\d{4}$/)).toBeInTheDocument()
  })

  it("waits for the owner without offering a hold", async () => {
    declare()
    renderAt(`/ca/border/exports/${EXPORT_VIN}`)
    const card = await screen.findByRole("region", { name: "Export decision" })
    expect(within(card).getByText("Awaiting owner")).toBeInTheDocument()
    expect(within(card).queryByRole("button", { name: "Hold for examination" })).toBeNull()
  })
})

describe("the owner's text about the export", () => {
  it("arrives on the phone and the owner refuses from the link, with a reference for police", async () => {
    declare()
    renderAt("/ca/phone")
    expect(await screen.findByText(/CBSA received an export declaration/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /fvbl\.on\.ca\/c\// }))
    expect(
      await screen.findByRole("heading", { name: "Did you authorize this export?" })
    ).toBeInTheDocument()
    expect(screen.getByText("The name on your registration")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "No, I didn't" }))
    expect(await screen.findByRole("heading", { name: "Export refused" })).toBeInTheDocument()
    expect(screen.getByText(/^EXR-\d{4}-\d{2}-\d{2}-\d{4}$/)).toBeInTheDocument()
    expect(getSessionStore().getState().exports?.[EXPORT_VIN]?.status).toBe("denied")
  })
})

describe("the clerk's record of the RAM", () => {
  it("shows the owner's refusal on the history, and nothing of the container", async () => {
    declare()
    deny()
    renderAt(`/ca/portal/vehicle/${EXPORT_VIN}?tab=history`)
    expect((await screen.findAllByText("Export not authorized")).length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        "Declared for export at the Port of Montréal. The registered owner said they didn't authorize it."
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/HBLU|examination/i)).toBeNull()
  })

  it("shows nothing while the owner can still answer", async () => {
    declare()
    renderAt(`/ca/portal/vehicle/${EXPORT_VIN}?tab=history`)
    await screen.findByRole("heading", { level: 1 })
    expect(screen.queryByText(/Declared for export/)).toBeNull()
  })
})

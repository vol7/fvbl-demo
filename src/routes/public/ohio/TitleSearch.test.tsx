import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { routes } from "@/router"
import { OWNER } from "@/regions/us/people"
import { CLEAN_VIN, ONTARIO_VIN } from "@/regions/us/vehicles"

function renderPage() {
  const router = createMemoryRouter(routes, { initialEntries: ["/us/ohio"] })
  render(<RouterProvider router={router} />)
}

async function search(vin: string) {
  await userEvent.type(screen.getByLabelText(/vehicle identification number/i), vin)
  await userEvent.click(screen.getByRole("button", { name: "Search" }))
}

async function askOwner() {
  await search(CLEAN_VIN)
  await userEvent.click(screen.getByRole("button", { name: "Ask the owner to confirm" }))
  await userEvent.click(await screen.findByRole("button", { name: "Send request" }))
}

function expectNoOwner() {
  const [first, last] = OWNER.name.split(" ")
  expect(screen.queryByText(new RegExp(first))).not.toBeInTheDocument()
  expect(screen.queryByText(new RegExp(last))).not.toBeInTheDocument()
  expect(screen.queryByText(new RegExp(OWNER.mobileLast4))).not.toBeInTheDocument()
}

describe("Ohio title search", () => {
  it("is US only", () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/ca/ohio"] })
    render(<RouterProvider router={router} />)
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument()
  })

  it("shows title status and year, make and model only", async () => {
    renderPage()
    await search(CLEAN_VIN)
    expect(screen.getByText("Title active in Ohio")).toBeInTheDocument()
    expect(screen.getByText("2023 Mercedes-AMG GLE 53")).toBeInTheDocument()
    expect(screen.queryByText(/JKR 4821/)).not.toBeInTheDocument()
    expect(screen.queryByText(/NMVTIS/)).not.toBeInTheDocument()
    expectNoOwner()
  })

  it("offers no confirmation for a VIN without an Ohio title", async () => {
    renderPage()
    await search(ONTARIO_VIN)
    expect(screen.getByText("No active Ohio title")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Ask the owner to confirm" })).toBeNull()
  })

  it("sends the request on the US session and waits, never showing the owner", async () => {
    renderPage()
    await askOwner()
    expect(await screen.findByText("Waiting for the owner")).toBeInTheDocument()
    expectNoOwner()
    expect(getSessionStore("us").getState()).toMatchObject({
      activeVin: CLEAN_VIN,
      authorizations: {
        [CLEAN_VIN]: { status: "pending", origin: "buyer", requester: "Tyler Brooks" },
      },
    })
    expect(getSessionStore("ca").getState().activeVin).toBeNull()
  })

  it("turns green when the owner approves", async () => {
    renderPage()
    await askOwner()
    act(() =>
      getSessionStore("us").dispatch({
        type: "approve",
        vin: CLEAN_VIN,
        authorizationCode: "A1B2C3",
        at: new Date().toISOString(),
      })
    )
    const answer = await screen.findByText("Owner confirmed")
    expect(answer.closest("[data-tone]")).toHaveAttribute("data-tone", "good")
    expectNoOwner()
  })

  it("turns red when the owner says it isn't their sale", async () => {
    renderPage()
    await askOwner()
    act(() =>
      getSessionStore("us").dispatch({
        type: "deny",
        vin: CLEAN_VIN,
        at: new Date().toISOString(),
      })
    )
    const answer = await screen.findByText("The owner said this isn't their sale")
    expect(answer.closest("[data-tone]")).toHaveAttribute("data-tone", "bad")
    expect(screen.getByText(/Don't pay for this vehicle/)).toBeInTheDocument()
  })
})

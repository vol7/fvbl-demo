import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { regionPaths } from "@/lib/paths"
import { getSessionStore } from "@/lib/session"
import { RegionContext } from "@/regions/context"
import { CLEAN_VIN, EXPORTED_VIN } from "@/regions/us/vehicles"

import { Vehicle } from "./Vehicle"

const paths = regionPaths("us")

function renderVehicle(vin: string) {
  const router = createMemoryRouter([{ path: paths.portal.vehiclePattern, element: <Vehicle /> }], {
    initialEntries: [paths.portal.vehicle(vin)],
  })
  render(
    <RegionContext.Provider value="us">
      <RouterProvider router={router} />
    </RegionContext.Provider>
  )
}

const card = () => screen.getByRole("region", { name: "Title decision" })
const now = () => new Date().toISOString()

function issuedOf(vin: string) {
  const state = getSessionStore("us").getState().authorizations[vin]
  return state && state.status !== "escalated" ? state.issued : undefined
}

/** FVBL informs; the clerk decides. None of these may appear on a US card. */
function expectNoGateWords() {
  const text = card().textContent ?? ""
  expect(text).not.toMatch(/do not issue|blocked|package/i)
}

describe("US vehicle page: the county title clerk decides", () => {
  it("issues the title from checks clear, with no owner confirmation on file", async () => {
    renderVehicle(CLEAN_VIN)
    expect(within(card()).getByText("No conflicts found for this VIN")).toBeInTheDocument()
    expect(within(card()).getByRole("button", { name: /ask the owner to confirm/i })).toBeVisible()
    expectNoGateWords()

    await userEvent.click(within(card()).getByRole("button", { name: "Issue title" }))
    expect(await within(card()).findByText("Ohio title issued")).toBeInTheDocument()
    expect(within(card()).getByText(/^OH-T-\d{4}-\d{2}-\d{2}-\d{4}$/)).toBeInTheDocument()
    expect(issuedOf(CLEAN_VIN)).toBeTruthy()
    expectNoGateWords()
  })

  it("issues after the owner confirmed and names the confirmation", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(within(card()).getByRole("button", { name: /ask the owner to confirm/i }))
    await userEvent.click(await screen.findByRole("button", { name: "Send title alert" }))
    getSessionStore("us").dispatch({
      type: "approve",
      vin: CLEAN_VIN,
      authorizationCode: "OC-7K2M-9Q3F",
      at: now(),
    })
    expect(
      await within(card()).findByText("The registered owner confirmed this sale")
    ).toBeInTheDocument()
    await userEvent.click(within(card()).getByRole("button", { name: "Issue title" }))
    expect(
      await within(card()).findByText(/The owner's confirmation OC-7K2M-9Q3F is on file/)
    ).toBeInTheDocument()
  })

  it("a missing reply is neutral: the title can still be issued", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(within(card()).getByRole("button", { name: /ask the owner to confirm/i }))
    await userEvent.click(await screen.findByRole("button", { name: "Send title alert" }))
    getSessionStore("us").dispatch({ type: "timeout", vin: CLEAN_VIN, at: now() })
    expect(await within(card()).findByText(/didn't reply within 24 hours/)).toBeInTheDocument()
    expect(within(card()).getByRole("button", { name: "Issue title" })).toBeVisible()
  })

  it("holds for review on a failed check; refer is first, issuing needs a note", async () => {
    renderVehicle(EXPORTED_VIN)
    expect(within(card()).getByText("Hold for review")).toBeInTheDocument()
    expect(within(card()).getByText(/Your office decides whether to issue\./)).toBeInTheDocument()
    expect(within(card()).queryByRole("button", { name: "Issue title" })).toBeNull()
    expectNoGateWords()

    await userEvent.click(within(card()).getByRole("button", { name: /issue after review/i }))
    const confirm = await screen.findByRole("button", { name: "Issue title" })
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Reason for issuing"), "   ")
    expect(confirm).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Reason for issuing"), "Re-entry confirmed by CBP")
    await userEvent.click(confirm)

    expect(await within(card()).findByText("Ohio title issued")).toBeInTheDocument()
    expect(
      within(card()).getByText(/Issued after review: “Re-entry confirmed by CBP”/)
    ).toBeInTheDocument()
    expect(issuedOf(EXPORTED_VIN)?.reviewNote).toBe("Re-entry confirmed by CBP")
  })

  it("refers to state investigators without telling the customer why", async () => {
    renderVehicle(EXPORTED_VIN)
    await userEvent.click(within(card()).getByRole("button", { name: "Refer to investigators" }))
    expect(await within(card()).findByText("Referred to state investigators")).toBeInTheDocument()
    expect(within(card()).getByText(/Don't share the reason/)).toBeInTheDocument()
    expectNoGateWords()
  })

  it("treats the owner's “Not me” as a hold the clerk can refer", async () => {
    renderVehicle(CLEAN_VIN)
    await userEvent.click(within(card()).getByRole("button", { name: /ask the owner to confirm/i }))
    await userEvent.click(await screen.findByRole("button", { name: "Send title alert" }))
    getSessionStore("us").dispatch({ type: "deny", vin: CLEAN_VIN, at: now() })
    expect(await within(card()).findByText("Hold for review")).toBeInTheDocument()
    expect(within(card()).queryByRole("button", { name: "Issue title" })).toBeNull()
    expectNoGateWords()
    await userEvent.click(within(card()).getByRole("button", { name: "Refer to investigators" }))
    expect(await within(card()).findByText("Referred to state investigators")).toBeInTheDocument()
  })
})

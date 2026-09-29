import { act, render, screen, within } from "@testing-library/react"
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

/** FVBL informs; the clerk decides. None of these may appear on a US card. */
function expectInformational() {
  const text = card().textContent ?? ""
  expect(text).not.toMatch(/do not issue|blocked|package/i)
  // The strip's certificate mark is a button too, but it only opens the certificate.
  expect(within(within(card()).getByRole("status")).queryAllByRole("button")).toEqual([])
}

const dispatch = (action: Parameters<ReturnType<typeof getSessionStore>["dispatch"]>[0]) =>
  act(() => getSessionStore("us").dispatch(action))

function buyerAsks(vin: string) {
  dispatch({ type: "clear" })
  dispatch({
    type: "buyerRequest",
    vin,
    buyer: "Tyler Brooks",
    otp: "514 087",
    link: "q8h3t2mz7rkc4vwn",
    at: now(),
  })
}

describe("US vehicle page: the card informs, with no actions", () => {
  it("checks clear with no owner confirmation on file", () => {
    dispatch({ type: "clear" })
    renderVehicle(CLEAN_VIN)
    expect(within(card()).getByText("No conflicts found for this VIN")).toBeInTheDocument()
    expectInformational()
  })

  it("waits for the owner after the buyer asked", async () => {
    buyerAsks(CLEAN_VIN)
    renderVehicle(CLEAN_VIN)
    expect(await within(card()).findByText("Waiting for the registered owner")).toBeInTheDocument()
    expectInformational()
  })

  it("shows the owner's confirmation", async () => {
    buyerAsks(CLEAN_VIN)
    dispatch({ type: "approve", vin: CLEAN_VIN, authorizationCode: "OC-7K2M-9Q3F", at: now() })
    renderVehicle(CLEAN_VIN)
    expect(
      await within(card()).findByText("The registered owner confirmed this sale")
    ).toBeInTheDocument()
    expectInformational()
  })

  it("a missing reply is neutral", async () => {
    buyerAsks(CLEAN_VIN)
    dispatch({ type: "timeout", vin: CLEAN_VIN, at: now() })
    renderVehicle(CLEAN_VIN)
    expect(await within(card()).findByText(/didn't reply within 24 hours/)).toBeInTheDocument()
    expectInformational()
  })

  it("holds for review on a failed check, and leaves the decision to the office", () => {
    dispatch({ type: "clear" })
    renderVehicle(EXPORTED_VIN)
    expect(within(card()).getByText("Hold for review")).toBeInTheDocument()
    expect(within(card()).getByText(/Your office decides whether to issue\./)).toBeInTheDocument()
    expectInformational()
  })

  it("treats the owner's “Not me” as a hold for review", async () => {
    buyerAsks(CLEAN_VIN)
    dispatch({ type: "deny", vin: CLEAN_VIN, at: now() })
    renderVehicle(CLEAN_VIN)
    expect(await within(card()).findByText("Hold for review")).toBeInTheDocument()
    expectInformational()
  })
})

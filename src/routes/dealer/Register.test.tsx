import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { regionPaths } from "@/lib/paths"
import { getSessionStore } from "@/lib/session"
import { Register } from "./Register"
import { NEW_VIN } from "@/regions/ca/vehicles"
import { RegionProvider } from "@/regions/RegionRoot"
import { NEW_VIN as US_NEW_VIN } from "@/regions/us/vehicles"

const paths = regionPaths("ca")

function renderRegister() {
  const router = createMemoryRouter([{ path: paths.dealer.register, element: <Register /> }], {
    initialEntries: [paths.dealer.register],
  })
  render(<RouterProvider router={router} />)
  return router
}

async function toNvisStep() {
  renderRegister()
  expect(screen.getByLabelText(/vehicle identification number/i)).toHaveValue(NEW_VIN)
  await userEvent.click(screen.getByRole("button", { name: /decode vin/i }))
  expect(await screen.findByText("2026 Mercedes-Benz GLE 450 4MATIC")).toBeInTheDocument()
  expect(screen.getByText(/no registration on file/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole("button", { name: "Continue" }))
  expect(await screen.findByRole("heading", { name: /nvis and delivery/i })).toBeInTheDocument()
}

describe("Dealer registration", () => {
  it("decodes the prefilled VIN and says there is no registration on file", async () => {
    await toNvisStep()
  })

  it("does not continue until the NVIS box is ticked", async () => {
    await toNvisStep()
    const next = screen.getByRole("button", { name: "Continue" })
    expect(next).toBeDisabled()
    await userEvent.click(
      screen.getByRole("checkbox", { name: /new vehicle information statement/i })
    )
    expect(next).toBeEnabled()
    await userEvent.click(next)
    expect(await screen.findByRole("heading", { name: /review and submit/i })).toBeInTheDocument()
    expect(screen.getByText("NVIS 2026-MB-0187342")).toBeInTheDocument()
    expect(screen.getByText(/mobile ending 2204/i)).toBeInTheDocument()
  })

  it("submits to the ministry as the dealer and makes the VIN active", async () => {
    await toNvisStep()
    await userEvent.click(
      screen.getByRole("checkbox", { name: /new vehicle information statement/i })
    )
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    await userEvent.click(await screen.findByRole("button", { name: /submit to ministry/i }))

    expect(await screen.findByText(/submitted to the ministry/i)).toBeInTheDocument()
    expect(screen.getByText(/awaiting confirmation/i)).toBeInTheDocument()
    expect(getSessionStore().getState()).toMatchObject({
      activeVin: NEW_VIN,
      registrations: {
        [NEW_VIN]: {
          status: "pending",
          dealer: "Mercedes-Benz Downtown",
          sourceDocument: { label: "NVIS", number: "NVIS 2026-MB-0187342" },
        },
      },
    })
  })

  it("turns into Registration recorded when the phone confirms", async () => {
    await toNvisStep()
    await userEvent.click(
      screen.getByRole("checkbox", { name: /new vehicle information statement/i })
    )
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    await userEvent.click(await screen.findByRole("button", { name: /submit to ministry/i }))
    await screen.findByText(/awaiting confirmation/i)

    getSessionStore().dispatch({
      type: "confirmRegistration",
      vin: NEW_VIN,
      registrationRef: "FVBL-R-2026-09-15-0417",
      at: new Date().toISOString(),
    })
    expect(await screen.findByText("Registration recorded")).toBeInTheDocument()
    expect(screen.getByText("FVBL-R-2026-09-15-0417")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /view in fvbl/i })).toHaveAttribute(
      "href",
      paths.portal.vehicle(NEW_VIN)
    )
  })
})

describe("Dealer first title (US)", () => {
  const usPaths = regionPaths("us")

  async function toCertificateStep() {
    const router = createMemoryRouter(
      [{ path: usPaths.dealer.register, element: <Register /> }],
      { initialEntries: [usPaths.dealer.register] }
    )
    render(
      <RegionProvider region="us">
        <RouterProvider router={router} />
      </RegionProvider>
    )
    expect(screen.getByLabelText(/vehicle identification number/i)).toHaveValue(US_NEW_VIN)
    await userEvent.click(screen.getByRole("button", { name: /decode vin/i }))
    expect(await screen.findByText(/no title on file/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(
      await screen.findByRole("heading", { name: /^certificate of origin$/i })
    ).toBeInTheDocument()
  }

  it("confirms the certificate of origin, with title alerts pre-ticked", async () => {
    await toCertificateStep()
    const alerts = screen.getByRole("checkbox", { name: /turned on title alerts/i })
    expect(alerts).toBeChecked()
    expect(screen.getByText(/turn alerts off any time/i)).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("checkbox", { name: /manufacturer's certificate of origin/i })
    )
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByRole("heading", { name: /review and submit/i })).toBeInTheDocument()
    expect(screen.getByText("MCO 2026-0418826")).toBeInTheDocument()
    expect(screen.getByText("On, mobile ending 0193")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /submit title application/i }))

    expect(await screen.findByText(/submitted to the county title office/i)).toBeInTheDocument()
    expect(getSessionStore("us").getState().registrations[US_NEW_VIN]).toMatchObject({
      status: "pending",
      sourceDocument: { label: "Certificate of origin", number: "MCO 2026-0418826" },
      titleAlerts: { mobileLast4: "0193" },
    })

    getSessionStore("us").dispatch({
      type: "confirmRegistration",
      vin: US_NEW_VIN,
      registrationRef: "FVBL-T-2026-09-29-0417",
      at: new Date().toISOString(),
    })
    expect(await screen.findByText("Title application recorded")).toBeInTheDocument()
    expect(screen.getByText("FVBL-T-2026-09-29-0417")).toBeInTheDocument()
  })

  it("submits without title alerts when the box is unticked", async () => {
    await toCertificateStep()
    await userEvent.click(screen.getByRole("checkbox", { name: /turned on title alerts/i }))
    await userEvent.click(
      screen.getByRole("checkbox", { name: /manufacturer's certificate of origin/i })
    )
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByRole("heading", { name: /review and submit/i })).toBeInTheDocument()
    expect(screen.queryByText(/on, mobile ending/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /submit title application/i }))
    await screen.findByText(/submitted to the county title office/i)
    expect(getSessionStore("us").getState().registrations[US_NEW_VIN]).toMatchObject({
      titleAlerts: null,
    })
  })
})

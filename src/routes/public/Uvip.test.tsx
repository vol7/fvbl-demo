import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { getSessionStore } from "@/lib/session"
import { UvipBuyer } from "./UvipBuyer"
import { UvipOwner } from "./UvipOwner"
import { CLEAN_VIN, CLONED_VIN } from "@/regions/ca/vehicles"

function renderAt(path: string, element: React.ReactNode) {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

async function enterVin(vin: string) {
  await userEvent.type(screen.getByLabelText(/vehicle identification number/i), vin)
  await userEvent.click(screen.getByRole("button", { name: /find vehicle/i }))
}

describe("UVIP owner flow", () => {
  it("rejects a vehicle with record conflicts", async () => {
    renderAt("/uvip/owner", <UvipOwner />)
    await enterVin(CLONED_VIN)
    expect(screen.getByText(/cannot be pre-approved online/i)).toBeInTheDocument()
  })

  it("never shows the plate on the public side", async () => {
    renderAt("/uvip/owner", <UvipOwner />)
    await enterVin(CLEAN_VIN)
    expect(screen.getByText("2023 Mercedes-AMG GLE 63 S 4MATIC+")).toBeInTheDocument()
    expect(screen.queryByText(/CKXR/)).not.toBeInTheDocument()
  })

  it("asks for licence and mobile only, shows the licence in clear on review, and pre-approves", async () => {
    renderAt("/uvip/owner", <UvipOwner />)
    await enterVin(CLEAN_VIN)
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(
      await screen.findByRole("heading", { name: /verify your identity/i })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/full legal name/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/driver's licence number/i)).toHaveValue("D6101-40706-60905")
    await userEvent.click(screen.getByRole("button", { name: /take photo/i }))
    expect(await screen.findByText("Verified", {}, { timeout: 3000 })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByRole("heading", { name: /review and confirm/i })).toBeInTheDocument()
    expect(screen.getByText(CLEAN_VIN)).toBeInTheDocument()
    expect(screen.getByText("D6101-40706-60905")).toBeInTheDocument()
    expect(screen.getByText("D***** O*****")).toBeInTheDocument()
    expect(screen.queryByText(/CKXR/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /confirm and pre-approve/i }))

    expect(await screen.findByText("Pre-approval on file")).toBeInTheDocument()
    expect(getSessionStore().getState()).toMatchObject({
      activeVin: CLEAN_VIN,
      authorizations: {
        [CLEAN_VIN]: { status: "authorized", origin: "owner", requester: "Daniel Okafor" },
      },
    })
  })

  it("finds the vehicle on Enter", async () => {
    renderAt("/uvip/owner", <UvipOwner />)
    await userEvent.type(
      screen.getByLabelText(/vehicle identification number/i),
      `${CLEAN_VIN}{Enter}`
    )
    expect(await screen.findByText("2023 Mercedes-AMG GLE 63 S 4MATIC+")).toBeInTheDocument()
  })
})

describe("UVIP buyer flow", () => {
  it("collects name, licence and mobile, reviews them in clear, and texts the owner", async () => {
    renderAt("/uvip/buyer", <UvipBuyer />)
    await enterVin(CLEAN_VIN)
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByRole("heading", { name: /your details/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByRole("heading", { name: /review and send/i })).toBeInTheDocument()
    expect(screen.getByText(CLEAN_VIN)).toBeInTheDocument()
    expect(screen.getByText("D***** O*****")).toBeInTheDocument()
    expect(screen.getByText("B2947-51083-64712")).toBeInTheDocument()
    expect(screen.queryByText(/CKXR/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /send request to owner/i }))

    expect(await screen.findByText("Request sent to the owner")).toBeInTheDocument()
    expect(screen.getByText(CLEAN_VIN)).toBeInTheDocument()
    expect(screen.getByText("D***** O*****")).toBeInTheDocument()
    expect(screen.getByText(/phone ending in 0917/i)).toBeInTheDocument()
    const s = getSessionStore().getState()
    expect(s.activeVin).toBe(CLEAN_VIN)
    expect(s.authorizations[CLEAN_VIN]).toMatchObject({
      status: "pending",
      origin: "buyer",
      requester: "Marcus Beaulieu",
    })
    expect(s.authorizations[CLEAN_VIN]).toHaveProperty(
      "link",
      expect.stringMatching(/^[a-z2-9]{16}$/)
    )
  })
})

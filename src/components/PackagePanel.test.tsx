import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { type AuthorizationState } from "@/lib/authorization"
import { evaluateChecks } from "@/lib/checks"
import { CLEAN_VIN, CLONED_VIN, findVehicle } from "@/lib/vehicles"
import { PackagePanel } from "./PackagePanel"

const clean = findVehicle(CLEAN_VIN)!
const cloned = findVehicle(CLONED_VIN)!
const T0 = "2026-09-09T18:14:00.000Z"
const T1 = "2026-09-09T18:16:30.000Z"
const VALID = "2026-10-09T18:16:30.000Z"

const clerk = {
  origin: "clerk" as const,
  requester: "Marcus Beaulieu",
  otp: "482 193",
  link: "k7m2p9xq4tvn8bwz",
}

function renderPanel(state: AuthorizationState, vehicle = clean) {
  const onRequest = vi.fn()
  const onEscalate = vi.fn()
  const onIssue = vi.fn()
  render(
    <PackagePanel
      vehicle={vehicle}
      checks={evaluateChecks(vehicle)}
      state={state}
      onRequest={onRequest}
      onEscalate={onEscalate}
      onIssue={onIssue}
    />
  )
  return { onRequest, onEscalate, onIssue }
}

describe("PackagePanel", () => {
  it("idle: collects applicant name, licence and mobile, then requests", async () => {
    const { onRequest } = renderPanel({ status: "idle" })
    expect(screen.getByLabelText("Applicant")).toHaveValue("Marcus Beaulieu")
    expect(screen.getByLabelText(/driver's licence/i)).toHaveValue("B2947-51083-64712")
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue("(647) 555-4410")
    expect(screen.getByText(/with a link to approve or decline/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /request owner authorization/i }))
    expect(onRequest).toHaveBeenCalledWith({
      name: "Marcus Beaulieu",
      licence: "B2947-51083-64712",
      mobile: "(647) 555-4410",
    })
  })

  it("blocked: request disabled, escalate goes to law enforcement", async () => {
    const { onEscalate } = renderPanel({ status: "blocked" }, cloned)
    expect(screen.getByRole("button", { name: /request owner authorization/i })).toBeDisabled()
    expect(screen.getByText("Package cannot be issued")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Escalate to law enforcement" }))
    expect(onEscalate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/insurance/i)).not.toBeInTheDocument()
  })

  it("escalated: tells the clerk not to issue the package", () => {
    renderPanel(
      { status: "escalated", caseReference: "OVIL-2026-09-09-0417", escalatedAt: T1 },
      cloned
    )
    expect(screen.getByText(/do not issue the package/i)).toBeInTheDocument()
    expect(screen.getByText("OVIL-2026-09-09-0417")).toBeInTheDocument()
  })

  it("pending: locks the applicant to the requester and shows the countdown", () => {
    renderPanel({
      status: "pending",
      ...clerk,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000).toISOString(),
    })
    expect(screen.getByText("Request sent to registered owner")).toBeInTheDocument()
    expect(screen.getByText("Marcus Beaulieu")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.getByText(/^23:59:5\d$/)).toBeInTheDocument()
  })

  it("pending from a buyer: names the buyer and the channel", () => {
    renderPanel({
      status: "pending",
      ...clerk,
      origin: "buyer",
      sentAt: T0,
      expiresAt: VALID,
    })
    expect(screen.getByText("Awaiting registered owner")).toBeInTheDocument()
    expect(screen.getByText(/requested online by Marcus Beaulieu/i)).toBeInTheDocument()
  })

  it("authorized: shows the reference and the issue CTA, hides the request button", async () => {
    const { onIssue } = renderPanel({
      status: "authorized",
      ...clerk,
      sentAt: T0,
      authorizationCode: "OV-7K2M-9Q3F",
      approvedAt: T1,
      validUntil: VALID,
    })
    expect(screen.getByText("Authorized by registered owner")).toBeInTheDocument()
    expect(screen.getByText("OV-7K2M-9Q3F")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /request owner authorization/i })
    ).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole("button", { name: /issue used vehicle information package/i })
    )
    expect(onIssue).toHaveBeenCalledTimes(1)
  })

  it("issued: replaces the CTA with the package number", () => {
    renderPanel({
      status: "authorized",
      ...clerk,
      sentAt: T0,
      authorizationCode: "OV-7K2M-9Q3F",
      approvedAt: T1,
      validUntil: VALID,
      issued: { at: T1, packageNumber: "UVIP-2026-09-09-4821" },
    })
    expect(screen.getByText("UVIP-2026-09-09-4821")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /issue used vehicle information package/i })
    ).not.toBeInTheDocument()
  })

  it("authorized by owner pre-approval: on-file wording, validity, and an open applicant slot", () => {
    renderPanel({
      status: "authorized",
      origin: "owner",
      requester: "Daniel Okafor",
      otp: "",
      link: "",
      sentAt: T0,
      authorizationCode: "OV-K3PM-7HQ2",
      approvedAt: T0,
      validUntil: VALID,
    })
    expect(screen.getByText("Authorization on file")).toBeInTheDocument()
    expect(screen.getByText(/valid until October 9, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/pre-approved by the owner/i)).toBeInTheDocument()
  })

  it("frozen: shows the reason", () => {
    renderPanel({ status: "frozen", ...clerk, reason: "timeout", sentAt: T0, frozenAt: T1 })
    expect(screen.getByText(/flagged for security review/i)).toBeInTheDocument()
    expect(screen.getByText(/no response within 24 hours/i)).toBeInTheDocument()
  })
})

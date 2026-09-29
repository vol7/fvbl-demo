import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { AuthorizationState } from "@/lib/authorization"
import { evaluateChecks } from "@/lib/checks"
import { findVehicle } from "@/lib/vehicles"
import { verdictLabel } from "@/lib/verdict"
import { VehicleSummary } from "./VehicleSummary"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN } from "@/regions/ca/vehicles"
import { ca } from "@/regions/ca"

const T0 = "2026-09-12T14:00:00.000Z"
const T1 = "2026-09-12T14:05:00.000Z"
const VALID = "2026-10-09T18:16:30.000Z"

const clerk = {
  origin: "clerk" as const,
  requester: "Marcus Beaulieu",
  otp: "482 193",
  link: "k7m2p9xq4tvn8bwz",
}

function renderSummary(vin: string, state: AuthorizationState) {
  const vehicle = findVehicle(ca, vin)!
  const handlers = { onRequest: vi.fn(), onIssue: vi.fn(), onEscalate: vi.fn() }
  render(
    <VehicleSummary
      vehicle={vehicle}
      checks={evaluateChecks(ca, vehicle)}
      state={state}
      {...handlers}
    />
  )
  return handlers
}

const card = () => screen.getByRole("region", { name: "Package decision" })

describe("verdictLabel", () => {
  const label = (state: AuthorizationState) => verdictLabel(state, ca.copy.decision.verdict)

  it("names every state", () => {
    expect(label({ status: "idle" })).toBe("Checks clear")
    expect(label({ status: "blocked" })).toBe("Cannot be issued")
    expect(label({ status: "escalated", caseReference: "x", escalatedAt: T0 })).toBe("Escalated")
    const base = { origin: "clerk" as const, requester: "M.", otp: "", link: "", sentAt: T0 }
    expect(label({ status: "pending", ...base, expiresAt: T1 })).toBe("Awaiting owner")
    expect(label({ status: "frozen", ...base, reason: "denied", frozenAt: T1 })).toBe(
      "Owner denied"
    )
    expect(label({ status: "frozen", ...base, reason: "timeout", frozenAt: T1 })).toBe(
      "Request expired"
    )
    const authorized = {
      status: "authorized" as const,
      ...base,
      authorizationCode: "OV-A-B",
      approvedAt: T1,
      validUntil: T1,
    }
    expect(label(authorized)).toBe("Authorized to issue")
    expect(label({ ...authorized, issued: { at: T1, reference: "UVIP-1" } })).toBe("Package issued")
  })
})

describe("VehicleSummary", () => {
  it("shows the identity: plate, title with trim, colour and VIN", () => {
    renderSummary(CLEAN_VIN, { status: "idle" })
    expect(screen.getByLabelText("Ontario plate")).toHaveTextContent("CKXR 214")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2023 Mercedes-AMG GLE 63 S 4MATIC+"
    )
    expect(screen.getByText("Obsidian Black SUV")).toBeInTheDocument()
    expect(screen.getByText("4JGFB8KBXPA812634")).toBeInTheDocument()
  })

  it("idle: the checks are clear and the clerk can request authorization", async () => {
    const { onRequest } = renderSummary(CLEAN_VIN, { status: "idle" })
    expect(within(card()).getByText("Checks clear")).toBeInTheDocument()
    expect(within(card()).getByText("All 9 passed")).toBeInTheDocument()
    expect(within(card()).getByText("Not yet requested")).toBeInTheDocument()
    expect(within(card()).getByText("Registration renewed")).toBeInTheDocument()
    expect(within(card()).getByText("April 11, 2025")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /request owner authorization/i }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByLabelText("Applicant")).toHaveValue("Marcus Beaulieu")
    expect(within(dialog).getByLabelText(/driver's licence/i)).toHaveValue("B2947-51083-64712")
    expect(within(dialog).getByLabelText(/mobile number/i)).toHaveValue("(647) 555-4410")
    await userEvent.click(within(dialog).getByRole("button", { name: "Send request" }))
    expect(onRequest).toHaveBeenCalledWith({
      name: "Marcus Beaulieu",
      licence: "B2947-51083-64712",
      mobile: "(647) 555-4410",
    })
  })

  it("blocked: tells the worst flag's story and offers escalation", async () => {
    const { onEscalate } = renderSummary(CLONED_VIN, { status: "blocked" })
    expect(within(card()).getByText("Hold, do not issue")).toBeInTheDocument()
    expect(within(card()).getByText("This vehicle was declared a total loss")).toBeInTheDocument()
    expect(
      within(card()).getByText(
        "Reported by IBC and Carfax. Duplicate identity and collision record are also flagged."
      )
    ).toBeInTheDocument()
    expect(within(card()).getByText("3 of 9 failed")).toBeInTheDocument()
    expect(within(card()).getByText("2 high risk")).toBeInTheDocument()
    expect(within(card()).getByText("Unavailable")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /request owner authorization/i })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Refer for investigation" }))
    expect(onEscalate).toHaveBeenCalledTimes(1)
  })

  it("blocked export: the last recorded event is the export", () => {
    renderSummary(EXPORTED_VIN, { status: "blocked" })
    expect(
      within(card()).getByText("This VIN was reported exported and has no re-entry on record")
    ).toBeInTheDocument()
    expect(within(card()).getByText("Exported")).toBeInTheDocument()
    expect(within(card()).getByText("March 18, 2025")).toBeInTheDocument()
  })

  it("escalated: names the case and what was shared", () => {
    renderSummary(CLONED_VIN, {
      status: "escalated",
      caseReference: "FVBL-2026-09-09-0417",
      escalatedAt: T1,
    })
    expect(within(card()).getByText("Referred, do not issue")).toBeInTheDocument()
    expect(within(card()).getByText("FVBL-2026-09-09-0417")).toBeInTheDocument()
    expect(within(card()).getByText(/notifies the OPP after review/)).toBeInTheDocument()
    expect(within(card()).getByText(/9 record check results/)).toBeInTheDocument()
  })

  it("pending from the clerk: the text went out and the link is counting down", () => {
    renderSummary(CLEAN_VIN, {
      status: "pending",
      ...clerk,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000).toISOString(),
    })
    expect(within(card()).getByText("Waiting for the registered owner")).toBeInTheDocument()
    expect(within(card()).getByText(/A text went to the phone ending in 0917/)).toBeInTheDocument()
    expect(within(card()).getAllByText(/^23:59:5\d$/)).toHaveLength(2)
  })

  it("pending from a buyer: names the buyer and the channel", () => {
    renderSummary(CLEAN_VIN, {
      status: "pending",
      ...clerk,
      origin: "buyer",
      sentAt: T0,
      expiresAt: VALID,
    })
    expect(
      within(card()).getByText(/Marcus Beaulieu requested it online through ServiceOntario/)
    ).toBeInTheDocument()
  })

  it("authorized: shows the reference, the certificate and the issue button", async () => {
    const { onIssue } = renderSummary(CLEAN_VIN, {
      status: "authorized",
      ...clerk,
      sentAt: T0,
      authorizationCode: "OV-7K2M-9Q3F",
      approvedAt: T1,
      validUntil: VALID,
    })
    expect(within(card()).getByText("Authorized to issue")).toBeInTheDocument()
    expect(within(card()).getByText("OV-7K2M-9Q3F")).toBeInTheDocument()
    expect(
      within(card()).getByRole("button", { name: "Blockchain certificate for Owner approved" })
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Issue package" }))
    expect(onIssue).toHaveBeenCalledTimes(1)
  })

  it("issued: replaces the button with the package number", () => {
    renderSummary(CLEAN_VIN, {
      status: "authorized",
      ...clerk,
      sentAt: T0,
      authorizationCode: "OV-7K2M-9Q3F",
      approvedAt: T1,
      validUntil: VALID,
      issued: { at: T1, reference: "UVIP-2026-09-09-4821" },
    })
    expect(within(card()).getByText("Package issued")).toBeInTheDocument()
    expect(within(card()).getByText("UVIP-2026-09-09-4821")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Issue package" })).not.toBeInTheDocument()
  })

  it("authorized by owner pre-approval: says so, with its validity", () => {
    renderSummary(CLEAN_VIN, {
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
    expect(
      within(card()).getByText("The registered owner pre-approved this sale")
    ).toBeInTheDocument()
    expect(within(card()).getByText(/valid until October 9, 2026/)).toBeInTheDocument()
  })

  it("frozen: says why", () => {
    renderSummary(CLEAN_VIN, {
      status: "frozen",
      ...clerk,
      reason: "timeout",
      sentAt: T0,
      frozenAt: T1,
    })
    expect(
      within(card()).getByText("The owner did not respond within 24 hours")
    ).toBeInTheDocument()
    expect(within(card()).getByText(/flagged for security review/)).toBeInTheDocument()
  })
})

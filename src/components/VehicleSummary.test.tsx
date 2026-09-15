import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { AuthorizationState } from "@/lib/authorization"
import { evaluateChecks } from "@/lib/checks"
import { CLEAN_VIN, CLONED_VIN, findVehicle } from "@/lib/vehicles"
import { verdictLabel } from "@/lib/verdict"
import { VehicleSummary } from "./VehicleSummary"

const T0 = "2026-09-12T14:00:00.000Z"
const T1 = "2026-09-12T14:05:00.000Z"

function renderSummary(vin: string, state: AuthorizationState) {
  const vehicle = findVehicle(vin)!
  const onOpenTab = vi.fn()
  render(
    <VehicleSummary
      vehicle={vehicle}
      checks={evaluateChecks(vehicle)}
      state={state}
      openedAt={new Date().toISOString()}
      onOpenTab={onOpenTab}
    />
  )
  return onOpenTab
}

describe("verdictLabel", () => {
  it("names every state", () => {
    expect(verdictLabel({ status: "idle" })).toBe("Checks clear")
    expect(verdictLabel({ status: "blocked" })).toBe("Cannot be issued")
    expect(verdictLabel({ status: "escalated", caseReference: "x", escalatedAt: T0 })).toBe(
      "Escalated"
    )
    const base = { origin: "clerk" as const, requester: "M.", otp: "", link: "", sentAt: T0 }
    expect(verdictLabel({ status: "pending", ...base, expiresAt: T1 })).toBe("Awaiting owner")
    expect(verdictLabel({ status: "frozen", ...base, reason: "denied", frozenAt: T1 })).toBe(
      "Owner denied"
    )
    expect(verdictLabel({ status: "frozen", ...base, reason: "timeout", frozenAt: T1 })).toBe(
      "Request expired"
    )
    const authorized = {
      status: "authorized" as const,
      ...base,
      authorizationCode: "OV-A-B",
      approvedAt: T1,
      validUntil: T1,
    }
    expect(verdictLabel(authorized)).toBe("Authorized to issue")
    expect(verdictLabel({ ...authorized, issued: { at: T1, packageNumber: "UVIP-1" } })).toBe(
      "Package issued"
    )
  })
})

describe("VehicleSummary", () => {
  it("shows three tiles and the sources strip for a clean record", () => {
    renderSummary(CLEAN_VIN, { status: "idle" })
    expect(screen.getByText("All 8 checks passed")).toBeInTheDocument()
    expect(screen.getByText("Not yet requested")).toBeInTheDocument()
    expect(
      screen.getByText(/7 events · no tampering detected · verified 3 minutes ago/)
    ).toBeInTheDocument()
    for (const name of ["Transport Canada", "CBSA", "MTO", "CPIC", "IBC", "NHTSA", "PPSR"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
  })

  it("names the worst flag and its agencies when checks fail", () => {
    renderSummary(CLONED_VIN, { status: "blocked" })
    expect(screen.getByText("2 high-risk flags")).toBeInTheDocument()
    expect(screen.getByText(/Insurer write-off · IBC · \+2 more/)).toBeInTheDocument()
    expect(screen.getByText("Unavailable")).toBeInTheDocument()
  })

  it("tiles open their tab", async () => {
    const onOpenTab = renderSummary(CLEAN_VIN, { status: "idle" })
    const { default: userEvent } = await import("@testing-library/user-event")
    await userEvent.click(screen.getByRole("button", { name: /all 8 checks passed/i }))
    expect(onOpenTab).toHaveBeenCalledWith("checks")
    await userEvent.click(screen.getByRole("button", { name: /blockchain certified/i }))
    expect(onOpenTab).toHaveBeenCalledWith("history")
  })
})

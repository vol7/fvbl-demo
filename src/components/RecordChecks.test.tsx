import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { evaluateChecks } from "@/lib/checks"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { RecordChecks } from "./RecordChecks"

const checksFor = (vin: string) => evaluateChecks(findVehicle(vin)!)

describe("RecordChecks", () => {
  it("lists every source and nine passing checks for the clean vehicle", () => {
    render(<RecordChecks checks={checksFor(CLEAN_VIN)} />)
    expect(
      within(screen.getByRole("list", { name: "Sources" })).getAllByRole("listitem")
    ).toHaveLength(9)
    expect(screen.getByText("All 9 sources answered")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "High risk" })).not.toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Low risk" })).not.toBeInTheDocument()
    const passed = within(screen.getByRole("region", { name: "Passed" })).getAllByRole("listitem")
    expect(passed).toHaveLength(9)
    expect(passed[0]).toHaveTextContent("Import and export record")
    expect(passed[0]).toHaveTextContent("No export reported")
    expect(passed[0]).toHaveTextContent("Transport Canada, CBSA")
  })

  it("groups high risk, then low risk, then passed", () => {
    render(<RecordChecks checks={checksFor(CLONED_VIN)} />)
    const flagged = within(screen.getByRole("region", { name: "High risk" })).getAllByRole(
      "listitem"
    )
    expect(flagged).toHaveLength(2)
    expect(flagged[0]).toHaveTextContent("Insurer write-off")
    expect(flagged[0]).toHaveTextContent("Declared a total loss")
    expect(flagged[0]).toHaveTextContent("Aviva Canada, June 14, 2025")
    const low = within(screen.getByRole("region", { name: "Low risk" })).getAllByRole("listitem")
    expect(low).toHaveLength(1)
    expect(low[0]).toHaveTextContent("Collision record")
    expect(
      within(screen.getByRole("region", { name: "Passed" })).getAllByRole("listitem")
    ).toHaveLength(6)
  })

  it("flags the exported vehicle on the border check alone", () => {
    render(<RecordChecks checks={checksFor(EXPORTED_VIN)} />)
    const [row] = within(screen.getByRole("region", { name: "High risk" })).getAllByRole("listitem")
    expect(row).toHaveTextContent("Export reported, no re-entry")
    expect(row).toHaveTextContent(
      "Reported exported through Port of Montréal, QC on March 18, 2025"
    )
  })
})

import { render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { evaluateChecks } from "@/lib/checks"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { RecordChecks } from "./RecordChecks"

const checksFor = (vin: string) => evaluateChecks(findVehicle(vin)!)

describe("RecordChecks", () => {
  it("lists every source and nine passing checks for the clean vehicle", () => {
    render(<RecordChecks checks={checksFor(CLEAN_VIN)} boot={false} />)
    expect(
      within(screen.getByRole("list", { name: "Sources" })).getAllByRole("listitem")
    ).toHaveLength(9)
    expect(screen.getByText("All 9 sources answered in 1.8 s")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Flagged" })).not.toBeInTheDocument()
    const passed = within(screen.getByRole("region", { name: "Passed" })).getAllByRole("listitem")
    expect(passed).toHaveLength(9)
    expect(passed[0]).toHaveTextContent("Import and export record")
    expect(passed[0]).toHaveTextContent("No export on record")
    expect(passed[0]).toHaveTextContent("Transport Canada, CBSA")
  })

  it("groups failures first, with one severity badge each", () => {
    render(<RecordChecks checks={checksFor(CLONED_VIN)} boot={false} />)
    const flagged = within(screen.getByRole("region", { name: "Flagged" })).getAllByRole("listitem")
    expect(flagged).toHaveLength(3)
    expect(flagged[0]).toHaveTextContent("Insurer write-off")
    expect(flagged[0]).toHaveTextContent("Declared a total loss")
    expect(flagged[0]).toHaveTextContent("Aviva Canada, June 14, 2025")
    expect(screen.getAllByText("High risk")).toHaveLength(2)
    expect(screen.getAllByText("Low risk")).toHaveLength(1)
    expect(
      within(screen.getByRole("region", { name: "Passed" })).getAllByRole("listitem")
    ).toHaveLength(6)
  })

  it("flags the exported vehicle on the border check alone", () => {
    render(<RecordChecks checks={checksFor(EXPORTED_VIN)} boot={false} />)
    const [row] = within(screen.getByRole("region", { name: "Flagged" })).getAllByRole("listitem")
    expect(row).toHaveTextContent("Exported, no re-entry")
    expect(row).toHaveTextContent("Left through Port of Montréal, QC on March 18, 2025")
  })

  it("plays the sources in, then settles", async () => {
    const onSettled = vi.fn()
    render(<RecordChecks checks={checksFor(CLEAN_VIN)} onSettled={onSettled} />)
    expect(screen.getByText("Querying 9 sources…")).toBeInTheDocument()
    await waitFor(() => expect(onSettled).toHaveBeenCalled(), { timeout: 4000 })
  })

  it("settles at once when it does not play", () => {
    const onSettled = vi.fn()
    render(<RecordChecks checks={checksFor(CLEAN_VIN)} boot={false} onSettled={onSettled} />)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { evaluateChecks } from "@/lib/checks"
import { CLEAN_VIN, CLONED_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { RecordChecks } from "./RecordChecks"

describe("RecordChecks", () => {
  it("renders eight checks with pass status for the clean vehicle", () => {
    render(<RecordChecks checks={evaluateChecks(findVehicle(CLEAN_VIN)!)} />)
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(8)
    expect(screen.getAllByText("Pass")).toHaveLength(8)
    expect(screen.getByText(/8 of 8 checks passed/i)).toBeInTheDocument()
    expect(screen.getByText("Import and export record")).toBeInTheDocument()
    expect(screen.getByText("VIN decode match")).toBeInTheDocument()
  })

  it("marks failures first, with severity, and shows their detail", () => {
    render(<RecordChecks checks={evaluateChecks(findVehicle(CLONED_VIN)!)} />)
    expect(screen.getAllByText("Fail")).toHaveLength(3)
    expect(screen.getAllByText("High risk")).toHaveLength(2)
    expect(screen.getAllByText("Low risk")).toHaveLength(1)
    expect(screen.getByText(/Aviva Canada/)).toBeInTheDocument()
    expect(screen.getByText(/3 of 8 checks failed · high risk/i)).toBeInTheDocument()
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Insurer write-off")
    expect(items[0]).toHaveTextContent("Cannot be overridden")
  })

  it("flags the exported vehicle on the border check alone", () => {
    render(<RecordChecks checks={evaluateChecks(findVehicle(EXPORTED_VIN)!)} />)
    expect(screen.getAllByText("Fail")).toHaveLength(1)
    expect(screen.getByText(/1 of 8 checks failed · high risk/i)).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Import and export record")
    expect(screen.getByText(/Lagos, Nigeria/)).toBeInTheDocument()
  })
})

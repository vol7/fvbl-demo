import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CLEAN_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { VehicleTimeline } from "./VehicleTimeline"

describe("VehicleTimeline", () => {
  it("shows every event with nothing to expand", () => {
    const vehicle = findVehicle(CLEAN_VIN)!
    render(<VehicleTimeline vehicle={vehicle} />)
    expect(screen.getAllByRole("listitem")).toHaveLength(7)
    expect(screen.getByText("Entered Canada")).toBeInTheDocument()
    expect(screen.getByText("First registration")).toBeInTheDocument()
    expect(screen.getAllByText("Odometer reading")).toHaveLength(3)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("lists newest first with a certificate on every row", () => {
    render(<VehicleTimeline vehicle={findVehicle(EXPORTED_VIN)!} />)
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Exported")
    expect(items[0]).toHaveTextContent("no re-entry on record")
    expect(items.at(-1)).toHaveTextContent("Entered Canada")
    expect(screen.getAllByText("Blockchain certified")).toHaveLength(items.length)
  })

  it("never shows a person", () => {
    const vehicle = findVehicle(CLEAN_VIN)!
    const { container } = render(<VehicleTimeline vehicle={vehicle} />)
    expect(container.textContent).not.toContain("Okafor")
    expect(container.textContent).not.toContain(vehicle.plate)
  })
})

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CLEAN_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { VehicleTimeline } from "./VehicleTimeline"

describe("VehicleTimeline", () => {
  it("shows the life at a glance, then every event by year, ending where it was built", () => {
    render(<VehicleTimeline vehicle={findVehicle(CLEAN_VIN)!} />)
    const stops = within(screen.getByRole("region", { name: "Lifecycle" })).getAllByRole("listitem")
    expect(stops.map((s) => s.textContent)).toEqual([
      "BuiltUnited States",
      "Entered CanadaFeb 2023Windsor",
      "First registrationApr 2023Toronto",
      "RenewedApr 2025",
    ])
    expect(
      screen.getByText("All 7 events match their ledger certificates. Last checked just now.", {
        exact: false,
      })
    ).toBeInTheDocument()
    const years = ["2025", "2024", "2023"].map((y) => screen.getByRole("region", { name: y }))
    const last = within(years[2]).getAllByRole("listitem").at(-1)!
    expect(last).toHaveTextContent("Built in United States")
    expect(last).toHaveTextContent("Tuscaloosa, Alabama, USA, from the VIN decode")
    expect(screen.getByText("Entered Canada from United States")).toBeInTheDocument()
    expect(screen.getAllByText("Toronto office 4412")).toHaveLength(2)
    expect(screen.getByText("Odometer 31 240 km")).toBeInTheDocument()
  })

  it("puts a certificate on every ledger event and opens it", async () => {
    render(<VehicleTimeline vehicle={findVehicle(CLEAN_VIN)!} />)
    const certificates = screen.getAllByRole("button", { name: /blockchain certificate for/i })
    expect(certificates).toHaveLength(7)
    await userEvent.click(
      screen.getByRole("button", { name: "Blockchain certificate for First registration" })
    )
    expect(
      await screen.findByText("Matches the record. No changes since it was recorded.")
    ).toBeInTheDocument()
    expect(screen.getByText("April 18, 2023")).toBeInTheDocument()
  })

  it("marks the open export and the gap after it", () => {
    render(<VehicleTimeline vehicle={findVehicle(EXPORTED_VIN)!} />)
    const [newest] = within(screen.getByRole("region", { name: "2025" })).getAllByRole("listitem")
    expect(newest).toHaveTextContent("Exported from Canada")
    expect(newest).toHaveTextContent("Port of Montréal, QC, with no re-entry on record")
    const stops = within(screen.getByRole("region", { name: "Lifecycle" })).getAllByRole("listitem")
    expect(stops.at(-1)).toHaveTextContent("No re-entry")
  })

  it("never shows a person", () => {
    const vehicle = findVehicle(CLEAN_VIN)!
    const { container } = render(<VehicleTimeline vehicle={vehicle} />)
    expect(container.textContent).not.toContain("Okafor")
    expect(container.textContent).not.toContain(vehicle.plate)
  })
})

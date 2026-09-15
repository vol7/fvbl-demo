import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CLEAN_VIN, EXPORTED_VIN, findVehicle } from "@/lib/vehicles"
import { BorderAlert } from "./BorderAlert"

describe("BorderAlert", () => {
  it("renders nothing when the vehicle is in the country", () => {
    const { container } = render(<BorderAlert vehicle={findVehicle(CLEAN_VIN)!} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("tells the CBSA and Transport Canada story for an open export", () => {
    render(<BorderAlert vehicle={findVehicle(EXPORTED_VIN)!} />)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("recorded as having left Canada")
    expect(alert).toHaveTextContent(
      "March 18, 2025 via Port of Montréal, QC, bound for Lagos, Nigeria"
    )
    expect(alert).toHaveTextContent("Transport Canada has no re-entry on file")
    expect(alert).toHaveTextContent("cannot be overridden")
  })
})

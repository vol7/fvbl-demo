import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import { TabPanel, Tabs } from "./Tabs"

type K = "a" | "b" | "c"

function Harness() {
  const [tab, setTab] = useState<K>("a")
  return (
    <>
      <Tabs
        idPrefix="t"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "a", label: "Alpha", count: 8 },
          { key: "b", label: "Beta" },
          { key: "c", label: "Gamma" },
        ]}
      />
      <TabPanel id="t" active={tab}>
        <p>panel {tab}</p>
      </TabPanel>
    </>
  )
}

describe("Tabs", () => {
  it("selects on click and wires aria", async () => {
    render(<Harness />)
    const alpha = screen.getByRole("tab", { name: /alpha/i })
    expect(alpha).toHaveAttribute("aria-selected", "true")
    expect(alpha).toHaveTextContent("8")
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "t-a")
    await userEvent.click(screen.getByRole("tab", { name: /beta/i }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("panel b")
    expect(alpha).toHaveAttribute("aria-selected", "false")
  })

  it("moves with the arrow keys and wraps", async () => {
    render(<Harness />)
    screen.getByRole("tab", { name: /alpha/i }).focus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(screen.getByRole("tab", { name: /gamma/i })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: /gamma/i })).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: /alpha/i })).toHaveAttribute("aria-selected", "true")
  })
})

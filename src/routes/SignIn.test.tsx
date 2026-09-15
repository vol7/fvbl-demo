import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router"
import { describe, expect, it } from "vitest"

import { SignIn } from "./SignIn"
import { paths } from "@/lib/paths"

function renderSignIn() {
  const router = createMemoryRouter(
    [
      { path: paths.portal.signIn, element: <SignIn /> },
      { path: paths.portal.home, element: <div>home page</div> },
    ],
    { initialEntries: [paths.portal.signIn] }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe("SignIn", () => {
  it("shows the portal name and a sign-in form", () => {
    renderSignIn()
    expect(screen.getByRole("heading", { name: /authorized user portal/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it("navigates to the portal home on submit", async () => {
    const router = renderSignIn()
    await userEvent.type(screen.getByLabelText(/username/i), "mchen")
    await userEvent.type(screen.getByLabelText(/password/i), "secret")
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }))
    expect(router.state.location.pathname).toBe(paths.portal.home)
    expect(screen.getByText("home page")).toBeInTheDocument()
  })
})

describe("SignIn for the dealer portal", () => {
  it("shows the dealer copy and lands on the registration page", async () => {
    const router = createMemoryRouter(
      [
        { path: paths.dealer.signIn, element: <SignIn variant="dealer" /> },
        { path: paths.dealer.register, element: <div>register page</div> },
      ],
      { initialEntries: [paths.dealer.signIn] }
    )
    render(<RouterProvider router={router} />)
    expect(screen.getByRole("heading", { name: /dealer portal/i })).toBeInTheDocument()
    expect(screen.getByText(/dealer credentials/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }))
    expect(router.state.location.pathname).toBe(paths.dealer.register)
  })
})

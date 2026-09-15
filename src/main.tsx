import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router"

import "./index.css"
import { DealerShell } from "@/components/dealer/DealerShell"
import { ConfirmPage } from "@/components/phone/ConfirmPage"
import { PhoneScreen } from "@/components/phone/PhoneScreen"
import { PortalShell } from "@/components/PortalShell"
import { paths } from "@/lib/paths"
import { Cases } from "@/routes/Cases"
import { Register } from "@/routes/dealer/Register"
import { Home } from "@/routes/Home"
import { Hub } from "@/routes/Hub"
import { Lookup } from "@/routes/Lookup"
import { Phone } from "@/routes/Phone"
import { Uvip } from "@/routes/public/Uvip"
import { UvipBuyer } from "@/routes/public/UvipBuyer"
import { UvipOwner } from "@/routes/public/UvipOwner"
import { Requests } from "@/routes/Requests"
import { SignIn } from "@/routes/SignIn"
import { Vehicle } from "@/routes/Vehicle"

const router = createBrowserRouter([
  { path: paths.hub, element: <Hub /> },
  { path: paths.demo, element: <Navigate to={paths.hub} replace /> },

  { path: paths.portal.signIn, element: <SignIn /> },
  {
    element: <PortalShell />,
    children: [
      { path: paths.portal.home, element: <Home /> },
      { path: paths.portal.lookup, element: <Lookup /> },
      { path: paths.portal.vehiclePattern, element: <Vehicle /> },
      { path: paths.portal.requests, element: <Requests /> },
      { path: paths.portal.cases, element: <Cases /> },
    ],
  },

  { path: paths.dealer.signIn, element: <SignIn variant="dealer" /> },
  {
    element: <DealerShell />,
    children: [{ path: paths.dealer.register, element: <Register /> }],
  },

  {
    path: paths.phone,
    element: <Phone />,
    children: [
      { index: true, element: <PhoneScreen /> },
      { path: "confirm", element: <ConfirmPage /> },
    ],
  },

  { path: paths.uvip, element: <Uvip /> },
  { path: paths.uvipOwner, element: <UvipOwner /> },
  { path: paths.uvipBuyer, element: <UvipBuyer /> },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

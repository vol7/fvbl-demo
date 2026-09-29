import { Navigate, type RouteObject } from "react-router"

import { DealerShell } from "@/components/dealer/DealerShell"
import { ConfirmPage } from "@/components/phone/ConfirmPage"
import { PhoneScreen } from "@/components/phone/PhoneScreen"
import { PortalShell } from "@/components/PortalShell"
import { paths, regionPaths, routePatterns as r } from "@/lib/paths"
import { OnlyIn, RegionRoot } from "@/regions/RegionRoot"
import { Cases } from "@/routes/Cases"
import { Register } from "@/routes/dealer/Register"
import { Home } from "@/routes/Home"
import { Hub } from "@/routes/Hub"
import { LegacyRedirect } from "@/routes/LegacyRedirect"
import { Lookup } from "@/routes/Lookup"
import { NotFound } from "@/routes/NotFound"
import { Phone } from "@/routes/Phone"
import { Picker } from "@/routes/Picker"
import { TitleSearch } from "@/routes/public/ohio/TitleSearch"
import { Uvip } from "@/routes/public/Uvip"
import { UvipBuyer } from "@/routes/public/UvipBuyer"
import { UvipOwner } from "@/routes/public/UvipOwner"
import { Requests } from "@/routes/Requests"
import { SignIn } from "@/routes/SignIn"
import { Vehicle } from "@/routes/Vehicle"

/** Every route. `main.tsx` mounts them in the browser; tests mount them in memory. */
export const routes: RouteObject[] = [
  { path: paths.picker, element: <Picker /> },
  { path: paths.demo, element: <Navigate to={regionPaths("ca").hub} replace /> },
  ...paths.legacy.map((path) => ({ path, element: <LegacyRedirect /> })),

  {
    path: "/:region",
    element: <RegionRoot />,
    children: [
      { index: true, element: <Hub /> },

      { path: r.portal.signIn, element: <SignIn /> },
      {
        element: <PortalShell />,
        children: [
          { path: r.portal.home, element: <Home /> },
          { path: r.portal.lookup, element: <Lookup /> },
          { path: r.portal.vehicle, element: <Vehicle /> },
          { path: r.portal.requests, element: <Requests /> },
          {
            // Referrals from the card; the US card only informs.
            path: r.portal.cases,
            element: (
              <OnlyIn region="ca">
                <Cases />
              </OnlyIn>
            ),
          },
        ],
      },

      { path: r.dealer.signIn, element: <SignIn variant="dealer" /> },
      {
        element: <DealerShell />,
        children: [{ path: r.dealer.register, element: <Register /> }],
      },

      {
        path: r.phone,
        element: <Phone />,
        children: [
          { index: true, element: <PhoneScreen /> },
          { path: "confirm", element: <ConfirmPage /> },
        ],
      },

      {
        path: r.uvip,
        element: (
          <OnlyIn region="ca">
            <Uvip />
          </OnlyIn>
        ),
      },
      {
        path: r.uvipOwner,
        element: (
          <OnlyIn region="ca">
            <UvipOwner />
          </OnlyIn>
        ),
      },
      {
        path: r.uvipBuyer,
        element: (
          <OnlyIn region="ca">
            <UvipBuyer />
          </OnlyIn>
        ),
      },

      {
        path: r.ohio,
        element: (
          <OnlyIn region="us">
            <TitleSearch />
          </OnlyIn>
        ),
      },

      { path: "*", element: <NotFound /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]

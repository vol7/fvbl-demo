import type { RegionId } from "@/regions/types"

/**
 * Every route in one place. `/` picks a country; each region's hub owns `/<region>`
 * and every surface lives under it.
 */
export function regionPaths(region: RegionId) {
  const root = `/${region}`
  const portal = `${root}/portal`
  return {
    hub: root,

    portal: {
      prefix: portal,
      signIn: portal,
      home: `${portal}/home`,
      lookup: `${portal}/lookup`,
      vehicle: (vin: string) => `${portal}/vehicle/${vin}`,
      vehiclePattern: `${portal}/vehicle/:vin`,
      /** Tab on the vehicle page; omitted for the default (record checks). */
      vehicleTab: (vin: string, tab: string) => `${portal}/vehicle/${vin}?tab=${tab}`,
      requests: `${portal}/requests`,
      cases: `${portal}/cases`,
    },

    phone: `${root}/phone`,
    phoneConfirm: `${root}/phone/confirm`,

    /** The dealer's side: first registration of a brand-new vehicle. */
    dealer: {
      signIn: `${root}/dealer`,
      register: `${root}/dealer/register`,
    },

    /** Canada only: the UVIP pages behind the saved ServiceOntario page. */
    uvip: `${root}/uvip`,
    uvipOwner: `${root}/uvip/owner`,
    uvipBuyer: `${root}/uvip/buyer`,

    /** US only: the mock Ohio title search, where the buyer asks the owner to confirm. */
    ohio: `${root}/ohio`,
  }
}

export type RegionPaths = ReturnType<typeof regionPaths>

/** Route patterns, relative to `/:region`. */
export const routePatterns = {
  portal: {
    signIn: "portal",
    home: "portal/home",
    lookup: "portal/lookup",
    vehicle: "portal/vehicle/:vin",
    requests: "portal/requests",
    cases: "portal/cases",
  },
  dealer: { signIn: "dealer", register: "dealer/register" },
  phone: "phone",
  uvip: "uvip",
  uvipOwner: "uvip/owner",
  uvipBuyer: "uvip/buyer",
  ohio: "ohio",
} as const

export const paths = {
  /** Picks a country. Not part of the product. */
  picker: "/",
  /** Legacy alias for the Canadian hub. */
  demo: "/demo",
  /** Served statically from public/; needs the trailing slash. Canada only. */
  serviceOntario: "/serviceontario/",
  /**
   * Routes from before the region prefix. Each redirects to the same path under
   * `/ca`, so the Canadian setup and shared links keep working.
   */
  legacy: ["/portal/*", "/dealer/*", "/phone/*", "/uvip/*"],
} as const

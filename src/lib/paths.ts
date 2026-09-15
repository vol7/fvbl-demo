/**
 * Every route in one place. The hub owns `/`; each surface lives under its own prefix.
 */
export const PORTAL_PREFIX = "/portal"

export const paths = {
  hub: "/",
  /** Legacy alias for the hub; redirects to `/`. */
  demo: "/demo",

  portal: {
    signIn: PORTAL_PREFIX,
    home: `${PORTAL_PREFIX}/home`,
    lookup: `${PORTAL_PREFIX}/lookup`,
    vehicle: (vin: string) => `${PORTAL_PREFIX}/vehicle/${vin}`,
    vehiclePattern: `${PORTAL_PREFIX}/vehicle/:vin`,
    /** Tab on the vehicle page; omitted for the default (record checks). */
    vehicleTab: (vin: string, tab: string) => `${PORTAL_PREFIX}/vehicle/${vin}?tab=${tab}`,
    requests: `${PORTAL_PREFIX}/requests`,
    cases: `${PORTAL_PREFIX}/cases`,
  },

  phone: "/phone",
  phoneConfirm: "/phone/confirm",

  /** The dealer's side: first registration of a brand-new vehicle. */
  dealer: {
    signIn: "/dealer",
    register: "/dealer/register",
  },

  /** Served statically from public/; needs the trailing slash. */
  serviceOntario: "/serviceontario/",
  uvip: "/uvip",
  uvipOwner: "/uvip/owner",
  uvipBuyer: "/uvip/buyer",
} as const

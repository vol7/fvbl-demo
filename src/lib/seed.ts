import { allPass, evaluateChecks } from "./checks"
import { DEMO_VEHICLES, vehicleTitle } from "./vehicles"

/** Static rows that make the portal look in use. Invented data. */

export type Outcome = "clear" | "blocked" | "pending" | "frozen"

export type RecentLookup = {
  vin: string
  plate: string
  vehicle: string
  outcome: Outcome
  when: string // human label
}

export const RECENT_LOOKUPS: RecentLookup[] = [
  {
    vin: "2T3P1RFV8RW412907",
    plate: "CVEK 771",
    vehicle: "2024 Toyota RAV4 XLE",
    outcome: "clear",
    when: "Yesterday, 4:52 p.m.",
  },
  {
    vin: "1FTFW1E85PFA31066",
    plate: "AZRT 305",
    vehicle: "2023 Ford F-150 Lariat",
    outcome: "clear",
    when: "Yesterday, 3:18 p.m.",
  },
  {
    vin: "WBA53BJ0XPCL22841",
    plate: "BKMP 480",
    vehicle: "2023 BMW 530i xDrive",
    outcome: "frozen",
    when: "Yesterday, 11:06 a.m.",
  },
  {
    vin: "5YJ3E1EB7PF563190",
    plate: "CHRW 926",
    vehicle: "2023 Tesla Model 3 Long Range",
    outcome: "clear",
    when: "Sep 2, 2:41 p.m.",
  },
]

export type RequestRow = {
  reference: string
  vehicle: string
  plate: string
  applicant: string
  status: "Authorized" | "Issued" | "Pending" | "Frozen" | "Expired"
  when: string
}

export const REQUEST_ROWS: RequestRow[] = [
  {
    reference: "OV-Q7RM-2HTK",
    vehicle: "2024 Toyota RAV4 XLE",
    plate: "CVEK 771",
    applicant: "L. Tremblay",
    status: "Authorized",
    when: "Yesterday, 4:58 p.m.",
  },
  {
    reference: "OV-3ZPD-WK8N",
    vehicle: "2023 Ford F-150 Lariat",
    plate: "AZRT 305",
    applicant: "R. Singh",
    status: "Authorized",
    when: "Yesterday, 3:25 p.m.",
  },
  {
    reference: "—",
    vehicle: "2023 BMW 530i xDrive",
    plate: "BKMP 480",
    applicant: "J. Moreau",
    status: "Frozen",
    when: "Yesterday, 11:09 a.m.",
  },
  {
    reference: "OV-8HXA-5MQ2",
    vehicle: "2023 Tesla Model 3 Long Range",
    plate: "CHRW 926",
    applicant: "A. Nguyen",
    status: "Authorized",
    when: "Sep 2, 2:47 p.m.",
  },
  {
    reference: "—",
    vehicle: "2022 Honda CR-V Touring",
    plate: "BRTL 118",
    applicant: "S. Patel",
    status: "Expired",
    when: "Sep 1, 9:32 a.m.",
  },
]

export type CaseRow = {
  reference: string
  vehicle: string
  plate: string
  reason: string
  routedTo: string
  status: "Open" | "Under review" | "Closed"
  when: string
}

export const CASE_ROWS: CaseRow[] = [
  {
    reference: "FVBL-2026-09-03-1182",
    vehicle: "2023 BMW 530i xDrive",
    plate: "BKMP 480",
    reason: "Owner denied authorization",
    routedTo: "OPP Auto Theft Unit",
    status: "Under review",
    when: "Yesterday, 11:12 a.m.",
  },
  {
    reference: "FVBL-2026-08-29-0674",
    vehicle: "2022 Lexus RX 350",
    plate: "CJPN 552",
    reason: "Odometer rollback",
    routedTo: "Insurance Hub",
    status: "Open",
    when: "Aug 29, 1:20 p.m.",
  },
  {
    reference: "FVBL-2026-08-21-0417",
    vehicle: "2021 Ram 1500 Sport",
    plate: "BXAT 209",
    reason: "Duplicate identity",
    routedTo: "Toronto Police 32 Division",
    status: "Closed",
    when: "Aug 21, 10:04 a.m.",
  },
  {
    reference: "FVBL-2026-08-14-0233",
    vehicle: "2024 Honda Civic Si",
    plate: "CMDA 660",
    reason: "Stolen vehicle report",
    routedTo: "OPP Auto Theft Unit",
    status: "Closed",
    when: "Aug 14, 3:47 p.m.",
  },
]

export const TODAY_STATS = {
  lookups: 14,
  casesOpened: 1,
} as const

export const OUTCOME_LABEL: Record<RecentLookup["outcome"], string> = {
  clear: "Clear",
  blocked: "Blocked",
  pending: "Pending",
  frozen: "Frozen",
}

/** Demo vehicles first (they are the clickable ones), then static filler. */
export function recentRows(): (RecentLookup & { live: boolean })[] {
  const demo = DEMO_VEHICLES.map((v, i) => ({
    vin: v.vin,
    plate: v.plate,
    vehicle: vehicleTitle(v),
    outcome: (allPass(evaluateChecks(v)) ? "clear" : "blocked") as RecentLookup["outcome"],
    when: ["Today, 9:41 a.m.", "Today, 9:12 a.m.", "Today, 8:56 a.m."][i] ?? "Today",
    live: true,
  }))
  return [...demo, ...RECENT_LOOKUPS.map((r) => ({ ...r, live: false }))]
}

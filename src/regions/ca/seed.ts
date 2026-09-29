import type { CaseRow, RecentLookup, RequestRow } from "@/lib/seed"
import type { Seed } from "@/regions/types"

/** Static rows that make the portal look in use. Invented data. */

const RECENT_LOOKUPS: RecentLookup[] = [
  {
    vin: "2T3P1RFVXRW412907",
    plate: "CVEK 771",
    vehicle: "2024 Toyota RAV4 XLE",
    outcome: "clear",
    when: "Yesterday, 4:52 p.m.",
  },
  {
    vin: "1FTFW1E81PFA31066",
    plate: "AZRT 305",
    vehicle: "2023 Ford F-150 Lariat",
    outcome: "clear",
    when: "Yesterday, 3:18 p.m.",
  },
  {
    vin: "WBA53BJ03PCL22841",
    plate: "BKMP 480",
    vehicle: "2023 BMW 530i xDrive",
    outcome: "frozen",
    when: "Yesterday, 11:06 a.m.",
  },
  {
    vin: "5YJ3E1EB2PF563190",
    plate: "CHRW 926",
    vehicle: "2023 Tesla Model 3 Long Range",
    outcome: "clear",
    when: "Sep 2, 2:41 p.m.",
  },
]

const REQUEST_ROWS: RequestRow[] = [
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

const CASE_ROWS: CaseRow[] = [
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

export const SEED: Seed = {
  recentLookups: RECENT_LOOKUPS,
  requestRows: REQUEST_ROWS,
  caseRows: CASE_ROWS,
  todayStats: { lookups: 14, casesOpened: 1 },
  demoLookupTimes: ["Today, 9:41 a.m.", "Today, 9:12 a.m.", "Today, 8:56 a.m.", "Today, 8:33 a.m."],
}

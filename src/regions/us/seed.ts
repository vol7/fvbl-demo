import type { CaseRow, RecentLookup, RequestRow } from "@/lib/seed"
import type { Seed } from "@/regions/types"

/** Static rows that make the county title office look in use. Invented data. */

const RECENT_LOOKUPS: RecentLookup[] = [
  {
    vin: "1HGCY2F59RA031874",
    plate: "KDM 5193",
    vehicle: "2024 Honda Accord EX-L",
    outcome: "clear",
    when: "Yesterday, 4:47 p.m.",
  },
  {
    vin: "1GCUDDED2PZ206418",
    plate: "JPX 2276",
    vehicle: "2023 Chevrolet Silverado 1500 LT",
    outcome: "clear",
    when: "Yesterday, 2:31 p.m.",
  },
  {
    vin: "5UX53DP09P9M47215",
    plate: "HRL 8830",
    vehicle: "2023 BMW X3 xDrive30i",
    outcome: "frozen",
    when: "Yesterday, 10:58 a.m.",
  },
  {
    vin: "1C4RJXF68RC118902",
    plate: "JWN 1047",
    vehicle: "2024 Jeep Grand Cherokee Limited",
    outcome: "clear",
    when: "Sep 25, 3:12 p.m.",
  },
]

const REQUEST_ROWS: RequestRow[] = [
  {
    reference: "OH-C-4TRX-9KMB",
    vehicle: "2024 Honda Accord EX-L",
    plate: "KDM 5193",
    applicant: "A. Kowalski",
    status: "Confirmed",
    when: "Yesterday, 4:52 p.m.",
  },
  {
    reference: "OH-C-7HQN-2WDP",
    vehicle: "2023 Chevrolet Silverado 1500 LT",
    plate: "JPX 2276",
    applicant: "B. Ramirez",
    status: "Confirmed",
    when: "Yesterday, 2:38 p.m.",
  },
  {
    reference: "—",
    vehicle: "2023 BMW X3 xDrive30i",
    plate: "HRL 8830",
    applicant: "C. Mitchell",
    status: "Not me",
    when: "Yesterday, 11:02 a.m.",
  },
  {
    reference: "—",
    vehicle: "2022 Toyota RAV4 XLE",
    plate: "HGT 6614",
    applicant: "D. Okonkwo",
    status: "No reply",
    when: "Sep 24, 9:40 a.m.",
  },
]

const CASE_ROWS: CaseRow[] = [
  {
    reference: "FVBL-2026-09-28-0931",
    vehicle: "2023 BMW X3 xDrive30i",
    plate: "HRL 8830",
    reason: "Owner said the sale isn't theirs",
    routedTo: "State investigators",
    status: "Under review",
    when: "Yesterday, 11:05 a.m.",
  },
  {
    reference: "FVBL-2026-09-17-0512",
    vehicle: "2020 Ram 1500 Big Horn",
    plate: "—",
    reason: "Salvage brand in another state",
    routedTo: "State investigators",
    status: "Open",
    when: "Sep 17, 1:44 p.m.",
  },
  {
    reference: "FVBL-2026-09-03-0288",
    vehicle: "2022 Dodge Durango R/T",
    plate: "—",
    reason: "Export with no re-entry",
    routedTo: "State investigators",
    status: "Closed",
    when: "Sep 3, 10:20 a.m.",
  },
]

export const SEED: Seed = {
  recentLookups: RECENT_LOOKUPS,
  requestRows: REQUEST_ROWS,
  caseRows: CASE_ROWS,
  todayStats: { lookups: 11, casesOpened: 0 },
  demoLookupTimes: ["Today, 9:38 a.m.", "Today, 9:15 a.m.", "Today, 8:52 a.m.", "Today, 8:30 a.m."],
}

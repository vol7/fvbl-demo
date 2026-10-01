import type { DeclaredVehicle } from "@/lib/border"
import type { BorderPack } from "@/regions/types"

import { BORDER_COPY } from "./copy/border"
import { EXPORT_OWNER } from "./people"
import { EXPORT_VIN } from "./vehicles"

/**
 * The vehicles declared for export at the Port of Montréal, as a CBSA officer
 * sees them (2026-09-30 call). One car per container. Invented: the vessel, the
 * exporters, the owners, the container numbers (with valid ISO 6346 check digits)
 * and the permit numbers. The permit number format is a stand-in until the client
 * confirms Ontario's.
 *
 * The live declaration is the RAM 1500, a demo vehicle with its full record in
 * `vehicles.ts`; the others exist only here.
 */

const confirmed = (at: string) => ({ status: "confirmed" as const, at })
const permit = (number: string) => ({ document: "permit" as const, permit: number })

const DECLARED: DeclaredVehicle[] = [
  {
    // Catch 4. Sold on a deposit and shipped under the seller's name: the permit is
    // genuine, the truck isn't reported stolen, and only the owner can say no.
    vin: EXPORT_VIN,
    year: 2024,
    make: "RAM",
    model: "1500 Limited",
    container: "HBLU4205174",
    position: "Block 4C · row 15 · tier 1",
    billOfLading: "HLF-MTL-26-04502",
    declared: { ...permit("42396781"), exporter: EXPORT_OWNER.name },
    record: { permit: "42396781", stolen: false, owner: EXPORT_OWNER.name },
    owner: "live",
  },
  {
    // Another car's permit: the number is real, the vehicle isn't the one it names.
    vin: "5J8YE1H07PL017354",
    year: 2023,
    make: "Acura",
    model: "MDX A-Spec",
    container: "NRTU5529132",
    position: "Block 4C · row 14 · tier 3",
    billOfLading: "HLF-MTL-26-04471",
    declared: { ...permit("40718254"), exporter: "Tri-Port Trading Inc." },
    record: {
      permit: "40255917",
      declaredPermitBelongsTo: "2019 Honda Civic LX",
      stolen: false,
      owner: "Sanjay Mehta",
    },
    owner: { status: "noReply", at: "8:02 a.m." },
  },
  {
    // A fake permit: the number is on no Ontario registration.
    vin: "2T3F1RFV6PW287316",
    year: 2023,
    make: "Toyota",
    model: "RAV4 Limited",
    container: "LSPU3077810",
    position: "Block 2A · row 6 · tier 4",
    billOfLading: "HLF-MTL-26-04483",
    declared: { ...permit("39170426"), exporter: "Omar Haddad" },
    record: { permit: "41822063", stolen: false, owner: "Lucie Bergeron" },
    owner: { status: "noReply", at: "8:14 a.m." },
  },
  {
    vin: "4T1G11AK5NU603118",
    year: 2022,
    make: "Toyota",
    model: "Camry SE",
    container: "HBLU4182063",
    position: "Block 1B · row 3 · tier 2",
    billOfLading: "HLF-MTL-26-04412",
    declared: { ...permit("40963318"), exporter: "Rideau Motor Exports Ltd." },
    record: { permit: "40963318", stolen: false, owner: "Rideau Motor Exports Ltd." },
    owner: confirmed("7:48 a.m."),
  },
  {
    vin: "2HKRW2H82MH214573",
    year: 2021,
    make: "Honda",
    model: "CR-V EX-L",
    container: "CRXU6110940",
    position: "Block 1B · row 4 · tier 1",
    billOfLading: "HLF-MTL-26-04419",
    declared: { ...permit("39884120"), exporter: "Samuel Osei" },
    record: { permit: "39884120", stolen: false, owner: "Samuel Osei" },
    owner: confirmed("7:55 a.m."),
  },
  {
    vin: "KM8JBCAE0PU192044",
    year: 2023,
    make: "Hyundai",
    model: "Tucson Preferred",
    container: "NRTU5533024",
    position: "Block 3A · row 9 · tier 2",
    billOfLading: "HLF-MTL-26-04437",
    declared: { ...permit("42017739"), exporter: "Rideau Motor Exports Ltd." },
    record: { permit: "42017739", stolen: false, owner: "Rideau Motor Exports Ltd." },
    owner: confirmed("8:05 a.m."),
  },
  {
    // Bought privately and shipped on a bill of sale alone, never transferred: the
    // VIN still finds the registered owner, who confirmed.
    vin: "WDC0G4KB0KV167329",
    year: 2019,
    make: "Mercedes-Benz",
    model: "GLC 300",
    container: "LSPU3091464",
    position: "Block 2A · row 7 · tier 1",
    billOfLading: "HLF-MTL-26-04445",
    declared: { document: "billOfSale", permit: null, exporter: "Julien Côté" },
    record: { permit: "37415092", stolen: false, owner: "Marie-Ève Lavoie" },
    owner: confirmed("8:21 a.m."),
  },
  {
    vin: "3GCUYDED6MG402815",
    year: 2021,
    make: "Chevrolet",
    model: "Silverado 1500 LT",
    container: "HBLU4218309",
    position: "Block 3B · row 2 · tier 3",
    billOfLading: "HLF-MTL-26-04458",
    declared: { ...permit("40551873"), exporter: "Rideau Motor Exports Ltd." },
    record: { permit: "40551873", stolen: false, owner: "Rideau Motor Exports Ltd." },
    owner: confirmed("8:26 a.m."),
  },
  {
    vin: "5N1AT2MVXLC726590",
    year: 2020,
    make: "Nissan",
    model: "Rogue SV",
    container: "CRXU6122555",
    position: "Block 3B · row 5 · tier 2",
    billOfLading: "HLF-MTL-26-04463",
    declared: { ...permit("38926401"), exporter: "Amélie Fortin" },
    record: { permit: "38926401", stolen: false, owner: "Amélie Fortin" },
    owner: confirmed("8:30 a.m."),
  },
]

export const BORDER: BorderPack = {
  agency: "CBSA",
  officer: {
    name: "Karine Ouellet",
    initials: "KO",
    role: "Border services officer",
    badge: "Badge 18842",
  },
  vessel: {
    name: "MV Laurentide Spirit",
    voyage: "Voyage 2640E",
    from: "Port of Montréal",
    to: "Antwerp, Belgium",
  },
  declared: DECLARED,
  live: { vin: EXPORT_VIN, exporter: EXPORT_OWNER.name },
  holdPrefix: "EX",
  refusalPrefix: "EXR",
  copy: BORDER_COPY,
}

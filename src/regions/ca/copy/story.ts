import type { Check } from "@/lib/checks"
import { formatDate } from "@/lib/format"
import { openExport, type Vehicle } from "@/lib/vehicles"
import type { StoryCopy, StoryTelling } from "@/regions/types"

const FEDERAL = "the OPP and CBSA"
const PROVINCIAL = "the OPP"

/** Agencies as a clerk says them: "the MTO", everything else by name. */
function agencyName(agency: string): string {
  return agency === "MTO" ? "the MTO" : agency
}

/**
 * The record's worst flag told in the clerk's words. Identity conflicts name the
 * conflict, not a verdict on the car at the counter: either vehicle could be the
 * clone, and a clerk cannot tell which.
 */
function tell(check: Check, vehicle: Vehicle): StoryTelling {
  const r = vehicle.records
  switch (check.id) {
    case "border": {
      const exported = openExport(vehicle)
      const where = exported ? ` on ${formatDate(exported.date)} via ${exported.port}` : ""
      return {
        title: "This VIN was reported exported and has no re-entry on record",
        body: `CBSA has an export reported${where}, and no re-entry is on file. Either the vehicle at this counter or the exported one carries a cloned identity, or a re-entry went unrecorded.`,
        footnote: "The MTO record alone would have shown this vehicle as clear.",
        notifyAfterReview: FEDERAL,
      }
    }
    case "usTitle": {
      const state = r.usTitle?.state ?? "a US state"
      const issued = r.usTitle ? `, issued ${formatDate(r.usTitle.issuedOn)}` : ""
      return {
        title: "This VIN also holds an active US title",
        body: `NMVTIS, the US federal title system, reports an active ${state} title for this VIN${issued}. Either the vehicle at this counter or the one titled in ${state} carries a cloned identity, or the US title was not cancelled at import.`,
        footnote: "The Ontario record alone would have shown this vehicle as clear.",
        notifyAfterReview: FEDERAL,
      }
    }
    case "writeOff":
      return {
        title: "This vehicle was declared a total loss",
        body: r.writeOff
          ? `${r.writeOff.insurer} declared it a total loss on ${formatDate(r.writeOff.declaredOn)}. A written-off VIN back on the road is a common sign of a rebuilt or re-identified vehicle.`
          : `${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
    case "duplicate":
      return {
        title: "This VIN is registered to more than one vehicle",
        body: r.duplicateIdentity
          ? `The same VIN has been active on Ontario plate ${r.duplicateIdentity.plate} since ${formatDate(r.duplicateIdentity.since)}. Two vehicles cannot share one identity, so one of them carries a cloned VIN.`
          : `${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
    case "stolen":
      return {
        title: "This vehicle is reported stolen",
        body: r.stolenReport
          ? `${r.stolenReport.agency} reported it stolen on ${formatDate(r.stolenReport.reportedOn)}.`
          : `${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
    case "decode":
      return {
        title: "The VIN does not describe this vehicle",
        body: `${check.detail}.`,
        notifyAfterReview: FEDERAL,
      }
    case "collision":
      return {
        title: "A collision is on record",
        body: `${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
    case "odometer":
      return {
        title: "The odometer has gone backwards",
        body: `The odometer read ${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
    case "lien":
      return {
        title: "An active lien is registered",
        body: r.lien
          ? `${r.lien.holder} registered a lien on ${formatDate(r.lien.registeredOn)}. The package cannot be issued until it is discharged.`
          : `${check.detail}.`,
        notifyAfterReview: PROVINCIAL,
      }
  }
}

export const STORY: StoryCopy = { tell, agencyName }

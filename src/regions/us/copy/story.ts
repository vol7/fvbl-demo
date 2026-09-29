import type { Check } from "@/lib/checks"
import { formatDate } from "@/lib/format"
import { openExport, type Vehicle } from "@/lib/vehicles"
import type { StoryCopy, StoryTelling } from "@/regions/types"

import { latestTitle } from "../checks"

/**
 * Who state investigators notify after review. Placeholders until the US contact
 * confirms who a clerk refers a suspect title to (US plan, open question 4).
 */
const BORDER = "CBP"
const PARTNER = "the other jurisdiction's registry"
const STATE = "the titling state"

const AGENCY_NAMES: Record<string, string> = {
  States: "participating state registries",
  Ontario: "Ontario's vehicle registry",
  Owner: "the registered owner",
  Titles: "the title records",
  Title: "the current title",
}

/** Agencies as a clerk says them: acronyms as they are, the rest in words. */
function agencyName(agency: string): string {
  return AGENCY_NAMES[agency] ?? agency
}

/**
 * The record's worst flag told to a county title clerk. FVBL informs; the clerk
 * decides (docs/us-version.md). Identity conflicts name the conflict, never a verdict
 * on the person at the counter, and FVBL is framed by its reach, not by gaps in
 * Ohio's own records. Outside sources keep their conditional wording.
 */
function tell(check: Check, vehicle: Vehicle): StoryTelling {
  const r = vehicle.records
  switch (check.id) {
    case "border": {
      const exported = openExport(vehicle)
      const where = exported ? ` on ${formatDate(exported.date)} through ${exported.port}` : ""
      return {
        title: "This VIN was reported exported and has no re-entry on record",
        body: `CBP has an export on file for this VIN${where}, and no re-entry into the US. Either the vehicle at this counter or the exported one may carry a cloned identity, or a re-entry went unrecorded.`,
        footnote: "Export records shared with the right agreements in place.",
        notifyAfterReview: BORDER,
      }
    }
    case "otherJurisdiction": {
      const other = r.otherJurisdiction
      const where = other?.jurisdiction ?? "another jurisdiction"
      const title = latestTitle(vehicle)
      const presented = title ? `The ${title.state} title presented here` : "The title presented here"
      const since = other ? ` since ${formatDate(other.since)}` : ""
      return {
        title: `This VIN is on an active ${where} ${other?.kind ?? "record"}`,
        body: `${presented} is for a VIN that ${where === "Ontario" ? "Ontario's registry" : where} reports as ${other?.kind === "title" ? "titled" : "registered"} in ${where}${since}. Either the vehicle at this counter or the one in ${where} may carry a cloned identity, or the ${where} ${other?.kind ?? "record"} was not cancelled at export.`,
        footnote: "A record held in another jurisdiction, shared with the right agreements in place.",
        reportedBy: ["Ontario"],
        notifyAfterReview: PARTNER,
      }
    }
    case "nmvtis":
    case "brand": {
      const b = r.brand
      if (!b) {
        return { title: `${check.label}: ${check.result}`, body: `${check.detail}.`, notifyAfterReview: STATE }
      }
      return {
        title: `This VIN carried a ${b.brand.toLowerCase()} brand before its current title`,
        body: `${b.state} branded this vehicle ${b.brand.toLowerCase()} on ${formatDate(b.brandedOn)}. ${b.cleanTitle.state} issued a title without the brand on ${formatDate(b.cleanTitle.issuedOn)}, and that is the title presented here.`,
        footnote: "Found alongside the NMVTIS check, with the branding state's record on the ledger.",
        reportedBy: ["NMVTIS", "States"],
        notifyAfterReview: STATE,
      }
    }
    case "ownerConfirmed":
      return {
        title: "The registered owner said this sale isn't theirs",
        body: `The owner answered the title alert for this vehicle with “Not me”. The assignment on the title may not have been made by the owner of record.`,
        footnote: "The owner's answer is certified on the ledger.",
        notifyAfterReview: STATE,
      }
    case "stolen":
      return {
        title: "This vehicle is reported stolen",
        body: r.stolenReport
          ? `${r.stolenReport.agency} reported it stolen on ${formatDate(r.stolenReport.reportedOn)}.`
          : `${check.detail}.`,
        notifyAfterReview: STATE,
      }
    case "decode":
      return {
        title: "The VIN does not describe this vehicle",
        body: `${check.detail}.`,
        notifyAfterReview: STATE,
      }
    case "odometer":
      return {
        title: "The odometer has gone backwards",
        body: `The odometer read ${check.detail}.`,
        notifyAfterReview: STATE,
      }
    case "lien":
      return {
        title: "A lien is noted on the title",
        body: r.lien
          ? `${r.lien.holder} noted a lien on ${formatDate(r.lien.registeredOn)}.`
          : `${check.detail}.`,
        notifyAfterReview: STATE,
      }
    // Ontario's checks; an Ohio counter doesn't run them.
    case "writeOff":
    case "duplicate":
    case "usTitle":
    case "collision":
      return { title: check.label, body: `${check.detail}.`, notifyAfterReview: STATE }
  }
}

export const STORY: StoryCopy = {
  tell,
  agencyName,
  closing: "Your office decides whether to issue.",
}

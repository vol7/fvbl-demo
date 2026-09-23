import { useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"

import { ActivityTimeline } from "@/components/ActivityTimeline"
import { DemoControls } from "@/components/DemoControls"
import { LedgerCheckedAt } from "@/components/ledgerClock"
import { OwnershipHistory } from "@/components/OwnershipHistory"
import { RecordChecks } from "@/components/RecordChecks"
import type { ApplicantDetails } from "@/components/RequestDialog"
import { TabPanel, Tabs } from "@/components/Tabs"
import { VehicleDetails } from "@/components/VehicleDetails"
import { VehicleSummary, type VehicleTab } from "@/components/VehicleSummary"
import { VehicleTimeline } from "@/components/VehicleTimeline"
import { useClock } from "@/hooks/useClock"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deriveActivity, registrationActivity } from "@/lib/activity"
import {
  generateCaseReference,
  generateLinkToken,
  generateOtp,
  generatePackageNumber,
} from "@/lib/authorization"
import { allPass, evaluateChecks } from "@/lib/checks"
import { ledgerEntries } from "@/lib/ledger"
import { OFFICE } from "@/lib/office"
import type { RegistrationState } from "@/lib/registration"
import { registrationState, useSession, vehicleState } from "@/lib/session"
import {
  bornVehicle,
  findVehicle,
  vehicleTitle,
  type Vehicle as VehicleRecord,
} from "@/lib/vehicles"
import { paths } from "@/lib/paths"

const TABS: VehicleTab[] = ["checks", "history", "ownership"]

function isTab(value: string | null): value is VehicleTab {
  return TABS.includes(value as VehicleTab)
}

export function Vehicle() {
  const { vin = "" } = useParams<{ vin: string }>()
  const [session] = useSession()
  const found = findVehicle(vin)
  const registration = registrationState(session, found?.vin ?? vin)
  // The registry's view: a confirmed dealer submission becomes the first history events.
  const vehicle = found ? bornVehicle(found, registration) : undefined

  if (!vehicle) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="items-start gap-4">
          <p className="text-sm">No record found for this VIN.</p>
          <Link to={paths.portal.lookup} className={buttonVariants({ variant: "outline" })}>
            Back to lookup
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (vehicle.history.length === 0) {
    return <UnregisteredVehicle vehicle={vehicle} registration={registration} />
  }

  return <VehicleView key={vehicle.vin} vehicle={vehicle} registration={registration} />
}

/** The VIN decodes but the ministry has never registered it. Nothing to check yet. */
function UnregisteredVehicle({
  vehicle,
  registration,
}: {
  vehicle: VehicleRecord
  registration: RegistrationState
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="items-start gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Unregistered VIN
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{vehicleTitle(vehicle)}</h1>
          <span className="font-mono text-sm tracking-wider text-muted-foreground">
            {vehicle.vin}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          This VIN decodes to a {vehicle.year} {vehicle.make} {vehicle.model} but has{" "}
          <span className="font-medium text-foreground">no registration on file</span> with the
          ministry or any other jurisdiction. Record checks run once it is registered.
        </p>
        {registration.status === "pending" ? (
          <p
            role="status"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            A dealer submission is awaiting confirmation from {registration.dealer}.
          </p>
        ) : null}
        <Link to={paths.portal.lookup} className={buttonVariants({ variant: "outline" })}>
          Back to lookup
        </Link>
      </CardContent>
    </Card>
  )
}

function VehicleView({
  vehicle,
  registration,
}: {
  vehicle: VehicleRecord
  registration: RegistrationState
}) {
  const checks = useMemo(() => evaluateChecks(vehicle), [vehicle])
  const canRequest = allPass(checks)
  const [session, dispatch] = useSession()
  const now = useClock()
  // Presentational only: when this page was opened, for the activity feed and the ledger.
  const [openedAt] = useState(() => new Date().toISOString())
  // The record checks play once per record; until then the decision card holds its verdict.
  const [settled, setSettled] = useState(false)

  // The tab lives in the URL so deep links and the hub's shortcuts land on it.
  const [params, setParams] = useSearchParams()
  const tabParam = params.get("tab")
  const tab: VehicleTab = isTab(tabParam) ? tabParam : "checks"
  const [direction, setDirection] = useState(1)
  const setTab = (next: VehicleTab) => {
    setDirection(TABS.indexOf(next) >= TABS.indexOf(tab) ? 1 : -1)
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === "checks") p.delete("tab")
        else p.set("tab", next)
        return p
      },
      { replace: true }
    )
  }

  // Browsing is read-only. Nothing here writes to the session until the clerk acts.
  const vin = vehicle.vin
  const state = vehicleState(session, vin, canRequest)

  const stamp = () => new Date().toISOString()
  const onRequest = (applicant: ApplicantDetails) =>
    dispatch({
      type: "request",
      vin,
      canRequest,
      otp: generateOtp(),
      link: generateLinkToken(),
      requester: applicant.name,
      at: stamp(),
    })
  const onIssue = () =>
    dispatch({ type: "issue", vin, packageNumber: generatePackageNumber(new Date()), at: stamp() })
  const onEscalate = () =>
    dispatch({
      type: "escalate",
      vin,
      canRequest,
      caseReference: generateCaseReference(new Date()),
      at: stamp(),
    })

  const checked = settled || tab !== "checks"
  const events = [
    ...registrationActivity(vehicle, registration),
    ...deriveActivity(state, openedAt, OFFICE.clerk, vehicle),
  ]
    // The feed does not give the verdict away while the checks are still coming in.
    .filter((event) => checked || event.id !== "blocked")
    .sort((a, b) => a.at.localeCompare(b.at))

  // The ledger last verified this record a few minutes before the page opened, unless
  // the record itself is newer: a vehicle registered seconds ago was verified just now.
  const verifiedAt = useMemo(
    () =>
      new Date(
        Math.max(
          new Date(openedAt).getTime() - 3 * 60_000,
          registration.status === "registered" ? new Date(registration.registeredAt).getTime() : 0
        )
      ),
    [openedAt, registration]
  )

  return (
    <LedgerCheckedAt.Provider value={verifiedAt}>
      <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <VehicleSummary
            vehicle={vehicle}
            checks={checks}
            state={state}
            settled={checked}
            onRequest={onRequest}
            onIssue={onIssue}
            onEscalate={onEscalate}
            onOpenTab={setTab}
          />
          <div className="flex flex-col gap-5">
            <Tabs
              idPrefix="vehicle-tab"
              value={tab}
              onChange={setTab}
              tabs={[
                { key: "checks", label: "Record checks", count: checks.length },
                { key: "history", label: "Vehicle history", count: vehicle.history.length },
                {
                  key: "ownership",
                  label: "Ownership",
                  count: vehicle.history.filter(
                    (e) => e.kind === "firstRegistration" || e.kind === "transfer"
                  ).length,
                },
              ]}
            />
            <TabPanel id="vehicle-tab" active={tab} direction={direction}>
              {tab === "checks" ? (
                <RecordChecks checks={checks} boot={!settled} onSettled={() => setSettled(true)} />
              ) : null}
              {tab === "history" ? <VehicleTimeline vehicle={vehicle} /> : null}
              {tab === "ownership" ? (
                <OwnershipHistory vehicle={vehicle} today={openedAt.slice(0, 10)} />
              ) : null}
            </TabPanel>
          </div>
        </div>
        <aside
          aria-label="Record details"
          className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-0"
        >
          <VehicleDetails
            vehicle={vehicle}
            ledgerEvents={ledgerEntries(vehicle, state).length}
            verifiedAt={verifiedAt}
            now={now}
          />
          <ActivityTimeline events={events} />
        </aside>
      </div>
      <DemoControls />
    </LedgerCheckedAt.Provider>
  )
}

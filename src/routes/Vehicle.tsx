import { useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router"

import { ActivityTimeline } from "@/components/ActivityTimeline"
import { BorderAlert } from "@/components/BorderAlert"
import { DemoControls } from "@/components/DemoControls"
import { OwnershipCard } from "@/components/OwnershipCard"
import { PackagePanel, type ApplicantDetails } from "@/components/PackagePanel"
import { RecordChecks } from "@/components/RecordChecks"
import { TabPanel, Tabs } from "@/components/Tabs"
import { VehicleSummary, type VehicleTab } from "@/components/VehicleSummary"
import { VehicleTimeline } from "@/components/VehicleTimeline"
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
  // Presentational only: when this page was opened, for the timeline caption.
  const [openedAt] = useState(() => new Date().toISOString())
  const [settled, setSettled] = useState(false)

  // The tab lives in the URL so deep links and the hub's shortcuts land on it.
  const [params, setParams] = useSearchParams()
  const tabParam = params.get("tab")
  const tab: VehicleTab = isTab(tabParam) ? tabParam : "checks"
  const setTab = (next: VehicleTab) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === "checks") p.delete("tab")
        else p.set("tab", next)
        return p
      },
      { replace: true }
    )

  // Browsing is read-only. Nothing here writes to the session until the clerk acts.
  const vin = vehicle.vin
  const state = vehicleState(session, vin, canRequest)

  const now = () => new Date().toISOString()
  const onRequest = (applicant: ApplicantDetails) =>
    dispatch({
      type: "request",
      vin,
      canRequest,
      otp: generateOtp(),
      link: generateLinkToken(),
      requester: applicant.name,
      at: now(),
    })
  const onIssue = () =>
    dispatch({ type: "issue", vin, packageNumber: generatePackageNumber(new Date()), at: now() })
  const onEscalate = () =>
    dispatch({
      type: "escalate",
      vin,
      canRequest,
      caseReference: generateCaseReference(new Date()),
      at: now(),
    })

  const events = [
    ...registrationActivity(vehicle, registration),
    ...deriveActivity(state, openedAt, OFFICE.clerk, vehicle),
  ].sort((a, b) => a.at.localeCompare(b.at))

  return (
    <div className="flex flex-col gap-6">
      <VehicleSummary
        vehicle={vehicle}
        checks={checks}
        state={state}
        openedAt={openedAt}
        verifiedAt={registration.status === "registered" ? registration.registeredAt : undefined}
        onOpenTab={setTab}
      />
      <BorderAlert vehicle={vehicle} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tabs
            idPrefix="vehicle-tab"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "checks", label: "Record checks", count: checks.length },
              { key: "history", label: "Vehicle history", count: vehicle.history.length },
              { key: "ownership", label: "Ownership and registration" },
            ]}
          />
          <TabPanel id="vehicle-tab" active={tab}>
            {tab === "checks" ? (
              <RecordChecks checks={checks} onSettled={() => setSettled(true)} />
            ) : null}
            {tab === "history" ? <VehicleTimeline vehicle={vehicle} /> : null}
            {tab === "ownership" ? <OwnershipCard vehicle={vehicle} /> : null}
          </TabPanel>
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-0">
          <PackagePanel
            vehicle={vehicle}
            checks={checks}
            state={state}
            onRequest={onRequest}
            onEscalate={onEscalate}
            onIssue={onIssue}
            settled={settled || tab !== "checks"}
          />
          <ActivityTimeline events={events} />
        </div>
      </div>
      <DemoControls />
    </div>
  )
}

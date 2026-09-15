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
import { deriveActivity } from "@/lib/activity"
import {
  generateCaseReference,
  generateLinkToken,
  generateOtp,
  generatePackageNumber,
} from "@/lib/authorization"
import { allPass, evaluateChecks } from "@/lib/checks"
import { OFFICE } from "@/lib/office"
import { useSession, vehicleState } from "@/lib/session"
import { findVehicle, type Vehicle as VehicleRecord } from "@/lib/vehicles"
import { paths } from "@/lib/paths"

const TABS: VehicleTab[] = ["checks", "history", "ownership"]

function isTab(value: string | null): value is VehicleTab {
  return TABS.includes(value as VehicleTab)
}

export function Vehicle() {
  const { vin = "" } = useParams<{ vin: string }>()
  const vehicle = findVehicle(vin)

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

  return <VehicleView key={vehicle.vin} vehicle={vehicle} />
}

function VehicleView({ vehicle }: { vehicle: VehicleRecord }) {
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

  const events = deriveActivity(state, openedAt, OFFICE.clerk, vehicle)

  return (
    <div className="flex flex-col gap-6">
      <VehicleSummary
        vehicle={vehicle}
        checks={checks}
        state={state}
        openedAt={openedAt}
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

import { Ship } from "lucide-react"

import { DemoControls } from "@/components/DemoControls"
import { Button } from "@/components/ui/button"
import { generateLinkToken, generateOtp } from "@/lib/authorization"
import { loadingCutoff } from "@/lib/exports"
import { exportState, useSession } from "@/lib/session"
import { useRegion } from "@/regions"

/**
 * Files the live declaration: the vehicle joins the officer's list and its
 * registered owner is texted, with until the loading cut-off to answer. Not part of
 * the product; in the concept the text goes out the moment the exporter files. On
 * the hub and in the border pages' hidden panel.
 */
export function DeclareExportButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const border = useRegion().border
  const [session, dispatch] = useSession()
  if (!border) return null
  const declared = exportState(session, border.live.vin).status !== "none"
  return (
    <Button
      variant="outline"
      size={size}
      disabled={declared}
      onClick={() => {
        const now = new Date()
        dispatch({
          type: "declareExport",
          vin: border.live.vin,
          exporter: border.live.exporter,
          otp: generateOtp(),
          link: generateLinkToken(),
          at: now.toISOString(),
          expiresAt: loadingCutoff(now),
        })
      }}
    >
      <Ship data-icon="inline-start" aria-hidden />
      {border.copy.hub.declare}
    </Button>
  )
}

/** Shift+D on the border pages: declare the export, then answer as the owner. */
export function BorderDemoControls() {
  return (
    <DemoControls>
      <DeclareExportButton />
    </DemoControls>
  )
}

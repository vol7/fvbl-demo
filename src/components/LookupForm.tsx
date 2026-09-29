import { Search } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidVin, normalizeVin } from "@/lib/format"
import { submitOnEnter } from "@/lib/submitOnEnter"
import { findVehicle } from "@/lib/vehicles"
import { paths } from "@/lib/paths"

export const INVALID_MESSAGE = "Enter a 17-character VIN (letters I, O and Q are not used)."
export const NOT_FOUND_MESSAGE = "No record found for this VIN."

/** `hideLabel` keeps the label for screen readers when a heading above already names the field. */
export function LookupForm({
  size = "default",
  hideLabel = false,
}: {
  size?: "default" | "lg"
  hideLabel?: boolean
}) {
  const navigate = useNavigate()
  const [vin, setVin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const large = size === "lg"

  function submit() {
    if (!isValidVin(vin)) {
      setError(INVALID_MESSAGE)
      return
    }
    const normalized = normalizeVin(vin)
    if (!findVehicle(normalized)) {
      setError(NOT_FOUND_MESSAGE)
      return
    }
    navigate(paths.portal.vehicle(normalized))
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="lookup-code" className={hideLabel ? "sr-only" : undefined}>
        Vehicle Identification Number (VIN)
      </Label>
      <div className="flex gap-2">
        <Input
          id="lookup-code"
          size={large ? "lg" : "default"}
          className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
          maxLength={17}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          spellCheck={false}
          placeholder="17 characters"
          value={vin}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "lookup-error" : undefined}
          onKeyDown={submitOnEnter(submit)}
          onChange={(e) => {
            setVin(e.target.value.toUpperCase())
            setError(null)
          }}
        />
        <Button
          type="button"
          size={large ? "lg" : "default"}
          className="px-4 has-data-[icon=inline-start]:pl-3.5"
          onClick={submit}
        >
          <Search data-icon="inline-start" aria-hidden />
          Look up
        </Button>
      </div>
      {error ? (
        <p id="lookup-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

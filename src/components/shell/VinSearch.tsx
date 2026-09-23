import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

import { Input } from "@/components/ui/input"
import { isValidVin, normalizeVin } from "@/lib/format"
import { submitOnEnter } from "@/lib/submitOnEnter"
import { cn } from "@/lib/utils"
import { findVehicle } from "@/lib/vehicles"
import { paths } from "@/lib/paths"

/** VIN search for the sidebar. ⌘K or Ctrl+K focuses it from anywhere in the portal. */
export function VinSearch() {
  const navigate = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  const [vin, setVin] = useState("")
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function submit() {
    const normalized = normalizeVin(vin)
    if (!isValidVin(normalized) || !findVehicle(normalized)) {
      setInvalid(true)
      return
    }
    setVin("")
    ref.current?.blur()
    navigate(paths.portal.vehicle(normalized))
  }

  return (
    <div className="relative" role="search">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={ref}
        aria-label="Search by VIN"
        placeholder="Search by VIN"
        className={cn(
          "h-8 bg-background pr-10 pl-8 font-mono text-[13px] tracking-wider uppercase",
          "placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
        )}
        value={vin}
        maxLength={17}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        onKeyDown={(e) => submitOnEnter(submit)(e)}
        onChange={(e) => {
          setVin(e.target.value.toUpperCase())
          setInvalid(false)
        }}
      />
      <kbd
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border bg-muted/60 px-1 font-sans text-[11px] leading-4 text-muted-foreground"
        aria-hidden
      >
        ⌘K
      </kbd>
    </div>
  )
}

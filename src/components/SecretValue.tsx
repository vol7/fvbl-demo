import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Owner details stay behind a grey bar until the clerk asks to see them. The bar's
 * width stands in for the value so the layout does not jump on reveal.
 */
export function SecretValue({
  value,
  label,
  width = "6rem",
  mono = false,
}: {
  value: string
  /** Names the value for the toggle: "owner name". */
  label: string
  width?: string
  mono?: boolean
}) {
  const [shown, setShown] = useState(false)
  return (
    <span className="inline-flex min-h-5 items-center gap-1.5">
      {shown ? (
        <span className={cn(mono && "font-mono text-[13px] tracking-wide")}>{value}</span>
      ) : (
        <span
          className="inline-block h-3 rounded-sm bg-muted-foreground/20"
          style={{ width }}
          role="img"
          aria-label={`${label} hidden`}
        />
      )}
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-label={`${shown ? "Hide" : "Show"} ${label}`}
        className="-my-1 grid size-6 place-items-center rounded-md text-muted-foreground/80 hover:bg-muted hover:text-foreground"
      >
        {shown ? (
          <EyeOff className="size-3.5" aria-hidden />
        ) : (
          <Eye className="size-3.5" aria-hidden />
        )}
      </button>
    </span>
  )
}

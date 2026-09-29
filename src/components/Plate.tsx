import { cn } from "@/lib/utils"
import { useRegion } from "@/regions"

/**
 * The region's plate, drawn like one. Ontario (the only style so far): blue ink on
 * white, a thin border, wide tracking.
 */
export function Plate({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const pack = useRegion()
  return (
    <span
      aria-label={pack.plate.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded border-[1.5px] border-[#1d3f8f] bg-background font-mono leading-none font-semibold text-[#1d3f8f] dark:border-[#8fb0ff] dark:text-[#8fb0ff]",
        size === "md"
          ? "h-6 px-2 text-[13px] tracking-[0.12em]"
          : "h-5 px-1.5 text-[11px] tracking-[0.1em]"
      )}
    >
      {plate}
    </span>
  )
}

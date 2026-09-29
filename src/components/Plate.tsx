import { cn } from "@/lib/utils"
import { useRegion } from "@/regions"

/**
 * The region's plate, drawn like one. Ontario: blue ink on white, a thin blue
 * border, wide tracking. Ohio: navy ink on white, a grey border and a red band
 * along the bottom edge.
 */
export function Plate({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const pack = useRegion()
  return (
    <span
      aria-label={pack.plate.label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded bg-background font-mono leading-none font-semibold",
        pack.plate.style === "ohio"
          ? "border border-b-[3px] border-[#9aa3ad] border-b-[#c8102e] text-[#13294b] dark:border-[#5d6670] dark:border-b-[#ff5a6e] dark:text-[#a9c1f0]"
          : "border-[1.5px] border-[#1d3f8f] text-[#1d3f8f] dark:border-[#8fb0ff] dark:text-[#8fb0ff]",
        size === "md"
          ? "h-6 px-2 text-[13px] tracking-[0.12em]"
          : "h-5 px-1.5 text-[11px] tracking-[0.1em]"
      )}
    >
      {plate}
    </span>
  )
}

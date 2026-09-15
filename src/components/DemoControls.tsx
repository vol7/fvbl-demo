import { X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useOwnerActions } from "@/hooks/useOwnerActions"

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  )
}

export function OwnerActionButtons({ size = "sm" }: { size?: "sm" | "default" }) {
  const { pending, canTimeout, approve, deny, timeout, reset } = useOwnerActions()
  return (
    <>
      <Button variant="outline" size={size} disabled={!pending} onClick={approve}>
        Owner approves
      </Button>
      <Button variant="outline" size={size} disabled={!pending} onClick={deny}>
        Owner denies
      </Button>
      <Button variant="outline" size={size} disabled={!canTimeout} onClick={timeout}>
        Simulate 24h timeout
      </Button>
      <Button variant="secondary" size={size} onClick={reset}>
        Reset session
      </Button>
    </>
  )
}

export function DemoControls() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      if (!event.shiftKey || event.key.toLowerCase() !== "d") return
      if (isEditable(event.target)) return
      event.preventDefault()
      setOpen((v) => !v)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  if (!open) return null

  return (
    <section
      aria-label="Demo controls"
      className="fixed bottom-4 left-4 z-50 w-64 rounded-xl bg-background p-3 shadow-[0_0_0_1px_oklch(0_0_0/0.06),0_1px_2px_-1px_oklch(0_0_0/0.06),0_8px_16px_-4px_oklch(0_0_0/0.08)]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Demo controls
        </span>
        <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => setOpen(false)}>
          <X aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <OwnerActionButtons />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Shift+D to hide</p>
    </section>
  )
}

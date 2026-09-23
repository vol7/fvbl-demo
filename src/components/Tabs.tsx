import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type TabItem<K extends string> = { key: K; label: string; count?: number }

/**
 * Underlined tab list. Roving focus with the arrow keys; the panel is whatever
 * the caller renders under it with `aria-labelledby={tabId(key)}`.
 */
export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  idPrefix = "tab",
}: {
  tabs: TabItem<K>[]
  value: K
  onChange: (key: K) => void
  idPrefix?: string
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    onChange(next.key)
    refs.current[next.key]?.focus()
  }

  return (
    <div role="tablist" aria-orientation="horizontal" className="flex gap-6 border-b">
      {tabs.map((tab, i) => {
        const selected = tab.key === value
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[tab.key] = el
            }}
            id={`${idPrefix}-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}-${tab.key}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50",
              selected
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="text-xs text-muted-foreground/70 tabular-nums">{tab.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

const SLIDE = 28

const panel = {
  enter: (direction: number) => ({ opacity: 0, x: direction * SLIDE }),
  center: { opacity: 1, x: 0, transition: { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -SLIDE,
    transition: { duration: 0.18, ease: "easeIn" as const },
  }),
} as const

/**
 * The active panel. Keyed by the tab, so a switch remounts the content: the old panel
 * leaves toward where it sits in the tab order and the new one comes in from the other
 * side. `direction` is 1 when moving right through the tabs, -1 when moving left.
 */
export function TabPanel({
  id,
  active,
  direction = 1,
  children,
}: {
  id: string
  active: string
  direction?: number
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  // The first panel appears in place. Not through AnimatePresence's `initial`, which
  // would also block every first-mount animation inside the panel.
  const [first, setFirst] = useState<string | null>(active)
  if (first !== null && active !== first) setFirst(null)
  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={active}
          role="tabpanel"
          id={`${id}-${active}-panel`}
          aria-labelledby={`${id}-${active}`}
          custom={direction}
          variants={reduceMotion ? undefined : panel}
          initial={active === first ? false : "enter"}
          animate="center"
          exit="exit"
          className="flex flex-col gap-6"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

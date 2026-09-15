import { motion, useReducedMotion } from "motion/react"
import { useRef } from "react"

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
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-xs tabular-nums",
                  selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** Fades the active panel in. Keyed by the tab so a switch remounts the content. */
export function TabPanel({
  id,
  active,
  children,
}: {
  id: string
  active: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      key={active}
      role="tabpanel"
      id={`${id}-${active}-panel`}
      aria-labelledby={`${id}-${active}`}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col gap-6"
    >
      {children}
    </motion.div>
  )
}

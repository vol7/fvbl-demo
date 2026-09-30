import { useId } from "react"

import { cn } from "@/lib/utils"
import { TITLE_SEARCH } from "@/regions/us/copy/public"

/** A five-pointed star, centred on (cx, cy), outer radius r. */
function starPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.4
    const angle = (Math.PI / 5) * i - Math.PI / 2
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`
  })
  return `M${points.join("L")}Z`
}
const STAR = starPath(8, 16, 5.5)

/**
 * Generic state-government chrome for the US title search, in the spirit of
 * America.gov: serif wordmark, pill sign-in, a navy footer. Deliberately no real
 * agency's site: no seal, no logo, no "official website" banner. Ohio appears in
 * the content only. The video's cards carry the mock-up notice.
 */
export function StateShell({ children }: { children: React.ReactNode }) {
  const copy = TITLE_SEARCH.shell
  return (
    <div className="theme-state flex min-h-svh flex-col bg-background text-foreground">
      <title>{copy.documentTitle}</title>

      <header className="mx-auto flex h-20 w-full max-w-[80rem] items-center justify-between px-10">
        <Wordmark />
        <div className="flex items-center gap-8">
          <nav aria-label="Primary" className="hidden items-center gap-7 text-[15px] md:flex">
            {copy.nav.map((item) => {
              const active = item === copy.activeNav
              return (
                <span
                  key={item}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "font-medium",
                    active ? "underline decoration-2 underline-offset-8" : "text-muted-foreground"
                  )}
                >
                  {item}
                </span>
              )
            })}
          </nav>
          <span className="flex h-10 items-center rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground">
            {copy.signIn}
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 pb-24">{children}</main>

      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-10 px-10 pt-14 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Wordmark inverse />
            <div className="flex gap-7 text-[15px] font-medium">
              {copy.nav.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-6 border-t border-white/15 pt-6 text-sm text-white/70">
            {copy.footer.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

/** A generic star-and-stripes badge and a serif name; not any agency's logo. */
function Wordmark({ inverse = false }: { inverse?: boolean }) {
  const clipId = `badge-${useId()}`
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <clipPath id={clipId}>
          <circle cx="16" cy="16" r="15.25" />
        </clipPath>
        <circle cx="16" cy="16" r="16" fill="#fff" />
        <g clipPath={`url(#${clipId})`}>
          {[4, 12, 20, 28].map((y) => (
            <rect key={y} x="16" y={y - 2} width="16" height="4" fill="var(--state-red)" />
          ))}
          <rect width="16" height="32" fill={inverse ? "#fff" : "var(--primary)"} />
          <path d={STAR} fill={inverse ? "var(--primary)" : "#fff"} />
        </g>
        <circle
          cx="16"
          cy="16"
          r="15.25"
          fill="none"
          stroke={inverse ? "#fff" : "var(--primary)"}
          strokeWidth="1.5"
        />
      </svg>
      <span className="font-display text-[26px] leading-none tracking-[-0.02em]">
        {TITLE_SEARCH.shell.name}
      </span>
    </span>
  )
}

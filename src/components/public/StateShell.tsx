import { ChevronRight } from "lucide-react"

import { TITLE_SEARCH } from "@/regions/us/copy/public"

/** A plain state-portal look for the palette; no seal, logo or officials. */
const THEME = {
  "--primary": "oklch(0.36 0.1 258)",
  "--primary-foreground": "oklch(1 0 0)",
  "--ring": "oklch(0.36 0.1 258)",
  "--radius": "0.375rem",
} as React.CSSProperties

/**
 * Generic state-government chrome for the Ohio title search. Deliberately not a
 * copy of the real BMV site. The video's cards carry the mock-up notice.
 */
export function StateShell({
  crumbs,
  children,
}: {
  crumbs: readonly string[]
  children: React.ReactNode
}) {
  const copy = TITLE_SEARCH.shell
  return (
    <div style={THEME} className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold tracking-tight">{copy.state}</span>
            <span className="h-4 w-px self-center bg-primary-foreground/40" aria-hidden />
            <span className="text-base text-primary-foreground/85">{copy.service}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-primary-foreground/85">
            {copy.nav.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="mx-auto w-full max-w-6xl px-6 pt-5 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
          {crumbs.map((label, i) => (
            <li key={label} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3.5" aria-hidden /> : null}
              <span className={i === crumbs.length - 1 ? "text-foreground" : undefined}>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>

      <footer className="border-t bg-muted/60 text-muted-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {copy.footer.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

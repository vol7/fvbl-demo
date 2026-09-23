import { ChevronRight } from "lucide-react"
import { Link } from "react-router"

export type Crumb = { label: string; to?: string }

/** The frame's header: where you are. Search and the office moved to the sidebar. */
export function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b px-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
              ) : null}
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  className="truncate text-muted-foreground hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "truncate font-medium" : "truncate text-muted-foreground"}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </header>
  )
}

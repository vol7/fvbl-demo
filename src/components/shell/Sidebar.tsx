import { LogOut } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router"

import { FvblMark } from "@/components/FvblMark"
import { VinSearch } from "@/components/shell/VinSearch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { plateLabel } from "@/lib/format"
import { isActive, navItems } from "@/lib/nav"
import { recentRows } from "@/lib/seed"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { useRegionPaths } from "@/regions/context"
import { useRegion } from "@/regions"

const itemClass = (active: boolean) =>
  cn(
    "flex h-8 min-w-0 items-center gap-2.5 rounded-md px-2 text-sm transition-[color,background-color] duration-150",
    active
      ? "bg-foreground/[0.06] font-medium text-foreground"
      : "text-foreground/75 hover:bg-foreground/[0.04] hover:text-foreground"
  )

/**
 * Sits on the canvas, not on a card: the page is the raised surface. The office is the
 * workspace, search lives here, and the demo vehicles are one click away under Recent.
 */
export function Sidebar() {
  const pack = useRegion()
  const paths = useRegionPaths()
  const { pathname } = useLocation()
  const [session] = useSession()
  const recent = recentRows(pack, session).filter((row) => row.live)

  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col px-2 py-2.5">
      <Link
        to={paths.portal.home}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-foreground/[0.04]"
      >
        <FvblMark className="h-7 w-auto" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-semibold">FVBL</span>
          <span className="truncate text-xs text-muted-foreground">{pack.office.name}</span>
        </span>
      </Link>

      <div className="mt-3 px-1">
        <VinSearch />
      </div>

      <nav aria-label="Primary" className="mt-3 flex flex-1 flex-col gap-5 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems(
            paths,
            pack.copy.portal.requests.title,
            pack.copy.decision.actions !== null
          ).map((item) => {
            const active = isActive(item, pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={itemClass(active)}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {item.label}
              </NavLink>
            )
          })}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="px-2 pb-1 text-xs text-muted-foreground">Recent</div>
          {recent.map((row) => {
            const to = paths.portal.vehicle(row.vin)
            const active = pathname === to
            return (
              <Link
                key={row.vin}
                to={to}
                aria-current={active ? "page" : undefined}
                className={itemClass(active)}
              >
                <span className="shrink-0 font-mono text-xs tracking-wider text-muted-foreground">
                  {plateLabel(pack.plate, row.plate)}
                </span>
                <span className="truncate">{row.vehicle.replace(/^\d{4} /, "")}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="flex items-center gap-2.5 px-2 pt-2">
        <Avatar>
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {pack.office.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-sm font-medium">{pack.office.clerkFullName}</span>
          <span className="truncate text-xs text-muted-foreground">{pack.office.counter}</span>
        </div>
        <Link
          to={paths.portal.signIn}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
        </Link>
      </div>
    </aside>
  )
}

import { CarFront, LogOut } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"

import { FvblMark } from "@/components/FvblMark"
import { TopBar } from "@/components/shell/TopBar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DEALER } from "@/lib/people"
import { useRegionPaths } from "@/regions/context"

/**
 * The dealer's side of FVBL: a sibling of the clerk portal with one job. Same inset
 * frame as the clerk portal, but its own shell (not a parameterized Sidebar) because
 * the client is sending reference for the real dealer portal and the reskin should
 * land here alone.
 */
export function DealerShell() {
  const paths = useRegionPaths()
  return (
    <div className="flex h-svh overflow-hidden bg-muted/70">
      <aside className="flex h-svh w-60 shrink-0 flex-col px-2 py-2.5">
        <Link
          to={paths.dealer.register}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-foreground/[0.04]"
        >
          <FvblMark className="h-7 w-auto" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-semibold">FVBL</span>
            <span className="truncate text-xs text-muted-foreground">{DEALER.name}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-5 flex flex-1 flex-col gap-0.5">
          <div className="px-2 pb-1 text-xs text-muted-foreground">Registrations</div>
          <NavLink
            to={paths.dealer.register}
            aria-current="page"
            className="flex h-8 items-center gap-2.5 rounded-md bg-foreground/[0.06] px-2 text-sm font-medium text-foreground"
          >
            <CarFront className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Register a new vehicle
          </NavLink>
        </nav>

        <div className="flex items-center gap-2.5 px-2 pt-2">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              SM
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{DEALER.principal}</span>
            <span className="truncate text-xs text-muted-foreground">
              Dealer no. {DEALER.number}
            </span>
          </div>
          <Link
            to={paths.dealer.signIn}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-foreground/[0.06]">
        <TopBar crumbs={[{ label: "Register a new vehicle" }]} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[46rem] px-8 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

import { CarFront, LogOut } from "lucide-react"
import { Link, NavLink, Outlet } from "react-router"

import { FvblMark } from "@/components/FvblMark"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { DEALER } from "@/lib/people"
import { paths } from "@/lib/paths"
import { cn } from "@/lib/utils"

/**
 * The dealer's side of FVBL: a sibling of the clerk portal with one job. Kept as
 * its own shell (not a parameterized Sidebar) because the client is sending
 * reference for the real dealer portal and the reskin should land here alone.
 */
export function DealerShell() {
  return (
    <div className="flex h-svh overflow-hidden bg-muted/40">
      <aside className="flex h-svh w-60 shrink-0 flex-col border-r bg-background">
        <Link to={paths.dealer.register} className="flex h-14 items-center gap-2.5 border-b px-5">
          <FvblMark className="h-7 w-auto" />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide">FVBL</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">Dealer Portal</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            <div className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Registrations
            </div>
            <NavLink
              to={paths.dealer.register}
              aria-current="page"
              className="flex h-8 items-center gap-2.5 rounded-md bg-primary/10 px-2 text-sm font-medium text-primary"
            >
              <CarFront className="size-4 shrink-0" aria-hidden />
              Register a new vehicle
            </NavLink>
          </div>
        </nav>

        <div className="flex flex-col gap-3 border-t p-3">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                SM
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{DEALER.principal}</span>
              <span className="truncate text-xs text-muted-foreground">
                Dealer principal · No. {DEALER.number}
              </span>
            </div>
          </div>
          <Link
            to={paths.dealer.signIn}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-center"
            )}
          >
            <LogOut data-icon="inline-start" aria-hidden />
            Sign out
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b bg-background px-6">
          <nav aria-label="Breadcrumb" className="text-sm font-medium">
            Register a new vehicle
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden gap-1.5 lg:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Ontario · Dealer channel
            </Badge>
            <span className="hidden text-sm text-muted-foreground xl:inline">{DEALER.name}</span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[880px] px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

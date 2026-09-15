import { LogOut, ShieldCheck } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { NAV_ITEMS, isActive } from "@/lib/nav"
import { OFFICE } from "@/lib/office"
import { cn } from "@/lib/utils"
import { paths } from "@/lib/paths"

export function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col border-r bg-background">
      <Link to={paths.portal.home} className="flex h-14 items-center gap-2.5 border-b px-5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-wide">FVBL</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">Authorized User Portal</span>
        </span>
      </Link>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item, pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-[color,background-color] duration-150",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className="size-4 shrink-0"
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden
                />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <div className="flex flex-col gap-3 border-t p-3">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {OFFICE.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{OFFICE.clerkFullName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {OFFICE.role} · {OFFICE.counter}
            </span>
          </div>
        </div>
        <Link
          to={paths.portal.signIn}
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
  )
}

import { Container, LogOut } from "lucide-react"
import { Link, NavLink, Outlet, useMatches } from "react-router"

import { FvblMark } from "@/components/FvblMark"
import { TopBar } from "@/components/shell/TopBar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRegionPaths } from "@/regions/context"
import { useRegion } from "@/regions"
import { NotFound } from "@/routes/NotFound"

/**
 * The border officer's side of FVBL: the clerk portal's inset frame with one job,
 * the vehicles declared for export and one card for each. Its own shell, like the
 * dealer's: the officer sees none of the clerk's pages.
 */
export function BorderShell() {
  const pack = useRegion()
  const paths = useRegionPaths()
  const matches = useMatches()
  const border = pack.border
  if (!border) return <NotFound />
  const { copy, officer } = border
  const vin = matches.find((m) => m.params.vin)?.params.vin
  const declared = vin ? border.declared.find((v) => v.vin === vin) : undefined

  return (
    <div className="flex h-svh overflow-hidden bg-muted/70">
      <title>{`FVBL · ${copy.signIn.title}`}</title>
      <aside className="flex h-svh w-60 shrink-0 flex-col px-2 py-2.5">
        <Link
          to={paths.border.list}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-foreground/[0.04]"
        >
          <FvblMark className="h-7 w-auto" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-semibold">FVBL</span>
            <span className="truncate text-xs text-muted-foreground">{copy.workspace}</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-5 flex flex-1 flex-col gap-0.5">
          <NavLink
            to={paths.border.list}
            aria-current="page"
            className="flex h-8 items-center gap-2.5 rounded-md bg-foreground/[0.06] px-2 text-sm font-medium text-foreground"
          >
            <Container className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {copy.navItem}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2.5 px-2 pt-2">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {officer.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{officer.name}</span>
            <span className="truncate text-xs text-muted-foreground" title={officer.role}>
              {officer.badge}
            </span>
          </div>
          <Link
            to={paths.border.signIn}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-foreground/[0.06]">
        <TopBar
          crumbs={[
            { label: copy.navItem, to: paths.border.list },
            ...(declared ? [{ label: `${declared.year} ${declared.make} ${declared.model}` }] : []),
          ]}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

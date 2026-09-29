import { Link } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { paths } from "@/lib/paths"

/** Any path outside the known regions and surfaces. */
export function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">Nothing lives at this address.</p>
        <Link to={paths.picker} className={buttonVariants({ variant: "outline" })}>
          Choose a demo
        </Link>
      </div>
    </main>
  )
}

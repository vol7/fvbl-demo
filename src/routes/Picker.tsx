import { ArrowRight } from "lucide-react"
import { Link } from "react-router"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { regionPaths } from "@/lib/paths"
import type { RegionId } from "@/regions/types"

const DEMOS: { region: RegionId; title: string; description: string }[] = [
  {
    region: "ca",
    title: "Canada · Ontario",
    description: "ServiceOntario, the MTO clerk portal and the dealer's first registration.",
  },
  {
    region: "us",
    title: "United States · Ohio",
    description: "Ohio's title search, the county title clerk and the dealer's first title.",
  },
]

/** `/`: pick which country's demo to record. Not part of the product. */
export function Picker() {
  return (
    <main className="min-h-svh bg-muted/40 px-6 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="text-sm text-muted-foreground">
            Recording hub · not part of the product
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">FVBL demo</h1>
          <p className="text-sm text-muted-foreground">
            Each country has its own hub and its own session, so resetting one never touches the
            other.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMOS.map((demo) => (
            <Link key={demo.region} to={regionPaths(demo.region).hub} className="group rounded-xl">
              <Card className="h-full transition-colors duration-150 group-hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    {demo.title}
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </CardTitle>
                  <CardDescription>{demo.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

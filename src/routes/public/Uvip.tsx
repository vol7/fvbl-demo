import { ArrowRight, KeyRound, ShoppingCart } from "lucide-react"
import { Link } from "react-router"

import { PublicShell } from "@/components/public/PublicShell"

const CRUMBS = [
  { label: "ServiceOntario", to: "/serviceontario/" },
  { label: "Vehicles", to: "/serviceontario/" },
  { label: "Used Vehicle Information Package" },
]

function RoleCard({
  to,
  icon,
  title,
  description,
}: {
  to: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-[border-color,background-color] duration-150 hover:border-primary/50 hover:bg-primary/5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-base font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <ArrowRight
        className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  )
}

export function Uvip() {
  return (
    <PublicShell crumbs={CRUMBS}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Used Vehicle Information Package (UVIP)
          </h1>
          <p className="text-base text-muted-foreground">
            A UVIP is required when a used vehicle is sold privately in Ontario. For high-value
            vehicles, the registered owner must authorize the package before ServiceOntario issues
            it. You can do that here, ahead of your visit.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">I am…</h2>
          <RoleCard
            to="/uvip/owner"
            icon={<KeyRound className="size-5" aria-hidden />}
            title="Selling my vehicle"
            description="Verify your identity and pre-approve the package for your vehicle. Valid for 30 days."
          />
          <RoleCard
            to="/uvip/buyer"
            icon={<ShoppingCart className="size-5" aria-hidden />}
            title="Buying a vehicle"
            description="Ask the registered owner to authorize the package. They will receive a text message."
          />
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          You will need the vehicle identification number (VIN) and your Ontario driver's licence.
        </div>
      </div>
    </PublicShell>
  )
}

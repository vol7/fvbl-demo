import { Car, FileWarning, Home, ShieldCheck, type LucideIcon } from "lucide-react"

import type { RegionPaths } from "./paths"

export type NavItem = { to: string; label: string; icon: LucideIcon; match?: RegExp }

export function navItems(p: RegionPaths): NavItem[] {
  return [
    { to: p.portal.home, label: "Home", icon: Home },
    {
      to: p.portal.lookup,
      label: "Vehicle lookup",
      icon: Car,
      match: new RegExp(`^${p.portal.prefix}/(lookup|vehicle)`),
    },
    { to: p.portal.requests, label: "Authorization requests", icon: ShieldCheck },
    { to: p.portal.cases, label: "Cases", icon: FileWarning },
  ]
}

export function isActive(item: NavItem, pathname: string): boolean {
  return item.match ? item.match.test(pathname) : pathname === item.to
}

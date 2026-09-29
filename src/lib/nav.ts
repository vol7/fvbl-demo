import { Car, FileWarning, Home, ShieldCheck, type LucideIcon } from "lucide-react"

import type { RegionPaths } from "./paths"

export type NavItem = { to: string; label: string; icon: LucideIcon; match?: RegExp }

/**
 * `requests` is the region's name for the Requests page ("Authorization requests").
 * Cases lists the clerk's referrals, so it shows only where the clerk refers from
 * FVBL (Canada); the US card only informs.
 */
export function navItems(p: RegionPaths, requests: string, cases = true): NavItem[] {
  const items: NavItem[] = [
    { to: p.portal.home, label: "Home", icon: Home },
    {
      to: p.portal.lookup,
      label: "Vehicle lookup",
      icon: Car,
      match: new RegExp(`^${p.portal.prefix}/(lookup|vehicle)`),
    },
    { to: p.portal.requests, label: requests, icon: ShieldCheck },
  ]
  if (cases) items.push({ to: p.portal.cases, label: "Cases", icon: FileWarning })
  return items
}

export function isActive(item: NavItem, pathname: string): boolean {
  return item.match ? item.match.test(pathname) : pathname === item.to
}

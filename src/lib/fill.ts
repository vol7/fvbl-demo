import { createElement, Fragment, type ReactNode } from "react"

/**
 * Fills `{slot}` placeholders in a copy template with nodes, so region copy can
 * stay plain strings while the component supplies the link or the bold reference.
 */
export function fill(template: string, slots: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const slot = /^\{(\w+)\}$/.exec(part)?.[1]
    return createElement(Fragment, { key: i }, slot && slot in slots ? slots[slot] : part)
  })
}

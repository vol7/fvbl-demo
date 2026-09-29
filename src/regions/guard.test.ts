import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Shared code must not speak for one country. Canada's names live in
 * `src/regions/ca`, and the Canada-only public pages (the UVIP flow behind the saved
 * ServiceOntario page) are exempt, and so is the country picker at `/`, which names
 * both on purpose. Only what a viewer could read is checked: string
 * literals and JSX text, with comments, type declarations and identifier-like strings
 * (ids, keys) left out.
 */
const CANADIAN =
  /\b(MTO|Ontario|ServiceOntario|CBSA|UVIP|ministry|Ministry|licence|Licence|colour|Colour|Canada|OPP|CPIC)\b/

const EXEMPT = [
  /^src\/regions\//,
  /^src\/routes\/public\//,
  /^src\/components\/public\//,
  /^src\/components\/ui\//,
  /^src\/routes\/Picker\.tsx$/,
]

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? files(path) : [path]
  })
}

function visibleText(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1")
    // Type declarations name agencies as literal types; they are not copy.
    .replace(/^(export )?type \w+[^=\n]*=[\s\S]*?\n(?=\n|export|function|const)/gm, "")
  const literals = [...code.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)]
    .map((m) => m[0].slice(1, -1))
    .filter((text) => !/^[a-z][\w-]*$/.test(text))
  // Text between tags; a generic's `>(` is code, not copy.
  const jsxText = [...code.matchAll(/>([^<>{}]+)</g)]
    .map((m) => m[1])
    .filter((text) => !/^\(|\bconst\b|=>|;/.test(text))
  return [...literals, ...jsxText]
}

describe("shared code", () => {
  it("names no Canadian agency, place or spelling outside the Canada pack", () => {
    const hits = files("src")
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
      .filter((f) => !EXEMPT.some((re) => re.test(f)))
      .flatMap((f) =>
        visibleText(readFileSync(f, "utf8"))
          .filter((text) => CANADIAN.test(text))
          .map((text) => `${f}: ${text.trim().slice(0, 80)}`)
      )
    expect(hits).toEqual([])
  })
})

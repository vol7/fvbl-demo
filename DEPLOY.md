# Deploying the FVBL demo

The whole prototype is a static build. There is no backend, no database and no
environment variables: session state lives in `localStorage` and windows sync
over a `BroadcastChannel`. `pnpm build` produces a `dist/` you can drop on any
static host.

    pnpm install
    pnpm build          # tsc -b && vite build → dist/ (~10 MB)
    pnpm preview        # serve dist/ locally, same routing as production

## Before the first public deploy

`public/serviceontario/` is a saved copy of ontario.ca with the scripts removed.
It is there so the hand-off into `/uvip` feels continuous on camera. An
unauthenticated public copy of a government page is indistinguishable from a
phishing clone, so **turn on access protection before you share the URL**:

- Vercel — Project → Settings → Deployment Protection → Password Protection.
- Netlify — Site configuration → Access & security → Visitor access → Password.

The build also ships `public/robots.txt` (`Disallow: /`) and a
`noindex, nofollow, noarchive` meta on both the app shell and the saved page.
Those keep crawlers out; they do not keep people out. Access protection is the
control that matters.

## Deploy

Both hosts work from the repo with no extra configuration.

| Host | Build command | Output | Routing file |
| --- | --- | --- | --- |
| Vercel | `pnpm build` | `dist` | `vercel.json` |
| Netlify | `pnpm build` | `dist` | `public/_redirects` |

Routing is two rules in both files: `/serviceontario` serves the saved static
page, everything else falls through to `index.html` so React Router can handle
it. Static files are matched before the fallback, so the app's own assets are
never swallowed by the catch-all.

## Why the saved page uses absolute asset paths

The saved page references its stylesheets and images as
`/serviceontario/assets/…`, not `./assets/…`. This is deliberate. Relative URLs
resolve against the *document* URL, so `./assets/x.css` only works when the
browser address bar ends in a slash:

| Browser URL | `./assets/x.css` resolves to |
| --- | --- |
| `/serviceontario/` | `/serviceontario/assets/x.css` ✅ |
| `/serviceontario` | `/assets/x.css` ❌ |

A server-side rewrite fixes the lookup but not the address bar, and hosts
disagree about whether to keep or strip a trailing slash. Absolute paths make
all three forms — `/serviceontario`, `/serviceontario/` and
`/serviceontario/index.html` — render identically. If you ever re-save the page
from ontario.ca, rewrite `"./assets/` to `"/serviceontario/assets/` again.

Font and image URLs *inside* the theme CSS stay relative (`url(../theme/…)`),
which is correct: CSS URLs resolve against the stylesheet, not the document.

## Verifying a deploy

Open each of these and confirm the demo is intact:

| Check | Expect |
| --- | --- |
| `/serviceontario` **and** `/serviceontario/` | Fully styled ServiceOntario page, Ontario fonts and logo, both identical |
| The "Get a Used Vehicle Information Package (UVIP)" card | Lands on `/uvip` in the React app |
| `/portal` | Sign-in, then `/portal/home` |
| `/phone` | Thread renders at 390×844 |
| `/robots.txt` | `Disallow: /` |
| Deep-link a vehicle page, then reload | Same page, not a 404 |

The last one is the SPA fallback. If it 404s, the catch-all rewrite is not
being applied.

## Known limits

- `localStorage` and `BroadcastChannel` are per origin **and** per browser
  profile. Open every surface from the same browser; incognito windows do not
  share a session.
- The saved page keeps its original outbound links to `ontario.ca` and
  `signin.ontario.ca`. Clicking one navigates off the demo. Only the UVIP card
  and the Vehicles-column link point back into the prototype.
- The app bundle is a single ~578 kB chunk. Vite warns about this; it is fine
  at demo scale and not worth code-splitting.

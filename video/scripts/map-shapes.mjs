// Writes src/map-shapes.ts: one map layout per version of the cut, as SVG
// paths on the 1920×1080 frame, for the map scene. Outlines are Natural Earth
// 1:50m (public domain), simplified to the pixel. Run once, commit the
// output: `node scripts/map-shapes.mjs`.
//
// Canada-first: Canada's provinces and territories and the US states, joined,
// projected Lambert conformal conic as Statistics Canada does.
// US-first: the US states on the usual US map (Albers, with Alaska and Hawaii
// as insets), and Canada as one outline running off the top of the frame, so
// the two read as neighbours, not one bloc.
import { writeFileSync } from "node:fs";
import { geoAlbers, geoConicConformal, geoConicEqualArea } from "d3-geo";

const NE =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/";

/**
 * Where the two countries sit in the frame: left of centre, leaving the
 * Atlantic side clear for the ledger, which belongs to neither.
 */
const EXTENT = [
  [200, 50],
  [1280, 1030],
];
/** Douglas–Peucker tolerance, and the smallest island kept, in pixels. */
const TOLERANCE = 1.1;
const MIN_AREA = 120;

const get = async (file) => (await fetch(NE + file)).json();
const [admin1, admin0, lakes] = await Promise.all([
  get("ne_50m_admin_1_states_provinces.geojson"),
  get("ne_50m_admin_0_countries.geojson"),
  get("ne_50m_lakes.geojson"),
]);

const provinces = admin1.features.filter(
  (f) => f.properties.adm0_a3 === "CAN",
);
const us = admin0.features.find((f) => f.properties.ADM0_A3 === "USA");
/** Alaska and the lower 48; DC is too small to see. */
const states = admin1.features.filter(
  (f) =>
    f.properties.adm0_a3 === "USA" && !["HI", "DC"].includes(f.properties.postal),
);
/** Hawaii, drawn only as the US map's inset. */
const hawaii = admin1.features.find(
  (f) => f.properties.adm0_a3 === "USA" && f.properties.postal === "HI",
);
// The main islands only: the Northwestern chain runs out to Kure Atoll and
// would shrink the inset to a speck.
hawaii.geometry = {
  type: "MultiPolygon",
  coordinates: (hawaii.geometry.type === "Polygon"
    ? [hawaii.geometry.coordinates]
    : hawaii.geometry.coordinates
  ).filter((poly) => poly[0].every(([lon]) => lon > -161)),
};
const canada = admin0.features.find((f) => f.properties.ADM0_A3 === "CAN");

// Alaska and the lower 48 only: no Hawaii, no Aleutians past the antimeridian.
const keepUs = (ring) =>
  ring.every(([lon, lat]) => lon < 0 && lon > -170 && lat > 24);
us.geometry = {
  type: "MultiPolygon",
  coordinates: us.geometry.coordinates.filter((poly) => keepUs(poly[0])),
};

// Fit to the points, not the polygons: Natural Earth winds rings the
// GeoJSON way, which d3 reads as "everything but this shape".
const points = (features) => ({
  type: "MultiPoint",
  coordinates: features.flatMap((f) =>
    f.geometry.coordinates.flat(f.geometry.type === "Polygon" ? 1 : 2),
  ),
});

const projection = geoConicConformal()
  .parallels([49, 77])
  .rotate([96, 0])
  .fitExtent(EXTENT, points([...provinces, us]));

const perpendicular = ([x, y], [x1, y1], [x2, y2]) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / len;
};

function simplify(points) {
  if (points.length < 3) return points;
  let max = 0;
  let at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points.at(-1));
    if (d > max) [max, at] = [d, i];
  }
  if (max <= TOLERANCE) return [points[0], points.at(-1)];
  return [
    ...simplify(points.slice(0, at + 1)).slice(0, -1),
    ...simplify(points.slice(at)),
  ];
}

/** A closed ring starts and ends on one point, so simplify it in two halves. */
function simplifyRing(ring) {
  const mid = Math.floor(ring.length / 2);
  return [
    ...simplify(ring.slice(0, mid + 1)).slice(0, -1),
    ...simplify(ring.slice(mid)),
  ];
}

const area = (ring) =>
  Math.abs(
    ring.reduce((sum, [x, y], i) => {
      const [nx, ny] = ring[(i + 1) % ring.length];
      return sum + x * ny - nx * y;
    }, 0) / 2,
  );

const round = (n) => Math.round(n * 10) / 10;

/** A ring clipped to the frame, plus a margin (Sutherland–Hodgman). */
function clipToFrame(ring, m = 24) {
  const edges = [
    [(p) => p[0] >= -m, (a, b) => at(a, b, 0, -m)],
    [(p) => p[0] <= 1920 + m, (a, b) => at(a, b, 0, 1920 + m)],
    [(p) => p[1] >= -m, (a, b) => at(a, b, 1, -m)],
    [(p) => p[1] <= 1080 + m, (a, b) => at(a, b, 1, 1080 + m)],
  ];
  function at(a, b, axis, v) {
    const t = (v - a[axis]) / (b[axis] - a[axis]);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  let out = ring;
  for (const [inside, cross] of edges) {
    const input = out;
    out = [];
    input.forEach((p, i) => {
      const prev = input.at(i - 1);
      if (inside(p)) {
        if (!inside(prev)) out.push(cross(prev, p));
        out.push(p);
      } else if (inside(prev)) out.push(cross(prev, p));
    });
    if (!out.length) return out;
  }
  return [...out, out[0]];
}

/** Projected, simplified outer rings (holes dropped: lakes read as land here). */
function rings(geometry, project = projection, clip = false, minArea = MIN_AREA) {
  const polys =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const all = polys
    .map((poly) => poly[0].map((p) => project(p)))
    .map((ring) => (clip ? clipToFrame(ring) : ring))
    .filter((ring) => ring.length > 3)
    .map(simplifyRing);
  // Small islands go, but never a region's main piece (PEI is small).
  const biggest = Math.max(...all.map(area));
  return all.filter(
    (ring) =>
      ring.length > 3 && (area(ring) >= minArea || area(ring) === biggest),
  );
}

const toPath = (rs) =>
  rs
    .map((r) => "M" + r.map(([x, y]) => `${round(x)} ${round(y)}`).join("L") + "Z")
    .join("");

/** The label anchor: the centroid of the largest piece, on the page. */
function anchor(rs) {
  const ring = rs.toSorted((a, b) => area(b) - area(a))[0];
  let cx = 0;
  let cy = 0;
  let a = 0;
  ring.forEach(([x, y], i) => {
    const [nx, ny] = ring[(i + 1) % ring.length];
    const cross = x * ny - nx * y;
    a += cross;
    cx += (x + nx) * cross;
    cy += (y + ny) * cross;
  });
  return [cx / (3 * a), cy / (3 * a)].map(round);
}

// Alaska's Aleutians cross the antimeridian: keep its mainland pieces only.
for (const f of states.filter((f) => f.properties.postal === "AK")) {
  f.geometry = {
    type: "MultiPolygon",
    coordinates: f.geometry.coordinates.filter((poly) => keepUs(poly[0])),
  };
}

const region = (code, country, name, rs) => {
  const [x, y] = anchor(rs);
  return { code, country, name, x, y, rs };
};
/** Drop the working rings, keep the path. */
const finish = ({ rs, ...r }) => ({ ...r, d: toPath(rs) });
const gap = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// The big lakes, cut out of the land as water: the province and state
// outlines run to the border through the Great Lakes, so without these the
// lakes read as land. Natural Earth's largest lakes, in the frame only.
const inFrame = (ring) => ring.every(([lon, lat]) => lon < -50 && lat > 24);
const water = (project, clip) =>
  lakes.features
    .filter((f) => f.properties.scalerank === 0)
    .filter((f) =>
      (f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates
      ).every((poly) => inFrame(poly[0])),
    )
    .map((f) => ({ name: f.properties.name, rs: rings(f.geometry, project, clip) }))
    .filter(({ rs }) => rs.length && Math.max(...rs.map(area)) >= MIN_AREA)
    .map(({ name, rs }) => ({ name, d: toPath(rs) }));

/** The national capitals, where each country's arc to the ledger starts. */
const capitals = (project) =>
  Object.fromEntries(
    [
      ["CA", "Ottawa", [-75.6972, 45.4215]],
      ["US", "Washington", [-77.0369, 38.9072]],
    ].map(([code, name, lonLat]) => {
      const [x, y] = project(lonLat).map(round);
      return [code, { name, x, y }];
    }),
  );

// ── Canada-first: both countries joined, every region drawn ──────────────
// Alaska's Aleutians cross the antimeridian: keep its mainland pieces only.
for (const f of states.filter((f) => f.properties.postal === "AK")) {
  f.geometry = {
    type: "MultiPolygon",
    coordinates: f.geometry.coordinates.filter((poly) => keepUs(poly[0])),
  };
}

const caRegions = [
  ...provinces.map((f) =>
    region(f.properties.postal, "CA", f.properties.name, rings(f.geometry)),
  ),
  ...states.map((f) =>
    region(f.properties.postal, "US", f.properties.name, rings(f.geometry)),
  ),
];
// Each region's distance from the other country, so both ripple out from
// the border: to the nearest label anchor across it.
for (const r of caRegions) {
  r.border = Math.min(
    ...caRegions
      .filter((o) => o.country !== r.country)
      .map((o) => gap([r.x, r.y], [o.x, o.y])),
  );
}
const usOutline = region("US", "US", "United States", rings(us.geometry));

const ca = {
  regions: caRegions.map(finish),
  lakes: water(projection),
  capitals: capitals(projection),
  labels: { CA: { x: 700, y: 470 }, US: { x: usOutline.x, y: round(usOutline.y + 60) } },
  hub: { x: 1560, y: 500 },
  crossing: ["CA-ON", "US-OH"],
};

// ── US-first: the US map, Canada as its neighbour ────────────────────────
const lower48 = states.filter((f) => f.properties.postal !== "AK");
const alaska = states.find((f) => f.properties.postal === "AK");

/** The lower 48, fitted low in the frame: Canada shows above the border. */
const US_EXTENT = [
  [220, 330],
  [1300, 1010],
];
/** The insets, bottom left, where Mexico would be. */
const AK_BOX = [
  [150, 800],
  [400, 990],
];
const HI_BOX = [
  [420, 930],
  [600, 1020],
];

const US_LAKES = [
  "Lake Superior",
  "Lake Michigan",
  "Lake Huron",
  "Lake Erie",
  "Lake Ontario",
  "Lake of the Woods",
  "Great Salt Lake",
];

const albers = geoAlbers().fitExtent(US_EXTENT, points(lower48));
const akInset = geoConicEqualArea()
  .rotate([154, 0])
  .center([-2, 58.5])
  .parallels([55, 65])
  .fitExtent(AK_BOX, points([alaska]));
const hiInset = geoConicEqualArea()
  .rotate([157, 0])
  .center([-3, 19.9])
  .parallels([8, 18])
  .fitExtent(HI_BOX, points([hawaii]));

const canadaMass = region("CA", "CA", "Canada", rings(canada.geometry, albers, true));
const edge = canadaMass.rs.flat();
const usStates = [
  ...lower48.map((f) =>
    region(f.properties.postal, "US", f.properties.name, rings(f.geometry, albers)),
  ),
  region("AK", "US", "Alaska", rings(alaska.geometry, akInset)),
  // Hawaii's islands are small at inset scale: keep the main eight.
  region("HI", "US", "Hawaii", rings(hawaii.geometry, hiInset, false, 6)),
];
// Distance from Canada's outline, so the states ripple out from the border.
// Alaska borders Canada, so it lights with the first wave; Hawaii, last.
for (const r of usStates) {
  r.border =
    r.code === "AK"
      ? 0
      : r.code === "HI"
        ? 2000
        : round(Math.min(...edge.map((p) => gap([r.x, r.y], p))));
}
canadaMass.border = 0;
const lower48Outline = region("US", "US", "United States", rings(us.geometry, albers));

const usLayout = {
  regions: [canadaMass, ...usStates].map(finish),
  // Only the lakes on the border or in the US: Canada is a neighbour here,
  // drawn plain.
  lakes: water(albers, true).filter((l) => US_LAKES.includes(l.name)),
  capitals: capitals(albers),
  labels: {
    CA: { x: 800, y: 170 },
    US: { x: lower48Outline.x, y: round(lower48Outline.y + 40) },
  },
  hub: { x: 1600, y: 560 },
  crossing: ["CA-CA", "US-OH"],
  neighbour: "CA",
  // Southern Ontario, across Lake Erie from Ohio: where a flag lands.
  across: Object.fromEntries(
    ["x", "y"].map((k, i) => [k, round(albers([-80.4, 43.3])[i])]),
  ),
};

// ── Canada-first, peers: Canada's map, the US as its neighbour ───────────
// The inverse of the US map (2026-09-30): the provinces and territories in
// full, on Statistics Canada's projection, and the US as one outline along
// the bottom, running off the frame.

/**
 * Canada, fitted to the width left of the ledger, so it fills the frame
 * (2026-09-30: fitted whole, it took half the screen), and low enough that
 * the Arctic islands clear the top; the US shows below.
 */
const CA_EXTENT = [
  [60, 20],
  [1460, 980],
];
const lcc = geoConicConformal()
  .parallels([49, 77])
  .rotate([96, 0])
  .fitExtent(CA_EXTENT, points(provinces));
const caProvinces = provinces.map((f) =>
  region(f.properties.postal, "CA", f.properties.name, rings(f.geometry, lcc, true)),
);
const usMass = region("US", "US", "United States", rings(us.geometry, lcc, true));
const usEdge = usMass.rs.flat();
// Distance from the US outline, so the provinces ripple out from the border.
for (const r of caProvinces) {
  r.border = round(Math.min(...usEdge.map((p) => gap([r.x, r.y], p))));
}
usMass.border = 0;
const project = (lonLat) => Object.fromEntries(["x", "y"].map((k, i) => [k, round(lcc(lonLat)[i])]));

const caPeers = {
  regions: [usMass, ...caProvinces].map(finish),
  lakes: water(lcc, true),
  capitals: capitals(lcc),
  labels: {
    CA: project([-100, 60]),
    US: project([-100, 43.6]),
  },
  hub: { x: 1640, y: 520 },
  crossing: ["CA-ON", "US-US"],
  neighbour: "US",
  // Pennsylvania, across the lakes from Ontario: where a flag lands. The
  // Canada cut's second catch is an active Pennsylvania title.
  across: project([-77.7, 40.9]),
};

writeFileSync(
  new URL("../src/map-shapes.ts", import.meta.url),
  `// Generated by scripts/map-shapes.mjs from Natural Earth 1:50m (public
// domain). Do not edit by hand.

export type Region = {
  /** Postal code, e.g. "ON" or "OH"; "CA" for Canada drawn whole. */
  code: string;
  country: "CA" | "US";
  name: string;
  /** Label anchor: the centroid of the largest piece. */
  x: number;
  y: number;
  /** How far it sits from the other country, for the ripple. */
  border: number;
  /** SVG path on the 1920×1080 frame. */
  d: string;
};

type Point = { x: number; y: number };

export type MapLayout = {
  regions: Region[];
  /** The big lakes, as water over the land. */
  lakes: { name: string; d: string }[];
  /** The national capitals, on the frame. */
  capitals: Record<"CA" | "US", Point & { name: string }>;
  /** Where each country's name sits. */
  labels: Record<"CA" | "US", Point>;
  /** The ledger. */
  hub: Point;
  /** The regions a flag leaves from, as "country-code". */
  crossing: string[];
  /** The other country, drawn whole and quieter, if this map has one. */
  neighbour?: "CA" | "US";
  /** Where a flag from the example state lands on the other side. */
  across?: Point;
};

/** Canada-first: both countries, every province, territory and state. */
export const MAP_CA: MapLayout = ${JSON.stringify(ca, null, 2)};

/** US-first: the US map, with Canada drawn whole along the top. */
export const MAP_US: MapLayout = ${JSON.stringify(usLayout, null, 2)};

/** Canada-first, peers: Canada's map, with the US drawn whole along the bottom. */
export const MAP_CA_PEERS: MapLayout = ${JSON.stringify(caPeers, null, 2)};
`,
);

for (const [name, layout] of [["ca", ca], ["us", usLayout], ["ca-peers", caPeers]]) {
  const size = layout.regions.reduce((n, r) => n + r.d.length, 0);
  console.log(`${name}: ${layout.regions.length} regions, ${size} chars`);
}

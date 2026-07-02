# SEO Pitch Deck — LLM Prompt Pack

Generate a filled `DECK` config for **any** local service business, then paste it into
`seo-pitch-deck.html` (replace the `const DECK = {...}` object). The HTML template never
changes — only the data does.

**Workflow**
1. Fill the **INPUT BLOCK** with one brand's raw research.
2. Run the **MASTER PROMPT** (input block included) → get the full `DECK` JSON → replace the
   `DECK` object in the HTML.
3. To redo one slide, run that **PER-SLIDE TEMPLATE** → replace just that key in the object.

The model does the math (local volumes, projections, ramp) and writes the copy. You supply
the raw research.

---

## OUTPUT CONTRACT (applies to every prompt below)

- Output **valid JSON only** — double-quoted keys and strings, no comments, no trailing
  commas, no markdown code fences, no preamble. (Valid JSON pastes cleanly as a JS object.)
- It must match the **DECK SCHEMA** at the bottom of this file exactly.
- After the JSON, if you estimated or assumed anything, add a line `---NOTES---` and list it
  in plain text below. **Everything above `---NOTES---` must be valid JSON.**
- Never invent competitor metrics — use only supplied numbers; estimate only the few
  positions the layout requires and flag them under NOTES.
- Revenue is framed as a **ceiling, not a promise** (total addressable market).

### Calculation rules (the model performs these)

- **Localize national volume:** if a keyword already contains a place name → use as-is.
  Otherwise `local_vol = national_vol × (LOCAL_POP / NATIONAL_POP)`. Default `NATIONAL_POP =
  332000000`.
- **Cluster volume** = sum of the localized volumes of every variation in that service.
- **Grand total** = sum of all cluster volumes. Set `geo.total` and
  `projection.searchVolume` both equal to this number.
- **Town allocation (geo):** distribute the grand total across the listed towns in
  proportion to population (primary city largest). Round to whole numbers.
- **Revenue** = `searchVolume × ctr × convRate × aov`. Defaults: `ctr = 0.05`,
  `convRate = 0.25` (override only if supplied).
- **Ramp:** `steady = round(searchVolume × ctr × convRate)`. Output 12 ascending integers
  forming an S-curve from ~5% of `steady` (month 1) to ~100% (month 12).

### Copy rules (fit the slide layout)

- `coverTitle`: two short lines, joined with `<br>`, ≤ 6 words per line.
- `coverLede`: one sentence, ~20 words, no jargon.
- `issues`: 4–5 items. `title` ≤ 6 words, `note` ≤ 9 words, `cost` ≤ 4 words framed as a loss
  ("~40 leads/mo lost", "Map pack invisible").
- `clusters[].name`: the service, ≤ 3 words.
- `competitors`: 5–8 rows. Exactly one `leader:true` (strongest) and one `you:true` (the
  client, using their real current metrics).
- `timeline`: exactly 4 months. `title` ≤ 3 words, 3 `items` each ≤ 5 words.
- Voice: confident, specific, money-forward, zero SEO jargon. Speak to a non-technical owner.

---

## MASTER PROMPT

> Paste everything in this block into the model. Fill the INPUT BLOCK first.

```
You are a senior local-SEO strategist at Butter First building a sales pitch deck for the
owner of a local service business. The owner is non-technical and skeptical. Your job is to
show them, in plain language and concrete numbers, how much search demand and revenue is
sitting unclaimed in their market — and that the gap with competitors is closeable.

Produce a single JSON object matching the DECK schema below. Obey every rule in the OUTPUT
CONTRACT, CALCULATION RULES, and COPY RULES.

=== OUTPUT CONTRACT ===
- Output valid JSON only (double quotes, no comments, no trailing commas, no code fences, no
  preamble). It must match the DECK SCHEMA exactly.
- After the JSON, if you assumed/estimated anything, add a line ---NOTES--- and list it.
  Everything above ---NOTES--- must be valid JSON.
- Use only supplied competitor numbers. Revenue is a ceiling, not a promise.

=== CALCULATION RULES ===
- Localize: if a keyword already names a place, use its volume as-is; else
  local_vol = national_vol × (LOCAL_POP / NATIONAL_POP). Default NATIONAL_POP = 332000000.
- cluster vol = sum of localized variation volumes. grand_total = sum of cluster vols.
- geo.total = projection.searchVolume = grand_total.
- geo.points[].vol = grand_total split across towns by population share (primary city largest), rounded.
- revenue = searchVolume × ctr × convRate × aov. Defaults ctr=0.05, convRate=0.25.
- steady = round(searchVolume × ctr × convRate). ramp = 12 ascending ints, S-curve 5%→100% of steady.

=== COPY RULES ===
- coverTitle: 2 lines joined by <br>, ≤6 words/line. coverLede: ~20 words, no jargon.
- issues: 4–5; title ≤6 words, note ≤9 words, cost ≤4 words framed as a loss.
- clusters[].name ≤3 words. competitors: 5–8 rows, exactly one leader:true and one you:true.
- timeline: 4 months; title ≤3 words; 3 items each ≤5 words.
- Voice: confident, specific, money-forward, zero jargon, speaking to a non-technical owner.

=== DECK SCHEMA ===
{
  "meta": { "client","market","preparedBy","coverCrest","coverTitle","coverLede","footBy","brand","brand2" },
  "issues": [ { "title","note","cost" } ],
  "geo": { "total", "points":[ {"city","x","y","vol","you"} ], "region" },
  "clusters": [ { "name","vol" } ],
  "competitors": [ { "name","leader","you","dr","kw","traffic","reviews","links" } ],
  "projection": { "searchVolume","ctr","convRate","aov" },
  "ramp": [ 12 integers ],
  "timeline": [ { "month","title","items":[..] } ],
  "budget": { "monthly","sprintLabel" }
}
Notes on tricky fields:
- meta.brand = client primary hex; meta.brand2 = a lighter/brighter sibling (raise lightness ~12%).
- meta.coverCrest default "Local Market SEO Audit". meta.preparedBy default
  "Patrick Dinehart · Butter First". meta.footBy default "Butter First · SEO Generating Local Leads".
- geo.points x,y are 0–100 schematic positions (NOT real coordinates). Put the primary city near
  center (~46,50). Place other towns by compass: North=lower y, South=higher y, East=higher x,
  West=lower x, distance ∝ how far out they are. Keep all values 10–90. Set "you":true on the
  primary city only.
- geo.region: leave as the default path string provided in the input unless a custom one is given.
- competitors: include "leader" and "you" as booleans on every row (true/false).

=== INPUT BLOCK ===
<<PASTE THE FILLED INPUT BLOCK HERE>>
```

---

## INPUT BLOCK (fill one per brand)

```
BUSINESS NAME: [[name]]
MARKET / SERVICE AREA: [[primary city, state]]
LOCAL POPULATION (service area): [[number]]
BRAND COLOR (hex or description): [[#hex]]
AVERAGE JOB VALUE (AOV $): [[number]]

SERVICES + KEYWORD CLUSTERS (national monthly volumes from DataForSEO/Ahrefs):
- [[Service 1]]: [[kw a]] = [[vol]], [[kw b]] = [[vol]], [[kw c]] = [[vol]]
- [[Service 2]]: [[kw a]] = [[vol]], [[kw b]] = [[vol]]
- [[Service 3]]: ...
(Mark any keyword that already contains a city name — it's already local.)

TOWNS IN SERVICE AREA (city + population, for the demand map):
- [[Primary City]] = [[pop]]   (this is the business location)
- [[Town 2]] = [[pop]], compass dir: [[N/S/E/W/NE...]]
- [[Town 3]] = [[pop]], compass dir: [[...]]

SITE ISSUES (from discovery call / audit — 4 to 5):
- [[issue]] — [[why it costs them]]
- [[issue]] — [[...]]

COMPETITORS (name + metrics; include the client's own current metrics as one row):
- [[Competitor]]: DR [[..]], keywords [[..]], traffic/mo [[..]], reviews [[..]], backlinks [[..]]
- [[Competitor]]: ...
- [[CLIENT — current]]: DR [[..]], keywords [[..]], traffic/mo [[..]], reviews [[..]], backlinks [[..]]

OPTIONAL OVERRIDES: blended CTR [[default 0.05]], conv rate [[default 0.25]],
monthly budget [[default $2,500]], custom region path [[default below]]

DEFAULT REGION PATH (paste into geo.region if no custom map):
M10,38 C8,18 30,8 50,10 C74,12 94,20 92,42 C90,66 78,92 50,92 C24,92 12,62 10,38 Z
```

---

## PER-SLIDE TEMPLATES

Each is standalone — run it to (re)generate just that slide's key. Output **only** that key as
JSON (e.g. `{ "meta": { ... } }`), obeying the OUTPUT CONTRACT and COPY RULES above.

### Slide 1 — Cover → `meta`
**Job:** name the client, set the market, set the brand color, and hook with one bold line
about unclaimed local demand.
**Inputs:** business name, market, brand color.
**Output:**
```
Generate the "meta" object only. coverTitle = two punchy lines (<br>-joined) about their
market searching for them right now. coverLede ~20 words. brand2 = a lighter sibling of brand.
Keep preparedBy/footBy/coverCrest at the Butter First defaults unless told otherwise.
INPUT: <<name, market, brand hex>>
```

### Slide 2 — Site Issues → `issues`
**Job:** 4–5 fixable gaps, each tied to lost revenue, to create urgency.
**Inputs:** discovery-call/audit issues.
**Output:**
```
Generate the "issues" array (4–5 items). Each: title ≤6 words, note ≤9 words, cost ≤4 words
framed as a loss. Lead with their biggest money-keyword ranking gap.
INPUT: <<audit issues>>
```

### Slide 3 — Local Demand Map → `geo`
**Job:** show total local monthly searches and where the demand is, town by town.
**Inputs:** towns + populations, grand total (or services to compute it), region path.
**Output:**
```
Generate the "geo" object. geo.total = grand_total. Allocate it across the listed towns by
population share (rounded). Place towns on a 0–100 grid by compass direction; primary city
near center with "you":true. Use the default region path unless a custom one is supplied.
INPUT: <<towns+pops, grand_total or service volumes, region path>>
```

### Slide 4 — Keyword Opportunities → `clusters`
**Job:** break the total demand down by service as a bar chart.
**Inputs:** services + keyword variations + national volumes + local population.
**Output:**
```
Generate the "clusters" array. For each service, localize each keyword variation then sum to
the cluster vol (skip localization for keywords that already name a place). name ≤3 words.
Order largest→smallest. The sum must equal the grand_total used in geo/projection.
INPUT: <<services + keyword volumes, local pop>>
```

### Slide 5 — Competitor Gap → `competitors`
**Job:** rank the client against the businesses winning those searches.
**Inputs:** competitor metrics + client's current metrics.
**Output:**
```
Generate the "competitors" array (5–8 rows). Each row: name, leader(bool), you(bool), dr, kw,
traffic, reviews, links. Exactly one leader:true (strongest) and one you:true (the client).
Use only supplied numbers; flag any estimate under ---NOTES---.
INPUT: <<competitor + client metrics>>
```

### Slide 6 — Projected Results → `projection` + `ramp`
**Job:** convert demand into a defensible revenue ceiling + a compounding-leads line graph.
**Inputs:** grand total, AOV, optional CTR/conv overrides.
**Output:**
```
Generate "projection" and "ramp". projection.searchVolume = grand_total. ctr default 0.05,
convRate default 0.25, aov from input. ramp = 12 ascending integers, S-curve from ~5% to 100%
of round(searchVolume × ctr × convRate).
INPUT: <<grand_total, aov, overrides>>
```

### Slide 7 — Game Plan & Budget → `timeline` + `budget`
**Job:** a 4-month sprint plan with a budget anchor.
**Inputs:** the gaps to close (from issues + competitor analysis), budget.
**Output:**
```
Generate "timeline" (exactly 4 months) and "budget". Month 1 fixes, Month 2 content+links,
Month 3 authority+reviews, Month 4 evaluate. title ≤3 words; 3 items each ≤5 words. budget.monthly
default "$2,500"; sprintLabel default "4-month sprint · evaluate, then continue".
INPUT: <<gaps to close, budget>>
```

---

## DECK SCHEMA REFERENCE

| Key | Type | Notes |
|---|---|---|
| `meta.client` | string | Business name |
| `meta.market` | string | "City, ST" |
| `meta.preparedBy` | string | Default "Patrick Dinehart · Butter First" |
| `meta.coverCrest` | string | Default "Local Market SEO Audit" |
| `meta.coverTitle` | string | 2 lines, `<br>`-joined |
| `meta.coverLede` | string | ~20 words |
| `meta.footBy` | string | Default "Butter First · SEO Generating Local Leads" |
| `meta.brand` / `meta.brand2` | hex | Primary + lighter sibling |
| `issues[]` | `{title, note, cost}` | 4–5 |
| `geo.total` | int | = grand_total |
| `geo.points[]` | `{city, x, y, vol, you}` | x,y 0–100; one `you:true` |
| `geo.region` | string | SVG path in 0–100 space |
| `clusters[]` | `{name, vol}` | sums to grand_total |
| `competitors[]` | `{name, leader, you, dr, kw, traffic, reviews, links}` | one leader, one you |
| `projection` | `{searchVolume, ctr, convRate, aov}` | searchVolume = grand_total |
| `ramp[]` | int×12 | S-curve |
| `timeline[]` | `{month, title, items[]}` | exactly 4 |
| `budget` | `{monthly, sprintLabel}` | — |

**To use the output:** open `seo-pitch-deck.html`, find `const DECK = {`, and replace the
whole object with the generated JSON (prefix it with `const DECK = ` and end with `;`).

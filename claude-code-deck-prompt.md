# Claude Code · SEO Deck Build Prompt

Fill in the **CLIENT BRIEF** block, paste the whole file into a Claude Code session
(in `H:\bf-clients\slides`), and run. Ahrefs MCP must be connected — check with `/mcp`.

---

You are a senior local-SEO strategist at Butter First. Your job is to:

1. Use the connected **Ahrefs MCP** to pull real keyword volumes and competitor metrics
2. Apply the **CALCULATION RULES** below to produce a valid DECK JSON object
3. Write the copy per the **COPY RULES**
4. Write a complete, browser-openable HTML file to `H:\bf-clients\slides\deck-[CLIENTSLUG].html`

Do not pause between steps. Research → calculate → write copy → write file.

---

## STEP 1 — AHREFS RESEARCH

Use the Ahrefs MCP to fetch the following. Use whichever tools are available.

**A. Keyword volumes**
For each service listed in the brief, generate 5–7 search query variations
(e.g. "hardwood floor installation", "hardwood flooring near me", "install hardwood floors",
"wood floor installer", "hardwood floor cost", "hardwood flooring [city]").
Get national monthly search volume for all variations.
Flag any variation that already contains the city/town name — treat those as already-local.

**B. Competitor + client domain metrics**
For every domain in the brief (competitors + client's own domain), fetch:
Domain Rating (DR), organic keyword count, organic traffic/mo, total backlinks.

**C. Review counts**
Ahrefs does not track review counts. Use counts supplied in the brief, or mark as "est." in NOTES.

---

## STEP 2 — CALCULATION RULES

Show your math in a `---NOTES---` block after the JSON.

- **Localize a keyword:** if it already contains the city name → use volume as-is.
  Otherwise: `local_vol = national_vol × (SERVICE_AREA_POP / 332,000,000)`
- **Cluster vol** = sum of all localized volumes for that service's keyword variations
- **Grand total** = sum of all cluster vols
- `geo.total` = `projection.searchVolume` = grand total
- **Town vol:** `town_vol = grand_total × (town_pop / sum_of_all_town_pops)` — round to integers
- **Revenue ceiling (annual):** `searchVolume × ctr × convRate × aov × 12`
  Defaults: `ctr = 0.05`, `convRate = 0.25` — override only if brief supplies different values
- **Steady:** `steady = round(searchVolume × ctr × convRate)`
- **Ramp:** 12 ascending integers, S-curve from ~5% of steady (month 1) to 100% (month 12)

---

## STEP 3 — COPY RULES

- `coverTitle`: two punchy lines joined by `<br>`, ≤ 6 words per line.
  Lead with what's at stake — searches going to rivals, revenue left on the table.
- `coverLede`: one sentence, ~20 words, no SEO jargon, speaks to a business owner
- `issues`: 4–5 items. `title` ≤ 6 words, `note` ≤ 9 words, `cost` ≤ 4 words framed as a
  loss ("~40 leads/mo lost", "Map pack invisible", "Zero local pages indexed")
- `clusters[].name`: the service label, ≤ 3 words
- `competitors`: 5–8 rows. Exactly one `"leader": true` (highest DR/traffic) and one
  `"you": true` (client domain). Every row must include both `leader` and `you` booleans.
- `timeline`: exactly 4 months, 3 `items` each (≤ 5 words per item).
  Mo 1 = technical fixes. Mo 2 = content/pages. Mo 3 = authority/links/reviews. Mo 4 = scale.
- Voice: confident, specific, money-forward. The owner is non-technical and skeptical of SEO.

---

## STEP 4 — DECK JSON SCHEMA

Output a JSON object matching this shape exactly:

```json
{
  "meta": {
    "client": "",
    "market": "",
    "preparedBy": "Patrick Dinehart · Butter First",
    "coverCrest": "Local Market SEO Audit",
    "coverTitle": "",
    "coverLede": "",
    "footBy": "Butter First · SEO Generating Local Leads",
    "brand": "",
    "brand2": ""
  },
  "issues": [
    { "title": "", "note": "", "cost": "" }
  ],
  "geo": {
    "total": 0,
    "points": [
      { "city": "", "x": 0, "y": 0, "vol": 0, "you": false }
    ],
    "region": "M10,38 C8,18 30,8 50,10 C74,12 94,20 92,42 C90,66 78,92 50,92 C24,92 12,62 10,38 Z"
  },
  "clusters": [
    { "name": "", "vol": 0 }
  ],
  "competitors": [
    { "name": "", "leader": false, "you": false, "dr": 0, "kw": 0, "traffic": 0, "reviews": 0, "links": 0 }
  ],
  "projection": {
    "searchVolume": 0,
    "ctr": 0.05,
    "convRate": 0.25,
    "aov": 0
  },
  "ramp": [],
  "timeline": [
    { "month": 1, "title": "", "items": [] },
    { "month": 2, "title": "", "items": [] },
    { "month": 3, "title": "", "items": [] },
    { "month": 4, "title": "", "items": [] }
  ],
  "budget": {
    "monthly": "$2,500",
    "sprintLabel": "4-month sprint · evaluate, then continue"
  }
}
```

**Schema notes:**
- `meta.brand` = client's primary hex color. `meta.brand2` = same hue, lightness raised ~12%.
- `geo.points` — x/y are schematic 0–100 positions, not real coordinates.
  Primary city goes near center (x≈46, y≈50) with `"you": true`.
  Other towns positioned by compass direction from center; distance ∝ how far they are.
  Keep all values 10–90.
- `ramp` = exactly 12 integers, never decreasing.

---

## STEP 5 — WRITE THE FILE

Write `H:\bf-clients\slides\deck-[CLIENTSLUG].html` using this shell,
replacing the `window.DECK_OVERRIDE` value with the computed JSON:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[CLIENT NAME] · SEO Pitch Deck · Butter First</title>
  <link rel="stylesheet" href="deck.css">
</head>
<body>
  <div id="topbar">
    <span class="deck-brand" id="deck-brand-label">Butter First · SEO Generating Local Leads</span>
    <button id="fullscreen-btn">⛶ Fullscreen</button>
  </div>
  <div id="slides">
    <section class="slide" id="slide-cover"></section>
    <section class="slide" id="slide-issues"></section>
    <section class="slide" id="slide-geo"></section>
    <section class="slide" id="slide-clusters"></section>
    <section class="slide" id="slide-competitors"></section>
    <section class="slide" id="slide-projection"></section>
    <section class="slide" id="slide-timeline"></section>
  </div>
  <nav id="nav">
    <button class="nav-btn" id="prev-btn" title="Previous (←)">&#8592;</button>
    <div class="nav-dots" id="nav-dots"></div>
    <button class="nav-btn" id="next-btn" title="Next (→)">&#8594;</button>
    <span id="slide-counter">1 / 7</span>
  </nav>
  <script>
  window.DECK_OVERRIDE = /* COMPUTED JSON GOES HERE */;
  </script>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <script src="deck.js"></script>
</body>
</html>
```

CLIENTSLUG = client name lowercased, spaces → hyphens, no special characters.
Example: "Apex Hardwood Flooring" → `deck-apex-hardwood-flooring.html`

---

## CLIENT BRIEF

```
BUSINESS NAME:        
BUSINESS DOMAIN:      
CLIENT SLUG:          
MARKET:               (City, ST)
SERVICE AREA POP:     (total population of area served)
BRAND COLOR (hex):    
AVG JOB VALUE ($):    
MONTHLY RETAINER:     $2,500

SERVICES (Ahrefs will supply keyword volumes):
- 
- 
- 

COMPETITOR DOMAINS (Ahrefs will pull DR / traffic / links):
- 
- 
- 
- 
- [clientdomain.com]  ← this one gets you:true

TOWNS IN SERVICE AREA:
- [Primary City]  pop:        (you:true — place at map center)
- [Town 2]        pop:        dir: N/NE/E/SE/S/SW/W/NW
- [Town 3]        pop:        dir: 
- [Town 4]        pop:        dir: 

SITE ISSUES (from your audit — what's broken and what it costs them):
- 
- 
- 
- 

REVIEW COUNTS (Google, if known):
- [competitor]:  reviews
- [client]:      reviews

OVERRIDES (leave blank to use defaults: ctr=0.05, convRate=0.25):
- CTR:       
- Conv rate: 
```

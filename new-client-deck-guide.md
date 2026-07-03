# New Client Deck — Step-by-Step Guide

How to turn a client brief into a live, published SEO pitch deck at
`https://appleinferno.github.io/local-rank-slide-deck/[clientslug]/`,
using Claude Code + the Ahrefs MCP, with the same visual system as the
837Junk build (`837junk/index.html`).

This assumes you're working in `H:\bf-clients\slides` (this repo) and
have already connected the Ahrefs MCP (`/mcp` → "Authentication successful.
Connected to ahrefs.").

---

## 0. What's fixed vs. what's per-client

- `deck.css` and `deck.js` are **shared** — every client deck loads them
  from one level up (`../deck.css`, `../deck.js`). Don't copy or fork
  them per client. Any styling change you make to them (like the larger
  nav buttons and the 25%-larger slide content already baked in) applies
  to **every** deck automatically, past and future.
- Only the `window.DECK_OVERRIDE` JSON and the client's own
  `[clientslug]/index.html` shell are per-client.
- `claude-code-deck-prompt.md` in this repo is the original schema/rules
  reference (calculation rules, copy rules, JSON schema). This guide adds
  the real-world corrections learned from building the 837Junk deck —
  read both.

---

## 1. Gather the client brief

Minimum you need:
- Business name, domain, market (city, ST), full service-area population
- Brand color (hex)
- Average job value ($)
- A rough list of services/keywords the client thinks matter

**Before trusting that keyword list**, check the client's actual site
(WebSearch or WebFetch their domain) to confirm what they actually sell.
On the 837Junk build, the initial brief included "residential junk
removal" as a keyword, but the business is dumpster rental only — no
junk-hauling service pages existed anywhere on their site. Including it
would have inflated demand numbers with irrelevant traffic. If services
in the brief don't match what the site actually offers, flag it and
confirm before running the numbers.

---

## 2. Ahrefs keyword research

For each real service, generate 5–7 query variations (near-me, pricing/
cost, sizes, affordable/cheap, residential/commercial, same-day, etc.)
and pull volumes in one batch:

```
mcp__ahrefs__keywords-explorer-overview
  select: keyword,volume,cpc,difficulty
  country: US
  keywords: "term one,term two,term three,..."
```

Flag (don't localize) any variation that already contains a city name —
those are already local searches.

Call `mcp__ahrefs__doc` for a tool once per session if you haven't used
it before, to confirm the current `select` fields — the schema has
changed shape before.

---

## 3. Find real local competitors (Ahrefs alone isn't enough)

`site-explorer-organic-competitors` on a small/thin local domain tends to
return junk: Facebook, Yelp, BBB, Reddit, Lowes — sites that happen to
share a handful of keywords but aren't real competitors. This happened on
837Junk (DR 3.4, only 10 ranking keywords) — the auto-suggested list was
useless.

When that happens:
1. WebSearch `"[service] [primary city], [state]"` and
   `"[service] [secondary town/county]"` to find actual local operators.
2. Pull real metrics per candidate:
   - `site-explorer-domain-rating`
   - `site-explorer-backlinks-stats` (mode: subdomains)
   - `site-explorer-metrics` (mode: subdomains, country: US) → org_keywords, org_traffic
3. Keep 5–8 domains total, including the client. Whichever has the
   highest DR/traffic/keywords is `"leader": true`. Exactly one row gets
   `"you": true`.

---

## 4. Review counts

Ahrefs does not track review counts — don't guess a number with no
basis. Options in order of preference:
1. Brief supplies real counts → use them.
2. WebSearch the business name + "google reviews" — Facebook/Yelp pages
   often surface a real number (this is how 837Junk's 228 was confirmed).
3. Otherwise, estimate proportionally to the domain's DR/traffic tier
   relative to competitors you *do* have real numbers for, and say so
   when you report back to the user — don't silently present an estimate
   as fact.

---

## 5. Run the calculations

Formulas (from `claude-code-deck-prompt.md`, STEP 2):
- `local_vol = national_vol × (SERVICE_AREA_POP / 332,000,000)`
- Cluster vol = sum of a service's localized keyword volumes
- Grand total = sum of all cluster vols
- Town vol = `grand_total × (town_pop / sum_of_town_pops)`
- `steady = round(searchVolume × ctr × convRate)`, defaults ctr 0.05 / convRate 0.25
- Annual revenue ceiling = `searchVolume × ctr × convRate × aov × 12`
- Ramp = 12 non-decreasing integers, ending at `steady`

Two real gotchas hit on this build:

**Rounding town splits so they sum correctly.** Rounding each town
independently (`Math.round`) usually lands one off from the grand total.
Use the largest-remainder method: floor every value, then hand out the
leftover units to whichever towns had the largest fractional remainder,
largest first, until the total matches exactly. Always sanity-check with:

```js
node -e "const d=require('./data.json'); console.log(d.geo.points.reduce((s,p)=>s+p.vol,0), d.geo.total)"
```

**When `steady` rounds to 0.** With a small rural population and a tight
keyword list, `searchVolume × ctr × convRate` can round down to 0
leads/month — technically correct, but a flat-zero ramp chart is a dead
slide. Judgment call used here: keep the ramp ascending to at least 1 by
the later months rather than showing literal zero all year, and say so
explicitly when reporting the numbers back — don't silently override the
formula without flagging it. If the client wants a higher CTR assumption
justified by low competition (as was the case here, bumped 5% → 12%),
that's a legitimate lever to ask about before falling back to fudging the
ramp.

---

## 6. Write copy

Follow `claude-code-deck-prompt.md` STEP 3 rules exactly (word counts,
tone, exactly one leader/one you in competitors, 4-month/3-item
timeline). Keep `clusters[].name` to ≤3 words — plan for this if you're
splitting one service into multiple named clusters (e.g. "Dumpster
Rental" / "Dumpster Near Me" / "Dumpster Pricing") to avoid double-
counting a keyword that lives in two clusters at once.

---

## 7. Build the file — in its own folder

GitHub Pages serves `/[clientslug]/` only if `[clientslug]/index.html`
exists. Don't write `deck-[clientslug].html` in the repo root anymore —
create the folder:

```
H:\bf-clients\slides\[clientslug]\index.html
```

Use this shell (note the `../` on both asset paths — that's the part
that's easy to forget when copying the shell from
`claude-code-deck-prompt.md`, which shows root-relative paths):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[CLIENT NAME] · SEO Pitch Deck · Butter First</title>
  <link rel="stylesheet" href="../deck.css">
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
  <script src="../deck.js"></script>
</body>
</html>
```

`clientslug` = client name lowercased, spaces → hyphens, no special
characters (matches the folder name — no `deck-` prefix needed since the
folder itself is the namespace now).

---

## 8. Validate before calling it done

```bash
node -e "
const fs=require('fs');
let s=fs.readFileSync('[clientslug]/index.html','utf8');
let m=s.match(/window.DECK_OVERRIDE = ([\s\S]*?);\s*<\/script>/);
const d=JSON.parse(m[1]);
console.log('valid json');
console.log('geo total', d.geo.total, 'sum points', d.geo.points.reduce((s,p)=>s+p.vol,0));
console.log('cluster sum', d.clusters.reduce((s,c)=>s+c.vol,0));
"
```

All three totals should match. If they don't, a rounding step was done
independently instead of with the largest-remainder method — go back to
step 5.

---

## 9. Ship it

```bash
git add [clientslug]/index.html
git commit -m "add [client] slide deck"
git push
```

`.mcp.json` and `.claude/settings.local.json` are already gitignored, so
`git add .` is safe in this repo if you'd rather stage everything at
once — just glance at `git status` first.

GitHub Pages deploys automatically on push. Confirm it's live:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://appleinferno.github.io/local-rank-slide-deck/[clientslug]/
```

Expect `200`. It can take a minute or two after the push for Pages to
rebuild.

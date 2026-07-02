# Ahrefs Auto-Research — LLM Prompt Pack

Instead of manually filling in keyword volumes and competitor metrics, give Claude Code your
Ahrefs API key and a minimal brief. Claude fetches every number, runs the calculations, and
outputs a ready-to-use `DECK` JSON.

**What this eliminates:**
- Manual keyword volume lookup in Ahrefs/DataForSEO
- Manual competitor DR / traffic / backlinks lookup
- Copy-pasting numbers into the INPUT BLOCK

**What you still supply:**
- Business name, location, population, brand color, AOV
- A list of service names (no volumes needed)
- Competitor domain names (no metrics needed)

---

## OPTION A — WebFetch in Claude Code (no MCP setup required)

This works today with any Claude Code session. Claude uses `WebFetch` to call the Ahrefs
REST API directly inside the conversation.

### Setup (one time)

1. Get an Ahrefs API key from **ahrefs.com → Account → API**
   (requires Ahrefs Advanced or Enterprise; Lite does not include API access)
2. Note your key: `ahrefs_XXXXXXXXXXXXXXXX`
3. That's it — no MCP server, no Node.js, no config files.

### How to use

Open Claude Code (`claude` in terminal or the desktop app), then paste the **AUTO-RESEARCH
PROMPT** below with your client brief filled in. Claude will:
1. Call Ahrefs Keywords Explorer for each service × common modifier set
2. Call Ahrefs Site Explorer for each competitor domain
3. Compute all localizations, cluster volumes, and revenue projections
4. Output the full `DECK` JSON — paste it into `deck-[client].html`

---

## AUTO-RESEARCH PROMPT

> Paste everything below into Claude Code. Fill the BRIEF section first.

```
You are a senior local-SEO strategist at Butter First. Your task is to research a client's
local market using the Ahrefs API, then produce a complete DECK JSON for their pitch deck.

=== AHREFS API INSTRUCTIONS ===
Base URL: https://api.ahrefs.com/v3
Auth header on every request: Authorization: Bearer <<AHREFS_API_KEY>>
Content-Type: application/json

Step 1 — Keywords Explorer (get volume for each keyword):
  GET https://api.ahrefs.com/v3/keywords-explorer/overview
  Params: country=us, select=keyword,volume,cpc,difficulty
  Body (JSON): { "keywords": ["keyword one", "keyword two", ...] }
  Do this once per batch of up to 100 keywords.
  For each service in the brief, generate 4–6 common variations (e.g. "dumpster rental",
  "roll off dumpster", "dumpster rental near me", "rent a dumpster", "cheap dumpster rental",
  "dumpster rental [city]"). Include one variation that already contains the city name —
  treat that one as already-local (use its volume as-is; skip localization).

Step 2 — Site Explorer (get metrics for each competitor):
  GET https://api.ahrefs.com/v3/site-explorer/overview
  Params: target=domain.com, mode=domain,
          select=domain_rating,org_keywords,org_traffic,backlinks
  Do this once per competitor domain.
  Also call it for the client's own domain.

Step 3 — Reviews use the data given by the user (flag as N/A if this data is missing).

After fetching all data, apply the CALCULATION RULES and COPY RULES below, then output
the DECK JSON. Do NOT ask for confirmation between steps — fetch, compute, output.

=== OUTPUT CONTRACT ===
- Output valid JSON only (double quotes, no comments, no trailing commas, no code fences).
- After the JSON, add ---NOTES--- and list any values you had to estimate.
- Revenue is a ceiling, not a promise.

=== CALCULATION RULES ===
- Localize: if a keyword already contains the city name, use volume as-is.
  Else: local_vol = national_vol × (LOCAL_POP / 332000000).
- cluster vol = sum of localized variation volumes. grand_total = sum of cluster vols.
- geo.total = projection.searchVolume = grand_total.
- geo.points[].vol = grand_total × (town_pop / total_service_area_pop), rounded.
- revenue = searchVolume × ctr × convRate × aov. Defaults: ctr=0.05, convRate=0.25.
- steady = round(searchVolume × ctr × convRate).
  ramp = 12 ascending integers, S-curve from ~5% of steady (month 1) to ~100% (month 12).

=== COPY RULES ===
- coverTitle: 2 lines joined by <br>, ≤6 words/line. coverLede: ~20 words, no jargon.
- issues: 4–5; title ≤6 words, note ≤9 words, cost ≤4 words framed as a loss.
- clusters[].name ≤3 words. competitors: 5–8 rows, exactly one leader:true, one you:true.
- timeline: 4 months; title ≤3 words; 3 items each ≤5 words.
- Voice: confident, specific, money-forward, zero jargon, non-technical owner.

=== DECK SCHEMA ===
{
  "meta": { "client","market","preparedBy","coverCrest","coverTitle","coverLede","footBy","brand","brand2" },
  "issues": [ { "title","note","cost" } ],
  "geo": { "total", "points":[ {"city","x","y","vol","you"} ], "region" },
  "clusters": [ { "name","vol" } ],
  "competitors": [ { "name","leader","you","dr","kw","traffic","reviews","links" } ],
  "projection": { "searchVolume","ctr","convRate","aov" },
  "ramp": [ 12 integers ],
  "timeline": [ { "month","title","items":[] } ],
  "budget": { "monthly","sprintLabel" }
}
Schema notes:
- meta.preparedBy default "Patrick Dinehart · Butter First"
- meta.coverCrest default "Local Market SEO Audit"
- meta.footBy default "Butter First · SEO Generating Local Leads"
- meta.brand = client hex; meta.brand2 = lighter sibling (+12% lightness)
- geo.points x,y: 0–100 schematic grid. Primary city near center (46,50) with you:true.
  Compass: North=lower y, South=higher y, East=higher x, West=lower x. Keep 10–90.
- geo.region default: M10,38 C8,18 30,8 50,10 C74,12 94,20 92,42 C90,66 78,92 50,92 C24,92 12,62 10,38 Z
- competitors: leader and you are booleans on every row.

=== CLIENT BRIEF ===
AHREFS API KEY: <<paste key here>>

BUSINESS NAME: [[name]]
BUSINESS URL: [[domain.com]]
MARKET: [[City, ST]]
SERVICE AREA POPULATION: [[number]]
BRAND COLOR (hex): [[#hex]]
AVERAGE JOB VALUE ($): [[number]]
MONTHLY BUDGET: [[default $2,500]]

SERVICES (names only — you will research the keyword volumes):
- [[Service 1]]
- [[Service 2]]
- [[Service 3]]

COMPETITOR DOMAINS (you will pull their metrics):
- [[competitor1.com]]
- [[competitor2.com]]
- [[competitor3.com]]
- [[competitor4.com]]
(include the client domain as one entry — you:true in the output)

TOWNS IN SERVICE AREA:
- [[Primary City]] = [[pop]] (primary)
- [[Town 2]] = [[pop]], dir: [[N/S/E/W...]]
- [[Town 3]] = [[pop]], dir: [[...]]

SITE ISSUES (from audit — 4 to 5 bullet points describing what's broken):
- [[issue and why it costs them]]
- [[...]]
```

---

## OPTION B — Ahrefs MCP Server (more integrated, runs automatically)

With an MCP server wired into Claude Code, the model can call Ahrefs tools mid-conversation
without a WebFetch prompt — useful if you're generating multiple decks per session.

### Step 1 — Install the MCP wrapper

There is no official Ahrefs MCP server yet. Build a minimal one with Node.js:

```bash
mkdir ahrefs-mcp && cd ahrefs-mcp
npm init -y
npm install @modelcontextprotocol/sdk node-fetch
```

Create `index.js`:

```javascript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API = 'https://api.ahrefs.com/v3';
const KEY = process.env.AHREFS_API_KEY;
const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const server = new McpServer({ name: 'ahrefs', version: '1.0.0' });

server.tool(
  'keywords_volume',
  'Get national monthly search volume for a list of keywords',
  { keywords: z.array(z.string()).describe('Up to 100 keyword phrases') },
  async ({ keywords }) => {
    const res = await fetch(`${API}/keywords-explorer/overview?country=us&select=keyword,volume,difficulty`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ keywords }),
    });
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

server.tool(
  'domain_metrics',
  'Get DR, organic keywords, traffic, and backlinks for a domain',
  { domain: z.string().describe('Domain without protocol, e.g. example.com') },
  async ({ domain }) => {
    const res = await fetch(
      `${API}/site-explorer/overview?target=${domain}&mode=domain&select=domain_rating,org_keywords,org_traffic,backlinks`,
      { headers }
    );
    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 2 — Wire it into Claude Code

Add to `H:\bf-clients\slides\.claude\settings.json`:

```json
{
  "mcpServers": {
    "ahrefs": {
      "command": "node",
      "args": ["C:/path/to/ahrefs-mcp/index.js"],
      "env": {
        "AHREFS_API_KEY": "ahrefs_XXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

Restart Claude Code. You'll see `ahrefs` in the connected MCP servers list.

### Step 3 — Use the SHORT BRIEF PROMPT (MCP version)

Once the MCP is live, Claude Code can call `keywords_volume` and `domain_metrics` as tools.
Just paste this shorter prompt — no WebFetch instructions needed:

```
You are a Butter First SEO strategist. Use the ahrefs MCP tools to research this client,
then produce a complete DECK JSON following the schema in seo-deck-prompt-pack.md.

1. Call keywords_volume with 4–6 variations per service below.
2. Call domain_metrics for each competitor and for the client domain.
3. Apply the calculation and copy rules from the prompt pack.
4. Output valid JSON only, then ---NOTES--- for any estimates.

CLIENT BRIEF:
BUSINESS: [[name]] · [[domain.com]]
MARKET: [[City, ST]] · POP: [[number]] · BRAND: [[#hex]] · AOV: $[[number]]

SERVICES: [[Service 1]], [[Service 2]], [[Service 3]]

COMPETITOR DOMAINS: [[c1.com]], [[c2.com]], [[c3.com]], [[c4.com]], [[client.com]]

TOWNS: [[Primary City]] [[pop]] (primary) | [[Town 2]] [[pop]] [[dir]] | [[Town 3]] [[pop]] [[dir]]

ISSUES FROM AUDIT:
- [[issue — cost]]
- [[issue — cost]]
- [[issue — cost]]
- [[issue — cost]]

BUDGET: $[[monthly]]
```

---

## OPTION C — DataForSEO (cheaper, no subscription required)

DataForSEO has keyword volume and SERP data via a pay-per-call API. Cheaper than Ahrefs API
for occasional use. Swap the Ahrefs endpoints for:

```
Keywords volume:
POST https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live
Auth: Basic base64(login:password)
Body: [{ "keywords": ["keyword one", "keyword two"], "location_code": 2840 }]

Domain metrics (SERP/organic):
POST https://api.dataforseo.com/v3/domain_analytics/technologies/domain_technologies/live
```

DataForSEO credits cost roughly $0.002–0.05 per call. One full deck research session
(~30 keyword lookups + 6 domain metrics) costs under $1.

---

## Workflow Comparison

| | Manual (current) | WebFetch Prompt | MCP Server |
|---|---|---|---|
| Setup time | 0 | 0 | ~30 min |
| Research time | 30–60 min | 0 | 0 |
| Cost per deck | Your time | Ahrefs API credits | Ahrefs API credits |
| Ahrefs required | Yes (manual) | Yes (API) | Yes (API) |
| Works in claude.ai | Yes | No | No |
| Works in Claude Code | Yes | Yes | Yes |

**Recommended path:** Start with Option A (WebFetch) — zero setup, works in the first
session. Move to Option B (MCP) once you're generating 3+ decks per week.

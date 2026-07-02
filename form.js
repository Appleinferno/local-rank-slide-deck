/* ── Constants ── */
const MASTER_PROMPT_PREFIX = `You are a senior local-SEO strategist at Butter First building a sales pitch deck for the owner of a local service business. The owner is non-technical and skeptical. Your job is to show them, in plain language and concrete numbers, how much search demand and revenue is sitting unclaimed in their market — and that the gap with competitors is closeable.

Produce a single JSON object matching the DECK schema below. Obey every rule in the OUTPUT CONTRACT, CALCULATION RULES, and COPY RULES.

=== OUTPUT CONTRACT ===
- Output valid JSON only (double quotes, no comments, no trailing commas, no code fences, no preamble). It must match the DECK SCHEMA exactly.
- After the JSON, if you assumed/estimated anything, add a line ---NOTES--- and list it. Everything above ---NOTES--- must be valid JSON.
- Use only supplied competitor numbers. Revenue is a ceiling, not a promise.

=== CALCULATION RULES ===
- Localize: if a keyword already names a place, use its volume as-is; else local_vol = national_vol × (LOCAL_POP / NATIONAL_POP). Default NATIONAL_POP = 332000000.
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
  "meta": { "client":"", "market":"", "preparedBy":"", "coverCrest":"", "coverTitle":"", "coverLede":"", "footBy":"", "brand":"", "brand2":"" },
  "issues": [ { "title":"", "note":"", "cost":"" } ],
  "geo": { "total": 0, "points": [ { "city":"", "x":0, "y":0, "vol":0, "you":false } ], "region":"" },
  "clusters": [ { "name":"", "vol":0 } ],
  "competitors": [ { "name":"", "leader":false, "you":false, "dr":0, "kw":0, "traffic":0, "reviews":0, "links":0 } ],
  "projection": { "searchVolume":0, "ctr":0.05, "convRate":0.25, "aov":0 },
  "ramp": [],
  "timeline": [ { "month":1, "title":"", "items":[] } ],
  "budget": { "monthly":"", "sprintLabel":"" }
}
Notes on tricky fields:
- meta.brand = client primary hex (e.g. "#1e40af"); meta.brand2 = a lighter/brighter sibling (raise lightness ~12%).
- meta.coverCrest default "Local Market SEO Audit". meta.preparedBy default "Patrick Dinehart · Butter First". meta.footBy default "Butter First · SEO Generating Local Leads".
- geo.points x,y are 0–100 schematic positions. Primary city near center (~46,50) with you:true. Other towns by compass: North=lower y, South=higher y, East=higher x, West=lower x. Keep 10–90.
- geo.region: use the DEFAULT REGION PATH unless a custom one is given.
- competitors: include "leader" and "you" as booleans on every row.

=== INPUT BLOCK ===
`;

/* ── DOM refs ── */
const form = document.getElementById('deck-form');
const apiKeyInput = document.getElementById('api-key');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('error-msg');
const colorPicker = document.getElementById('brand-color-picker');
const colorHex = document.getElementById('brand-color-hex');
const servicesList = document.getElementById('services-list');
const townsList = document.getElementById('towns-list');
const issuesList = document.getElementById('issues-list');
const compsList = document.getElementById('competitors-list');

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  restoreApiKey();
  if (localStorage.getItem('deckData')) {
    document.getElementById('view-last-btn').style.display = 'inline-flex';
  }
  restoreDraft();
  if (!servicesList.children.length) addService();
  if (!townsList.children.length) { addTown(true); addTown(false); }
  if (!issuesList.children.length) { addIssue(); addIssue(); addIssue(); addIssue(); }
  if (!compsList.children.length) { addComp(); addComp(); addComp(); }
  setupColorSync();
});

/* ── API key persistence ── */
function restoreApiKey() {
  const key = localStorage.getItem('anthropicKey');
  if (key) {
    apiKeyInput.value = key;
    document.getElementById('api-details').open = false;
  } else {
    document.getElementById('api-details').open = true;
  }
}

apiKeyInput.addEventListener('change', () => {
  localStorage.setItem('anthropicKey', apiKeyInput.value.trim());
});

/* ── Color picker sync ── */
function setupColorSync() {
  colorPicker.addEventListener('input', () => {
    colorHex.value = colorPicker.value;
  });
  colorHex.addEventListener('input', () => {
    const v = colorHex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) colorPicker.value = v;
  });
  colorHex.value = colorPicker.value;
}

/* ── Dynamic: Services ── */
document.getElementById('add-service-btn').addEventListener('click', () => addService());

function addService() {
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  div.innerHTML = `
    <button type="button" class="remove-btn" title="Remove">×</button>
    <div class="service-name-row">
      <input type="text" placeholder="Service name (e.g. Hardwood Installation)" style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.5rem 0.7rem;color:var(--text);font-family:var(--font);font-size:0.88rem;">
    </div>
    <div class="kw-list"></div>
    <button type="button" class="add-kw-btn">+ Add keyword</button>
  `;
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
  div.querySelector('.add-kw-btn').addEventListener('click', () => addKw(div.querySelector('.kw-list')));
  servicesList.appendChild(div);
  addKw(div.querySelector('.kw-list'));
  addKw(div.querySelector('.kw-list'));
}

function addKw(list) {
  const row = document.createElement('div');
  row.className = 'kw-row';
  row.innerHTML = `
    <input type="text" placeholder="hardwood floor installation" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
    <input type="number" placeholder="22000" min="0" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
    <label class="kw-local"><input type="checkbox"> Already local</label>
    <button type="button" class="icon-btn" title="Remove keyword">×</button>
  `;
  row.querySelector('.icon-btn').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

/* ── Dynamic: Towns ── */
document.getElementById('add-town-btn').addEventListener('click', () => addTown(false));

function addTown(isPrimary) {
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  if (isPrimary) {
    div.innerHTML = `
      <div class="row-grid g3">
        <div>
          <div class="row-label">Primary City (business location)</div>
          <input type="text" data-field="city" placeholder="Austin" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
        </div>
        <div>
          <div class="row-label">Population</div>
          <input type="number" data-field="pop" placeholder="961000" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
        </div>
        <div>
          <div class="row-label">Direction</div>
          <input type="text" value="primary" disabled style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--muted);font-family:var(--font);font-size:0.85rem;cursor:default;">
        </div>
      </div>
    `;
  } else {
    div.innerHTML = `
      <button type="button" class="remove-btn" title="Remove">×</button>
      <div class="row-grid g3">
        <div>
          <div class="row-label">Town Name</div>
          <input type="text" data-field="city" placeholder="Round Rock" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
        </div>
        <div>
          <div class="row-label">Population</div>
          <input type="number" data-field="pop" placeholder="128000" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
        </div>
        <div>
          <div class="row-label">Compass Direction</div>
          <select data-field="dir" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
            <option value="N">North</option>
            <option value="NE">Northeast</option>
            <option value="E">East</option>
            <option value="SE">Southeast</option>
            <option value="S">South</option>
            <option value="SW">Southwest</option>
            <option value="W">West</option>
            <option value="NW">Northwest</option>
          </select>
        </div>
      </div>
    `;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
  }
  townsList.appendChild(div);
}

/* ── Dynamic: Issues ── */
document.getElementById('add-issue-btn').addEventListener('click', addIssue);

function addIssue() {
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  div.innerHTML = `
    <button type="button" class="remove-btn" title="Remove">×</button>
    <div class="row-grid g2">
      <div>
        <div class="row-label">Issue (what's broken)</div>
        <input type="text" data-field="issue" placeholder="Not ranking for main service keyword" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
      </div>
      <div>
        <div class="row-label">Why it costs them</div>
        <input type="text" data-field="cost" placeholder="~40 leads/month go to competitors" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.45rem 0.65rem;color:var(--text);font-family:var(--font);font-size:0.85rem;">
      </div>
    </div>
  `;
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
  issuesList.appendChild(div);
}

/* ── Dynamic: Competitors ── */
document.getElementById('add-comp-btn').addEventListener('click', addComp);

function addComp() {
  const div = document.createElement('div');
  div.className = 'dynamic-row';
  div.innerHTML = `
    <button type="button" class="remove-btn" title="Remove">×</button>
    <div class="row-grid" style="grid-template-columns:2fr 70px 100px 100px 80px 90px;gap:0.4rem;">
      <div>
        <div class="row-label">Name</div>
        <input type="text" data-field="name" placeholder="Austin Floor Pros" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
      <div>
        <div class="row-label">DR</div>
        <input type="number" data-field="dr" placeholder="32" min="0" max="100" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
      <div>
        <div class="row-label">Keywords</div>
        <input type="number" data-field="kw" placeholder="240" min="0" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
      <div>
        <div class="row-label">Traffic/mo</div>
        <input type="number" data-field="traffic" placeholder="1200" min="0" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
      <div>
        <div class="row-label">Reviews</div>
        <input type="number" data-field="reviews" placeholder="84" min="0" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
      <div>
        <div class="row-label">Backlinks</div>
        <input type="number" data-field="links" placeholder="320" min="0" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:0.4rem 0.6rem;color:var(--text);font-family:var(--font);font-size:0.82rem;">
      </div>
    </div>
    <label class="client-check">
      <input type="checkbox" data-field="isClient"> This row is the client's current metrics
    </label>
  `;
  div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
  compsList.appendChild(div);
}

/* ── Collect form data ── */
function collectFormData() {
  const fd = new FormData(form);
  const data = {
    businessName: fd.get('businessName') || '',
    market: fd.get('market') || '',
    population: parseInt(fd.get('population')) || 0,
    brandColor: colorHex.value.trim() || '#1e40af',
    aov: parseFloat(fd.get('aov')) || 0,
    services: [],
    towns: [],
    issues: [],
    competitors: [],
    overrides: {
      ctr: fd.get('ctr') || '',
      convRate: fd.get('convRate') || '',
      budget: fd.get('budget') || '',
    }
  };

  // Services
  servicesList.querySelectorAll('.dynamic-row').forEach(row => {
    const nameInput = row.querySelector('.service-name-row input');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return;
    const keywords = [];
    row.querySelectorAll('.kw-row').forEach(krow => {
      const inputs = krow.querySelectorAll('input');
      const phrase = inputs[0]?.value.trim();
      const vol = parseInt(inputs[1]?.value) || 0;
      const isLocal = krow.querySelector('input[type="checkbox"]')?.checked || false;
      if (phrase) keywords.push({ phrase, vol, isLocal });
    });
    data.services.push({ name, keywords });
  });

  // Towns
  townsList.querySelectorAll('.dynamic-row').forEach((row, i) => {
    const city = row.querySelector('[data-field="city"]')?.value.trim() || '';
    const pop = parseInt(row.querySelector('[data-field="pop"]')?.value) || 0;
    const dir = row.querySelector('[data-field="dir"]')?.value || 'primary';
    if (city) data.towns.push({ city, pop, direction: i === 0 ? 'primary' : dir });
  });

  // Issues
  issuesList.querySelectorAll('.dynamic-row').forEach(row => {
    const issue = row.querySelector('[data-field="issue"]')?.value.trim() || '';
    const cost = row.querySelector('[data-field="cost"]')?.value.trim() || '';
    if (issue) data.issues.push({ issue, cost });
  });

  // Competitors
  compsList.querySelectorAll('.dynamic-row').forEach(row => {
    const name = row.querySelector('[data-field="name"]')?.value.trim() || '';
    if (!name) return;
    const isClient = row.querySelector('[data-field="isClient"]')?.checked || false;
    data.competitors.push({
      name: isClient ? `${name} — current` : name,
      dr: parseInt(row.querySelector('[data-field="dr"]')?.value) || 0,
      kw: parseInt(row.querySelector('[data-field="kw"]')?.value) || 0,
      traffic: parseInt(row.querySelector('[data-field="traffic"]')?.value) || 0,
      reviews: parseInt(row.querySelector('[data-field="reviews"]')?.value) || 0,
      links: parseInt(row.querySelector('[data-field="links"]')?.value) || 0,
      isClient,
    });
  });

  return data;
}

/* ── Build INPUT BLOCK ── */
function buildInputBlock(d) {
  const lines = [];
  lines.push(`BUSINESS NAME: ${d.businessName}`);
  lines.push(`MARKET / SERVICE AREA: ${d.market}`);
  lines.push(`LOCAL POPULATION (service area): ${d.population}`);
  lines.push(`BRAND COLOR (hex): ${d.brandColor}`);
  lines.push(`AVERAGE JOB VALUE (AOV $): ${d.aov}`);
  lines.push('');
  lines.push('SERVICES + KEYWORD CLUSTERS (national monthly volumes from DataForSEO/Ahrefs):');
  d.services.forEach(svc => {
    const kwParts = svc.keywords.map(k => `${k.phrase} = ${k.vol}${k.isLocal ? ' (LOCAL)' : ''}`).join(', ');
    lines.push(`- ${svc.name}: ${kwParts}`);
  });
  lines.push('');
  lines.push('TOWNS IN SERVICE AREA (city + population, for the demand map):');
  d.towns.forEach((t, i) => {
    if (i === 0) {
      lines.push(`- ${t.city} = ${t.pop}   (this is the business location)`);
    } else {
      lines.push(`- ${t.city} = ${t.pop}, compass dir: ${t.direction}`);
    }
  });
  lines.push('');
  lines.push('SITE ISSUES (from discovery call / audit — 4 to 5):');
  d.issues.forEach(iss => lines.push(`- ${iss.issue} — ${iss.cost}`));
  lines.push('');
  lines.push('COMPETITORS (name + metrics; client row labeled "— current"):');
  d.competitors.forEach(c => {
    lines.push(`- ${c.name}: DR ${c.dr}, keywords ${c.kw}, traffic/mo ${c.traffic}, reviews ${c.reviews}, backlinks ${c.links}`);
  });
  lines.push('');
  const ctr = d.overrides.ctr || '0.05';
  const conv = d.overrides.convRate || '0.25';
  const budget = d.overrides.budget || '$2,500';
  lines.push(`OPTIONAL OVERRIDES: blended CTR ${ctr}, conv rate ${conv}, monthly budget ${budget}, custom region path [none]`);
  lines.push('');
  lines.push('DEFAULT REGION PATH (paste into geo.region if no custom map):');
  lines.push('M10,38 C8,18 30,8 50,10 C74,12 94,20 92,42 C90,66 78,92 50,92 C24,92 12,62 10,38 Z');
  return lines.join('\n');
}

/* ── Validate ── */
function validate(d) {
  if (!d.businessName) return 'Business name is required.';
  if (!d.market) return 'Market is required.';
  if (!d.population) return 'Service area population is required.';
  if (!d.aov) return 'Average job value (AOV) is required.';
  if (!d.services.length) return 'Add at least one service with keywords.';
  if (!d.towns.length) return 'Add at least the primary city.';
  if (!d.issues.length) return 'Add at least one site issue.';
  if (d.competitors.length < 2) return 'Add at least 2 competitors (include the client).';
  if (!d.competitors.some(c => c.isClient)) return 'Mark one competitor row as the client\'s current metrics.';
  return null;
}

/* ── Parse JSON from LLM response ── */
function parseJsonFromResponse(text) {
  const notesIdx = text.indexOf('---NOTES---');
  const raw = notesIdx !== -1 ? text.slice(0, notesIdx) : text;
  const cleaned = raw
    .replace(/^```(?:json)?/m, '')
    .replace(/```$/m, '')
    .trim();
  return JSON.parse(cleaned);
}

/* ── API call ── */
async function callClaude(prompt) {
  const apiKey = localStorage.getItem('anthropicKey') || apiKeyInput.value.trim();
  if (!apiKey) throw new Error('Enter your Anthropic API key in the settings panel above.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/* ── Form submit ── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const data = collectFormData();
  const validationError = validate(data);
  if (validationError) { showError(validationError); return; }

  const inputBlock = buildInputBlock(data);
  const prompt = MASTER_PROMPT_PREFIX + inputBlock;

  showLoading(true);
  generateBtn.disabled = true;

  try {
    const responseText = await callClaude(prompt);
    const deck = parseJsonFromResponse(responseText);
    localStorage.setItem('deckData', JSON.stringify(deck));
    window.location.href = 'deck.html';
  } catch (err) {
    showError('Generation failed: ' + err.message);
  } finally {
    showLoading(false);
    generateBtn.disabled = false;
  }
});

/* ── Manual JSON paste ── */
document.getElementById('load-json-btn').addEventListener('click', () => {
  const raw = document.getElementById('paste-json').value.trim();
  if (!raw) { showError('Paste a DECK JSON first.'); return; }
  try {
    const deck = JSON.parse(raw);
    localStorage.setItem('deckData', JSON.stringify(deck));
    window.location.href = 'deck.html';
  } catch {
    showError('Invalid JSON — check for syntax errors and try again.');
  }
});

/* ── UI helpers ── */
function showLoading(on) {
  loading.classList.toggle('hidden', !on);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('visible');
  errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  errorMsg.textContent = '';
  errorMsg.classList.remove('visible');
}

/* ── Draft persistence ── */
form.addEventListener('input', () => saveDraft());

function saveDraft() {
  try {
    const d = collectFormData();
    localStorage.setItem('deckDraft', JSON.stringify(d));
  } catch { /* ignore */ }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem('deckDraft');
    if (!raw) return;
    const d = JSON.parse(raw);
    const fd = form.elements;
    if (d.businessName) fd.businessName.value = d.businessName;
    if (d.market) fd.market.value = d.market;
    if (d.population) fd.population.value = d.population;
    if (d.brandColor) { colorHex.value = d.brandColor; colorPicker.value = d.brandColor; }
    if (d.aov) fd.aov.value = d.aov;
    if (d.overrides?.ctr) fd.ctr.value = d.overrides.ctr;
    if (d.overrides?.convRate) fd.convRate.value = d.overrides.convRate;
    if (d.overrides?.budget) fd.budget.value = d.overrides.budget;
  } catch { /* ignore */ }
}

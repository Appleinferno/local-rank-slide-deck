/* ── Load DECK ── */
let DECK = null;
try {
  // window.DECK_OVERRIDE lets a standalone file inject data directly
  DECK = window.DECK_OVERRIDE || null;
  if (!DECK) {
    const raw = localStorage.getItem('deckData');
    if (raw) DECK = JSON.parse(raw);
  }
} catch { /* bad JSON */ }

if (!DECK) {
  document.getElementById('slides').innerHTML = `
    <div class="no-data">
      <h2>No deck data found</h2>
      <p>Head back to the form to generate a deck.</p>
      <br>
      <a href="index.html">← Build a Deck</a>
    </div>`;
  document.getElementById('nav').style.display = 'none';
  document.getElementById('topbar').style.display = 'none';
  throw new Error('No deck data');
}

/* ── Utilities ── */
const fmt = n => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));
const fmtK = n => { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : String(Math.round(n)); };
const fmtMoney = n => '$' + new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return { r: 99, g: 102, b: 241 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function darkenHex(hex, pct) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - pct / 100;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/* ── Apply brand colors ── */
const brand = (DECK.meta?.brand || '#6366f1').trim();
const brand2 = (DECK.meta?.brand2 || '#818cf8').trim();
const { r, g, b } = hexToRgb(brand);
const root = document.documentElement;
root.style.setProperty('--brand', brand);
root.style.setProperty('--brand2', brand2);
root.style.setProperty('--brand-rgb', `${r},${g},${b}`);

if (DECK.meta?.footBy) {
  document.getElementById('deck-brand-label').textContent = DECK.meta.footBy;
}

/* ── Slide navigation ── */
const slideEls = Array.from(document.querySelectorAll('.slide'));
const dotsEl = document.getElementById('nav-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const counterEl = document.getElementById('slide-counter');
let current = 0;
let animLocks = new Set();

slideEls.forEach((_, i) => {
  const dot = el('div', 'dot');
  dot.addEventListener('click', () => goTo(i));
  dotsEl.appendChild(dot);
});

function updateNav() {
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  counterEl.textContent = `${current + 1} / ${slideEls.length}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slideEls.length - 1;
}

function goTo(idx) {
  if (idx === current || idx < 0 || idx >= slideEls.length) return;
  const dir = idx > current ? 1 : -1;
  slideEls[current].classList.remove('active');
  slideEls[current].classList.add('prev');
  slideEls[current].style.transform = `translateX(${dir * -55}px)`;

  const entering = slideEls[idx];
  entering.style.transition = 'none';
  entering.style.transform = `translateX(${dir * 55}px)`;
  entering.style.opacity = '0';
  entering.classList.remove('prev');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      entering.style.transition = 'opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)';
      entering.style.transform = 'translateX(0)';
      entering.style.opacity = '1';
      entering.classList.add('active');
    });
  });

  setTimeout(() => {
    slideEls[current].style.transform = '';
    slideEls[current].style.opacity = '';
    slideEls[current].style.transition = '';
  }, 500);

  current = idx;
  updateNav();
  triggerSlideAnimations(idx);
}

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
});

/* Touch swipe */
let touchX = 0;
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
});

/* Fullscreen */
document.getElementById('fullscreen-btn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

/* ══════════════════════════════════════
   SLIDE RENDERERS
══════════════════════════════════════ */

/* ── Slide 1: Cover ── */
function renderCover() {
  const m = DECK.meta || {};
  const slide = document.getElementById('slide-cover');
  slide.style.background = `linear-gradient(145deg, ${darkenHex(brand, 55)} 0%, #08090f 55%)`;

  slide.innerHTML = `
    <div class="cover-inner">
      <div class="cover-noise"></div>
      <div class="cover-glow" style="background:radial-gradient(ellipse, ${brand}, transparent 70%);"></div>
      <div class="cover-accent-line"></div>
      <div class="cover-crest">${m.coverCrest || 'Local Market SEO Audit'}</div>
      <h1 class="cover-title">${m.coverTitle || m.client || 'Your Market'}</h1>
      <p class="cover-lede">${m.coverLede || ''}</p>
      <div class="cover-footer">
        <span class="cover-client">${m.client || ''}</span>
        <span>${m.market || ''}</span>
        <span>${m.preparedBy || 'Butter First'}</span>
      </div>
    </div>
  `;
}

/* ── Slide 2: Issues ── */
function renderIssues() {
  const issues = DECK.issues || [];
  const slide = document.getElementById('slide-issues');
  const inner = el('div', 'slide-inner');

  const header = el('div', '');
  header.innerHTML = `<div class="slide-label">Why You're Losing Leads</div><h2 class="slide-title">What's Holding You Back</h2>`;
  inner.appendChild(header);

  const grid = el('div', 'issues-grid');
  issues.forEach((iss, i) => {
    const card = el('div', 'issue-card');
    card.innerHTML = `
      <div class="issue-num">0${i + 1}</div>
      <div class="issue-title">${iss.title || ''}</div>
      <div class="issue-note">${iss.note || ''}</div>
      <span class="issue-cost">${iss.cost || ''}</span>
    `;
    card.style.transitionDelay = `${i * 0.1}s`;
    grid.appendChild(card);
  });
  inner.appendChild(grid);
  slide.appendChild(inner);
}

/* ── Slide 3: Geo ── */
function renderGeo() {
  const geo = DECK.geo || {};
  const points = geo.points || [];
  const slide = document.getElementById('slide-geo');
  const inner = el('div', 'slide-inner');

  inner.innerHTML = `
    <div class="slide-label">Local Search Demand</div>
    <div class="geo-layout">
      <div class="geo-map-wrap">
        <svg id="geo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
      <div class="geo-right">
        <div>
          <div class="geo-total-label">Monthly local searches</div>
          <div class="geo-total-num" id="geo-total">${fmt(geo.total)}</div>
          <div class="geo-unit">searches / month</div>
        </div>
        <div>
          <div class="geo-total-label" style="margin-bottom:0.75rem;">Demand by area</div>
          <div class="geo-city-list" id="geo-city-list"></div>
        </div>
      </div>
    </div>
  `;
  slide.appendChild(inner);

  const svg = inner.querySelector('#geo-svg');
  const region = geo.region || 'M10,38 C8,18 30,8 50,10 C74,12 94,20 92,42 C90,66 78,92 50,92 C24,92 12,62 10,38 Z';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', region);
  path.setAttribute('class', 'region-path');
  svg.appendChild(path);

  const maxVol = Math.max(...points.map(p => p.vol), 1);
  const cityList = inner.querySelector('#geo-city-list');

  points.forEach((pt, i) => {
    const baseR = 1.5 + (pt.vol / maxVol) * 5;
    const cx = pt.x; const cy = pt.y;

    if (pt.you) {
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', cx); ring.setAttribute('cy', cy);
      ring.setAttribute('r', baseR);
      ring.setAttribute('class', 'city-ring');
      svg.appendChild(ring);
      setTimeout(() => ring.classList.add('pulse'), 800 + i * 150);
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
    circle.setAttribute('r', baseR);
    circle.setAttribute('class', pt.you ? 'city-dot you-dot' : 'city-dot');
    circle.setAttribute('fill', pt.you ? brand : `rgba(${r},${g},${b},0.6)`);
    svg.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', cx); label.setAttribute('y', cy - baseR - 1.2);
    label.setAttribute('class', 'city-label');
    label.textContent = pt.city;
    svg.appendChild(label);

    const volLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    volLabel.setAttribute('x', cx); volLabel.setAttribute('y', cy + baseR + 2.5);
    volLabel.setAttribute('class', 'city-vol');
    volLabel.textContent = fmtK(pt.vol);
    svg.appendChild(volLabel);

    const cityRow = el('div', 'geo-city-row');
    cityRow.innerHTML = `
      <span class="geo-city-name${pt.you ? ' you' : ''}">${pt.city}</span>
      <div class="geo-bar-wrap"><div class="geo-bar" data-w="${Math.round((pt.vol / maxVol) * 100)}"></div></div>
      <span class="geo-city-vol">${fmt(pt.vol)}</span>
    `;
    cityList.appendChild(cityRow);

    setTimeout(() => circle.classList.add('in'), 400 + i * 120);
  });
}

/* ── Slide 4: Clusters ── */
function renderClusters() {
  const clusters = [...(DECK.clusters || [])].sort((a, b) => b.vol - a.vol);
  const total = clusters.reduce((s, c) => s + (c.vol || 0), 0);
  const slide = document.getElementById('slide-clusters');
  const inner = el('div', 'slide-inner');

  inner.innerHTML = `
    <div class="slide-label">Keyword Opportunities</div>
    <h2 class="slide-title">Monthly Search Demand</h2>
    <div class="clusters-top">
      <span class="total-pill">${fmt(total)} total searches / mo</span>
    </div>
    <div id="chart-clusters"></div>
  `;
  slide.appendChild(inner);
}

function initClustersChart() {
  const clusters = [...(DECK.clusters || [])].sort((a, b) => b.vol - a.vol);
  const chartEl = document.getElementById('chart-clusters');
  if (!chartEl || !window.echarts) return;
  const chart = echarts.init(chartEl, null, { renderer: 'canvas' });
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: '2%', right: '12%', top: '3%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e2130' } },
      axisLabel: { color: '#64748b', fontSize: 11, formatter: v => fmtK(v) },
    },
    yAxis: {
      type: 'category',
      data: clusters.map(c => c.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' },
    },
    series: [{
      type: 'bar',
      data: clusters.map(c => c.vol),
      barMaxWidth: 38,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: brand },
          { offset: 1, color: brand2 },
        ]),
        borderRadius: [0, 6, 6, 0],
      },
      label: {
        show: true,
        position: 'right',
        color: '#64748b',
        fontSize: 11,
        formatter: p => fmtK(p.value),
      },
      animationDuration: 1300,
      animationDelay: i => i * 80,
      animationEasing: 'cubicOut',
    }],
  });
  window.addEventListener('resize', () => chart.resize());
}

/* ── Slide 5: Competitors ── */
function renderCompetitors() {
  const comps = DECK.competitors || [];
  const slide = document.getElementById('slide-competitors');
  const inner = el('div', 'slide-inner');

  const maxes = {
    dr: Math.max(...comps.map(c => c.dr || 0), 1),
    kw: Math.max(...comps.map(c => c.kw || 0), 1),
    traffic: Math.max(...comps.map(c => c.traffic || 0), 1),
    reviews: Math.max(...comps.map(c => c.reviews || 0), 1),
    links: Math.max(...comps.map(c => c.links || 0), 1),
  };

  const rows = comps.map(c => {
    const isYou = c.you === true;
    const isLeader = c.leader === true;
    const rowCls = isYou ? 'row-you' : isLeader ? 'row-leader' : '';
    const badge = isYou
      ? '<span class="cbadge cbadge-you">YOU</span>'
      : isLeader ? '<span class="cbadge cbadge-leader">★ LEADER</span>' : '';
    const barCell = (val, max, field) => `
      <td class="bar-td">
        <div class="bar-bg" data-w="${Math.round((val / max) * 100)}"></div>
        <div class="bar-val">${fmt(val)}</div>
      </td>`;
    return `<tr class="${rowCls}">
      <td><div class="comp-name-cell">${c.name || ''}${badge}</div></td>
      ${barCell(c.dr || 0, maxes.dr, 'dr')}
      ${barCell(c.kw || 0, maxes.kw, 'kw')}
      ${barCell(c.traffic || 0, maxes.traffic, 'traffic')}
      ${barCell(c.reviews || 0, maxes.reviews, 'reviews')}
      ${barCell(c.links || 0, maxes.links, 'links')}
    </tr>`;
  }).join('');

  inner.innerHTML = `
    <div class="slide-label">The Competitive Landscape</div>
    <h2 class="slide-title">Where You Stand</h2>
    <div class="comp-wrap">
      <table class="comp-table">
        <thead>
          <tr>
            <th>Competitor</th>
            <th class="num">DR</th>
            <th class="num">Keywords</th>
            <th class="num">Traffic/mo</th>
            <th class="num">Reviews</th>
            <th class="num">Backlinks</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
  slide.appendChild(inner);
}

/* ── Slide 6: Projection ── */
function renderProjection() {
  const proj = DECK.projection || {};
  const revenue = (proj.searchVolume || 0) * (proj.ctr || 0.05) * (proj.convRate || 0.25) * (proj.aov || 0);
  const slide = document.getElementById('slide-projection');
  const inner = el('div', 'slide-inner');

  inner.innerHTML = `
    <div class="slide-label">Revenue Opportunity</div>
    <div class="proj-layout">
      <div class="proj-left">
        <div>
          <div class="rev-label">Maximum addressable revenue</div>
          <div class="rev-num" id="rev-counter">$0</div>
          <div class="rev-sub">per year, at full market capture</div>
        </div>
        <div class="proj-metrics">
          <div class="proj-metric">
            <div class="pm-label">Monthly Searches</div>
            <div class="pm-val accent">${fmt(proj.searchVolume)}</div>
          </div>
          <div class="proj-metric">
            <div class="pm-label">Click-Through Rate</div>
            <div class="pm-val">${((proj.ctr || 0.05) * 100).toFixed(0)}%</div>
          </div>
          <div class="proj-metric">
            <div class="pm-label">Conversion Rate</div>
            <div class="pm-val">${((proj.convRate || 0.25) * 100).toFixed(0)}%</div>
          </div>
          <div class="proj-metric">
            <div class="pm-label">Avg Job Value</div>
            <div class="pm-val accent">${fmtMoney(proj.aov)}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="slide-label" style="margin-bottom:0.5rem;">Leads per month (12-month ramp)</div>
        <div id="chart-ramp"></div>
      </div>
    </div>
  `;
  slide.appendChild(inner);
  slide.dataset.revenue = revenue;
}

function initProjectionChart() {
  const ramp = DECK.ramp || [];
  const chartEl = document.getElementById('chart-ramp');
  if (!chartEl || !window.echarts) return;

  const chart = echarts.init(chartEl, null, { renderer: 'canvas' });
  chart.setOption({
    backgroundColor: 'transparent',
    grid: { left: '8%', right: '5%', top: '10%', bottom: '18%' },
    xAxis: {
      type: 'category',
      data: ramp.map((_, i) => `Mo ${i + 1}`),
      axisLine: { lineStyle: { color: '#1e2130' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e2130' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      name: 'Leads',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
    },
    series: [{
      type: 'line',
      data: ramp,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: brand, width: 2.5 },
      itemStyle: { color: brand },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: brand + 'aa' },
          { offset: 1, color: brand + '00' },
        ]),
      },
      animationDuration: 1800,
      animationEasing: 'cubicInOut',
    }],
  });
  window.addEventListener('resize', () => chart.resize());
}

function animateRevCounter(target) {
  const el = document.getElementById('rev-counter');
  if (!el) return;
  const duration = 1800;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmtMoney(Math.round(target * eased * 12));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Slide 7: Timeline ── */
function renderTimeline() {
  const timeline = DECK.timeline || [];
  const budget = DECK.budget || {};
  const slide = document.getElementById('slide-timeline');
  const inner = el('div', 'slide-inner');

  const cards = timeline.map(phase => `
    <div class="tl-card">
      <div class="tl-dot">${phase.month}</div>
      <div class="tl-title">${phase.title || ''}</div>
      <ul class="tl-items">
        ${(phase.items || []).map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  inner.innerHTML = `
    <div class="slide-label">The Game Plan</div>
    <h2 class="slide-title" style="margin-bottom:1.5rem;">Your 4-Month Sprint</h2>
    <div class="tl-layout">
      <div class="tl-cards">${cards}</div>
      <div class="budget-row">
        <div>
          <div class="budget-label">Monthly Investment</div>
          <div class="budget-amount">${budget.monthly || '$2,500'}</div>
        </div>
        <div class="budget-sprint">${budget.sprintLabel || '4-month sprint · evaluate, then continue'}</div>
      </div>
    </div>
  `;
  slide.appendChild(inner);
}

/* ══════════════════════════════════════
   ANIMATION TRIGGERS (on slide entry)
══════════════════════════════════════ */
const animated = new Set();

function triggerSlideAnimations(idx) {
  if (animated.has(idx)) {
    if (idx === 5) refireProjection();
    return;
  }
  animated.add(idx);

  switch (idx) {
    case 0: animateCover(); break;
    case 1: animateIssues(); break;
    case 2: animateGeo(); break;
    case 3: initClustersChart(); break;
    case 4: animateCompBars(); break;
    case 5: initProjectionChart(); fireRevCounter(); break;
    case 6: animateTimeline(); break;
  }
}

function animateCover() {
  requestAnimationFrame(() => {
    document.querySelector('.cover-crest')?.classList.add('in');
    setTimeout(() => document.querySelector('.cover-title')?.classList.add('in'), 200);
    setTimeout(() => document.querySelector('.cover-lede')?.classList.add('in'), 440);
    setTimeout(() => document.querySelector('.cover-footer')?.classList.add('in'), 700);
  });
}

function animateIssues() {
  document.querySelectorAll('.issue-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('in'), 150 + i * 110);
  });
}

function animateGeo() {
  document.querySelectorAll('.city-dot').forEach((dot, i) => {
    setTimeout(() => dot.classList.add('in'), 300 + i * 130);
  });
  setTimeout(() => {
    document.querySelectorAll('.geo-bar').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  }, 600);
}

function animateCompBars() {
  setTimeout(() => {
    document.querySelectorAll('.bar-bg').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  }, 250);
}

function fireRevCounter() {
  const slide = document.getElementById('slide-projection');
  const target = parseFloat(slide?.dataset.revenue || 0);
  setTimeout(() => animateRevCounter(target), 400);
}

function refireProjection() {
  fireRevCounter();
}

function animateTimeline() {
  document.querySelectorAll('.tl-card').forEach((card, i) => {
    setTimeout(() => card.classList.add('in'), 200 + i * 130);
  });
}

/* ══════════════════════════════════════
   INIT — render all slides, show first
══════════════════════════════════════ */
renderCover();
renderIssues();
renderGeo();
renderClusters();
renderCompetitors();
renderProjection();
renderTimeline();

slideEls[0].classList.add('active');
updateNav();
triggerSlideAnimations(0);

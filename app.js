/* ============================================================
   LEDGER — app shell, router, and screen renderers
   Vanilla JS SPA. Hash-based routing so every screen is a real,
   shareable/deep-linkable URL (Challenge 04).
   ============================================================ */

const STATE = {
  userId: 'u_maria',
  navStack: [],       // breadcrumb / "where you came from" trail (Challenge 04)
  activeThreadId: null,
  visibilityDraft: 'external',
};

function currentUser() { return DB.getUser(STATE.userId); }

// ---------- formatting helpers ----------
function money(n) {
  const neg = n < 0;
  const v = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? '−$' : '$') + v;
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function esc(s) { return (s ?? '').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function statusValClass(status) {
  return { 'ai-extracted': 'val-ai-extracted', 'verified': 'val-verified', 'needs-review': 'val-needs-review', 'locked': 'val-locked' }[status] || 'val-ai-extracted';
}
function statusIcon(status) {
  return { 'ai-extracted': '✦', 'verified': '✓', 'needs-review': '!', 'locked': '🔒' }[status] || '✦';
}
function valueBadge(field, opts = {}) {
  const cls = statusValClass(field.status);
  const editableCls = field.editable ? 'is-editable' : 'is-static';
  const icon = statusIcon(field.status);
  const clickAttr = field.editable ? `onclick="event.stopPropagation(); openFieldEditor('${field.id}')"` : '';
  return `<span class="val ${cls} ${editableCls}" ${clickAttr} title="${esc(fieldStatusLabel(field.status))}${field.editable ? ' — click to edit' : ''}">
    <span class="val-dot"></span><span class="mono">${money(field.value)}</span> <span style="opacity:.65;font-size:11px">${icon}</span>
  </span>`;
}
function fieldStatusLabel(s) {
  return { 'ai-extracted': 'AI-extracted — not yet verified', 'verified': 'Verified by a preparer', 'needs-review': 'Needs review', 'locked': 'Locked — carried forward, cannot be edited' }[s] || s;
}
function pill(stage) {
  return `<span class="pill pill-${stage}">${esc(DB.stageLabels[stage])}</span>`;
}
function urgencyDot(u) { return `<span class="dot-flag dot-${u}"></span>`; }

// ---------- routing ----------
function go(hash, opts = {}) {
  if (!opts.silent) {
    STATE.navStack.push(location.hash || '#/dashboard');
    if (STATE.navStack.length > 25) STATE.navStack.shift();
  }
  location.hash = hash;
}
function goBack() {
  const prev = STATE.navStack.pop();
  if (prev) location.hash = prev;
  else location.hash = '#/dashboard';
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/dashboard';
  render();
});

function parseRoute() {
  const raw = (location.hash || '#/dashboard').replace(/^#/, '');
  const parts = raw.split('/').filter(Boolean);
  return parts;
}

function render() {
  const parts = parseRoute();
  document.getElementById('app').innerHTML = shellHTML(parts);
  wireGlobalControls();
  const content = document.getElementById('content');
  content.innerHTML = routeHTML(parts);
  afterRouteRender(parts);
  window.scrollTo(0, 0);
}

// ---------- shell (sidebar + topbar) ----------
function navItemsForRole(role) {
  const common = [
    { hash: '#/dashboard', label: 'Dashboard', icon: '◆' },
  ];
  if (role === 'client') {
    return [
      ...common,
      { hash: '#/returns', label: 'My Return', icon: '▤' },
      { hash: '#/documents', label: 'Documents', icon: '▥' },
      { hash: '#/messages', label: 'Messages', icon: '✉' },
    ];
  }
  return [
    ...common,
    { hash: '#/returns', label: 'Returns', icon: '▤', badge: DB.returns.length },
    { hash: '#/documents', label: 'Documents', icon: '▥', badge: DB.documents.length },
    { hash: '#/messages', label: 'Messages', icon: '✉' },
  ];
}
const alwaysNav = [
  { hash: '#/onboarding', label: 'First-Time Client Demo', icon: '✳' },
  { hash: '#/roles', label: 'Role Architecture', icon: '⬡' },
  { hash: '#/ai-model', label: 'How AI Works Here', icon: '✦' },
];

function shellHTML(parts) {
  const user = currentUser();
  const items = navItemsForRole(user.role);
  const activeHash = '#/' + parts.join('/');
  const navLink = (it) => `
    <a class="nav-item ${activeHash.startsWith(it.hash) ? 'active' : ''}" href="${it.hash}">
      <span class="icon">${it.icon}</span><span>${it.label}</span>
      ${it.badge ? `<span class="nav-badge mono">${it.badge}</span>` : ''}
    </a>`;

  return `
    <div class="sidebar">
      <div class="brand"><span>Ledger</span><span class="dot">·tax</span></div>
      <div class="role-switcher">
        <div class="who">
          <div class="avatar">${user.initials}</div>
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#fff">${esc(user.name)}</div>
            <div style="font-size:11px;color:#9AA5BC">${esc(DB.roleLabels[user.role])}</div>
          </div>
        </div>
        <select id="roleSelect" onchange="switchUser(this.value)">
          ${DB.users.map(u => `<option value="${u.id}" ${u.id === user.id ? 'selected' : ''}>${esc(u.name)} — ${esc(DB.roleLabels[u.role])}</option>`).join('')}
        </select>
      </div>
      <nav>
        <div class="nav-section-label">Workspace</div>
        ${items.map(navLink).join('')}
        <div class="nav-section-label">Reference</div>
        ${alwaysNav.map(navLink).join('')}
      </nav>
    </div>
    <div class="main">
      <div class="topbar">
        <button class="back-btn" onclick="goBack()" title="Go back to where you were">← Back</button>
        <div class="breadcrumbs" id="breadcrumbs">${breadcrumbHTML(parts)}</div>
        <input class="global-search" id="globalSearch" type="text" placeholder="Search documents, tasks, clients…" onkeydown="if(event.key==='Enter') runGlobalSearch(this.value)">
      </div>
      <div class="content" id="content"></div>
    </div>
  `;
}

function wireGlobalControls() {}

function switchUser(id) {
  STATE.userId = id;
  go('#/dashboard');
}
function viewAsOnRoles(id) {
  STATE.userId = id;
  render(); // stay on the roles page, just re-render shell + content with the new identity
}

function runGlobalSearch(q) {
  if (!q.trim()) return;
  go('#/documents/search/' + encodeURIComponent(q));
}

// ---------- breadcrumbs (Challenge 04) ----------
function breadcrumbHTML(parts) {
  const crumbs = [{ label: 'Home', hash: '#/dashboard' }];
  if (parts[0] === 'returns' && parts[1]) {
    const r = DB.getReturn(parts[1]);
    crumbs.push({ label: 'Returns', hash: '#/returns' });
    crumbs.push({ label: r ? r.clientName + ' · ' + r.taxYear : parts[1], hash: `#/returns/${parts[1]}` });
    if (parts[2]) {
      const tabLabels = { trace: 'Traceability', messages: 'Messages', ai: 'AI Insights', documents: 'Documents' };
      crumbs.push({ label: tabLabels[parts[2]] || parts[2], hash: null });
    }
  } else if (parts[0] === 'returns') {
    crumbs.push({ label: 'Returns', hash: null });
  } else if (parts[0] === 'documents') {
    crumbs.push({ label: 'Documents', hash: null });
    if (parts[1] === 'search') crumbs.push({ label: `Search: "${decodeURIComponent(parts[2] || '')}"`, hash: null });
  } else if (parts[0] === 'messages') {
    crumbs.push({ label: 'Messages', hash: null });
  } else if (parts[0] === 'task') {
    const t = DB.getTask(parts[1]);
    crumbs.push({ label: 'Task', hash: null });
    crumbs.push({ label: t ? t.title : parts[1], hash: null });
  } else if (parts[0] === 'onboarding') {
    crumbs.push({ label: 'First-Time Client Demo', hash: null });
  } else if (parts[0] === 'roles') {
    crumbs.push({ label: 'Role Architecture', hash: null });
  } else if (parts[0] === 'ai-model') {
    crumbs.push({ label: 'How AI Works Here', hash: null });
  } else if (parts[0] === 'dashboard' || parts.length === 0) {
    crumbs[0] = { label: 'Home', hash: null };
  }
  return crumbs.map((c, i) => `
    ${i > 0 ? '<span class="sep">/</span>' : ''}
    ${c.hash ? `<a class="crumb" href="${c.hash}">${esc(c.label)}</a>` : `<span class="crumb current">${esc(c.label)}</span>`}
  `).join('');
}

// ---------- router table ----------
function routeHTML(parts) {
  const user = currentUser();
  if (parts.length === 0 || parts[0] === 'dashboard') {
    return user.role === 'client' ? clientDashboard(user) : preparerDashboard(user);
  }
  if (parts[0] === 'onboarding') return onboardingPage();
  if (parts[0] === 'roles') return rolesPage(user);
  if (parts[0] === 'ai-model') return aiModelPage();
  if (parts[0] === 'returns' && !parts[1]) return returnsListPage(user);
  if (parts[0] === 'returns' && parts[1]) return returnDetailPage(parts[1], parts[2] || 'overview');
  if (parts[0] === 'documents' && parts[1] === 'search') return documentsPage(user, decodeURIComponent(parts[2] || ''));
  if (parts[0] === 'documents') return documentsPage(user, '');
  if (parts[0] === 'messages') return globalMessagesPage(user);
  if (parts[0] === 'task') return taskDetailPage(parts[1]);
  return `<div class="empty-state">Page not found. <a href="#/dashboard">Go home</a></div>`;
}

function afterRouteRender(parts) {
  if (parts[0] === 'returns' && parts[1] && parts[2] === 'trace') {
    const fields = DB.fieldsForReturn(parts[1]);
    if (fields[0]) selectField(fields[0].id, true);
  }
  if (parts[0] === 'returns' && parts[1] && parts[2] === 'messages') {
    const threads = DB.threadsForReturn(parts[1]);
    if (threads[0]) selectThread(threads[0].id, true);
  }
}

/* ============================================================
   DASHBOARDS  (Challenge 07 — Actionable Dashboard, Challenge 06 — Status)
   ============================================================ */

function clientDashboard(user) {
  const myReturns = DB.returnsForClient(user.id);
  const primary = myReturns[0] || DB.returns[0];
  const tasks = DB.tasksForReturn(primary.id).filter(t => t.owner === user.id || t.owner === 'client');
  const threads = DB.threadsForReturn(primary.id);
  const docs = DB.docsForReturn(primary.id);

  return `
    <div class="page-title">Welcome back, ${esc(user.name.split(' ')[0])}</div>
    <p class="page-sub">Here's where your ${primary.taxYear} ${esc(primary.formType)} return stands right now.</p>

    <div class="card">
      <div class="card-row">
        <div>
          <span class="eyebrow">Return status</span>
          <div style="font-size:16px;font-weight:600;margin-top:2px">${esc(primary.clientName)} · ${primary.taxYear}</div>
        </div>
        ${pill(primary.stage)}
      </div>
      ${statusRail(primary.stage)}
      ${primary.blocking ? `<div class="helper-note" style="margin-top:10px">⚠ ${esc(primary.blocking)}. This is why the return can't move forward yet.</div>` : `<div class="helper-note" style="margin-top:10px">Nothing is blocking this return right now.</div>`}
      <div style="margin-top:12px"><a class="btn btn-primary" href="#/returns/${primary.id}">Open my return →</a></div>
    </div>

    <div class="card">
      <div class="card-title">What we need from you</div>
      <p class="page-sub" style="margin-bottom:10px">Everything below is waiting on you specifically — nothing else needs your attention today.</p>
      ${tasks.length === 0 ? `<div class="helper-note">You're all caught up. We'll reach out here the moment something needs your input.</div>` :
        tasks.map(t => `
        <div class="doc-row" style="cursor:pointer" onclick="go('#/task/${t.id}')">
          ${urgencyDot(t.urgency)}
          <div style="flex:1">
            <div style="font-weight:500">${esc(t.title)}</div>
            <div style="font-size:12px;color:var(--slate)">Due ${fmtDate(t.due)}</div>
          </div>
          <span class="btn btn-secondary btn-sm">Respond</span>
        </div>`).join('')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Recent documents</div>
        ${docs.slice(0, 4).map(d => `<div class="doc-row"><div class="doc-icon">${docInitials(d.type)}</div><div style="flex:1"><div>${esc(d.name)}</div><div style="font-size:12px;color:var(--slate)">${fmtDate(d.uploadedAt)}</div></div></div>`).join('')}
        <div style="margin-top:8px"><a class="btn btn-ghost btn-sm" href="#/returns/${primary.id}/documents">View all documents →</a></div>
      </div>
      <div class="card">
        <div class="card-title">Recent messages</div>
        ${threads.slice(0, 3).map(t => `<div class="doc-row" style="cursor:pointer" onclick="go('#/returns/${primary.id}/messages')"><div style="flex:1"><div style="font-weight:500">${esc(t.subject)}</div><div style="font-size:12px;color:var(--slate)">${esc(t.messages[t.messages.length - 1].text.slice(0, 70))}…</div></div></div>`).join('')}
        <div style="margin-top:8px"><a class="btn btn-ghost btn-sm" href="#/returns/${primary.id}/messages">Open messages →</a></div>
      </div>
    </div>
  `;
}

function docInitials(type) { return (type || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase(); }

function statusRail(currentStage) {
  const order = DB.stageOrder;
  const idx = order.indexOf(currentStage);
  return `<div class="status-rail">
    ${order.map((s, i) => `
      <div class="stage ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}">
        <div class="bubble">${i < idx ? '✓' : i + 1}</div>
        ${esc(DB.stageLabels[s])}
      </div>`).join('')}
  </div>`;
}

const URGENCY_RANK = { high: 0, medium: 1, low: 2 };

function preparerDashboard(user) {
  STATE.dashFilter = STATE.dashFilter || 'mine';
  const mineReturns = DB.returns.filter(r => r.preparerId === user.id || r.reviewerId === user.id);
  const pool = STATE.dashFilter === 'mine' ? mineReturns : DB.returns;

  const highUrgency = pool.filter(r => r.urgency === 'high').length;
  const clientAction = pool.filter(r => r.stage === 'client_action').length;
  const inReview = pool.filter(r => r.stage === 'in_review').length;
  const readyToFile = pool.filter(r => r.stage === 'ready_to_file').length;

  let filtered = pool;
  if (STATE.dashSubFilter === 'high') filtered = filtered.filter(r => r.urgency === 'high');
  if (STATE.dashSubFilter === 'review') filtered = filtered.filter(r => r.stage === 'in_review');
  if (STATE.dashSubFilter === 'client') filtered = filtered.filter(r => r.stage === 'client_action');
  const q = (STATE.dashQuery || '').toLowerCase();
  if (q) filtered = filtered.filter(r => r.clientName.toLowerCase().includes(q));

  filtered = [...filtered].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || (b.openQuestions - a.openQuestions));
  const shown = filtered.slice(0, 30);

  const myTasks = DB.tasks.filter(t => t.owner === user.id).sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);

  return `
    <div class="page-title">What should I work on right now?</div>
    <p class="page-sub">${esc(user.name)} · ${esc(DB.roleLabels[user.role])} — ${pool.length} returns in view, ranked by urgency and what's blocking them.</p>

    <div class="kpi-row">
      <div class="kpi"><div class="num">${highUrgency}</div><div class="label">High urgency</div></div>
      <div class="kpi"><div class="num">${clientAction}</div><div class="label">Waiting on client</div></div>
      <div class="kpi"><div class="num">${inReview}</div><div class="label">In review</div></div>
      <div class="kpi"><div class="num">${readyToFile}</div><div class="label">Ready to file</div></div>
    </div>

    ${myTasks.length ? `<div class="card">
      <div class="card-title">Your open action items (${myTasks.length})</div>
      ${myTasks.slice(0, 5).map(t => `
        <div class="doc-row" style="cursor:pointer" onclick="go('#/task/${t.id}')">
          ${urgencyDot(t.urgency)}
          <div style="flex:1"><div style="font-weight:500">${esc(t.title)}</div>
          <div style="font-size:12px;color:var(--slate)">${esc(DB.getReturn(t.returnId)?.clientName || '')} · due ${fmtDate(t.due)}</div></div>
          <span class="btn btn-secondary btn-sm">Open →</span>
        </div>`).join('')}
    </div>` : ''}

    <div class="card">
      <div class="card-row" style="margin-bottom:10px">
        <div class="card-title" style="margin:0">Return queue</div>
        <input class="global-search" style="width:200px" placeholder="Filter by client name…" value="${esc(STATE.dashQuery || '')}" oninput="STATE.dashQuery=this.value; rerenderContent()">
      </div>
      <div class="filter-bar">
        <button class="chip-filter ${STATE.dashFilter === 'mine' ? 'active' : ''}" onclick="STATE.dashFilter='mine'; rerenderContent()">My queue (${mineReturns.length})</button>
        <button class="chip-filter ${STATE.dashFilter === 'all' ? 'active' : ''}" onclick="STATE.dashFilter='all'; rerenderContent()">Firm-wide (${DB.returns.length})</button>
        <span style="width:1px;height:18px;background:var(--line-strong)"></span>
        <button class="chip-filter ${STATE.dashSubFilter === 'high' ? 'active' : ''}" onclick="STATE.dashSubFilter = STATE.dashSubFilter==='high'?null:'high'; rerenderContent()">High urgency</button>
        <button class="chip-filter ${STATE.dashSubFilter === 'review' ? 'active' : ''}" onclick="STATE.dashSubFilter = STATE.dashSubFilter==='review'?null:'review'; rerenderContent()">In review</button>
        <button class="chip-filter ${STATE.dashSubFilter === 'client' ? 'active' : ''}" onclick="STATE.dashSubFilter = STATE.dashSubFilter==='client'?null:'client'; rerenderContent()">Client action</button>
      </div>
      <div class="results-count">Showing ${shown.length} of ${filtered.length} matching returns${filtered.length > 30 ? ' (top 30 by priority)' : ''}.</div>
      <table>
        <thead><tr><th>Client</th><th>Form</th><th>Stage</th><th>Owner</th><th>Urgency</th><th>Updated</th></tr></thead>
        <tbody>
          ${shown.map(r => `
            <tr class="row-link" onclick="go('#/returns/${r.id}')">
              <td>${esc(r.clientName)}</td>
              <td class="mono" style="font-size:12px">${esc(r.formType)}</td>
              <td>${pill(r.stage)}</td>
              <td style="font-size:12.5px">${esc(r.ownerLabel || '—')}</td>
              <td>${urgencyDot(r.urgency)} <span class="urgency-${r.urgency}">${r.urgency}</span></td>
              <td class="mono" style="font-size:12px">${fmtDate(r.updatedAt)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function rerenderContent() {
  document.getElementById('content').innerHTML = routeHTML(parseRoute());
  afterRouteRender(parseRoute());
}

/* ============================================================
   RETURNS LIST  (role-aware — Challenge 05)
   ============================================================ */

function returnsListPage(user) {
  const list = user.role === 'client' ? DB.returnsForClient(user.id) : DB.returns;
  return `
    <div class="page-title">${user.role === 'client' ? 'My Returns' : 'All Returns'}</div>
    <p class="page-sub">${list.length} return${list.length === 1 ? '' : 's'}${user.role === 'client' ? '' : ' across the firm'}.</p>
    <div class="card">
      <table>
        <thead><tr><th>Client</th><th>Year</th><th>Form</th><th>Stage</th><th>Owner</th><th>Urgency</th></tr></thead>
        <tbody>
          ${list.map(r => `
            <tr class="row-link" onclick="go('#/returns/${r.id}')">
              <td>${esc(r.clientName)}</td>
              <td class="mono">${r.taxYear}</td>
              <td class="mono" style="font-size:12px">${esc(r.formType)}</td>
              <td>${pill(r.stage)}</td>
              <td style="font-size:12.5px">${esc(r.ownerLabel || '—')}</td>
              <td>${urgencyDot(r.urgency)} ${r.urgency}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   RETURN DETAIL — tabs: overview / documents / trace / messages / ai
   (Challenges 01, 02, 04, 06, 08, 10 all converge here)
   ============================================================ */

function returnTabs(id, active) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: 'Documents' },
    { key: 'trace', label: 'Traceability' },
    { key: 'messages', label: 'Messages' },
    { key: 'ai', label: 'AI Insights' },
  ];
  return `<div style="display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:18px">
    ${tabs.map(t => `<a href="#/returns/${id}/${t.key === 'overview' ? '' : t.key}" style="padding:9px 14px;font-size:13.5px;font-weight:${active === t.key ? '600' : '500'};color:${active === t.key ? 'var(--accent)' : 'var(--slate)'};border-bottom:2px solid ${active === t.key ? 'var(--accent)' : 'transparent'};margin-bottom:-1px">${t.label}</a>`).join('')}
  </div>`;
}

function linkedObjectsPanel(returnId, opts = {}) {
  const docs = DB.docsForReturn(returnId).slice(0, 4);
  const tasks = DB.tasksForReturn(returnId).filter(t => t.status === 'open');
  const threads = DB.threadsForReturn(returnId);
  return `
    <div class="card-title" style="font-size:13px;color:var(--slate);text-transform:uppercase;letter-spacing:.04em">Connected to this return</div>
    <div class="linked-objects">
      ${docs.map(d => `<a class="linked-chip" href="#/returns/${returnId}/documents">▥ ${esc(d.name.length > 28 ? d.name.slice(0, 28) + '…' : d.name)}</a>`).join('')}
      ${tasks.map(t => `<a class="linked-chip" href="#/task/${t.id}">${urgencyDot(t.urgency)} ${esc(t.title.length > 30 ? t.title.slice(0, 30) + '…' : t.title)}</a>`).join('')}
      ${threads.map(t => `<a class="linked-chip" href="#/returns/${returnId}/messages">✉ ${esc(t.subject.length > 30 ? t.subject.slice(0, 30) + '…' : t.subject)}</a>`).join('')}
    </div>
  `;
}

function returnDetailPage(id, tab) {
  const r = DB.getReturn(id);
  if (!r) return `<div class="empty-state">Return not found.</div>`;
  if (tab === 'documents') return returnDocumentsTab(r);
  if (tab === 'trace') return returnTraceTab(r);
  if (tab === 'messages') return returnMessagesTab(r);
  if (tab === 'ai') return returnAiTab(r);
  return returnOverviewTab(r);
}

function returnOverviewTab(r) {
  return `
    <div class="page-title">${esc(r.clientName)} — ${r.taxYear} ${esc(r.formType)}</div>
    <p class="page-sub">Preparer: ${esc(DB.getUser(r.preparerId)?.name || '—')} · Reviewer: ${esc(DB.getUser(r.reviewerId)?.name || '—')}${r.isStaffPersonalReturn ? ' · <strong>Staff personal return</strong> — cross-assigned to avoid self-review' : ''}</p>
    ${returnTabs(r.id, 'overview')}
    <div class="card">
      <div class="card-row">
        <div><span class="eyebrow">Current stage</span></div>
        ${pill(r.stage)}
      </div>
      ${statusRail(r.stage)}
      ${r.blocking ? `<div class="helper-note" style="margin-top:10px">⚠ Blocked: ${esc(r.blocking)} — owned by ${esc(r.ownerLabel)}.</div>` : `<div class="helper-note" style="margin-top:10px">Nothing is currently blocking this return.</div>`}
    </div>
    <div class="card">${linkedObjectsPanel(r.id)}</div>
    <div class="card">
      <div class="card-title">History</div>
      ${(r.history || []).map(h => `<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);font-size:13px"><span class="mono" style="color:var(--slate);width:90px;flex-shrink:0">${fmtDate(h.at)}</span><span>${esc(h.label)}</span></div>`).join('') || '<div class="empty-state">No history yet.</div>'}
    </div>
  `;
}

function returnDocumentsTab(r) {
  const docs = DB.docsForReturn(r.id);
  return `
    <div class="page-title">${esc(r.clientName)} — Documents</div>
    ${returnTabs(r.id, 'documents')}
    <div class="card">
      <div class="results-count">${docs.length} source document${docs.length === 1 ? '' : 's'} on file for this return.</div>
      ${docs.map(d => {
        const linkedFields = DB.fields.filter(f => f.documentId === d.id);
        return `
        <div class="doc-row" style="cursor:${linkedFields.length ? 'pointer' : 'default'}" ${linkedFields.length ? `onclick="go('#/returns/${r.id}/trace')"` : ''}>

          <div class="doc-icon">${docInitials(d.type)}</div>
          <div style="flex:1">
            <div style="font-weight:500">${esc(d.name)}</div>
            <div style="font-size:12px;color:var(--slate)">${d.pages} page${d.pages === 1 ? '' : 's'} · uploaded ${fmtDate(d.uploadedAt)}</div>
          </div>
          ${linkedFields.length ? `<span class="btn btn-ghost btn-sm">Traced to ${linkedFields.length} field${linkedFields.length === 1 ? '' : 's'} →</span>` : `<span class="helper-note" style="padding:3px 8px">Not yet linked to a field</span>`}
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ---- Traceability tab (Challenge 01) ---- */

const HIGHLIGHT_MAP = {
  f_wages:        { top: '34%', left: '10%', width: '38%', height: '6%' },
  f_interest:     { top: '40%', left: '10%', width: '30%', height: '6%' },
  f_dividends_ord:{ top: '30%', left: '12%', width: '35%', height: '6%' },
  f_dividends_qual:{ top: '42%', left: '12%', width: '35%', height: '6%' },
  f_mortgage_int: { top: '26%', left: '10%', width: '40%', height: '6%' },
  f_charity:      { top: '55%', left: '10%', width: '45%', height: '30%' },
  f_ptc:          { top: '48%', left: '10%', width: '42%', height: '20%' },
  f_agi_prior:    { top: '20%', left: '10%', width: '30%', height: '6%' },
};

function returnTraceTab(r) {
  const fields = DB.fieldsForReturn(r.id);
  return `
    <div class="page-title">${esc(r.clientName)} — Traceability</div>
    <p class="page-sub">Every number on this return links back to the exact source document, page, and calculation that produced it.</p>
    ${returnTabs(r.id, 'trace')}
    <div class="legend card" style="padding:10px 16px;margin-bottom:14px">
      <strong style="font-size:12px;margin-right:4px">Legend:</strong>
      <span class="val val-ai-extracted is-static"><span class="val-dot"></span>AI-extracted</span>
      <span class="val val-verified is-static"><span class="val-dot"></span>Verified</span>
      <span class="val val-needs-review is-static"><span class="val-dot"></span>Needs review</span>
      <span class="val val-locked is-static"><span class="val-dot"></span>Locked</span>
      <span style="color:var(--slate)">— dashed border = editable, click to correct</span>
    </div>
    <div class="trace-layout">
      <div class="field-list" id="fieldList">
        ${fields.map(f => `
          <div class="field-item" id="fitem-${f.id}" onclick="selectField('${f.id}')">
            <div class="flabel">${esc(f.label)}</div>
            <div class="fvalue">${valueBadge(f)}</div>
          </div>`).join('')}
      </div>
      <div id="docViewer"></div>
    </div>
  `;
}

function selectField(fieldId, silent) {
  const f = DB.getField(fieldId);
  if (!f) return;
  document.querySelectorAll('.field-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('fitem-' + fieldId);
  if (item) item.classList.add('active');
  const doc = DB.getDocument(f.documentId);
  const hl = HIGHLIGHT_MAP[fieldId] || { top: '30%', left: '10%', width: '40%', height: '8%' };
  const viewer = document.getElementById('docViewer');
  if (!viewer) return;
  viewer.innerHTML = `
    <div class="doc-viewer">
      <div class="card-row" style="margin-bottom:12px">
        <div>
          <div style="font-weight:600">${esc(doc.name)}</div>
          <div style="font-size:12px;color:var(--slate)">Page ${f.page} of ${doc.pages} · ${esc(f.section)}</div>
        </div>
        ${valueBadge(f)}
      </div>
      <div class="doc-page">
        <div style="font-size:10px;color:#999;letter-spacing:.05em;text-transform:uppercase">${esc(doc.type)} · facsimile</div>
        <div style="margin-top:30px;color:#555">Sample document content, positioned to roughly match a real ${esc(doc.type)} layout.</div>
        <div class="highlight-box" style="top:${hl.top};left:${hl.left};width:${hl.width};height:${hl.height}"></div>
      </div>
      <div class="trace-chain">
        <span class="node">Return field</span><span class="arrow">→</span>
        <span class="node">${esc(doc.name)}</span><span class="arrow">→</span>
        <span class="node">Page ${f.page}, ${esc(f.section)}</span><span class="arrow">→</span>
        <span class="node">${esc(f.transformation)}</span>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        ${f.editable ? `<button class="btn btn-secondary btn-sm" onclick="openFieldEditor('${f.id}')">Correct this value</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="go('#/returns/${r_id(f.returnId)}/documents')">View full document →</button>
      </div>
    </div>
  `;
  if (!silent) {}
}
function r_id(id) { return id; }

function openFieldEditor(fieldId) {
  const f = DB.getField(fieldId);
  if (!f) return;
  const val = prompt(`Correct value for "${f.label}" (currently ${money(f.value)}). This simulates a real inline correction:`, f.value);
  if (val === null) return;
  const num = parseFloat(val.replace(/[^0-9.\-]/g, ''));
  if (!isNaN(num)) {
    f.value = num;
    f.status = 'verified';
    rerenderContent();
    selectField(fieldId);
  }
}

/* ---- Messages tab (Challenge 02) ---- */

function returnMessagesTab(r) {
  const threads = DB.threadsForReturn(r.id);
  STATE.activeThreadId = STATE.activeThreadId && threads.find(t => t.id === STATE.activeThreadId) ? STATE.activeThreadId : (threads[0] && threads[0].id);
  return `
    <div class="page-title">${esc(r.clientName)} — Messages</div>
    ${returnTabs(r.id, 'messages')}
    <div class="trace-layout">
      <div class="thread-list" id="threadList">
        ${threads.map(t => `
          <div class="thread-item" id="thitem-${t.id}" onclick="selectThread('${t.id}')">
            <div style="font-weight:600;font-size:13px">${esc(t.subject)}</div>
            <div style="font-size:12px;color:var(--slate);margin-top:2px">${esc(t.messages[t.messages.length - 1].text.slice(0, 60))}…</div>
          </div>`).join('') || '<div class="empty-state">No message threads yet.</div>'}
      </div>
      <div id="threadView"></div>
    </div>
  `;
}

function selectThread(threadId, silent) {
  const t = DB.getThread(threadId);
  if (!t) return;
  STATE.activeThreadId = threadId;
  document.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('thitem-' + threadId);
  if (item) item.classList.add('active');
  const view = document.getElementById('threadView');
  if (!view) return;
  const user = currentUser();
  view.innerHTML = `
    <div class="doc-viewer">
      <div class="card-row" style="margin-bottom:6px">
        <div style="font-weight:600">${esc(t.subject)}</div>
      </div>
      <div class="linked-objects" style="margin-bottom:10px">
        ${t.linkedDocId ? `<a class="linked-chip" href="#/returns/${t.returnId}/documents">▥ ${esc(DB.getDocument(t.linkedDocId)?.name || '')}</a>` : ''}
        ${t.linkedTaskId ? `<a class="linked-chip" href="#/task/${t.linkedTaskId}">◆ Related task</a>` : ''}
        <a class="linked-chip" href="#/returns/${t.returnId}">▤ Return overview</a>
      </div>
      <div style="max-height:340px;overflow-y:auto;padding-right:4px">
        ${t.messages.map(m => `
          <div class="msg ${m.internal ? 'internal' : 'external'}">
            <div class="avatar" style="background:${m.internal ? '#B5721F' : '#2451B8'}">${DB.getUser(m.from)?.initials || '?'}</div>
            <div class="bubble-body">
              <div class="meta">${esc(DB.getUser(m.from)?.name || m.from)} · ${m.time}${m.internal ? '<span class="internal-tag">Internal note</span>' : ''}</div>
              <div class="text">${esc(m.text)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="composer">
        <input type="text" id="composerInput" placeholder="${user.role === 'client' ? 'Reply to your preparer…' : 'Write a message…'}">
        ${user.role !== 'client' ? `
        <div class="visibility-toggle">
          <button class="${STATE.visibilityDraft === 'internal' ? 'active-internal' : ''}" onclick="STATE.visibilityDraft='internal'; selectThread('${threadId}')">Internal</button>
          <button class="${STATE.visibilityDraft === 'external' ? 'active-external' : ''}" onclick="STATE.visibilityDraft='external'; selectThread('${threadId}')">Client-visible</button>
        </div>` : ''}
        <button class="btn btn-primary" onclick="sendMessage('${threadId}')">Send</button>
      </div>
    </div>
  `;
}

function sendMessage(threadId) {
  const input = document.getElementById('composerInput');
  if (!input || !input.value.trim()) return;
  const t = DB.getThread(threadId);
  const user = currentUser();
  const internal = user.role !== 'client' && STATE.visibilityDraft === 'internal';
  t.messages.push({ from: user.id, internal, time: 'Just now', text: input.value.trim() });
  selectThread(threadId);
}

/* ---- AI Insights tab (Challenge 10) ---- */

function returnAiTab(r) {
  const insights = DB.insightsForReturn(r.id);
  return `
    <div class="page-title">${esc(r.clientName)} — AI Insights</div>
    <p class="page-sub">What the AI flagged on this return, the evidence behind it, and what to do next.</p>
    ${returnTabs(r.id, 'ai')}
    ${insights.length === 0 ? `<div class="empty-state">No AI insights on this return yet.</div>` : insights.map(a => aiCard(a)).join('')}
    <div class="helper-note" style="margin-top:6px">Want the full model behind these cards? See <a href="#/ai-model" style="color:var(--accent);font-weight:600">How AI Works Here</a>.</div>
  `;
}

function aiCard(a) {
  const f = DB.getField(a.fieldId);
  return `
    <div class="ai-card type-${a.type}" id="aicard-${a.id}">
      <div class="ai-head">
        <span>${a.type === 'warning' ? '⚠' : '✦'}</span>
        <span>${esc(a.title)}</span>
      </div>
      <div style="font-size:13px;margin-bottom:8px">${esc(a.summary)}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:11.5px;color:var(--slate)">Confidence</span>
        <div class="confidence-bar"><span style="width:${Math.round(a.confidence * 100)}%"></span></div>
        <span class="mono" style="font-size:12px">${Math.round(a.confidence * 100)}%</span>
      </div>
      <div style="font-size:12px;color:var(--slate);font-weight:600;margin-top:8px">Evidence</div>
      <ul class="evidence-list">${a.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      <div style="font-size:12.5px;margin-top:8px"><strong>Suggested action:</strong> ${esc(a.suggestedAction)}</div>
      <div class="ai-actions">
        <button class="btn btn-primary btn-sm" onclick="approveInsight('${a.id}')">Approve</button>
        <button class="btn btn-secondary btn-sm" onclick="flagInsight('${a.id}')">Flag for discussion</button>
        ${f ? `<a class="btn btn-ghost btn-sm" href="#/returns/${a.returnId}/trace">See the field →</a>` : ''}
      </div>
    </div>
  `;
}

function approveInsight(id) {
  const el = document.getElementById('aicard-' + id);
  if (el) el.innerHTML = `<div style="font-size:13px;color:var(--verified)">✓ Approved — the underlying field has been marked verified.</div>`;
  const a = DB.aiInsights.find(x => x.id === id);
  const f = a && DB.getField(a.fieldId);
  if (f) f.status = 'verified';
}
function flagInsight(id) {
  const el = document.getElementById('aicard-' + id);
  if (el) el.insertAdjacentHTML('beforeend', `<div class="helper-note" style="margin-top:8px">🚩 Flagged — added to the review thread for discussion before filing.</div>`);
}

/* ============================================================
   DOCUMENTS  (Challenge 09 — complexity/scale, search & filter)
   ============================================================ */

function documentsPage(user, initialQuery) {
  STATE.docQuery = STATE.docQuery ?? initialQuery ?? '';
  STATE.docType = STATE.docType || 'all';
  STATE.docLimit = STATE.docLimit || 40;

  let pool = user.role === 'client' ? DB.documents.filter(d => DB.getReturn(d.returnId)?.clientId === user.id) : DB.documents;
  const types = ['all', ...Array.from(new Set(DB.documents.map(d => d.type)))];

  let filtered = pool;
  if (STATE.docType !== 'all') filtered = filtered.filter(d => d.type === STATE.docType);
  const q = STATE.docQuery.trim().toLowerCase();
  if (q) filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || (DB.getReturn(d.returnId)?.clientName || '').toLowerCase().includes(q));

  const shown = filtered.slice(0, STATE.docLimit);

  return `
    <div class="page-title">Documents</div>
    <p class="page-sub">${pool.length} document${pool.length === 1 ? '' : 's'} on file${user.role === 'client' ? ' for your returns' : ' across the firm'} — search and filter to get to any one of them in seconds.</p>
    <div class="card">
      <div class="filter-bar">
        <input class="global-search" style="width:260px" placeholder="Search by document or client name…" value="${esc(STATE.docQuery)}" oninput="STATE.docQuery=this.value; STATE.docLimit=40; rerenderContent()">
        ${types.map(t => `<button class="chip-filter ${STATE.docType === t ? 'active' : ''}" onclick="STATE.docType='${t}'; STATE.docLimit=40; rerenderContent()">${t === 'all' ? 'All types' : t}</button>`).join('')}
      </div>
      <div class="results-count">Showing ${shown.length} of ${filtered.length} matching document${filtered.length === 1 ? '' : 's'}.</div>
      ${shown.length === 0 ? `<div class="empty-state">No documents match that search. Try a different name or clear the type filter.</div>` : shown.map(d => {
        const ret = DB.getReturn(d.returnId);
        const linkedFields = DB.fields.filter(f => f.documentId === d.id);
        return `
        <div class="doc-row" style="cursor:pointer" onclick="go('#/returns/${d.returnId}${linkedFields.length ? '/trace' : '/documents'}')">
          <div class="doc-icon">${docInitials(d.type)}</div>
          <div style="flex:1">
            <div style="font-weight:500">${esc(d.name)}</div>
            <div style="font-size:12px;color:var(--slate)">${ret ? esc(ret.clientName) + ' · ' + ret.taxYear : ''} · uploaded ${fmtDate(d.uploadedAt)}</div>
          </div>
          ${linkedFields.length ? `<span class="btn btn-ghost btn-sm">${linkedFields.length} field${linkedFields.length === 1 ? '' : 's'} traced →</span>` : ''}
        </div>`;
      }).join('')}
      ${filtered.length > shown.length ? `<div style="text-align:center;margin-top:12px"><button class="btn btn-secondary btn-sm" onclick="STATE.docLimit+=40; rerenderContent()">Show more (${filtered.length - shown.length} remaining)</button></div>` : ''}
    </div>
  `;
}

/* ============================================================
   GLOBAL MESSAGES  (Challenge 02, firm-wide view)
   ============================================================ */

function globalMessagesPage(user) {
  const threads = user.role === 'client' ? DB.messageThreads.filter(t => t.participants.includes(user.id)) : DB.messageThreads;
  return `
    <div class="page-title">Messages</div>
    <p class="page-sub">Every conversation is tied to a return, and often to a specific document or task — nothing floats free.</p>
    <div class="card">
      ${threads.map(t => {
        const r = DB.getReturn(t.returnId);
        const last = t.messages[t.messages.length - 1];
        return `
        <div class="doc-row" style="cursor:pointer" onclick="go('#/returns/${t.returnId}/messages')">
          <div class="avatar" style="background:var(--accent)">${DB.getUser(last.from)?.initials || '?'}</div>
          <div style="flex:1">
            <div style="font-weight:600">${esc(t.subject)} <span style="font-weight:400;color:var(--slate);font-size:12px">· ${esc(r?.clientName || '')}</span></div>
            <div style="font-size:12.5px;color:var(--slate)">${esc(last.text.slice(0, 80))}…</div>
          </div>
          ${last.internal ? `<span class="internal-tag">Internal</span>` : ''}
        </div>`;
      }).join('') || '<div class="empty-state">No message threads yet.</div>'}
    </div>
  `;
}

/* ============================================================
   TASK DETAIL  (Challenge 04 — preserved context across objects)
   ============================================================ */

function taskDetailPage(taskId) {
  const t = DB.getTask(taskId);
  if (!t) return `<div class="empty-state">Task not found.</div>`;
  const r = DB.getReturn(t.returnId);
  const doc = t.linkedDocId ? DB.getDocument(t.linkedDocId) : null;
  const thread = t.linkedMessageId ? DB.getThread(t.linkedMessageId) : null;
  return `
    <div class="page-title">${esc(t.title)}</div>
    <p class="page-sub">${urgencyDot(t.urgency)} <span class="urgency-${t.urgency}">${t.urgency} urgency</span> · due ${fmtDate(t.due)} · owned by ${esc(t.owner === 'client' ? 'Client' : (DB.getUser(t.owner)?.name || t.owner))}</p>
    <div class="card">
      <div class="card-title">This task connects to</div>
      <div class="linked-objects">
        ${r ? `<a class="linked-chip" href="#/returns/${r.id}">▤ ${esc(r.clientName)} — ${r.taxYear} return</a>` : ''}
        ${doc ? `<a class="linked-chip" href="#/returns/${r.id}/trace">▥ ${esc(doc.name)}</a>` : ''}
        ${thread ? `<a class="linked-chip" href="#/returns/${r.id}/messages">✉ ${esc(thread.subject)}</a>` : ''}
      </div>
      <p class="page-sub" style="margin-top:14px;margin-bottom:0">Opening any of the links above takes you straight there — and the Back button at the top always returns you to this task, not to a generic list.</p>
    </div>
    ${r ? `<div class="card">
      <div class="card-title">Return snapshot</div>
      <div class="card-row"><span>${esc(r.clientName)} · ${r.taxYear} ${esc(r.formType)}</span>${pill(r.stage)}</div>
    </div>` : ''}
  `;
}

/* ============================================================
   ONBOARDING — First-time client experience  (Challenge 03)
   ============================================================ */

function onboardingPage() {
  STATE.onboardStep = STATE.onboardStep ?? 0; // 0,1,2 = which steps are complete; 3 = fully done
  const steps = [
    { title: 'Upload your W-2 (and any 1099s you have)', detail: 'This is the only thing we need to start. Everything else can wait.' },
    { title: 'Answer 4 quick questions about your year', detail: 'Filing status, dependents, and anything that changed since last year.' },
    { title: "We'll assign your preparer", detail: "You'll be introduced and can message them directly from here." },
  ];
  const done = STATE.onboardStep;
  const fullyDone = done >= steps.length;

  return `
    <div class="page-title">First-Time Client Demo</div>
    <p class="page-sub">A fictional brand-new client, <strong>Alex Kim</strong>, logging in for the very first time — no history, no muscle memory. This screen is independent of the role switcher above.</p>

    <div class="card onboard-hero">
      <span class="eyebrow">Welcome</span>
      <h2 style="margin:6px 0">${fullyDone ? "You're all set, Alex" : 'Welcome, Alex — here\'s what happens next'}</h2>
      <p class="page-sub" style="margin-bottom:0">${fullyDone
        ? 'Onboarding is done. Your homepage now looks like a normal returning client\'s — see it below.'
        : 'One thing at a time. We\'ll only ask for what\'s relevant right now, and hide the rest until it matters.'}</p>
    </div>

    ${!fullyDone ? `
    <div class="card">
      ${steps.map((s, i) => `
        <div class="onboard-step">
          <div class="checkbox-circle ${i < done ? 'done' : ''}">${i < done ? '✓' : ''}</div>
          <div style="flex:1; ${i > done ? 'opacity:.45' : ''}">
            <div style="font-weight:600">${esc(s.title)}</div>
            <div style="font-size:12.5px;color:var(--slate);margin-top:2px">${esc(s.detail)}</div>
            ${i === done ? `<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="STATE.onboardStep++; rerenderContent()">Mark complete (simulate)</button>` : ''}
          </div>
        </div>`).join('')}
    </div>
    <div class="helper-note">Design note: only the current step is fully visible and actionable. Future steps are visible but muted — enough to set expectations without competing for attention. Nothing about firm billing, tax jargon, or account settings appears here; that's deferred until onboarding is done.</div>
    ` : `
    <div class="card">
      <div class="card-row"><span class="eyebrow">Return status</span>${pill('intake')}</div>
      ${statusRail('intake')}
      <p class="page-sub" style="margin-top:10px">Once onboarding finishes, the homepage becomes the same status-and-tasks view every returning client sees — compare it on the <a href="#/dashboard" style="color:var(--accent);font-weight:600">Dashboard</a> (switch the role selector to Maria Chen or Devon Brooks).</p>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="STATE.onboardStep=0; rerenderContent()">Reset demo</button>
    `}
  `;
}

/* ============================================================
   ROLE ARCHITECTURE  (Challenge 05)
   ============================================================ */

function rolesPage(user) {
  const descriptions = {
    client: { nav: 'Dashboard, My Return, Documents, Messages', sees: 'Only their own return(s). Internal firm notes are invisible.' },
    preparer: { nav: 'Dashboard, Returns, Documents, Messages', sees: 'Every return assigned to them, plus firm-wide search. Can see and write internal notes.' },
    reviewer: { nav: 'Dashboard, Returns, Documents, Messages', sees: 'Returns they\'re reviewing, with extra emphasis on flagged AI insights and open questions.' },
    admin: { nav: 'Dashboard, Returns, Documents, Messages', sees: 'All returns firm-wide, staffing and workload, independent of who prepared what.' },
    staff: { nav: 'Dashboard, Returns, Documents, Messages', sees: 'A lighter version of the preparer view, scoped to returns they\'ve been assigned this season.' },
  };
  return `
    <div class="page-title">One product, six roles</div>
    <p class="page-sub">The shell — sidebar, topbar, breadcrumbs — never changes. What changes is which nav items appear, whose data is visible, and how much internal detail shows through. Try switching the role selector in the sidebar to see it live.</p>
    <div class="grid-2">
      ${DB.users.map(u => `
        <div class="role-card ${u.id === user.id ? 'current' : ''}">
          <div class="card-row">
            <div style="display:flex;align-items:center;gap:8px"><div class="avatar">${u.initials}</div><div><div style="font-weight:600">${esc(u.name)}</div><div style="font-size:12px;color:var(--slate)">${esc(DB.roleLabels[u.role])}</div></div></div>
            ${u.id === user.id ? '<span class="badge-role">Viewing now</span>' : `<button class="btn btn-secondary btn-sm" onclick="viewAsOnRoles('${u.id}')">View as</button>`}
          </div>
          <div style="margin-top:10px;font-size:12.5px"><strong>Sees:</strong> ${descriptions[u.role].sees}</div>
          ${u.dualClientReturnId ? `<div class="helper-note" style="margin-top:8px">Dual role: Sam is a preparer, but also has a personal return (<a href="#/returns/${u.dualClientReturnId}" style="color:var(--accent);font-weight:600">open it</a>). It's cross-assigned to a different preparer/reviewer so Sam never reviews their own work — the system enforces this, not a policy document.</div>` : ''}
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">How multi-role switching works</div>
      <p class="page-sub" style="margin-bottom:0">Someone who is both firm staff and a personal client (like Sam) doesn't get two accounts — they get one identity with a clearly separated "my return" context, reachable the same way any client reaches theirs, so it can never be confused with the returns they prepare for others.</p>
    </div>
  `;
}

/* ============================================================
   HOW AI WORKS HERE  (Challenge 10, standalone explainer)
   ============================================================ */

function aiModelPage() {
  const example = DB.aiInsights[0];
  return `
    <div class="page-title">How AI works here</div>
    <p class="page-sub">The same model appears everywhere AI touches this product: extraction, recommendations, and warnings. It always answers five questions, in this order.</p>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">1. What did it do?</div>
        <p class="page-sub" style="margin-bottom:0">A short, plain-language title — never a raw log line.</p>
      </div>
      <div class="card">
        <div class="card-title">2. Why?</div>
        <p class="page-sub" style="margin-bottom:0">One or two sentences of summary, not a technical trace.</p>
      </div>
      <div class="card">
        <div class="card-title">3. What's the evidence?</div>
        <p class="page-sub" style="margin-bottom:0">A short bulleted list of the specific facts behind the call — always inspectable, never just "trust me."</p>
      </div>
      <div class="card">
        <div class="card-title">4. How sure is it?</div>
        <p class="page-sub" style="margin-bottom:0">A visible confidence bar. Confidence is never hidden behind a single "AI-generated" badge.</p>
      </div>
    </div>
    <div class="card">
      <div class="card-title">5. What should I do about it — and how do I correct it?</div>
      <p class="page-sub">Every insight ends in an action, never just a flag. Corrections happen inline, in the same place the value appears — never a separate "override" workflow.</p>
      ${aiCard(example)}
    </div>
    <div class="card">
      <div class="card-title">Why it stops short of full transparency</div>
      <p class="page-sub" style="margin-bottom:0">We deliberately don't show raw model output, token-level confidence, or internal prompts. Past a certain point, more detail stops building trust and starts building noise — three pieces of well-chosen evidence are more convincing than twelve.</p>
    </div>
  `;
}

/* ============================================================
   MOCK DATA LAYER — Ledger (case-study prototype)
   Everything here is hardcoded/fabricated per the assignment's
   "keep it quick and dirty" instructions. No real OCR, no real
   AI model, no real backend. See README for what's simulated.
   ============================================================ */

const DB = (() => {

  // ---------- USERS / ROLES ----------
  const users = [
    { id: 'u_maria',  name: 'Maria Chen',    role: 'client',   subtitle: 'Individual taxpayer',        initials: 'MC' },
    { id: 'u_devon',  name: 'Devon Brooks',  role: 'client',   subtitle: 'Business owner · Brooks Landscaping', initials: 'DB' },
    { id: 'u_sam',    name: 'Sam Rivera',    role: 'preparer', subtitle: 'CPA · Preparer',              initials: 'SR', dualClientReturnId: 'ret_1006' },
    { id: 'u_jill',   name: 'Jill Okafor',   role: 'reviewer', subtitle: 'Senior Reviewer / EA',        initials: 'JO' },
    { id: 'u_omar',   name: 'Omar Haddad',   role: 'admin',    subtitle: 'Firm Administrator',          initials: 'OH' },
    { id: 'u_tara',   name: 'Tara Lin',      role: 'staff',    subtitle: 'Seasonal Preparer',           initials: 'TL' },
  ];

  const roleLabels = {
    client: 'Client', preparer: 'Preparer', reviewer: 'Reviewer', admin: 'Firm Admin', staff: 'Seasonal Staff'
  };

  // ---------- DOCUMENTS (core, deeply-linked set for Return 1001) ----------
  const coreDocuments = [
    { id: 'doc_w2_acme', name: 'W-2 — Acme Robotics Inc.', type: 'W-2', pages: 1, uploadedBy: 'u_maria', uploadedAt: '2026-01-28', returnId: 'ret_1001' },
    { id: 'doc_1099int_chase', name: '1099-INT — Chase Bank', type: '1099-INT', pages: 1, uploadedBy: 'u_maria', uploadedAt: '2026-01-30', returnId: 'ret_1001' },
    { id: 'doc_1099div_schwab', name: '1099-DIV — Charles Schwab', type: '1099-DIV', pages: 2, uploadedBy: 'u_maria', uploadedAt: '2026-01-30', returnId: 'ret_1001' },
    { id: 'doc_1098_wells', name: '1098 — Mortgage Interest, Wells Fargo', type: '1098', pages: 1, uploadedBy: 'u_maria', uploadedAt: '2026-02-02', returnId: 'ret_1001' },
    { id: 'doc_receipts_charity', name: 'Charitable Donation Receipts (bundle)', type: 'Receipts', pages: 4, uploadedBy: 'u_maria', uploadedAt: '2026-02-04', returnId: 'ret_1001' },
    { id: 'doc_1095a', name: '1095-A — Marketplace Health Coverage', type: '1095-A', pages: 1, uploadedBy: 'u_maria', uploadedAt: '2026-02-05', returnId: 'ret_1001' },
    { id: 'doc_prior_return', name: '2025 Tax Return (prior year, PDF)', type: 'Prior Return', pages: 6, uploadedBy: 'u_sam', uploadedAt: '2026-01-20', returnId: 'ret_1001' },
  ];

  // ---------- FIELDS on Form 1040 for Return 1001, with full traceability ----------
  const fields = [
    {
      id: 'f_wages', label: 'Line 1a — Wages (Form 1040)', value: 118432.00,
      documentId: 'doc_w2_acme', page: 1, section: 'Box 1 — Wages, tips, other compensation',
      transformation: 'Copied directly from Box 1. No calculation applied.',
      confidence: 0.98, status: 'verified', editable: false, returnId: 'ret_1001'
    },
    {
      id: 'f_interest', label: 'Line 2b — Taxable interest', value: 812.44,
      documentId: 'doc_1099int_chase', page: 1, section: 'Box 1 — Interest income',
      transformation: 'Copied directly from Box 1.',
      confidence: 0.99, status: 'verified', editable: false, returnId: 'ret_1001'
    },
    {
      id: 'f_dividends_ord', label: 'Line 3b — Ordinary dividends', value: 2140.10,
      documentId: 'doc_1099div_schwab', page: 1, section: 'Box 1a — Total ordinary dividends',
      transformation: 'Copied directly from Box 1a.',
      confidence: 0.97, status: 'ai-extracted', editable: true, returnId: 'ret_1001'
    },
    {
      id: 'f_dividends_qual', label: 'Line 3a — Qualified dividends', value: 1980.00,
      documentId: 'doc_1099div_schwab', page: 1, section: 'Box 1b — Qualified dividends',
      transformation: 'Copied directly from Box 1b.',
      confidence: 0.97, status: 'ai-extracted', editable: true, returnId: 'ret_1001'
    },
    {
      id: 'f_mortgage_int', label: 'Schedule A — Home mortgage interest', value: 9875.00,
      documentId: 'doc_1098_wells', page: 1, section: 'Box 1 — Mortgage interest received',
      transformation: 'Copied from Box 1. Deduction limited by acquisition debt cap — not yet reviewed.',
      confidence: 0.91, status: 'needs-review', editable: true, returnId: 'ret_1001'
    },
    {
      id: 'f_charity', label: 'Schedule A — Cash charitable contributions', value: 3450.00,
      documentId: 'doc_receipts_charity', page: 3, section: 'Sum of 6 receipts, Jan–Nov 2025',
      transformation: 'AI summed 6 individual receipt amounts: $500 + $500 + $600 + $850 + $500 + $500.',
      confidence: 0.88, status: 'ai-extracted', editable: true, returnId: 'ret_1001'
    },
    {
      id: 'f_ptc', label: 'Form 8962 — Premium Tax Credit reconciliation', value: -640.00,
      documentId: 'doc_1095a', page: 1, section: 'Part III, Column C — Monthly premium tax credit',
      transformation: '12 monthly values summed, then reconciled against actual household income from Line 11.',
      confidence: 0.82, status: 'needs-review', editable: true, returnId: 'ret_1001'
    },
    {
      id: 'f_agi_prior', label: 'Prior-year AGI (for e-file signature verification)', value: 96110.00,
      documentId: 'doc_prior_return', page: 2, section: 'Form 1040, Line 11, 2025 return',
      transformation: 'Carried forward from prior-year filing, unchanged.',
      confidence: 1.0, status: 'locked', editable: false, returnId: 'ret_1001'
    },
  ];

  // ---------- RETURNS (small, deeply-modeled set) ----------
  const coreReturns = [
    {
      id: 'ret_1001', clientId: 'u_maria', clientName: 'Maria Chen', taxYear: 2025, formType: 'Form 1040',
      preparerId: 'u_sam', reviewerId: 'u_jill',
      stage: 'in_review', // intake -> in_prep -> in_review -> client_action -> ready_to_file -> filed
      owner: 'u_jill', ownerLabel: 'Jill (Reviewer)', blocking: 'Waiting on 2 open questions from Maria',
      openQuestions: 2, updatedAt: '2026-07-21', urgency: 'high',
      history: [
        { at: '2026-01-15', label: 'Return created, engagement letter signed' },
        { at: '2026-02-06', label: 'All source documents received' },
        { at: '2026-02-10', label: 'Preparer completed first pass' },
        { at: '2026-07-18', label: 'Sent to review — 2 items flagged' },
      ],
    },
    {
      id: 'ret_1002', clientId: 'u_devon', clientName: 'Devon Brooks', taxYear: 2025, formType: '1040 + Schedule C',
      preparerId: 'u_sam', reviewerId: 'u_jill',
      stage: 'client_action', owner: 'u_devon', ownerLabel: 'Devon (Client)', blocking: 'Missing Q4 mileage log',
      openQuestions: 1, updatedAt: '2026-07-20', urgency: 'medium',
      history: [
        { at: '2026-01-22', label: 'Return created' },
        { at: '2026-03-01', label: 'Business documents received' },
        { at: '2026-07-15', label: 'Preparer requested mileage log for Q4' },
      ],
    },
    {
      id: 'ret_1003', clientId: 'u_maria', clientName: 'Maria Chen (2024, amended)', taxYear: 2024, formType: '1040-X',
      preparerId: 'u_tara', reviewerId: 'u_jill',
      stage: 'filed', owner: null, ownerLabel: '—', blocking: null,
      openQuestions: 0, updatedAt: '2026-04-30', urgency: 'low',
      history: [{ at: '2026-04-30', label: 'Filed and accepted by IRS' }],
    },
    {
      id: 'ret_1006', clientId: 'u_sam', clientName: 'Sam Rivera (personal)', taxYear: 2025, formType: 'Form 1040',
      preparerId: 'u_jill', reviewerId: 'u_omar',
      stage: 'in_prep', owner: 'u_jill', ownerLabel: 'Jill (Preparer, cross-assigned)', blocking: null,
      openQuestions: 0, updatedAt: '2026-07-10', urgency: 'low', isStaffPersonalReturn: true,
      history: [{ at: '2026-07-01', label: 'Return created — assigned to a different preparer to avoid self-review' }],
    },
  ];

  const stageLabels = {
    intake: 'Intake', in_prep: 'In Preparation', in_review: 'In Review',
    client_action: 'Needs Your Input', ready_to_file: 'Ready to File', filed: 'Filed'
  };
  const stageOrder = ['intake', 'in_prep', 'in_review', 'client_action', 'ready_to_file', 'filed'];

  // ---------- TASKS ----------
  const coreTasks = [
    { id: 't_q1', title: 'Confirm home office square footage for Schedule C', returnId: 'ret_1002', linkedDocId: null, linkedMessageId: 'm_thread_2', owner: 'u_devon', status: 'open', urgency: 'medium', due: '2026-07-28' },
    { id: 't_q2', title: 'Upload Q4 mileage log', returnId: 'ret_1002', linkedDocId: null, linkedMessageId: 'm_thread_2', owner: 'u_devon', status: 'open', urgency: 'high', due: '2026-07-25' },
    { id: 't_q3', title: 'Verify mortgage interest deduction cap (acquisition debt)', returnId: 'ret_1001', linkedDocId: 'doc_1098_wells', linkedMessageId: 'm_thread_1', owner: 'u_sam', status: 'open', urgency: 'high', due: '2026-07-24' },
    { id: 't_q4', title: 'Reconcile Premium Tax Credit against final household income', returnId: 'ret_1001', linkedDocId: 'doc_1095a', linkedMessageId: 'm_thread_1', owner: 'u_jill', status: 'open', urgency: 'high', due: '2026-07-24' },
    { id: 't_q5', title: 'Client sign-off on qualified dividend classification', returnId: 'ret_1001', linkedDocId: 'doc_1099div_schwab', linkedMessageId: null, owner: 'u_maria', status: 'open', urgency: 'medium', due: '2026-07-29' },
  ];

  // ---------- MESSAGE THREADS ----------
  const messageThreads = [
    {
      id: 'm_thread_1', subject: 'Mortgage interest & PTC — two open items', returnId: 'ret_1001',
      linkedDocId: 'doc_1098_wells', linkedTaskId: 't_q3',
      participants: ['u_sam', 'u_jill', 'u_maria'],
      messages: [
        { from: 'u_jill', internal: true,  time: '2026-07-18 09:12', text: 'Sam — mortgage balance looks like it may cross the $750k acquisition debt cap. Can you confirm origination date before we ask Maria anything?' },
        { from: 'u_sam',  internal: true,  time: '2026-07-18 10:03', text: 'Origination was 2019, so the $750k cap applies. Balance is under, so we should be fine — flagging for your sign-off anyway.' },
        { from: 'u_jill', internal: false, time: '2026-07-18 14:47', text: 'Hi Maria — quick one: can you confirm this mortgage is on your primary residence (not a second home)? Just need a one-line confirmation.' },
        { from: 'u_maria', internal: false, time: '2026-07-19 08:20', text: 'Yes, primary residence, no second home.' },
      ],
    },
    {
      id: 'm_thread_2', subject: 'Schedule C — home office & mileage', returnId: 'ret_1002',
      linkedDocId: null, linkedTaskId: 't_q2',
      participants: ['u_sam', 'u_devon'],
      messages: [
        { from: 'u_sam', internal: false, time: '2026-07-15 11:00', text: 'Hi Devon — two things before I can finalize the Schedule C: (1) square footage of your home office, and (2) your Q4 mileage log. Can you send both when you get a chance?' },
        { from: 'u_devon', internal: false, time: '2026-07-16 16:32', text: 'Office is 180 sq ft. Still tracking down the mileage log, give me a few days.' },
      ],
    },
    {
      id: 'm_thread_3', subject: 'Welcome — what happens next', returnId: 'ret_1002',
      linkedDocId: null, linkedTaskId: null,
      participants: ['u_sam', 'u_devon'],
      messages: [
        { from: 'u_sam', internal: false, time: '2026-01-22 09:00', text: 'Welcome aboard, Devon! I\'ve created your 2025 return. Next step is uploading your business income and expense records — I\'ll follow up with a checklist shortly.' },
      ],
    },
  ];

  // ---------- AI INSIGHTS (fabricated, for Trustworthy AI challenge) ----------
  const aiInsights = [
    {
      id: 'ai_1', returnId: 'ret_1001', fieldId: 'f_mortgage_int', type: 'warning',
      title: 'Mortgage interest may exceed the acquisition-debt cap',
      summary: 'The full $9,875 was extracted from the 1098, but loans originated after Dec 15, 2017 are capped at $750,000 of acquisition debt.',
      evidence: ['1098 shows outstanding principal of $612,400 (below the cap)', 'Origination date on file: 2019-06-01', 'Prior-year return applied no limitation'],
      confidence: 0.91, suggestedAction: 'No adjustment needed — balance is under the cap. Confirm and mark verified.',
      recommendedStatus: 'approve',
    },
    {
      id: 'ai_2', returnId: 'ret_1001', fieldId: 'f_charity', type: 'info',
      title: 'Charitable total summed from 6 receipts',
      summary: 'AI summed six individual receipts into one Schedule A line. Two receipts are handwritten and lower-confidence.',
      evidence: ['4 of 6 receipts are printed/typed (high confidence)', '2 of 6 are handwritten and harder to parse', 'Sum matches Maria\'s emailed total of $3,450'],
      confidence: 0.88, suggestedAction: 'Spot-check the 2 handwritten receipts, then approve.',
      recommendedStatus: 'review',
    },
    {
      id: 'ai_3', returnId: 'ret_1001', fieldId: 'f_ptc', type: 'warning',
      title: 'Premium Tax Credit reconciliation needs final income',
      summary: 'Form 8962 reconciliation was estimated using projected household income. Final W-2 and 1099 income is now available and differs slightly.',
      evidence: ['1095-A Part III totals extracted for all 12 months', 'Estimated income used: $121,000', 'Actual finalized income: $121,384.54'],
      confidence: 0.82, suggestedAction: 'Re-run reconciliation with finalized income before filing.',
      recommendedStatus: 'review',
    },
  ];

  // ---------- GENERATED VOLUME DATA (for scale/complexity + dashboard prioritization) ----------
  const firstNames = ['James','Priya','Wei','Fatima','Lucas','Emma','Noah','Ava','Diego','Grace','Kwame','Sofia','Liam','Nina','Omar','Elena','Marcus','Ines','Tobias','Aisha'];
  const lastNames = ['Rodriguez','Kim','Patel','Johnson','Nguyen','Williams','Osei','Garcia','Novak','Brooks','Larsen','Haddad','Ferreira','Tanaka','Cohen','Adeyemi','Silva','Murphy','Petrov','Okafor'];
  const docTypes = ['W-2','1099-INT','1099-DIV','1099-NEC','1099-MISC','1098','1095-A','K-1','Receipts','Prior Return','Bank Statement','Brokerage Statement'];
  const stages = stageOrder;
  const urgencies = ['high','medium','low'];

  function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }
  const rnd = seededRandom(42);

  const generatedReturns = [];
  for (let i = 0; i < 146; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 7 + 3) % lastNames.length];
    const stage = stages[Math.floor(rnd() * stages.length)];
    const urgency = urgencies[Math.floor(rnd() * urgencies.length)];
    generatedReturns.push({
      id: `ret_g${1000 + i}`, clientId: null, clientName: `${fn} ${ln}`, taxYear: 2025,
      formType: rnd() > 0.75 ? '1040 + Schedule C' : 'Form 1040',
      preparerId: rnd() > 0.5 ? 'u_sam' : 'u_tara', reviewerId: 'u_jill',
      stage, owner: stage === 'client_action' ? 'client' : 'preparer',
      ownerLabel: stage === 'client_action' ? 'Client' : 'Preparer',
      blocking: stage === 'client_action' ? 'Awaiting client documents' : null,
      openQuestions: Math.floor(rnd() * 3), updatedAt: '2026-07-' + (String(1 + Math.floor(rnd() * 22)).padStart(2, '0')),
      urgency, history: [], generated: true,
    });
  }

  const allReturns = [...coreReturns, ...generatedReturns];

  const generatedDocuments = [];
  let docCounter = 0;
  allReturns.forEach((r) => {
    const n = r.generated ? 1 + Math.floor(rnd() * 5) : 0; // core returns already have real docs
    for (let j = 0; j < n; j++) {
      const type = docTypes[Math.floor(rnd() * docTypes.length)];
      docCounter++;
      generatedDocuments.push({
        id: `doc_g${docCounter}`, name: `${type} — ${r.clientName}`, type, pages: 1 + Math.floor(rnd() * 3),
        uploadedBy: null, uploadedAt: r.updatedAt, returnId: r.id, generated: true,
      });
    }
  });
  const allDocuments = [...coreDocuments, ...generatedDocuments];

  const generatedTasks = [];
  allReturns.filter(r => r.generated).forEach((r, idx) => {
    if (rnd() > 0.45) {
      const titles = [
        'Review flagged deduction for reasonableness', 'Confirm dependent eligibility', 'Reconcile estimated vs. actual quarterly payments',
        'Request missing K-1', 'Verify state residency for allocation', 'Follow up on unsigned engagement letter',
        'Check for excess Roth IRA contribution', 'Confirm business mileage log completeness',
      ];
      generatedTasks.push({
        id: `t_g${idx}`, title: titles[Math.floor(rnd() * titles.length)], returnId: r.id,
        linkedDocId: null, linkedMessageId: null,
        owner: r.stage === 'client_action' ? 'client' : (r.preparerId || 'u_sam'),
        status: 'open', urgency: urgencies[Math.floor(rnd() * urgencies.length)],
        due: '2026-07-' + String(1 + Math.floor(rnd() * 28)).padStart(2, '0'), generated: true,
      });
    }
  });
  const allTasks = [...coreTasks, ...generatedTasks];

  return {
    users, roleLabels, stageLabels, stageOrder,
    documents: allDocuments, coreDocuments,
    fields, returns: allReturns, coreReturns,
    tasks: allTasks, coreTasks, messageThreads, aiInsights,

    // ---- helpers ----
    getUser(id) { return users.find(u => u.id === id); },
    getReturn(id) { return allReturns.find(r => r.id === id); },
    getDocument(id) { return allDocuments.find(d => d.id === id); },
    getField(id) { return fields.find(f => f.id === id); },
    getTask(id) { return allTasks.find(t => t.id === id); },
    getThread(id) { return messageThreads.find(m => m.id === id); },
    fieldsForReturn(returnId) { return fields.filter(f => f.returnId === returnId); },
    docsForReturn(returnId) { return allDocuments.filter(d => d.returnId === returnId); },
    tasksForReturn(returnId) { return allTasks.filter(t => t.returnId === returnId); },
    threadsForReturn(returnId) { return messageThreads.filter(m => m.returnId === returnId); },
    insightsForReturn(returnId) { return aiInsights.filter(a => a.returnId === returnId); },
    returnsForClient(clientId) { return allReturns.filter(r => r.clientId === clientId); },
    returnsForPreparer(preparerId) { return allReturns.filter(r => r.preparerId === preparerId); },
  };
})();

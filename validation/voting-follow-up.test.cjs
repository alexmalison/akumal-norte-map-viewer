// Runs the real ballot handlers and Apps Script against an in-memory DOM/workbook.
// No network calls or real ballots are made.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const main = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
const block = (start, end) => main.slice(main.indexOf(start), main.indexOf(end));
const sheets = new Map();
const book = {
  getSheetByName: name => sheets.get(name),
  insertSheet(name) {
    const rows = [];
    const sheet = { rows, getLastRow: () => rows.length, setFrozenRows() {},
      getRange(row, column, height, width) {
        return {
          getValues: () => rows.slice(row - 1, row - 1 + height).map(r => r.slice(column - 1, column - 1 + width)),
          setNumberFormat() { return this; },
          setValues(values) { values.forEach((r, i) => { rows[row - 1 + i] ||= []; r.forEach((value, j) => { rows[row - 1 + i][column - 1 + j] = value; }); }); return this; }
        };
      }
    };
    sheets.set(name, sheet);
    return sheet;
  }
};
const storage = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-only' }) },
  SpreadsheetApp: { openById: () => book, flush() {} },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: text => ({ text, setMimeType() { return this; } }), MimeType: {} }
});
vm.runInContext(fs.readFileSync(path.join(root, 'apps_script/voting/Code.gs'), 'utf8'), storage);
storage.initializeVotingSheet();
const publicFeed = () => JSON.parse(storage.doGet({}).text.slice('akumalReceiveVotes('.length, -2));
const submitStorage = data => JSON.parse(storage.doPost({ postData: { contents: JSON.stringify(data) } }).text);
const barrier = 'Funding Proposal (Only Barrier)';
// Upgrade the two old schemas without moving columns or rewriting historical ballots.
const oldVotes = sheets.get('Votes').rows;
oldVotes[0].pop();
const historicalVote = ['2026-11-01', barrier, '2026-10-v1', 'lot:F25', 'Previous voter', 'true', 'no'];
oldVotes.push([...historicalVote]);
assert.equal(publicFeed().votes[barrier]['lot:F25'], 'no');
assert.equal(oldVotes[0].length, 7); // A public read never migrates the sheet.
const migrationVote = { proposal: barrier, version: '2026-10-v1', payer: 'lot:F24', name: 'New voter',
  authorized: true, vote: 'yes', email: 'new@example.com', activityId: 'migration-vote-id' };
assert.equal(submitStorage({ ...migrationVote, email: '' }).ok, false);
assert.equal(oldVotes.length, 2);
assert.equal(oldVotes[0].length, 7);
assert.equal(submitStorage(migrationVote).ok, true);
assert.equal(oldVotes[0][7], 'Email address');
assert.deepEqual(oldVotes[1], historicalVote);
assert.equal(oldVotes[2][7], 'new@example.com');
const oldActivity = sheets.get('Activity').rows;
oldActivity[0].pop();
oldActivity[1].pop();
const historicalActivity = [...oldActivity[1]];
assert.equal(submitStorage({ action: 'activity', proposal: barrier, version: '2026-10-v1', payer: 'lot:F24',
  name: '', email: '', event: 'incomplete_vote_comment', comments: 'Old schema upgrade', activityId: 'migration-comment-id' }).ok, true);
assert.equal(oldActivity[0][8], 'Email address');
assert.deepEqual(oldActivity[1], historicalActivity);
assert.equal(oldActivity[2][8], '');
sheets.clear();
storage.initializeVotingSheet();
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, c) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[c]);
const handlers = {};
const contentHandlers = {};
const closeHandlers = {};
const closeButton = { addEventListener: (event, fn) => { closeHandlers[event] = fn; } };
const dialogHandlers = {};
const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; },
  addEventListener: (event, fn) => { dialogHandlers[event] = fn; } };
const content = { markup: '', form: null, textarea: null,
  addEventListener: (event, fn) => { contentHandlers[event] = fn; },
  get innerHTML() { return this.markup; },
  set innerHTML(value) {
    this.markup = value;
    this.form = null;
    this.textarea = null;
    const kind = /class="(vote-form|vote-feedback-form)"/.exec(value)?.[1];
    if (!kind) return;
    const message = { textContent: '', replaceChildren(node) { this.textContent = node.textContent; } };
    const button = { disabled: /<button type="submit" disabled/.test(value) };
    const elements = { representative: { value: '' }, email: { value: '', focus() { this.focused = true; } },
      authorized: { checked: false }, vote: { value: '' } };
    this.form = { kind, elements, dataset: Object.fromEntries([...value.matchAll(/data-(payer|proposal|version)="([^"]+)"/g)].map(m => [m[1], decode(m[2])])),
      querySelector: selector => ['button', 'button[type="submit"]'].includes(selector) ? button : message,
      closest: selector => selector === '.' + kind ? this.form : null };
    if (kind === 'vote-feedback-form') this.textarea = { value: decode(/<textarea[^>]*>([\s\S]*?)<\/textarea>/.exec(value)[1]) };
  },
  querySelector(selector) {
    if (selector === 'textarea[name="comments"]') return this.textarea;
    if (selector === '.vote-form') return this.form?.kind === 'vote-form' ? this.form : null;
    return null;
  }
};
const detail = { payerKey: 'lot:F24', id: 'test-lot', sourceCode: 'F24', name: 'Test property',
  baseCategory: 'Bay Building High Impact Zone', contributionAsk: 1200 };
const proposal = { donations: new Map([['test-lot', detail]]) };
const requests = [];
let failNext = false;
let activityNumber = 0;
const ui = vm.createContext({
  document: { getElementById: id => ({ 'voting-ballot': dialog, 'voting-ballot-content': content,
    'voting-ballot-close': closeButton, 'voting-ballot-title': {} })[id],
  addEventListener: (event, fn) => { handlers[event] = fn; }, createTextNode: textContent => ({ textContent }) },
  window: { crypto: { randomUUID: () => 'test-activity-' + (++activityNumber) } },
  selectedContributionSet: barrier, barrierOnlyProposalLabel: barrier,
  votingFeed: publicFeed(), votingUrl: 'https://test.invalid', votingError: '',
  fundingProposals: new Map([[barrier, proposal], ['Funding Proposal', proposal]]),
  lotLayers: new Map(), sharedNames: new Map(), nameKey: feature => feature.id,
  map: { closePopup() {} }, escapeHtml,
  mapViewLabel: label => label === barrier ? '2027 Funding Proposal (Barrier Only)' : label,
  voteLabel: vote => ({ yes: 'Yes', no: 'No', pending: 'Pending vote' })[vote],
  currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
  AbortController, setTimeout, clearTimeout,
  fetch: async (_url, options) => {
    const data = JSON.parse(options.body);
    requests.push(data);
    if (failNext) { failNext = false; throw new Error('Test network failure'); }
    return { ok: true, json: async () => submitStorage(data) };
  }
});
const run = code => vm.runInContext(code, ui);
run('const activeProposal = () => fundingProposals.get(selectedContributionSet); const votingSettings = label => votingFeed.proposals[label];' +
  "const voteFor = (payer, label = selectedContributionSet) => votingFeed.votes[label][payer] || 'pending';");
run(block('const ballotDialog =', 'function renderVotingPanel'));
run('function redrawVoting() { if (ballotDialog.open) renderBallot(); } function loadVotes() {}');
run(block('let voteSubmitting = false;', 'const feesEditor ='));
const open = (label = barrier) => { ui.selectedContributionSet = label; assert.equal(run("openVotingBallot('test-lot')"), true); };
const click = selector => contentHandlers.click({ target: { closest: query => query === selector ? {} : null } });
const submitForm = async () => { assert.ok(content.form); await handlers.submit({ target: content.form, preventDefault() {} }); };
const flush = () => new Promise(resolve => setImmediate(resolve));
const vote = async value => {
  content.form.elements.representative.value = 'Private representative';
  content.form.elements.email.value = 'private@example.com';
  content.form.elements.authorized.checked = true;
  content.form.elements.vote.value = value;
  await submitForm();
};
const activity = () => sheets.get('Activity')?.rows.slice(1) || [];
const votes = () => sheets.get('Votes').rows.slice(1);

(async () => {
  for (const [email, expected] of [['owner@example.com', true], ['First.Last+lot@sub.example.org', true],
    [' contact@example.com ', true], ['a@xn--bcher-kva.example', true], ['', false], [null, false],
    ['owner', false], ['owner@', false], ['@example.com', false], ['owner@example', false],
    ['owner@@example.com', false], ['owner name@example.com', false], ['.owner@example.com', false],
    ['owner..name@example.com', false], ['owner@-example.com', false], ['owner@example..com', false],
    ['owner@example.com\nBcc:other@example.com', false], ['x'.repeat(65) + '@example.com', false],
    ['owner@' + 'x'.repeat(64) + '.com', false], ['owner@123.456', false]]) {
    assert.equal(run('validVoteEmail(' + JSON.stringify(email) + ')'), expected, String(email));
    assert.equal(storage.validVoteEmail(email), expected, String(email));
  }
  open();
  assert.match(content.innerHTML, /Your name[\s\S]*Email address<input name="email" type="email"[^>]*required/);
  assert.match(content.innerHTML, /Voting Instructions/);
  content.form.elements.representative.value = 'Draft owner';
  content.form.elements.email.value = 'draft@example.com';
  content.form.elements.authorized.checked = true;
  content.form.elements.vote.value = 'yes';
  const priorRequests = requests.length;
  click('.open-voting-instructions');
  assert.equal(run('ballotSession.stage'), 'instructions');
  assert.match(content.innerHTML, /https:\/\/docs.google.com\/document\/d\/1BKpQgmh-NBnJJP-32WBJ-a0J3PZxJmTbnAbogYK55To\/edit\?usp=sharing/);
  run('redrawVoting()');
  dialogHandlers.cancel({ preventDefault() {} }); // Escape returns to the ballot, not the map.
  assert.equal(run('ballotSession.stage'), 'ballot');
  assert.equal(dialog.open, true);
  assert.equal(content.form.elements.email.value, 'draft@example.com');
  assert.equal(content.form.elements.representative.value, 'Draft owner');
  assert.equal(content.form.elements.authorized.checked, true);
  assert.equal(content.form.elements.vote.value, 'yes');
  assert.equal(requests.length, priorRequests); // Opening/closing help is not an incomplete vote.
  click('.open-voting-instructions');
  closeHandlers.click();
  assert.equal(run('ballotSession.stage'), 'ballot');
  click('.open-voting-instructions');
  click('.return-to-ballot');
  assert.equal(run('ballotSession.stage'), 'ballot');
  for (const invalidEmail of ['', 'bad', 'name@example', 'a..b@example.com']) {
    content.form.elements.email.value = invalidEmail;
    await submitForm();
    assert.equal(requests.length, priorRequests);
    assert.match(content.form.querySelector('.vote-message').textContent, /valid email/);
    assert.equal(content.form.elements.email.focused, true);
  }
  // Finish this draft through the normal Yes flow below.
  await vote('yes');
  assert.equal(run('ballotSession.stage'), 'yes');
  assert.match(content.innerHTML, /Thank you for your commitment/);
  assert.match(content.innerHTML, /tel:\+16039304235/);
  assert.match(content.innerHTML, /mailto:secretary@vecinosakumalnorte.org/);
  assert.equal(activity()[0][5], 'vote_yes');
  assert.equal(activity()[0][8], 'private@example.com');
  assert.equal(votes()[0][7], 'private@example.com');
  assert.equal(JSON.stringify(publicFeed()).includes('private@example.com'), false);
  closeHandlers.click();
  assert.equal(dialog.open, false);
  assert.equal(activity().length, 1);

  open();
  assert.equal(content.form.elements.representative.value, ''); // No previous voter's draft.
  assert.equal(content.form.elements.email.value, '');
  await vote('no');
  assert.equal(run('ballotSession.stage'), 'no');
  assert.equal(publicFeed().votes[barrier]['lot:F24'], 'no');
  assert.match(content.innerHTML, /Your vote against funding/);
  content.textarea.value = '=Private reason <script>alert(1)</script>';
  run('redrawVoting()');
  assert.equal(content.textarea.value, '=Private reason <script>alert(1)</script>');
  assert.doesNotMatch(content.innerHTML, /<script>/);
  failNext = true;
  await submitForm();
  assert.equal(run('ballotSession.stage'), 'no');
  assert.match(content.innerHTML, /Could not save your comments/);
  const failedId = requests.at(-1).activityId;
  await submitForm();
  assert.equal(requests.at(-1).activityId, failedId);
  assert.equal(run('ballotSession.stage'), 'feedback_saved');
  assert.equal(activity().at(-1)[6], "'=Private reason <script>alert(1)</script>");
  assert.equal(votes().length, 2); // Comments never append ballots.
  const count = activity().length;
  assert.equal(submitStorage(requests.at(-1)).ok, true);
  assert.equal(activity().length, count); // A lost response cannot duplicate feedback.
  assert.equal(submitStorage({ ...requests.at(-1), comments: 'Changed payload' }).ok, false);
  assert.equal(JSON.stringify(publicFeed()).includes('Private'), false);
  assert.equal(JSON.stringify(publicFeed()).includes('@example.com'), false);
  closeHandlers.click();

  open();
  content.form.elements.representative.value = 'Draft owner';
  content.form.elements.email.value = 'unfinished@example.com';
  content.form.elements.authorized.checked = true;
  content.form.elements.vote.value = 'yes';
  dialogHandlers.cancel({ preventDefault() {} }); // Escape follows the same close process.
  await flush();
  assert.equal(run('ballotSession.stage'), 'incomplete');
  assert.equal(dialog.open, true);
  assert.equal(activity().at(-1)[5], 'vote_incomplete');
  click('.return-to-ballot');
  assert.equal(content.form.elements.representative.value, 'Draft owner');
  assert.equal(content.form.elements.email.value, 'unfinished@example.com');
  assert.equal(content.form.elements.authorized.checked, true);
  assert.equal(content.form.elements.vote.value, 'yes');
  closeHandlers.click();
  await flush();
  assert.equal(activity().filter(row => row[5] === 'vote_incomplete').length, 1);
  content.textarea.value = 'Need more information';
  await submitForm();
  assert.equal(activity().at(-1)[5], 'incomplete_vote_comment');
  assert.equal(votes().length, 2);
  assert.equal(publicFeed().votes[barrier]['lot:F24'], 'no');
  closeHandlers.click();

  open();
  failNext = true;
  closeHandlers.click();
  await flush();
  assert.match(content.innerHTML, /Could not record this unfinished visit/);
  click('.retry-incomplete-log');
  await flush();
  assert.equal(run('ballotSession.incompleteLogged'), true);
  closeHandlers.click();
  assert.equal(dialog.open, false); // Optional feedback can be skipped.

  open();
  failNext = true;
  await vote('yes');
  assert.equal(run('ballotSession.stage'), 'ballot');
  assert.equal(run('ballotSession.recorded'), false);
  assert.equal(content.form.querySelector('button').disabled, false);
  assert.match(content.form.querySelector('.vote-message').textContent, /Could not confirm/);
  await vote('yes');
  assert.equal(run('ballotSession.stage'), 'yes');
  assert.equal(publicFeed().votes[barrier]['lot:F24'], 'yes');
  const acceptedVote = requests.at(-1);
  const ballotCount = votes().length;
  assert.equal(submitStorage(acceptedVote).ok, true);
  assert.equal(votes().length, ballotCount);
  closeHandlers.click();

  const barrierActivityCount = activity().length;
  open('Funding Proposal');
  closeHandlers.click();
  assert.equal(dialog.open, false);
  open('Funding Proposal');
  await vote('no');
  assert.equal(run('ballotSession.stage'), 'ballot');
  closeHandlers.click();
  assert.equal(dialog.open, false);
  assert.equal(activity().length, barrierActivityCount);

  const feedback = { action: 'activity', proposal: barrier, version: '2026-10-v1', payer: 'lot:F24',
    name: '', event: 'incomplete_vote_comment', comments: 'Reason', activityId: 'validation-activity' };
  for (const change of [{ proposal: 'Funding Proposal' }, { version: 'old' }, { payer: 'unknown' },
    { event: 'unexpected' }, { comments: '' }, { comments: 'x'.repeat(2001) },
    { activityId: '=invalid' }, { name: 'x'.repeat(101) }]) {
    assert.equal(submitStorage({ ...feedback, ...change }).ok, false);
  }
  assert.equal(submitStorage(feedback).ok, true); // Incomplete visitors need not supply a name or authorization.
  for (const email of ['', 'bad', 'owner@example', null, 'owner..name@example.com']) {
    assert.equal(submitStorage({ ...migrationVote, activityId: 'invalid-email-test', email }).ok, false);
  }
  const stale = sheets.get('Activity').rows[0][0];
  sheets.get('Activity').rows[0][0] = 'Changed header';
  assert.equal(submitStorage({ ...feedback, activityId: 'other-validation-id' }).ok, false);
  sheets.get('Activity').rows[0][0] = stale;
  assert.equal(JSON.stringify(publicFeed()).includes('Reason'), false);
  // The previous deployment remains usable until the email-capable backend is installed.
  open();
  delete ui.votingFeed.features.voteEmail;
  run('renderBallot()');
  assert.doesNotMatch(content.innerHTML, /name="email"/);
  assert.doesNotMatch(content.innerHTML, /<button type="submit" disabled/);
  assert.match(content.innerHTML, /Voting Instructions/);
  ui.fetch = async (_url, options) => {
    const data = JSON.parse(options.body);
    assert.equal(Object.hasOwn(data, 'email'), false);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await vote('yes');
  assert.equal(run('ballotSession.recorded'), true);
  console.log('Follow-up checks passed: Yes/No/incomplete flows, Escape/return, draft refresh, failure/retry, private logging, duplicate protection, validation, and proposal isolation.');
})().catch(error => { console.error(error); process.exitCode = 1; });

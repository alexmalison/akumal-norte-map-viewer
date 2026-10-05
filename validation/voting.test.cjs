// Run with node validation/voting.test.cjs. No network or Google account needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .filter(match => !match[0].includes('application/json'));
scripts.forEach(match => new vm.Script(match[1]));
const main = scripts.at(-1)[1];
const block = (start, end) => main.slice(main.indexOf(start), main.indexOf(end));
const data = Object.fromEntries([...html.matchAll(/<script type="application\/json" id="([^"]+)">([\s\S]*?)<\/script>/g)]
  .map(match => [match[1], match[2]]));
const context = vm.createContext({
  document: { getElementById: id => ({ textContent: data[id] }) },
  localStorage: { getItem: () => null, setItem: () => {} },
  selectedContributionSet: 'Funding Proposal', votingResultsVisible: false,
  votingShortfallVisible: false, votingFeed: null
});
const run = code => vm.runInContext(code, context);
run(block('const voteFor =', '// Each entry'));
run('const geojson = ' + data['map-data'] + ';');
run(block('function splitLotRanges(features)', 'function expandSplitLots') +
  block('function lotId(name)', 'const labelMeasure') +
  block('const defaultBudget', 'const ballotDialog ='));
const recompute = () => run('fundingProposals.forEach(p => p.recompute())');
const cents = expression => run('Math.round((' + expression + ')*100)');
const totalShares = 'activeProposal().charged.reduce((s,r) => s+r.amount,0)';
context.votingResultsVisible = true;
recompute();
assert.equal(run('activeProposal().charged.length'), 0);
assert.equal(run('activeProposal().budget - activeProposal().flatTotal - activeProposal().lotTotal'), 340000);
context.votingFeed = { votes: { 'Funding Proposal': {
  'lot:F24': 'yes', 'lot:F25': 'no', 'lot:F5': 'yes', 'lot:H30': 'yes'
} } };
recompute();
assert.equal(run('activeProposal().charged.length'), 3);
assert.equal(cents(totalShares), 34000000);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.total,0)'), 34000000);
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F25').amount"), 0);
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F6').amount"), 0);
// Duplicate map drawings receive the same fee and consume only one voting/charging unit.
assert.equal(run("activeProposal().eligible.filter(r => r.payerKey==='lot:H30').length"), 1);
assert.equal(run("new Set([...activeProposal().donations.values()].filter(r => r.payerKey==='lot:H30').map(r => r.amount)).size"), 1);
assert.equal(run("fundingProposals.get('Funding Proposal 2').charged.length"), 0);
// Voting fees ignore browser-specific budget, rates and expected participation edits.
run('fullParticipationBudget=900000; feesSystem3.forEach(f => { f.building=5; f.buildingParticipation=0; });');
recompute();
assert.equal(cents(totalShares), 34000000);
assert.equal(run('activeProposal().budget'), 400000);
context.votingFeed.votes['Funding Proposal'] = Object.fromEntries(run('activeProposal().eligible.map(r => [r.payerKey,"yes"])'));
recompute();
assert.equal(cents(totalShares), 34000000);
context.votingFeed.votes['Funding Proposal'] = Object.fromEntries(run('activeProposal().eligible.map(r => [r.payerKey,"no"])'));
recompute();
assert.equal(run('activeProposal().lotTotal'), 0);
// Shortfall uses full-participation fees without increasing the Yes lots' contribution.
context.votingShortfallVisible = true;
context.votingFeed.votes['Funding Proposal'] = {};
recompute();
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), 34000000);
assert.equal(run('activeProposal().lotTotal'), 0);
context.votingFeed.votes['Funding Proposal'] = { 'lot:F24': 'yes', 'lot:F25': 'no', 'lot:F5': 'yes' };
recompute();
const baselineYes = cents(totalShares);
assert.ok(baselineYes > 0 && baselineYes < 34000000);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), 34000000 - baselineYes);
const baselineF24 = run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount");
context.votingFeed.votes['Funding Proposal'] = Object.fromEntries(run('activeProposal().eligible.map(r => [r.payerKey,"yes"])'));
recompute();
assert.equal(cents(totalShares), 34000000);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), 0);
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount"), baselineF24);
context.votingFeed.votes['Funding Proposal'] = { 'lot:F24': 'yes', 'lot:F25': 'no', 'lot:F5': 'yes' };
context.votingShortfallVisible = false;
recompute();
assert.equal(cents(totalShares), 34000000);
assert.ok(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount") > baselineF24);
// Status colors are categorical and independent of donation amount.
context.isFullSet = () => true;
context.isPendingSet = () => false;
context.votingMode = () => context.votingResultsVisible;
context.donations = run('activeProposal().donations');
run(block('function lotStyle(feature)', '// Green fill proportional'));
const feature = run("lotFeatures.find(f => activeProposal().donations.get(f.id)?.payerKey==='lot:F24')");
for (const [vote, color] of [['yes', '#16a34a'], ['no', '#ef4444'], ['pending', '#3b82f6']]) {
  context.votingFeed.votes['Funding Proposal'] = vote === 'pending' ? {} : { 'lot:F24': vote };
  context.feature = feature;
  assert.equal(run('lotStyle(feature).fillColor'), color);
}
context.votingResultsVisible = false;
recompute();
assert.equal(run('activeProposal().charged.length === activeProposal().eligible.length'), true);

// Exercise storage code against a private in-memory sheet; no real ballots are submitted.
const rows = [];
const sheet = {
  getLastRow: () => rows.length,
  setFrozenRows: () => {},
  getRange(row, column, height, width) {
    return {
      getValues: () => rows.slice(row - 1, row - 1 + height).map(r => r.slice(column - 1, column - 1 + width)),
      setNumberFormat() { return this; },
      setValues(values) { values.forEach((r, i) => { rows[row - 1 + i] = [...r]; }); return this; }
    };
  }
};
const book = { getSheetByName: () => rows.length ? sheet : null, insertSheet: () => sheet };
const output = text => ({ text, setMimeType() { return this; } });
const storage = vm.createContext({
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test-sheet' }) },
  SpreadsheetApp: { openById: () => book, flush: () => {} },
  LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
  ContentService: { createTextOutput: output, MimeType: { JSON: 'JSON', JAVASCRIPT: 'JS' } }
});
const backend = fs.readFileSync(path.join(root, 'apps_script/voting/Code.gs'), 'utf8');
vm.runInContext(backend, storage);
const stored = code => vm.runInContext(code, storage);
assert.deepEqual(Array.from(stored('[...ELIGIBLE]')).sort(), Array.from(run('activeProposal().eligible.map(r => r.payerKey)')).sort());
stored('initializeVotingSheet()');
const ballot = { proposal: 'Funding Proposal', version: '2026-10-v1', payer: 'lot:F24',
  name: 'Test Representative', authorized: true, vote: 'yes' };
const post = fields => JSON.parse(storage.doPost({ postData: { contents: JSON.stringify({ ...ballot, ...fields }) } }).text);
assert.equal(post({ authorized: false }).ok, false);
assert.equal(post({ payer: 'lot:unknown' }).ok, false);
assert.equal(post({ version: 'old' }).ok, false);
assert.equal(post({ name: ' ' }).ok, false);
assert.equal(post({ vote: 'pending' }).ok, false);
assert.equal(rows.length, 1);
assert.equal(post({}).ok, true);
assert.equal(post({ name: '=1+1', vote: 'no' }).ok, true);
assert.equal(rows[2][4], "'=1+1");
const get = () => {
  const text = storage.doGet({ parameter: { request: 'test' } }).text;
  assert.equal(text.includes('Test Representative'), false);
  return JSON.parse(text.slice('akumalReceiveVotes('.length, -2));
};
assert.equal(get().votes['Funding Proposal']['lot:F24'], 'no');
assert.equal(rows.length, 3); // History remains after vote replacement.
assert.equal(Object.keys(get().votes['Funding Proposal 2']).length, 0);
stored("PROPOSALS['Funding Proposal'].version='new-version'");
assert.equal(Object.keys(get().votes['Funding Proposal']).length, 0);
assert.equal(rows.length, 3);
console.log('Voting checks passed: colors, shortfalls, Yes-only fees, exact totals, duplicates, toggle restoration, ballot validation, history, privacy, and version isolation.');

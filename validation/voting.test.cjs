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
assert.equal(run('fundingProposals.get(barrierOnlyProposalLabel).budget'), 150000);
assert.equal(run('fundingProposals.get(barrierOnlyProposalLabel).lotTotal'), 90000);
assert.equal(run('fundingProposals.get(barrierOnlyProposalLabel).fees === activeProposal().fees'), false);
run("fundingProposals.get(barrierOnlyProposalLabel).setIncluded('lot:F24',false)");
assert.equal(run("activeProposal().included('lot:F24')"), true);
run("fundingProposals.get(barrierOnlyProposalLabel).setIncluded('lot:F24',true)");
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
assert.equal(run('activeProposal().votingSummary.votedFor'), 0);
assert.equal(run('activeProposal().votingSummary.shortfall'), 340000);
context.votingFeed.votes['Funding Proposal'] = { 'lot:F24': 'yes', 'lot:F25': 'no', 'lot:F5': 'yes' };
recompute();
const baselineYes = cents(totalShares);
assert.ok(baselineYes > 0 && baselineYes < 34000000);
assert.equal(cents('activeProposal().votingSummary.votedFor'), baselineYes);
assert.equal(cents('activeProposal().votingSummary.shortfall'), 34000000 - baselineYes);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), 34000000 - baselineYes);
const baselineF24 = run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount");
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').contributionAsk"), baselineF24);
assert.ok(run("activeProposal().eligible.find(r => r.payerKey==='lot:F25').contributionAsk") > 0);
assert.equal(run("new Set([...activeProposal().donations.values()].filter(r => r.payerKey==='lot:H30').map(r => r.contributionAsk)).size"), 1);
context.votingFeed.votes['Funding Proposal'] = Object.fromEntries(run('activeProposal().eligible.map(r => [r.payerKey,"yes"])'));
recompute();
assert.equal(cents(totalShares), 34000000);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), 0);
assert.equal(run('activeProposal().votingSummary.shortfall'), 0);
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount"), baselineF24);
context.votingFeed.votes['Funding Proposal'] = { 'lot:F24': 'yes', 'lot:F25': 'no', 'lot:F5': 'yes' };
context.votingShortfallVisible = false;
recompute();
assert.equal(cents(totalShares), 34000000);
assert.equal(cents('activeProposal().votingSummary.votedFor'), baselineYes);
assert.equal(cents('activeProposal().votingSummary.votedFor + activeProposal().votingSummary.businessContribution + activeProposal().votingSummary.shortfall'), 40000000);
assert.ok(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').amount") > baselineF24);
assert.equal(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').contributionAsk"), baselineF24);
// Status colors are categorical and independent of donation amount.
context.isFullSet = () => true;
context.isPendingSet = () => false;
context.isFeesSet = () => context.selectedContributionSet === 'Fees Structure';
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
// The new proposal's budget, edited fee settings, and votes remain independent.
context.selectedContributionSet = 'Funding Proposal (Only Barrier)';
assert.equal(run('activeProposal().budget'), 150000);
assert.equal(run('activeProposal().fees[2].building'), 1);
context.votingResultsVisible = true;
context.votingFeed.votes['Funding Proposal (Only Barrier)'] = { 'lot:F24': 'yes', 'lot:F25': 'no' };
recompute();
assert.equal(run('activeProposal().charged.length'), 1);
assert.equal(run('activeProposal().lotTotal'), 90000);
assert.equal(cents(totalShares), 9000000);
context.votingShortfallVisible = true;
recompute();
assert.ok(run('activeProposal().lotTotal') > 0 && run('activeProposal().lotTotal') < 90000);
assert.equal(cents('activeProposal().lotTotal + activeProposal().votingSummary.shortfall'), 9000000);
assert.equal(cents('activeProposal().categories.reduce((s,r) => s+r.shortfall,0)'), cents('activeProposal().votingSummary.shortfall'));
context.votingResultsVisible = false;
run('barrierOnlyBudget=175000');
recompute();
assert.equal(run('activeProposal().budget'), 175000);
assert.equal(run("fundingProposals.get('Funding Proposal').budget"), 900000);
context.selectedContributionSet = 'Funding Proposal';

// An older live endpoint must continue serving existing proposals until it is upgraded.
const oldFeed = {
  ok: true, request: 'compatibility-test', generatedAt: new Date().toISOString(),
  proposals: { 'Funding Proposal': run("votingSettings('Funding Proposal')"),
    'Funding Proposal 2': run("votingSettings('Funding Proposal 2')") },
  votes: { 'Funding Proposal': { 'lot:F24': 'yes' }, 'Funding Proposal 2': {} }
};
context.window = {};
context.votingRequest = { id: oldFeed.request };
context.votingError = '';
context.finishVotingRequest = () => { context.votingRequest = null; };
context.redrawVoting = () => {};
context.renderVotingPanel = () => {};
run(block('window.akumalReceiveVotes =', 'function finishVotingRequest'));
context.window.akumalReceiveVotes(oldFeed);
assert.equal(context.votingError, '');
assert.equal(context.votingFeed.votes['Funding Proposal']['lot:F24'], 'yes');
context.selectedContributionSet = 'Funding Proposal (Only Barrier)';
context.votingUrl = 'https://example.com/votes';
context.escapeHtml = value => String(value);
context.currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
run(block('function renderVoteForm', 'function renderVotingPanel'));
const unavailableBallot = run('renderVoteForm(activeProposal().eligible[0])');
assert.match(unavailableBallot, /button type="submit" disabled/);
assert.match(unavailableBallot, /Contribution ask/);
assert.match(unavailableBallot, /<span>Committed<\/span><span>Results not loaded/);
context.votingFeed.proposals['Funding Proposal (Only Barrier)'] = run('votingSettings(barrierOnlyProposalLabel)');
context.votingFeed.votes['Funding Proposal (Only Barrier)'] = {};
const availableBallot = run('renderVoteForm(activeProposal().eligible[0])');
assert.doesNotMatch(availableBallot, /button type="submit" disabled/);
assert.match(availableBallot, /Do you approve Funding Proposal \(Only Barrier\)/);
assert.match(availableBallot, /Budget \$150,000/);
// The selected lot's published ask is shown even before it has voted.
const lotAsk = run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').contributionAsk");
const lotBallot = () => run("renderVoteForm(activeProposal().eligible.find(r => r.payerKey==='lot:F24'))");
assert.ok(lotBallot().includes('<span>Contribution ask</span><span><strong>' + context.currency.format(lotAsk) + ' / year'));
assert.match(lotBallot(), /<span>Committed<\/span><span><strong>\$0 \/ year/);
context.votingFeed.votes['Funding Proposal (Only Barrier)']['lot:F24'] = 'yes';
assert.ok(lotBallot().includes('<span>Committed</span><span><strong>' + context.currency.format(lotAsk) + ' / year'));
assert.ok(lotBallot().includes(context.currency.format(lotAsk / 12) + ' / month'));
context.votingFeed.votes['Funding Proposal (Only Barrier)']['lot:F24'] = 'no';
assert.match(lotBallot(), /<span>Committed<\/span><span><strong>\$0 \/ year/);
context.selectedContributionSet = 'Funding Proposal';
assert.ok(lotBallot().includes('<span>Committed</span><span><strong>' + context.currency.format(run("activeProposal().eligible.find(r => r.payerKey==='lot:F24').contributionAsk")) + ' / year'));
context.selectedContributionSet = 'Funding Proposal';

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
assert.equal(post({ proposal: 'Funding Proposal (Only Barrier)' }).ok, true);
assert.equal(get().votes['Funding Proposal (Only Barrier)']['lot:F24'], 'yes');
assert.equal(Object.keys(get().votes['Funding Proposal']).length, 0);
assert.equal(get().proposals['Funding Proposal (Only Barrier)'].budget, 150000);
console.log('Voting checks passed: colors, shortfalls, Yes-only fees, exact totals, duplicates, toggle restoration, ballot validation, history, privacy, and version isolation.');

context.isFeesSet = () => context.selectedContributionSet === 'Fees Structure';
context.selectedContributionSet = 'Fees Structure';
context.votingResultsVisible = false;
assert.equal(run('feeStructureGroups.length'), 8);
assert.equal(run('new Set(feeStructureGroups.map(g => g.color)).size'), 8);
assert.deepEqual(Array.from(run('feeStructureGroups.map(g => g.reference)')), [0.1, 0.05, 0.1, 0.05, 1, 0.1, 0.2, 0.05]);
for (const row of run('[...feeStructureState.donations.values()]')) {
  context.feeFeature = { id: row.id, properties: {} };
  assert.ok(run('feeGroup(feeFeature)'));
  assert.equal(run('lotStyle(feeFeature).fillColor'), run('feeGroup(feeFeature).color'));
}
for (const code of ['G37', 'G38']) {
  context.feeFeature = run(`lotFeatures.find(f => lotId(f.properties.name) === '${code}')`);
  assert.equal(run('feeGroup(feeFeature).label'), 'Bay Empty Lot High Impact Zone');
  assert.equal(run('feeGroup(feeFeature).reference'), 0.1);
}
context.feeFeature = { id: 'park', properties: {} };
assert.equal(run('feeGroup(feeFeature).reference'), 0);
context.selectedContributionSet = 'Funding Proposal';
console.log('Fees checks passed: unique colors, reference rates, every fee-register shape, lot overrides, and parks.');

// Every mapped property has a reference rate; only the two named parks are exempt.
const propertyFeatures = run("lotFeatures.filter(f => f.properties.layer === 'Akumal Norte property Lots')");
for (const feature of propertyFeatures) {
  context.feeFeature = feature;
  const reference = run('feeGroup(feeFeature).reference');
  assert.ok(Number.isFinite(reference), feature.properties.name);
  if (!/^Parque (Bush|Yalku)$/.test(feature.properties.name)) {
    assert.ok(run('feeStructureState.donations.has(feeFeature.id)'), feature.properties.name);
    assert.ok(reference > 0, feature.properties.name);
  }
}
console.log('Fee coverage passed for all ' + propertyFeatures.length + ' lot shapes.');

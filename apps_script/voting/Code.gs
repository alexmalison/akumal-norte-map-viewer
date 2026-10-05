// Honor-system voting storage. Public reads return statuses only, never names.
// Set the VOTING_SPREADSHEET_ID script property, then run initializeVotingSheet once.
const RATES = [{ building: .1, lot: .05 }, { building: .1, lot: .05 },
  { building: 1, lot: .1 }, { building: .2, lot: .05 }];
// Freeze these settings during voting. Changing a proposal requires a NEW version;
// older ballots remain in the history but do not count toward the new version.
const PROPOSALS = {
  'Funding Proposal': { version: '2026-10-v1', budget: 400000, businessContribution: 60000, rates: RATES },
  'Funding Proposal 2': { version: '2026-10-v1', budget: 400000, businessContribution: 60000, rates: RATES }
};
// Matches the map's per-lot fee register, including divided lots and duplicate drawings.
const ELIGIBLE = new Set(["lot:0","lot:F4","lot:F3","lot:F2","lot:F1","lot:F5","lot:F6","lot:F7","lot:F8","lot:F12","lot:F13","lot:F14","lot:F15","lot:F16","lot:F17","lot:F18","lot:F19","lot:F20","lot:F21","lot:F23","lot:F22","lot:F24","lot:F25","lot:F26","lot:F27","lot:F28","lot:F29","lot:F31","lot:F32","lot:F33","lot:F34","lot:F35","lot:G41B","lot:G41C","lot:G41D","lot:G41E","lot:G41F","lot:G42","lot:G43","lot:G44","lot:G45","lot:G46","lot:G47","lot:G48","lot:G49","lot:G49A","lot:G50","lot:G50a","lot:G51","lot:G51A","lot:G52","lot:G52a","lot:G53","lot:G53A","lot:HA","lot:HB","lot:HC","lot:HD","lot:HE","lot:HF","lot:H01","lot:H04","lot:H05","lot:H06","lot:H07","lot:H08","lot:H09","lot:H10","lot:H11","lot:H12","lot:H13","lot:H14","lot:H15","lot:H16","lot:H17","lot:H18","lot:H19","lot:H20","lot:H21","lot:H22","lot:H23","lot:H24","lot:H25","lot:H27","lot:H28","lot:H29","lot:H30","lot:H31","lot:H32","lot:H33","lot:H34","lot:H35","lot:H36","lot:H37","lot:H38","lot:H39","lot:H40","lot:H41","lot:H42","lot:H43","lot:H44","lot:H45","lot:H50","lot:H51","lot:H52","lot:H53","lot:H54","lot:H55","lot:H56","lot:H57","lot:H58","lot:H59","lot:H60","lot:H61","lot:H73","lot:H74","lot:H75","lot:H76","lot:H77","lot:H78","lot:H79","lot:H80","lot:H81","lot:H82","lot:H83","lot:H84","lot:H85","lot:H86","lot:H87","lot:H88","lot:H89","lot:H94","lot:H95","lot:H96","lot:H97","lot:H98","lot:H99","lot:H100","lot:H101","lot:H102","lot:H103","lot:H104","lot:G44A?","lot:G42A?","lot:H02","lot:H03","lot:F9","lot:G41A","lot:G40","lot:G39","lot:G38","lot:G37","lot:G36","lot:F10","lot:F11","lot:F30","lot:H49","lot:H26","lot:46a","lot:G47A","lot:48a","lot:G45A","lot:G43A?","lot:64","lot:91","lot:H62"]);
const HEADERS = ['Timestamp UTC', 'Proposal', 'Version', 'Lot key', 'Representative name', 'Authorized', 'Vote'];

function votingBook() {
  const id = PropertiesService.getScriptProperties().getProperty('VOTING_SPREADSHEET_ID');
  if (!id) throw new Error('Voting storage is not configured');
  return SpreadsheetApp.openById(id);
}
function initializeVotingSheet() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = votingBook();
    const sheet = book.getSheetByName('Votes') || book.insertSheet('Votes');
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
    return checkedSheet();
  } finally { lock.releaseLock(); }
}
function checkedSheet() {
  const sheet = votingBook().getSheetByName('Votes');
  if (!sheet) throw new Error('Run initializeVotingSheet before opening voting');
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headers.some((value, index) => value !== HEADERS[index])) throw new Error('Voting sheet headers have changed');
  return sheet;
}
function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  const request = String(e && e.parameter && e.parameter.request || '').slice(0, 100);
  let payload;
  try {
    const sheet = checkedSheet();
    const votes = Object.fromEntries(Object.keys(PROPOSALS).map(label => [label, {}]));
    const count = sheet.getLastRow() - 1;
    const rows = count > 0 ? sheet.getRange(2, 1, count, HEADERS.length).getValues() : [];
    rows.forEach(([, proposal, version, payer, , authorized, vote]) => {
      if (Object.prototype.hasOwnProperty.call(PROPOSALS, proposal) && PROPOSALS[proposal].version === version &&
          ELIGIBLE.has(payer) && (authorized === true || authorized === 'true') && ['yes', 'no'].includes(vote)) {
        votes[proposal][payer] = vote; // Latest append wins; every prior ballot stays in the sheet.
      }
    });
    payload = { ok: true, request, generatedAt: new Date().toISOString(), proposals: PROPOSALS, votes };
  } catch (error) { payload = { ok: false, request, error: String(error.message || error) }; }
  // Fixed callback, JSON-encoded request value, read-only and non-sensitive output.
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  return ContentService.createTextOutput('akumalReceiveVotes(' + json + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents;
    if (typeof body !== 'string' || body.length > 2048) throw new Error('Invalid ballot');
    const data = JSON.parse(body);
    if (!Object.prototype.hasOwnProperty.call(PROPOSALS, data.proposal)) throw new Error('Unknown proposal');
    if (data.version !== PROPOSALS[data.proposal].version) throw new Error('Proposal version changed. Refresh before voting.');
    if (!ELIGIBLE.has(data.payer)) throw new Error('Unknown lot');
    if (data.authorized !== true) throw new Error('Authorization acknowledgment is required');
    if (!['yes', 'no'].includes(data.vote)) throw new Error('Choose Yes or No');
    if (typeof data.name !== 'string') throw new Error('Enter your name');
    const name = data.name.replace(/\s+/g, ' ').trim();
    if (!name || name.length > 100) throw new Error('Enter a name of up to 100 characters');
    // Store names as literal text, including names beginning with formula characters.
    const safeName = /^[=+\-@]/.test(name) ? "'" + name : name;
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = checkedSheet();
      const row = [new Date().toISOString(), data.proposal, data.version, data.payer, safeName, 'true', data.vote];
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, HEADERS.length).setNumberFormat('@').setValues([row]);
      SpreadsheetApp.flush();
    } finally { lock.releaseLock(); }
    return jsonOutput({ ok: true });
  } catch (error) { return jsonOutput({ ok: false, error: String(error.message || error) }); }
}

// Emails Funding Proposal 2 checkbox changes to the HMB Sargassum account. Deploy as a web app
// from hmbsargassumproject@gmail.com: execute as me, accessible to anyone. The map posts JSON
// as text/plain (a simple request, so browsers send no CORS preflight).
const RECIPIENT = 'hmbsargassumproject@gmail.com';
// Anyone can reach the web app URL, so cap the mail it sends. Consumer Gmail allows about
// 100 script emails a day in total.
const DAILY_LIMIT = 80;

function respond(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function cleanText(value, maxLength) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!text || text.length > maxLength) throw new Error('Invalid field');
  return text;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = cleanText(data.name, 100);
    const contributor = cleanText(data.contributor, 200);
    const proposal = cleanText(data.proposal, 60);
    if (data.status !== 'checked' && data.status !== 'unchecked') throw new Error('Invalid status');
    const page = data.page ? cleanText(data.page, 300) : '';

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const properties = PropertiesService.getScriptProperties();
      const key = 'sent-' + Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyy-MM-dd');
      const sent = Number(properties.getProperty(key) || 0);
      if (sent >= DAILY_LIMIT) return respond({ ok: false, error: 'Daily email limit reached' });
      MailApp.sendEmail({
        to: RECIPIENT,
        subject: `${proposal}: ${name} ${data.status} ${contributor}`,
        body: [
          `${proposal} checkbox change`,
          '',
          `Name entered: ${name}`,
          `Property/Business: ${contributor}`,
          `New checkbox status: ${data.status}`,
          `Time (UTC): ${new Date().toISOString()}`,
          page ? `Page: ${page}` : ''
        ].join('\n')
      });
      properties.setProperty(key, String(sent + 1));
    } finally {
      lock.releaseLock();
    }
    return respond({ ok: true });
  } catch (error) {
    return respond({ ok: false, error: String(error.message || error) });
  }
}

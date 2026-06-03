const qs = require('qs');
const { getLeadDetails } = require('../lib/amocrm');
const { sendToMeta } = require('../lib/metaCapi');

const QUALIFIED_STAGE_ID = '142';  // ✅ "Sifatli" bosqich ID

async function parseBody(req) {
  if (typeof req.body === 'string') {
    return qs.parse(req.body);
  }

  if (req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    if (keys.some((k) => k.includes('['))) {
      const queryString = keys
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(req.body[k]))}`)
        .join('&');
      return qs.parse(queryString);
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(qs.parse(Buffer.concat(chunks).toString())));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseBody(req);

    console.log('Body keys:', Object.keys(body));
    console.log('leads:', JSON.stringify(body?.leads));

    const statusLeads = body?.leads?.status;
    if (!statusLeads) {
      console.log('No leads.status — skipped');
      return res.status(200).json({ message: 'Not a lead status event — skipped' });
    }

    const list = Array.isArray(statusLeads)
      ? statusLeads
      : Object.values(statusLeads);

    for (const lead of list) {
      const leadId = lead.id;
      const statusId = String(lead.status_id);

      console.log(`Lead ${leadId} → status ${statusId}`);

      if (statusId !== QUALIFIED_STAGE_ID) {
        console.log(`Skipping: stage ${statusId} — QualifiedLead emas`);
        continue;
      }

      console.log(`QualifiedLead matched — processing lead ${leadId}`);

      const details = await getLeadDetails(leadId);
      await sendToMeta(details, leadId);

      console.log(`Done: lead ${leadId} Meta ga yuborildi`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// Sends a generated post to an automation webhook (Make.com, Zapier, n8n).
// That scenario does the actual posting to Instagram / LinkedIn / X with your connected accounts.
export async function publishToWebhook(payload) {
  const url = process.env.PUBLISH_WEBHOOK_URL;
  if (!url) {
    const err = new Error('PUBLISH_WEBHOOK_URL is not set in server/.env. Add a Make/Zapier/n8n webhook to publish directly.');
    err.status = 400;
    throw err;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Webhook responded ${res.status}: ${text.slice(0, 200)}`);
  return text.slice(0, 200) || 'Accepted';
}

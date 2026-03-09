const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function redisCmd(url, token, ...args) {
  const r = await fetch(`${url}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  if (!redisUrl || !redisToken) return res.status(500).json({ error: 'Redis not configured' });

  const { action, prompt, pole, subtype, billing, isPack, ref } = req.body;

  try {
    // ACTION: Valider une référence (la graver en base)
    if (action === 'validate') {
      if (!ref) return res.status(400).json({ error: 'Missing ref' });
      const result = await redisCmd(redisUrl, redisToken, 'SETNX', `ref:${ref}`, '1');
      const locked = result.result === 1;
      return res.status(200).json({ success: locked, ref });
    }

    // ACTION: Générer une nouvelle presta
    if (!prompt || !pole || !billing) return res.status(400).json({ error: 'Missing fields' });

    const sub = isPack ? 'PACK' : subtype;
    const counterKey = `counter:${pole}-${sub}-${billing}`;
    let refCandidate, attempts = 0;

    do {
      const incr = await redisCmd(redisUrl, redisToken, 'INCR', counterKey);
      const num = String(incr.result).padStart(3, '0');
      refCandidate = isPack ? `PACK-${sub}-${num}-${billing}` : `${pole}-${sub}-${num}-${billing}`;
      const exists = await redisCmd(redisUrl, redisToken, 'EXISTS', `ref:${refCandidate}`);
      if (exists.result === 0) break;
      attempts++;
    } while (attempts < 20);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await anthropicRes.json();
    return res.status(200).json({ ...data, ref: refCandidate });

  } catch (err) {
    return res.status(500).json({ error: 'Failed', detail: err.message });
  }
}


export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')
  try {
    const target = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'
    const r = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body)
    })
    const text = await r.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(r.status).send(text)
  } catch (err) {
    console.error('proxy error', err)
    res.status(500).json({ error: 'proxy failed' })
  }
}

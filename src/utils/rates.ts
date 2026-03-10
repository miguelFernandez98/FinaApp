export interface Rates { USD: number; EUR: number }

// Returns VES per USD and VES per EUR
export async function fetchRates(): Promise<Rates> {
  // Use exchangerate.host which supports CORS
  try {
    const usdRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VES')
    const eurRes = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=VES')
    if (usdRes.ok && eurRes.ok) {
      const u = await usdRes.json()
      const e = await eurRes.json()
      const usdToVES = Number(u?.rates?.VES)
      const eurToVES = Number(e?.rates?.VES)
      if (usdToVES && eurToVES) return { USD: usdToVES, EUR: eurToVES }
    }
  } catch (err) {
    console.warn('fetchRates: exchangerate.host failed', err)
  }

  // Fallback: try a couple of other public endpoints that may work
  const candidates = [
    'https://api.exchangerate-api.com/v4/latest/USD',
    'https://open.er-api.com/v6/latest/USD'
  ]
  for (const url of candidates) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const j = await res.json()
      const usdToVES = j?.rates?.VES || (j?.rates && j.rates.VES)
      if (usdToVES) {
        // attempt to derive EUR->VES using USD->EUR if available
        const usdToEur = j?.rates?.EUR
        if (usdToEur) {
          const eurToVES = usdToVES / usdToEur
          return { USD: Number(usdToVES), EUR: Number(eurToVES) }
        }
        return { USD: Number(usdToVES), EUR: Number(usdToVES) }
      }
    } catch (e) {
      console.warn('fetchRates candidate failed', url, e)
      continue
    }
  }

  console.warn('fetchRates: using fallback hardcoded rates')
  return { USD: 30000, EUR: 32000 }
}

export default fetchRates

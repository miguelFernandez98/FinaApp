export interface Rates { USD: number; EUR: number }

const CACHE_KEY = 'finanzapp_cached_rates_v1'
const OFFLINE_FLAG = 'finanzapp_offline_mode_v1'

function readCached(): Rates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.USD === 'number' && typeof parsed.EUR === 'number') return parsed
  } catch (e) {}
  return null
}

function writeCached(r: Rates) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(r)) } catch (e) {}
}

function offlineModeEnabled(): boolean {
  try {
    return localStorage.getItem(OFFLINE_FLAG) === 'true'
  } catch (e) { return false }
}

// Try to read USDT->VES market price from Binance P2P by averaging/median of visible adverts.
// Note: Binance P2P may be blocked by CORS in browsers; caller should handle failures.
async function fetchBinanceUSDTtoVES(tradeType: 'SELL' | 'BUY' = 'SELL'): Promise<number | null> {
  try {
    const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'
    const body = {
      page: 1,
      rows: 20,
      payTypes: [],
      asset: 'USDT',
      fiat: 'VES',
      tradeType: tradeType
    }
    // If running in dev (localhost), use the Vite dev proxy to avoid CORS.
    let fetchUrl: string
    try {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      if (isLocal) {
        fetchUrl = '/binance-proxy/bapi/c2c/v2/friendly/c2c/adv/search'
      } else {
        // Support optional proxy configured by the app: read from localStorage key 'finanzapp_binance_proxy_v1'.
        // Proxy may be a prefix like 'https://my-proxy.example.com/?url=' or a template containing '{url}'.
        fetchUrl = url
        try {
          const proxy = localStorage.getItem('finanzapp_binance_proxy_v1') || ''
          if (proxy) {
            fetchUrl = proxy.includes('{url}') ? proxy.replace('{url}', encodeURIComponent(url)) : proxy + encodeURIComponent(url)
          }
        } catch (e) {
          // ignore localStorage errors
        }
      }
    } catch (e) {
      fetchUrl = url
    }

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) return null
    const j = await res.json()
    const advs = j?.data || []
    const prices: number[] = advs.map((d: any) => Number(d?.adv?.price)).filter((p: number) => !isNaN(p) && p > 0)
    if (prices.length === 0) return null
    prices.sort((a, b) => a - b)
    const mid = Math.floor(prices.length / 2)
    const median = prices.length % 2 === 1 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
    return median
  } catch (e) {
    console.warn('fetchBinanceUSDTtoVES failed', e)
    throw e
  }
}

// Fetch both buy and sell medians from Binance P2P (BUY = user buys USDT i.e. price user pays in VES per USDT)
export async function fetchBinanceP2P(): Promise<{ buy: number | null; sell: number | null }> {
  try {
    const [sell, buy] = await Promise.all([
      fetchBinanceUSDTtoVES('SELL').catch(() => null),
      fetchBinanceUSDTtoVES('BUY').catch(() => null),
    ])
    return { buy, sell }
  } catch (e) {
    return { buy: null, sell: null }
  }
}

// Returns VES per USD and VES per EUR. Respects offline mode and caches last-successful rates.
export async function fetchRates(): Promise<Rates> {
  // If offline mode requested, return cache or fallback immediately
  if (offlineModeEnabled()) {
    const c = readCached()
    if (c) return c
    return { USD: 30000, EUR: 32000 }
  }
  // Try Binance P2P first (use USDT as USD proxy) to get market-local VES price.
  // If Binance is blocked by CORS, this will throw and we'll fall back to other sources.
  try {
    const usdToVES = await fetchBinanceUSDTtoVES()
    if (usdToVES) {
      // Derive EUR->VES by asking a reliable FX source for EUR->USD, then multiply.
      try {
        const eurToUsdRes = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD')
        if (eurToUsdRes.ok) {
          const eu = await eurToUsdRes.json()
          const eurToUsd = Number(eu?.rates?.USD)
          if (eurToUsd) {
            const eurToVES = eurToUsd * usdToVES
            const r = { USD: usdToVES, EUR: eurToVES }
            writeCached(r)
            return r
          }
        }
      } catch (err) {
        console.warn('fetchRates: derivation EUR->VES failed', err)
      }
    }
  } catch (err) {
    console.warn('fetchRates: Binance P2P attempt failed or blocked (CORS?)', err)
  }

  // Try reliable CORS-friendly source (exchangerate.host)
  try {
    const usdRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VES')
    const eurRes = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=VES')
    if (usdRes.ok && eurRes.ok) {
      const u = await usdRes.json()
      const e = await eurRes.json()
      const usdToVES = Number(u?.rates?.VES)
      const eurToVES = Number(e?.rates?.VES)
      if (usdToVES && eurToVES) {
        const r = { USD: usdToVES, EUR: eurToVES }
        writeCached(r)
        return r
      }
    }
  } catch (err) {
    console.warn('fetchRates: exchangerate.host failed', err)
  }

  // Try alternate public endpoints
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
        const usdToEur = j?.rates?.EUR
        const eurToVES = usdToEur ? usdToVES / usdToEur : usdToVES
        const r = { USD: Number(usdToVES), EUR: Number(eurToVES) }
        writeCached(r)
        return r
      }
    } catch (e) {
      console.warn('fetchRates candidate failed', url, e)
      continue
    }
  }

  // Last resort: cached or hardcoded fallback
  const cached = readCached()
  if (cached) return cached
  console.warn('fetchRates: using fallback hardcoded rates')
  return { USD: 30000, EUR: 32000 }
}

export function setOfflineMode(enabled: boolean) {
  try { localStorage.setItem(OFFLINE_FLAG, enabled ? 'true' : 'false') } catch (e) {}
}

export default fetchRates

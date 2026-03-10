export interface Rates {
  USD: number
  EUR: number
}

// Try multiple community endpoints; fall back to placeholders if CORS or network fails.
export async function fetchRates(): Promise<Rates> {
  // List of candidate endpoints (may require replacement with a working community API)
  const candidates = [
    'https://ve.dolarapi.com/api',
    'https://s3.amazonaws.com/dolartoday/data.json'
  ]

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue
      const j = await res.json()

      // Try detect common shapes
      if (j && typeof j === 'object') {
        // Example: dolartoday-like
        if (j.USD && typeof j.USD === 'object' && j.USD.transfer) {
          return { USD: Number(j.USD.transfer), EUR: Number(j.EUR?.transfer ?? j.USD.transfer) }
        }

        // Example: simple object with rates
        if (j.USD && j.EUR && typeof j.USD === 'number') {
          return { USD: Number(j.USD), EUR: Number(j.EUR) }
        }

        // Example: data.json with 'USD' as object
        if (j.USD && typeof j.USD === 'object' && j.USD.rate) {
          return { USD: Number(j.USD.rate), EUR: Number(j.EUR?.rate ?? j.USD.rate) }
        }
      }
    } catch (e) {
      // continue to next candidate
      console.warn('fetchRates candidate failed', url, e)
      continue
    }
  }

  // Fallback hardcoded rates (user should replace with preferred API)
  console.warn('All rate fetch attempts failed — using fallback rates')
  return { USD: 30000, EUR: 32000 }
}

export default fetchRates

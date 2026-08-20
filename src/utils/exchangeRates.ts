import { Capacitor } from "@capacitor/core";

export interface ExchangeRates {
  parallel: number | null;
  bcv: number | null;
  eur: number | null;
  lastUpdated: number | null;
  fromCache?: boolean;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYadioRate(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout("https://api.yadio.io/exrates/USD");
    const data = await response.json();

    if (data && data.USD && data.USD.VES) {
      return parseFloat(data.USD.VES);
    }
  } catch (error) {
    console.error("Error fetching parallel rate from yadio:", error);
  }
  return null;
}

async function fetchDolarApiParallelRate(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(
      "https://ve.dolarapi.com/v1/dolares/paralelo",
    );
    const data = await response.json();

    if (data && data.promedio) {
      return parseFloat(data.promedio);
    }
  } catch (error) {
    console.error("Fallback dolarapi paralelo failed:", error);
  }
  return null;
}

/**
 * Obtiene el precio de USDT en VES desde el P2P de Binance usando el
 * lado SELL (precio al que los usuarios compran USDT con VES), que es
 * la referencia que muestran las plataformas de monitoreo del dólar.
 * El lado BUY queda fuera porque baja el promedio artificialmente.
 */
export async function fetchBinanceRate(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  const body = {
    asset: "USDT",
    fiat: "VES",
    merchantCheck: false,
    page: 1,
    rows: 15,
    publisherType: null,
    tradeType: "SELL",
    transAmount: null,
    payTypes: [],
    countries: [],
  };

  try {
    const response = await fetchWithTimeout(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();

    if (data && Array.isArray(data.data) && data.data.length > 0) {
      const prices = data.data
        .map((adv: { adv?: { price?: string } }) =>
          parseFloat(adv.adv?.price ?? ""),
        )
        .filter((price: number) => !Number.isNaN(price));
      return average(prices);
    }
  } catch (error) {
    console.error("Error fetching Binance P2P SELL:", error);
  }
  return null;
}

export async function fetchParallelRate(): Promise<number | null> {
  const [binance, yadio, dolarapi] = await Promise.all([
    fetchBinanceRate(),
    fetchYadioRate(),
    fetchDolarApiParallelRate(),
  ]);

  if (binance !== null) return binance;
  const rates = [yadio, dolarapi].filter(
    (value): value is number => value !== null,
  );
  if (rates.length === 0) return null;
  return rates.reduce((sum, value) => sum + value, 0) / rates.length;
}

export async function fetchBCVRate(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(
      "https://ve.dolarapi.com/v1/dolares/oficial",
    );
    const data = await response.json();
    if (data && data.promedio) {
      return parseFloat(data.promedio);
    }
    throw new Error("dolarapi sin tasa oficial");
  } catch (error) {
    console.error("Error fetching BCV rate from dolarapi:", error);
    try {
      const response = await fetchWithTimeout(
        "https://api.exchangerate-api.com/v4/latest/VES",
      );
      const data = await response.json();
      if (data && data.rates && data.rates.USD) {
        return 1 / data.rates.USD;
      }
    } catch (fallbackError) {
      console.error("Fallback ExchangeRate-API also failed:", fallbackError);
    }
    return null;
  }
}

export async function fetchEURRate(): Promise<number | null> {
  try {
    const response = await fetchWithTimeout("https://open.er-api.com/v6/latest/EUR");
    const data = await response.json();
    if (data && data.rates && data.rates.VES) {
      return parseFloat(data.rates.VES);
    }
  } catch (error) {
    console.error("Error fetching EUR/VES from open.er-api:", error);
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.exchangerate-api.com/v4/latest/EUR",
    );
    const data = await response.json();
    if (data && data.rates && data.rates.VES) {
      return parseFloat(data.rates.VES);
    }
  } catch (fallbackError) {
    console.error("Fallback ExchangeRate-API for EUR also failed:", fallbackError);
  }
  return null;
}

export async function fetchAllRates(): Promise<ExchangeRates> {
  const [parallel, bcv, eur] = await Promise.all([
    fetchParallelRate(),
    fetchBCVRate(),
    fetchEURRate(),
  ]);

  return {
    parallel,
    bcv,
    eur,
    lastUpdated: Date.now(),
    fromCache: false,
  };
}

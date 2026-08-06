export interface ExchangeRates {
  binance: number | null;
  bcv: number | null;
  lastUpdated: number | null;
}

export async function fetchBinanceRate(): Promise<number | null> {
  try {
    const response = await fetch("https://api.yadio.io/exrates/USD");
    const data = await response.json();

    if (data && data.USD && data.USD.VES) {
      return parseFloat(data.USD.VES);
    }
    throw new Error("yadio sin tasa VES");
  } catch (error) {
    console.error("Error fetching Binance rate from yadio:", error);
    try {
      const fallbackResponse = await fetch(
        "https://ve.dolarapi.com/v1/dolares/paralelo",
      );
      const fallbackData = await fallbackResponse.json();

      if (fallbackData && fallbackData.promedio) {
        return parseFloat(fallbackData.promedio);
      }
    } catch (fallbackError) {
      console.error("Fallback dolarapi paralelo failed:", fallbackError);
    }

    return null;
  }
}

export async function fetchBCVRate(): Promise<number | null> {
  try {
    const response = await fetch(
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
      const response = await fetch(
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

export async function fetchAllRates(): Promise<ExchangeRates> {
  const [binance, bcv] = await Promise.all([
    fetchBinanceRate(),
    fetchBCVRate(),
  ]);

  return {
    binance,
    bcv,
    lastUpdated: Date.now(),
  };
}

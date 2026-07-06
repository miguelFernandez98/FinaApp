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
    try {
      const fallbackResponse = await fetch(
        "https://api.bluelytics.com.ar/v2/latest",
      );
      const fallbackData = await fallbackResponse.json();

      if (fallbackData && fallbackData.blue && fallbackData.blue.value_buy) {
        return fallbackData.blue.value_buy * 0.024;
      }
    } catch (fallbackError) {
      console.log("Fallback API failed");
    }

    return null;
  } catch (error) {
    console.error("Error fetching Binance rate:", error);
    return 520.0;
  }
}

export async function fetchBCVRate(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/VES",
    );
    const data = await response.json();
    if (data && data.rates && data.rates.USD) {
      return 1 / data.rates.USD;
    }

    return null;
  } catch (error) {
    console.error("Error fetching BCV rate from ExchangeRate-API:", error);
    try {
      const response = await fetch("https://api.bluelytics.com.ar/v2/latest");
      const data = await response.json();

      if (data && data.oficial && data.oficial.value_buy) {
        return data.oficial.value_buy * 0.024;
      }
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError);
    }
    return 481.22;
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

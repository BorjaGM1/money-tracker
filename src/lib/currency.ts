import { db, exchangeRates, settings } from "./db";
import { eq } from "drizzle-orm";
import { CURRENCIES, type Currency } from "./currency-types";

// Re-export for convenience
export { CURRENCIES, type Currency } from "./currency-types";

// How long before rates are considered stale (24 hours)
const RATE_STALE_MS = 24 * 60 * 60 * 1000;

// Frankfurter API - free, no API key needed
const API_BASE = "https://api.frankfurter.app";

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Get the user's preferred display currency
 */
export async function getDisplayCurrency(): Promise<Currency> {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "displayCurrency"));

  if (setting && CURRENCIES.includes(setting.value as Currency)) {
    return setting.value as Currency;
  }
  return "EUR"; // default
}

/**
 * Set the user's preferred display currency
 */
export async function setDisplayCurrency(currency: Currency): Promise<void> {
  await db
    .insert(settings)
    .values({ key: "displayCurrency", value: currency })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: currency },
    });
}

/**
 * Get exchange rates, refreshing from API if stale
 */
export async function getExchangeRates(): Promise<Map<Currency, number>> {
  // Check if we need to refresh rates
  const existingRates = await db.select().from(exchangeRates);

  const now = Date.now();
  const needsRefresh =
    existingRates.length === 0 ||
    existingRates.some((r) => {
      const updatedAt = new Date(r.updatedAt || 0).getTime();
      return now - updatedAt > RATE_STALE_MS;
    });

  if (needsRefresh) {
    await refreshExchangeRates();
  }

  // Return rates from DB
  const rates = await db.select().from(exchangeRates);
  const rateMap = new Map<Currency, number>();

  // EUR is always 1 (base currency)
  rateMap.set("EUR", 1);

  for (const rate of rates) {
    if (CURRENCIES.includes(rate.currency as Currency)) {
      rateMap.set(rate.currency as Currency, rate.rate);
    }
  }

  return rateMap;
}

/**
 * Fetch fresh rates from API and update DB
 */
async function refreshExchangeRates(): Promise<void> {
  try {
    const otherCurrencies = CURRENCIES.filter((c) => c !== "EUR");
    const response = await fetch(
      `${API_BASE}/latest?from=EUR&to=${otherCurrencies.join(",")}`
    );

    if (!response.ok) {
      console.error("Failed to fetch exchange rates:", response.statusText);
      return;
    }

    const data: FrankfurterResponse = await response.json();
    const now = new Date().toISOString();

    // Update or insert each rate
    for (const [currency, rate] of Object.entries(data.rates)) {
      await db
        .insert(exchangeRates)
        .values({ currency, rate, updatedAt: now })
        .onConflictDoUpdate({
          target: exchangeRates.currency,
          set: { rate, updatedAt: now },
        });
    }

    console.log("Exchange rates updated:", data.rates);
  } catch (error) {
    console.error("Error refreshing exchange rates:", error);
  }
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();
  const fromRate = rates.get(fromCurrency) || 1;
  const toRate = rates.get(toCurrency) || 1;

  // Convert to EUR first, then to target currency
  const amountInEur = amount / fromRate;
  return amountInEur * toRate;
}

/**
 * Convert multiple amounts to a target currency and sum them
 */
export async function sumInCurrency(
  items: Array<{ amount: number; currency: string }>,
  targetCurrency: Currency
): Promise<number> {
  const rates = await getExchangeRates();

  let total = 0;
  for (const item of items) {
    const fromRate = rates.get(item.currency as Currency) || 1;
    const toRate = rates.get(targetCurrency) || 1;

    // Convert to EUR first, then to target
    const amountInEur = item.amount / fromRate;
    total += amountInEur * toRate;
  }

  return total;
}

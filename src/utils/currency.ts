// Real-world conversion rates relative to 1 USD base currency
export const EXCHANGE_RATES: Record<string, number> = {
  'USD ($)': 1.0,
  'INR (₹)': 96.57, // 1 USD = 96.57 INR as requested by user
  'EUR (€)': 0.92,  // 1 USD = 0.92 EUR
  'GBP (£)': 0.78,  // 1 USD = 0.78 GBP
  'CAD ($)': 1.36,  // 1 USD = 1.36 CAD
};

export const getCurrencySymbol = (currencySetting?: string): string => {
  if (!currencySetting) return '$';
  if (currencySetting.includes('INR') || currencySetting.includes('₹')) return '₹';
  if (currencySetting.includes('EUR') || currencySetting.includes('€')) return '€';
  if (currencySetting.includes('GBP') || currencySetting.includes('£')) return '£';
  if (currencySetting.includes('CAD')) return 'CA$';
  return '$';
};

export const convertCurrency = (amountInUSD: number, targetCurrency?: string): number => {
  const key = Object.keys(EXCHANGE_RATES).find(k => k === targetCurrency || (targetCurrency && k.includes(targetCurrency))) || 'USD ($)';
  const rate = EXCHANGE_RATES[key] || 1.0;
  return amountInUSD * rate;
};

export const parseInputAmountToUSD = (inputAmount: number, currentCurrencySetting?: string): number => {
  const key = Object.keys(EXCHANGE_RATES).find(k => k === currentCurrencySetting || (currentCurrencySetting && k.includes(currentCurrencySetting))) || 'USD ($)';
  const rate = EXCHANGE_RATES[key] || 1.0;
  return inputAmount / rate;
};

export const formatCurrency = (amountInUSD: number, currencySetting?: string): string => {
  const converted = convertCurrency(amountInUSD, currencySetting);
  const absVal = Math.abs(converted).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amountInUSD < 0 ? '-' : '';
  const symbol = getCurrencySymbol(currencySetting);

  return `${sign}${symbol}${absVal}`;
};

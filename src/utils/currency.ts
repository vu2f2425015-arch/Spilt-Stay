export const getCurrencySymbol = (currencySetting?: string): string => {
  if (!currencySetting) return '₹';
  if (currencySetting.includes('INR') || currencySetting.includes('₹')) return '₹';
  if (currencySetting.includes('USD') || currencySetting.includes('$')) return '$';
  if (currencySetting.includes('EUR') || currencySetting.includes('€')) return '€';
  if (currencySetting.includes('GBP') || currencySetting.includes('£')) return '£';
  if (currencySetting.includes('CAD')) return 'CA$';
  return '₹';
};

export const convertCurrency = (amount: number, targetCurrency?: string): number => {
  const num = Number(parseFloat(String(amount || 0)).toFixed(2));
  return isNaN(num) ? 0 : num;
};

export const parseInputAmountToUSD = (inputAmount: number, currentCurrencySetting?: string): number => {
  const num = Number(parseFloat(String(inputAmount || 0)).toFixed(2));
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (amount: number, currencySetting?: string): string => {
  const num = Number(parseFloat(String(amount || 0)).toFixed(2));
  const safeNum = isNaN(num) || !isFinite(num) ? 0 : num;
  const absVal = Math.abs(safeNum).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = safeNum < 0 ? '-' : '';
  const symbol = getCurrencySymbol(currencySetting);

  return `${sign}${symbol}${absVal}`;
};

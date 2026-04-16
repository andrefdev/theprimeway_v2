export type CurrencyMeta = {
  code: string
  name: string
  symbol: string
  notation?: string
}

const CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: '$', notation: 'C$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: '$', notation: 'A$' },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: '$',
    notation: 'NZ$',
  },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  CLP: { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  COP: { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  PEN: { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.', notation: 'S/.' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
}

export function getCurrencyMeta(code: string): CurrencyMeta {
  const upper = (code || '').toUpperCase()
  return CURRENCIES[upper] ?? { code: upper, name: upper, symbol: upper }
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyMeta(code).symbol
}

export function formatAmountWithSymbol(
  amount: number | string,
  code: string,
): string {
  const meta = getCurrencyMeta(code)
  const symbol = meta.notation || meta.symbol
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const value = Number.isFinite(num) ? num : 0
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

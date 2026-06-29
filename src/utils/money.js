export const toCents = (value) => Math.round(Number(value || 0) * 100)

export const fromCents = (cents) => Number((Number(cents || 0) / 100).toFixed(2))

export const roundMoney = (value) => fromCents(toCents(value))

export const addMoney = (...values) => fromCents(values.reduce((sum, value) => sum + toCents(value), 0))

export const subtractMoney = (base, ...values) =>
  fromCents(toCents(base) - values.reduce((sum, value) => sum + toCents(value), 0))

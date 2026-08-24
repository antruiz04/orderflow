import { Decimal } from 'decimal.js';

// evita floats de JS en plata
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export function money(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

export function lineTotal(unitPrice: string, quantity: number): Decimal {
  return money(unitPrice).times(quantity);
}

export function toMoneyString(value: Decimal): string {
  return value.toFixed(2);
}

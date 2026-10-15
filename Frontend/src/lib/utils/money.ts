export function estimateTotal(price: string, days: number) {
  if (
    !/^\d{1,8}(\.\d{1,2})?$/.test(price) ||
    !Number.isSafeInteger(days) ||
    days < 1
  )
    return null;
  const [whole, fraction = ""] = price.split(".");
  const total =
    (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * BigInt(days);
  return `${total / 100n}.${String(total % 100n).padStart(2, "0")}`;
}
export function money(amount: string, currency: string) {
  const number = Number(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${currency} ${amount}`;
  }
}

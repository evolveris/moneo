import type { $brand } from "zod"

// Money is GBP only and always integer pence. Never use floating point for
// amounts: parsing works on the text, not on a number of pounds.
//
// The same brand PenceSchema produces, so parsed and constructed values match.
export type Pence = number & $brand<"Pence">

export function toPence(value: number): Pence {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Amount must be a whole number of pence")
  }
  return (value === 0 ? 0 : value) as Pence // avoids -0
}

// Accepts "12.34", "-£1,200.50", "+5", "£5.5" and "(5.00)" (a bracket means
// negative). Returns null when the text is not an amount with at most two
// decimal places.
export function parsePounds(text: string): Pence | null {
  let s = text.trim()
  let negative = false
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true
    s = s.slice(1, -1).trim()
  }
  if (s.startsWith("-")) {
    negative = !negative
    s = s.slice(1).trim()
  } else if (s.startsWith("+")) {
    s = s.slice(1).trim()
  }
  if (s.startsWith("£")) s = s.slice(1).trim()
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/.test(s)) return null
  const [whole, fraction = ""] = s.replaceAll(",", "").split(".")
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
  if (!Number.isSafeInteger(pence)) return null
  return toPence(negative ? -pence : pence)
}

// -1234 becomes "-£12.34".
export function formatPence(pence: Pence | number): string {
  const abs = Math.abs(pence)
  const pounds = Math.floor(abs / 100).toLocaleString("en-GB")
  const rest = String(abs % 100).padStart(2, "0")
  return `${pence < 0 ? "-" : ""}£${pounds}.${rest}`
}

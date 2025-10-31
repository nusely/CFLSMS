function stripToDigits(raw) {
  return String(raw || '').replace(/\D/g, '')
}

/**
 * Convert scientific notation (e.g., 2.33544E+11) to regular number string
 */
function convertScientificNotation(raw) {
  const str = String(raw || '').trim()
  // Check if it's in scientific notation (contains 'E' or 'e')
  if (/[eE]/.test(str)) {
    try {
      const num = parseFloat(str)
      if (!isNaN(num)) {
        // Convert to string without scientific notation
        return String(Math.round(num))
      }
    } catch (e) {
      // If conversion fails, return original
    }
  }
  return str
}

export function toE164Digits(raw) {
  // Convert scientific notation first
  const normalized = convertScientificNotation(raw)
  let digits = stripToDigits(normalized)
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  // Must start with 1-9 and be 8-15 digits total (E.164 max 15)
  if (digits.startsWith('0')) return null
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  return digits
}

export function isE164Digits(raw) {
  return toE164Digits(raw) != null
}

export function formatDisplayE164(raw) {
  const digits = toE164Digits(raw)
  return digits ? `+${digits}` : ''
}


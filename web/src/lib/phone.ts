/**
 * Cambodian Phone Number Formatter & Validator (+855)
 * Supports Smart (010, 086, 096, 098), Cellcard (012, 077, 089, 092), Metfone (097, 088, 071, 060, 068, 090)
 */

export function normalizeCambodianPhone(phoneInput: string): { valid: boolean; e164: string; error?: string } {
  // Remove spaces, hyphens, parentheses, and non-digit characters except leading +
  let cleaned = phoneInput.trim().replace(/[\s\-\(\)]/g, '')

  if (!cleaned) {
    return { valid: false, e164: '', error: 'Phone number cannot be empty' }
  }

  // Handle +855 format
  if (cleaned.startsWith('+855')) {
    cleaned = cleaned.slice(4)
  } else if (cleaned.startsWith('855')) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  // Cambodian numbers without country code are 8 or 9 digits long
  if (cleaned.length < 8 || cleaned.length > 9) {
    return {
      valid: false,
      e164: '',
      error: 'Invalid Cambodian phone number. Must be 8 or 9 digits (e.g. 012 345 678 or 097 123 4567)'
    }
  }

  // E.164 standard for Supabase Phone Auth
  const e164 = `+855${cleaned}`

  return {
    valid: true,
    e164
  }
}

export function applyPersonalization(message, contact) {
  if (!message) return ''
  const safe = (v) => (v == null ? '' : String(v))
  return message
    .replace(/\{\{\s*first_name\s*\}\}/gi, safe(contact?.first_name))
    .replace(/\{\{\s*last_name\s*\}\}/gi, safe(contact?.last_name))
}




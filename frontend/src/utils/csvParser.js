/**
 * Parse CSV text with support for:
 * - Quoted fields (handles commas inside quotes)
 * - Different delimiters (comma, semicolon, tab)
 * - Trimmed values
 * - Empty lines
 */
export function parseCSV(text) {
  if (!text || !text.trim()) return []
  
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) return []
  
  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = lines[0]
  let delimiter = ','
  if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';'
  } else if (firstLine.includes('\t')) {
    delimiter = '\t'
  }
  
  // Parse header row (handles quoted fields)
  const headers = parseCSVLine(lines[0], delimiter)
  
  if (headers.length === 0) return []
  
  // Parse data rows
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    if (values.length === 0) continue // Skip empty rows
    
    const obj = {}
    headers.forEach((header, idx) => {
      // Remove quotes and trim
      const value = (values[idx] ?? '').trim().replace(/^["']|["']$/g, '')
      obj[header] = value
    })
    rows.push(obj)
  }
  
  return rows
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line, delimiter = ',') {
  const values = []
  let current = ''
  let insideQuotes = false
  let quoteChar = null
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (!insideQuotes && (char === '"' || char === "'")) {
      // Start of quoted field
      insideQuotes = true
      quoteChar = char
    } else if (insideQuotes && char === quoteChar && nextChar === quoteChar) {
      // Escaped quote (double quote)
      current += char
      i++ // Skip next quote
    } else if (insideQuotes && char === quoteChar) {
      // End of quoted field
      insideQuotes = false
      quoteChar = null
    } else if (!insideQuotes && char === delimiter) {
      // Field separator
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Push last field
  values.push(current)
  
  return values.map(v => v.trim())
}


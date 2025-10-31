import { useMemo, useState, useEffect } from 'react'
import { parseCSV } from '../utils/csvParser'
import { toE164Digits } from '../utils/formatPhone'

export default function ImportWizard({ open, onClose, onConfirm, isSuperadmin = false, isGlobal = false, onGlobalChange }) {
  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({ first_name: '', last_name: '', phone: '' })
  const [groupName, setGroupName] = useState('') // Name for the group/import

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setRawText('')
      setRows([])
      setHeaders([])
      setMapping({ first_name: '', last_name: '', phone: '' })
      setGroupName('')
    }
  }, [open])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      setRawText(text)
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        alert('CSV file is empty or could not be parsed. Please check the format.')
        return
      }
      setRows(parsed)
      const headersList = parsed[0] ? Object.keys(parsed[0]) : []
      setHeaders(headersList)
      
      // Auto-detect column mappings based on header names (case-insensitive)
      const autoMapping = { first_name: '', last_name: '', phone: '' }
      headersList.forEach(h => {
        const lower = h.toLowerCase().trim()
        if ((lower.includes('first') || lower.includes('fname')) && !autoMapping.first_name) {
          autoMapping.first_name = h
        }
        if ((lower.includes('last') || lower.includes('lname') || lower.includes('surname')) && !autoMapping.last_name) {
          autoMapping.last_name = h
        }
        if ((lower.includes('phone') || lower.includes('mobile') || lower.includes('number') || lower.includes('tel')) && !autoMapping.phone) {
          autoMapping.phone = h
        }
      })
      setMapping(autoMapping)
    } catch (err) {
      alert(`Error reading CSV file: ${err.message}`)
      console.error('CSV parse error:', err)
    }
  }

  const handleParse = () => {
    try {
      if (!rawText.trim()) {
        alert('Please paste or upload a CSV file first.')
        return
      }
      const parsed = parseCSV(rawText)
      if (parsed.length === 0) {
        alert('CSV is empty or could not be parsed. Please check the format.\n\nExpected format:\nfirst_name,last_name,phone\nJohn,Doe,233245678910')
        return
      }
      setRows(parsed)
      const headersList = parsed[0] ? Object.keys(parsed[0]) : []
      setHeaders(headersList)
      
      // Auto-detect column mappings based on header names (case-insensitive)
      const autoMapping = { first_name: '', last_name: '', phone: '' }
      headersList.forEach(h => {
        const lower = h.toLowerCase().trim()
        if ((lower.includes('first') || lower.includes('fname')) && !autoMapping.first_name) {
          autoMapping.first_name = h
        }
        if ((lower.includes('last') || lower.includes('lname') || lower.includes('surname')) && !autoMapping.last_name) {
          autoMapping.last_name = h
        }
        if ((lower.includes('phone') || lower.includes('mobile') || lower.includes('number') || lower.includes('tel')) && !autoMapping.phone) {
          autoMapping.phone = h
        }
      })
      setMapping(autoMapping)
    } catch (err) {
      alert(`Error parsing CSV: ${err.message}`)
      console.error('CSV parse error:', err)
    }
  }

  const preview = useMemo(() => {
    if (!rows.length) return []
    return rows.slice(0, 10)
  }, [rows])

  const stats = useMemo(() => {
    if (!rows.length || !mapping.phone) return { total: 0, valid: 0, invalid: 0 }
    let valid = 0
    for (const r of rows) {
      if (toE164Digits(r[mapping.phone])) valid++
    }
    return { total: rows.length, valid, invalid: rows.length - valid }
  }, [rows, mapping])

  const confirm = () => {
    if (!mapping.first_name || !mapping.phone) {
      alert('Please select First name and Phone columns (Last name is optional)')
      return
    }
    if (rows.length === 0) {
      alert('No data to import. Please parse CSV first.')
      return
    }
    if (!groupName.trim()) {
      alert('Please enter a group name for this import (e.g., "Church Members", "Youth Group")')
      return
    }
    
    const out = rows.map(r => {
      const rawPhone = (r[mapping.phone] || '').trim()
      // Convert phone to E.164 (handles scientific notation)
      const phone = toE164Digits(rawPhone)
      
      return {
        first_name: (r[mapping.first_name] || '').trim() || 'Unknown',
        last_name: (r[mapping.last_name] || '').trim() || '', // Last name optional
        phone: phone || '', // Will be filtered if invalid
      }
    }).filter(r => r.phone) // Filter out rows without valid phone numbers
    
    if (out.length === 0) {
      alert('No valid contacts found. Please check your phone column mapping. Phone numbers must be in E.164 format.')
      return
    }
    
    onConfirm(out, groupName.trim())
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-blue-200 bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">Import Contacts</h3>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900"><i className="fas fa-times"></i></button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2 text-slate-700">Group Name *</label>
              <input 
                type="text" 
                value={groupName} 
                onChange={(e)=>setGroupName(e.target.value)}
                placeholder="e.g., Church Members, Youth Group, Leaders"
                className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
              <div className="text-xs text-slate-500 mt-1">Name this import/group to organize contacts</div>
              {isSuperadmin && (
                <label className="flex items-center mt-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => onGlobalChange?.(e.target.checked)}
                    className="mr-2 rounded border-slate-300"
                  />
                  <i className="fas fa-globe mr-1 text-blue-500"></i>
                  Make this a global group (visible to all admins)
                </label>
              )}
            </div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Upload CSV File</label>
            <label className="block w-full border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <span className="text-blue-500"><i className="fas fa-file-upload mr-2"></i>Click to upload CSV</span>
            </label>
            <div className="mt-2 text-xs text-slate-500">or paste CSV below</div>
            <label className="block text-sm font-medium mb-2 mt-3 text-slate-700">Paste CSV (first row = headers)</label>
            <textarea rows={8} value={rawText} onChange={(e)=>setRawText(e.target.value)} className="w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="mt-2 flex gap-2">
              <button onClick={handleParse} className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 text-sm font-medium">Preview</button>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">First name column</label>
                <select value={mapping.first_name} onChange={(e)=>setMapping(m=>({...m, first_name: e.target.value}))} className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mapping.first_name ? 'bg-blue-50 border-blue-400 font-medium' : 'bg-slate-50 border-slate-300'
                }`}>
                  <option value="">Select…</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapping.first_name && <div className="text-xs mt-1 text-green-600"><i className="fas fa-check mr-1"></i>Selected: {mapping.first_name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">Last name column (optional)</label>
                <select value={mapping.last_name} onChange={(e)=>setMapping(m=>({...m, last_name: e.target.value}))} className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mapping.last_name ? 'bg-blue-50 border-blue-400 font-medium' : 'bg-slate-50 border-slate-300'
                }`}>
                  <option value="">Select… (optional)</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapping.last_name && <div className="text-xs mt-1 text-green-600"><i className="fas fa-check mr-1"></i>Selected: {mapping.last_name}</div>}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-slate-700">Phone column (E.164)</label>
                <select value={mapping.phone} onChange={(e)=>setMapping(m=>({...m, phone: e.target.value}))} className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mapping.phone ? 'bg-blue-50 border-blue-400 font-medium' : 'bg-slate-50 border-slate-300'
                }`}>
                  <option value="">Select…</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapping.phone && <div className="text-xs mt-1 text-green-600"><i className="fas fa-check mr-1"></i>Selected: {mapping.phone}</div>}
                <div className={`text-xs mt-2 font-medium ${stats.invalid > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                  Total: {stats.total} • Valid: {stats.valid} • Invalid: {stats.invalid}
                  {stats.invalid > 0 && <div className="mt-1 text-slate-600">Invalid numbers will be skipped (check phone format or scientific notation)</div>}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-medium mb-2 text-slate-700">
                Preview {rows.length > 0 && `(${rows.length} rows)`}
              </div>
              {headers.length === 0 && rows.length === 0 ? (
                <div className="border border-slate-300 rounded-lg p-4 text-center text-sm text-slate-500 bg-slate-50">
                  No data. Upload CSV file or paste CSV data and click Preview.
                  <div className="mt-2 text-xs">
                    <strong>Expected format:</strong><br/>
                    first_name,last_name,phone<br/>
                    John,Doe,233245678910<br/>
                    Jane,Smith,233245678911
                  </div>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-lg max-h-64 overflow-auto bg-white shadow-inner">
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-blue-400 to-blue-500 text-white sticky top-0 z-10">
                      <tr>
                        {headers.map(h => (
                          <th 
                            key={h} 
                            className={`text-left px-2 py-2 border-b border-blue-400 ${
                              mapping.first_name === h || mapping.last_name === h || mapping.phone === h 
                                ? 'bg-blue-600' 
                                : ''
                            }`}
                          >
                            {h || '(empty)'}
                            {mapping.first_name === h && <span className="ml-1 text-xs">✓</span>}
                            {mapping.last_name === h && <span className="ml-1 text-xs">✓</span>}
                            {mapping.phone === h && <span className="ml-1 text-xs">✓</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.length === 0 ? (
                        <tr>
                          <td colSpan={headers.length} className="px-2 py-4 text-center text-slate-500">No rows found</td>
                        </tr>
                      ) : (
                        preview.map((r, i) => {
                          // Highlight rows with selected columns
                          const phone = r[mapping.phone] || ''
                          const phoneValid = mapping.phone ? toE164Digits(phone) : false
                          return (
                            <tr key={i} className={`odd:bg-slate-50 ${!phoneValid && mapping.phone ? 'bg-rose-50' : ''}`}>
                              {headers.map(h => {
                                let cellValue = r[h] || '(empty)'
                                // Convert scientific notation for display
                                if (h === mapping.phone && /[eE]/.test(cellValue)) {
                                  try {
                                    const num = parseFloat(cellValue)
                                    if (!isNaN(num)) {
                                      cellValue = String(Math.round(num))
                                    }
                                  } catch (e) {}
                                }
                                return (
                                  <td 
                                    key={h} 
                                    className={`px-2 py-2 border-b border-slate-200 ${
                                      mapping.first_name === h || mapping.last_name === h || mapping.phone === h 
                                        ? 'font-medium bg-blue-50' 
                                        : ''
                                    }`}
                                  >
                                    {cellValue}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          <button onClick={confirm} disabled={!rows.length || !mapping.first_name || !mapping.phone} className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Import {stats.valid > 0 && `(${stats.valid} contacts)`}
          </button>
        </div>
      </div>
    </div>
  )
}



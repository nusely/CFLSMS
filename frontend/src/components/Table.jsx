export default function Table({ columns, rows, empty = 'No data' }) {
  return (
    <div className="overflow-x-auto border border-blue-200 rounded-xl bg-white shadow-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-blue-400 to-blue-500 text-white">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`text-left px-4 py-3 font-semibold border-b border-blue-400 ${c.className || ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">{empty}</td>
            </tr>
          )}
          {rows.map((row, idx) => (
            <tr key={row.id ?? idx} className="odd:bg-slate-50 hover:bg-blue-50 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 border-b border-slate-200 text-slate-700 ${c.className || ''}`}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


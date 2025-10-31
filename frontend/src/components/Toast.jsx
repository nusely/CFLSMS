import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(id)
  }, [message, duration, onClose])

  if (!message) return null
  const styles = type === 'error' 
    ? 'bg-rose-50 border-rose-300 text-rose-700' 
    : type === 'success' 
    ? 'bg-green-50 border-green-300 text-green-700' 
    : 'bg-blue-50 border-blue-300 text-blue-700'
  return (
    <div className={`fixed top-4 right-4 text-sm px-4 py-3 rounded-lg shadow-lg border ${styles} font-medium z-[9999]`}>{message}</div>
  )
}


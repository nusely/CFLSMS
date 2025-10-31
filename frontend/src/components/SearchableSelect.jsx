import { useState, useRef, useEffect } from 'react'

/**
 * SearchableSelect - A searchable dropdown component
 * @param {Object} props
 * @param {Array} props.options - Array of options { value, label }
 * @param {string|number} props.value - Selected value
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the select is disabled
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Select...', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Filter options based on search term (exclude placeholder option from filtering)
  const filteredOptions = options.filter(opt => {
    if (opt.value === '' || opt.value === null || opt.value === undefined) {
      // Keep placeholder option only if no search term
      return !searchTerm
    }
    return opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Get selected option label
  const selectedOption = options.find(opt => String(opt.value) === String(value))
  const displayValue = selectedOption && selectedOption.value !== '' && selectedOption.value !== null && selectedOption.value !== undefined 
    ? selectedOption.label 
    : placeholder

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex]
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [focusedIndex])

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].value)
        } else if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(prev => Math.max(prev - 1, -1))
        }
        break
      case 'Tab':
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
        break
      default:
        if (!isOpen && e.key.length === 1) {
          setIsOpen(true)
        }
    }
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setFocusedIndex(-1)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? '' : 'text-slate-500'}>{displayValue}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-xs text-slate-400 ml-2`}></i>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = String(option.value) === String(value)
                const isFocused = index === focusedIndex
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : isFocused
                        ? 'bg-blue-50 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && (
                        <i className="fas fa-check text-blue-600"></i>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}



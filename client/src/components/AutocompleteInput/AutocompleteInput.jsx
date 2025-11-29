'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

export default function AutocompleteInput({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Type or select...',
  className = '',
  onBlur,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (inputValue === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(e);
    setIsOpen(true);
  };

  const handleSelectOption = (option) => {
    setInputValue(option);
    onChange({ target: { name: inputRef.current.name, value: option } });
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange({ target: { name: inputRef.current.name, value: '' } });
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e) => {
    // Delay to allow option click to register
    setTimeout(() => {
      setIsOpen(false);
      if (onBlur) {
        onBlur(e);
      }
    }, 200);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="input-field pr-20"
          autoComplete="off"
        />
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 mr-2 p-1"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <div className="text-gray-400 pointer-events-none">
            <FiChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectOption(option)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors"
                >
                  {option}
                </li>
              ))}
            </ul>
          ) : inputValue ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No matches. Press Enter to use "{inputValue}"
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Start typing to see suggestions
            </div>
          )}
        </div>
      )}
    </div>
  );
}


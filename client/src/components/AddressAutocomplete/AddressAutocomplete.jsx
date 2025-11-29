'use client';

import { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiX } from 'react-icons/fi';

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  className = '',
  required = false
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const placesServiceRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    // Load Google Maps API script only if API key is configured
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (inputRef.current) {
            initializeAutocomplete();
          }
        };
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
        };
        document.head.appendChild(script);
      } else if (window.google && inputRef.current) {
        initializeAutocomplete();
      }
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!window.google || !inputRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' } // Restrict to US addresses
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry) {
          // Parse address components
          const addressComponents = place.address_components || [];
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let zipCode = '';

          addressComponents.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              route = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (types.includes('postal_code')) {
              zipCode = component.long_name;
            }
          });

          const fullAddress = place.formatted_address || inputValue;
          const streetAddress = `${streetNumber} ${route}`.trim();

          // Update form with selected address
          if (onAddressSelect) {
            onAddressSelect({
              propertyAddress: streetAddress || fullAddress,
              city,
              state,
              zipCode,
              fullAddress
            });
          }

          setInputValue(fullAddress);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(e);
    setShowSuggestions(true);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange({ target: { name: 'propertyAddress', value: '' } });
    if (onAddressSelect) {
      onAddressSelect({
        propertyAddress: '',
        city: '',
        state: '',
        zipCode: '',
        fullAddress: ''
      });
    }
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FiMapPin className="w-5 h-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          name="propertyAddress"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          required={required}
          className="input-field pl-10 pr-10"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ Google Maps API key not configured. Address autocomplete will not work.
        </p>
      )}
    </div>
  );
}


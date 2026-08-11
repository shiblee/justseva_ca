import React, { useState, useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import Input from './Input';
import './AddressAutocomplete.css';

const AddressAutocomplete = ({ icon, label, value, onChange, onSelect, disabled, style }) => {
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
          console.warn('No Google Maps API Key found.');
          return;
        }

        setOptions({
          key: apiKey,
          version: 'weekly'
        });

        const placesLib = await importLibrary('places');
        setAutocompleteService(new placesLib.AutocompleteService());
        
        // We need a dummy element for PlacesService
        const dummyElement = document.createElement('div');
        setPlacesService(new placesLib.PlacesService(dummyElement));
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
      }
    };
    
    initGoogleMaps();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    
    if (val.trim().length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions({ input: val, componentRestrictions: { country: 'in' } }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      });
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (placeId, mainText) => {
    // Use just the building/street name (main_text), not the full "area, city, state, country" description
    onChange(mainText);
    setIsOpen(false);
    setPredictions([]);

    if (placesService) {
      placesService.getDetails({ placeId, fields: ['address_components', 'geometry', 'formatted_address', 'name'] }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Pass the short main_text as a fallback just in case
          place.descriptionFallback = mainText;
          onSelect(place);
        }
      });
    }
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef} style={style}>
      <Input
        icon={icon}
        label={label}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
      />
      
      {isOpen && predictions.length > 0 && (
        <ul className="suggestions-dropdown">
          {predictions.map((pred) => (
            <li 
              key={pred.place_id} 
              className="suggestion-item"
              onClick={() => handleSelect(pred.place_id, pred.structured_formatting.main_text)}
            >
              <span className="suggestion-main-text">{pred.structured_formatting.main_text}</span>
              <span className="suggestion-secondary-text">{pred.structured_formatting.secondary_text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;

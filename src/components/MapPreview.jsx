import React, { useEffect, useRef } from 'react';
import { importLibrary } from '@googlemaps/js-api-loader';

const MapPreview = ({ lat, lng }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') return;

        const mapsLib = await importLibrary('maps');
        const markerLib = await importLibrary('marker');

        if (!isMounted) return;

        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new mapsLib.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            mapId: 'DEMO_MAP_ID'
          });

          markerRef.current = new markerLib.AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: { lat, lng },
          });
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          if (markerRef.current) {
            markerRef.current.position = { lat, lng };
          }
        }
      } catch (e) {
        console.error("Map initialization failed", e);
      }
    };
    
    initMap();
    
    return () => {
      isMounted = false;
    };
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: '100%', height: '160px', borderRadius: '12px', marginBottom: '12px', background: '#e2e8f0' }} />;
};

export default MapPreview;

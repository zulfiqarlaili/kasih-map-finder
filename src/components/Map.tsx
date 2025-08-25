import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Merchant } from '@/types/merchant';
import { formatAddress, getGoogleMapsUrl } from '@/utils/geoUtils';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface MapProps {
  merchants: Merchant[];
  selectedMerchant?: Merchant | null;
  onMerchantSelect: (merchant: Merchant) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const Map: React.FC<MapProps> = ({ 
  merchants, 
  selectedMerchant, 
  onMerchantSelect, 
  userLocation 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL with OpenStreetMap tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: [101.686855, 3.1390], // Center on Kuala Lumpur, Malaysia
      zoom: 10,
      maxZoom: 18,
      minZoom: 6
    });

    // Add navigation controls
    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl());

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update merchants markers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add merchant markers
    merchants.forEach(merchant => {
      const el = document.createElement('div');
      el.className = 'merchant-marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        background: hsl(var(--map-marker));
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: var(--shadow-elegant);
        transition: var(--transition-smooth);
        z-index: 1000;
        position: relative;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.background = 'hsl(var(--map-hover))';
        el.style.transform = 'scale(1.3)';
        el.style.boxShadow = 'var(--shadow-glow)';
        el.style.zIndex = '2000';
      });

      el.addEventListener('mouseleave', () => {
        el.style.background = selectedMerchant?.merchantId === merchant.merchantId 
          ? 'hsl(var(--accent))' 
          : 'hsl(var(--map-marker))';
        el.style.transform = selectedMerchant?.merchantId === merchant.merchantId ? 'scale(1.2)' : 'scale(1)';
        el.style.boxShadow = 'var(--shadow-elegant)';
        el.style.zIndex = selectedMerchant?.merchantId === merchant.merchantId ? '1500' : '1000';
      });

      el.addEventListener('click', () => {
        onMerchantSelect(merchant);
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([merchant.longitude, merchant.latitude])
        .addTo(map.current!);

      markers.current[merchant.merchantId] = marker;
    });

    // Fit map to show all merchants
    if (merchants.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      merchants.forEach(merchant => {
        bounds.extend([merchant.longitude, merchant.latitude]);
      });
      
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }

      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 14
      });
    }

  }, [merchants, mapLoaded, onMerchantSelect]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Remove existing user marker
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Add user location marker with pulsing animation
    const el = document.createElement('div');
    el.style.cssText = `
      width: 20px;
      height: 20px;
      background: hsl(var(--success));
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: var(--shadow-elegant), 0 0 0 0 hsl(var(--success) / 0.7);
      animation: pulse 2s infinite;
      z-index: 2000;
      position: relative;
    `;
    
    // Add pulsing animation style
    if (!document.getElementById('user-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'user-marker-styles';
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: var(--shadow-elegant), 0 0 0 0 hsl(var(--success) / 0.7); }
          70% { box-shadow: var(--shadow-elegant), 0 0 0 10px hsl(var(--success) / 0); }
          100% { box-shadow: var(--shadow-elegant), 0 0 0 0 hsl(var(--success) / 0); }
        }
      `;
      document.head.appendChild(style);
    }

    userMarker.current = new maplibregl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

  }, [userLocation, mapLoaded]);

  // Handle selected merchant
  useEffect(() => {
    if (!map.current || !selectedMerchant) return;

    // Update marker styles
    Object.entries(markers.current).forEach(([merchantId, marker]) => {
      const el = marker.getElement();
      if (merchantId === selectedMerchant.merchantId) {
        el.style.background = 'hsl(var(--accent))';
        el.style.transform = 'scale(1.4)';
        el.style.zIndex = '1500';
        el.style.boxShadow = 'var(--shadow-glow)';
      } else {
        el.style.background = 'hsl(var(--map-marker))';
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1000';
        el.style.boxShadow = 'var(--shadow-elegant)';
      }
    });

    // Remove existing popup
    if (popup.current) {
      popup.current.remove();
    }

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'p-3 min-w-[280px]';
    popupContent.innerHTML = `
      <div class="space-y-3">
        <h3 class="font-semibold text-primary text-sm leading-tight">
          ${selectedMerchant.tradingName}
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          ${formatAddress(selectedMerchant)}
        </p>
        <button 
          id="google-maps-btn" 
          class="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary-hover transition-colors w-full justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m18 13 6-6-6-6"/>
            <path d="M3 7v10h14l-4-4"/>
          </svg>
          Open in Google Maps
        </button>
      </div>
    `;

    // Add click handler to button
    const button = popupContent.querySelector('#google-maps-btn');
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(
          getGoogleMapsUrl(selectedMerchant.latitude, selectedMerchant.longitude), 
          '_blank',
          'noopener,noreferrer'
        );
      });
    }

    // Create and show popup
    popup.current = new maplibregl.Popup({
      offset: [0, -24],
      closeButton: true,
      closeOnClick: false,
      className: 'merchant-popup'
    })
      .setLngLat([selectedMerchant.longitude, selectedMerchant.latitude])
      .setDOMContent(popupContent)
      .addTo(map.current);

    // Center map on selected merchant
    map.current.flyTo({
      center: [selectedMerchant.longitude, selectedMerchant.latitude],
      zoom: Math.max(map.current.getZoom(), 12),
      duration: 1000
    });

  }, [selectedMerchant]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-elegant overflow-hidden" />
      <style>{`
        .merchant-popup .maplibregl-popup-content {
          border-radius: 16px;
          box-shadow: var(--shadow-elegant);
          border: 1px solid hsl(var(--border) / 0.5);
          padding: 0;
          backdrop-filter: blur(12px);
          background: hsl(var(--card) / 0.95);
        }
        .merchant-popup .maplibregl-popup-close-button {
          color: hsl(var(--muted-foreground));
          font-size: 18px;
          padding: 8px;
          border-radius: 8px;
          transition: var(--transition-smooth);
        }
        .merchant-popup .maplibregl-popup-close-button:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
        .merchant-popup .maplibregl-popup-tip {
          border-top-color: hsl(var(--card) / 0.95);
        }
      `}</style>
    </>
  );
};

export default Map;
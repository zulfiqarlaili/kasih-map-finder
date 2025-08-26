import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Merchant } from '@/types/merchant';
import { formatAddress, getGoogleMapsUrl } from '@/utils/geoUtils';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MerchantFeatureProps = {
  merchantId: string;
  tradingName: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

interface MapProps {
  merchants: Merchant[];
  selectedMerchant?: Merchant | null;
  onMerchantSelect: (merchant: Merchant) => void;
  userLocation?: { lat: number; lng: number } | null;
  onFindNearMe?: () => void;
}

const Map: React.FC<MapProps> = ({ 
  merchants, 
  selectedMerchant, 
  onMerchantSelect, 
  userLocation,
  onFindNearMe
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const popup = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const merchantsSourceId = useRef<string>('merchants-source');
  const merchantsLayerId = useRef<string>('merchants-layer');
  const merchantByIdRef = useRef<Record<string, Merchant>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

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

    // Ensure map resizes correctly when container size changes (e.g., sidebar toggle)
    const handleWindowResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    // Observe container resize changes
    const containerElement = mapContainer.current;
    if (containerElement && 'ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize();
        }
      });
      resizeObserverRef.current.observe(containerElement);
    }

    // Cleanup
    return () => {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch (err) { console.warn('Failed to remove user marker:', err); }
        userMarkerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserverRef.current && containerElement) {
        try {
          resizeObserverRef.current.unobserve(containerElement);
        } catch (err) {
          console.warn('ResizeObserver unobserve failed:', err);
        }
      }
    };
  }, []);

  // Update merchants markers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Ensure merchant pin image is available (Google-style red pin)
    const pinImageId = 'merchant-pin-image';
    if (map.current && !map.current.hasImage(pinImageId)) {
      const merchantPinSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
        '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\
          <path d="M12 2c-4.42 0-8 3.134-8 7.5 0 5.625 8 12.5 8 12.5s8-6.875 8-12.5C20 5.134 16.42 2 12 2z" fill="#EA4335"/>\
          <circle cx="12" cy="9.5" r="3.5" fill="#FFFFFF"/>\
        </svg>'
      )}`;
      const img = new Image(75, 75);
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (map.current) {
          try {
            map.current.addImage(pinImageId, img, { pixelRatio: 2 });
          } catch (err) {
            console.warn('Failed to add merchant pin image:', err);
          }
        }
      };
      img.src = merchantPinSvg;
    }

    // Build GeoJSON from merchants
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, MerchantFeatureProps> = {
      type: 'FeatureCollection',
      features: merchants.map((m) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] },
        properties: {
          merchantId: m.merchantId,
          tradingName: m.tradingName,
          address1: m.address1,
          address2: m.address2,
          address3: m.address3,
          city: m.city,
          state: m.state,
          postalCode: m.postalCode,
          country: (m as unknown as { country?: string }).country,
        }
      }))
    };

    // Keep a fresh lookup to avoid stale closures in event handlers
    merchantByIdRef.current = merchants.reduce<Record<string, Merchant>>((acc, m) => {
      acc[m.merchantId] = m;
      return acc;
    }, {});

    // Add or update source
    if (map.current.getSource(merchantsSourceId.current)) {
      (map.current.getSource(merchantsSourceId.current) as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.current.addSource(merchantsSourceId.current, {
        type: 'geojson',
        data: geojson
      });
    }

    // Add layer if missing
    if (!map.current.getLayer(merchantsLayerId.current)) {
      map.current.addLayer({
        id: merchantsLayerId.current,
        type: 'symbol',
        source: merchantsSourceId.current,
        layout: {
          'icon-image': pinImageId,
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        }
      });

      // Ensure the layer is on top of base layers for hit-testing
      try {
        map.current.moveLayer(merchantsLayerId.current);
      } catch (err) {
        console.warn('moveLayer warning:', err);
      }

      // Cursor feedback
      map.current.on('mouseenter', merchantsLayerId.current, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });
      map.current.on('mouseleave', merchantsLayerId.current, () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Click to select merchant
      map.current.on('click', merchantsLayerId.current, (e) => {
        const feature = e.features && (e.features[0] as unknown as GeoJSON.Feature<GeoJSON.Point, MerchantFeatureProps>);
        if (!feature) return;
        const props = feature.properties as unknown as (MerchantFeatureProps & { country?: string });
        const merchantId = props?.merchantId as string | undefined;
        if (!merchantId) return;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const clickedMerchant: Merchant = {
          merchantId,
          tradingName: props.tradingName,
          address1: props.address1,
          address2: props.address2,
          address3: props.address3,
          city: props.city,
          state: props.state,
          postalCode: props.postalCode,
          country: props.country || '',
          latitude: coords[1],
          longitude: coords[0],
        };
        onMerchantSelect(clickedMerchant);
      });

      // Global map click log to verify map emits clicks
      map.current.on('click', (evt) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(evt.point, { layers: [merchantsLayerId.current] });
        const f = features && (features[0] as unknown as GeoJSON.Feature<GeoJSON.Point, MerchantFeatureProps>);
        const merchantId = f ? (f.properties as unknown as MerchantFeatureProps)?.merchantId : undefined;
        if (merchantId && f) {
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          const p = (f.properties as unknown as (MerchantFeatureProps & { country?: string }));
          const clickedMerchant: Merchant = {
            merchantId,
            tradingName: p.tradingName,
            address1: p.address1,
            address2: p.address2,
            address3: p.address3,
            city: p.city,
            state: p.state,
            postalCode: p.postalCode,
            country: p.country || '',
            latitude: coords[1],
            longitude: coords[0],
          };
          onMerchantSelect(clickedMerchant);
        }
      });
    }
 
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

  }, [merchants, mapLoaded, onMerchantSelect, userLocation]);

  // Show/update current user marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // If no user location, remove existing marker (if any)
    if (!userLocation) {
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch (err) { console.warn('Failed to remove user marker:', err); }
        userMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng } = userLocation;

    // Create marker element (pulsing-dot style)
    const el = document.createElement('div');
    el.className = 'user-location-marker';

    if (!userMarkerRef.current) {
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      // Update position and swap element to keep styles in sync
      userMarkerRef.current.setLngLat([lng, lat]);
      const m = userMarkerRef.current.getElement();
      if (m) m.className = 'user-location-marker';
    }
  }, [userLocation, mapLoaded]);

  // Handle selected merchant
  useEffect(() => {
    if (!map.current || !selectedMerchant) return;

    // Slightly enlarge selected merchant pin
    if (map.current.getLayer(merchantsLayerId.current)) {
      map.current.setLayoutProperty(merchantsLayerId.current, 'icon-size', [
        'case',
        ['==', ['get', 'merchantId'], selectedMerchant.merchantId],
        1.2,
        1
      ]);
    }

    // Remove existing popup
    if (popup.current) {
      popup.current.remove();
    }

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'p-3';
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
      zoom: Math.max(map.current.getZoom(), 15),
      duration: 1000
    });

  }, [selectedMerchant]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full shadow-elegant overflow-hidden" />
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          size="sm"
          className="rounded-full shadow-elegant"
          onClick={() => {
            if (!map.current) return;
            if (userLocation) {
              map.current.resize();
              map.current.easeTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: Math.max(map.current.getZoom(), 15),
                duration: 600
              });
            } else if (onFindNearMe) {
              onFindNearMe();
            }
          }}
          aria-label={userLocation ? 'Center map on my location' : 'Find my location'}
        >
          <MapPin className="w-4 h-4" />
        </Button>
      </div>
      
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
        /* Make DOM markers clearly clickable and above canvas */
        .maplibregl-canvas-container .maplibregl-canvas {
          pointer-events: auto;
        }
        /* Current user marker */
        .user-location-marker {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 0 2px #ffffff, 0 0 12px rgba(26,115,232,0.6);
          background: #1a73e8; /* Google Maps blue */
        }
        .user-location-marker::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #ffffff;
        }
        .user-location-marker::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid rgba(26,115,232,0.45);
          animation: user-pulse 1.8s ease-out infinite;
        }
        @keyframes user-pulse {
          0% { transform: scale(0.8); opacity: 0.9; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default Map;
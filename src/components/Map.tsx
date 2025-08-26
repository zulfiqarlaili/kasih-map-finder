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
  const popup = useRef<maplibregl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const merchantsSourceId = useRef<string>('merchants-source');
  const merchantsLayerId = useRef<string>('merchants-layer');
  const merchantByIdRef = useRef<Record<string, Merchant>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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
        type: 'circle',
        source: merchantsSourceId.current,
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
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

  // Removed user location marker effect per request; recentering is handled by the button below

  // Handle selected merchant
  useEffect(() => {
    if (!map.current || !selectedMerchant) return;

    // Highlight selected merchant via paint expression (bigger + accent color)
    if (map.current.getLayer(merchantsLayerId.current)) {
      map.current.setPaintProperty(merchantsLayerId.current, 'circle-color', [
        'case',
        ['==', ['get', 'merchantId'], selectedMerchant.merchantId],
        '#8b5cf6',
        '#3b82f6'
      ]);
      map.current.setPaintProperty(merchantsLayerId.current, 'circle-radius', [
        'case',
        ['==', ['get', 'merchantId'], selectedMerchant.merchantId],
        10,
        8
      ]);
      map.current.setPaintProperty(merchantsLayerId.current, 'circle-stroke-width', [
        'case',
        ['==', ['get', 'merchantId'], selectedMerchant.merchantId],
        3,
        2
      ]);
      map.current.setPaintProperty(merchantsLayerId.current, 'circle-stroke-color', [
        'case',
        ['==', ['get', 'merchantId'], selectedMerchant.merchantId],
        '#ffffff',
        '#ffffff'
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
      {userLocation && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            size="sm"
            className="rounded-full shadow-elegant"
            onClick={() => {
              if (!map.current || !userLocation) return;
              map.current.resize();
              map.current.easeTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: Math.max(map.current.getZoom(), 15),
                duration: 600
              });
            }}
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      )}
      
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
      `}</style>
    </>
  );
};

export default Map;
import React, { useEffect, useRef, useState } from 'react'

interface MapMarker {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  category: 'stay' | 'eat' | 'visit' | 'roam' | 'transport' | 'rental' | 'agency';
  address?: string;
  rating?: number;
}

interface InteractiveMapProps {
  center: { lat: number; lng: number };
  radiusKm: number;
  markers: MapMarker[];
  activeCategory: string; // 'all' or specific category
  focusedPlace?: any | null;
}

declare global {
  interface Window {
    google: any;
    initMapCallback?: () => void;
  }
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  radiusKm,
  markers,
  activeCategory,
  focusedPlace
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const markersRef = useRef<any[]>([])
  const circleRef = useRef<any>(null)

  // 1. Load Google Maps script dynamically
  useEffect(() => {
    if (window.google && window.google.maps) {
      setGoogleLoaded(true)
      return
    }

    // Check if script is already added
    const existingScript = document.getElementById('google-maps-script')
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setGoogleLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU'
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true)
    }
    document.head.appendChild(script)
  }, [])

  // 2. Initialize Map (only once, or if center changes significantly)
  useEffect(() => {
    if (!googleLoaded || !mapRef.current) return

    const maps = window.google.maps
    
    if (mapInstance) {
      mapInstance.setCenter(center)
      return
    }

    const map = new maps.Map(mapRef.current, {
      center: center,
      zoom: 13,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [{ "visibility": "off" }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    })

    setMapInstance(map)
  }, [googleLoaded, center])

  // 3. Draw Radius Circle and Markers
  useEffect(() => {
    if (!mapInstance) return

    const maps = window.google.maps

    // Remove old circle
    if (circleRef.current) {
      circleRef.current.setMap(null)
    }

    // Draw new circle
    circleRef.current = new maps.Circle({
      strokeColor: '#E07A5F', // Terra cotta
      strokeOpacity: 0.7,
      strokeWeight: 1.5,
      fillColor: '#E07A5F',
      fillOpacity: 0.08,
      map: mapInstance,
      center: center,
      radius: radiusKm * 1000
    })

    // Remove old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    // Info Window instance (singleton)
    const infoWindow = new maps.InfoWindow()

    // Filter markers based on activeCategory
    const filteredMarkers = markers.filter(m => 
      activeCategory === 'all' || m.category === activeCategory
    )

    // Category Color Mapping
    const getMarkerColor = (cat: string) => {
      switch (cat) {
        case 'stay': return '#3D5A50'; // Forest Green
        case 'eat': return '#E07A5F'; // Terra Cotta
        case 'visit': return '#4A90E2'; // Blue
        case 'roam': return '#8B572A'; // Brown
        case 'transport': return '#7C5295'; // Purple
        case 'rental': return '#F5A623'; // Orange-Yellow
        case 'agency': return '#9B9B9B'; // Gray
        default: return '#D56D49';
      }
    }

    // Plot markers
    filteredMarkers.forEach(item => {
      const pinColor = getMarkerColor(item.category)
      
      // Create custom pin svg icon
      const pinIcon = {
        path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: pinColor,
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 6,
      }

      const marker = new maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: mapInstance,
        title: item.name,
        icon: pinIcon,
        animation: maps.Animation.DROP
      })

      // Click to open info window function
      const openInfoWindow = () => {
        const content = `
          <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 220px;">
            <h4 style="font-weight: 700; margin: 0 0 4px; font-family: 'Outfit'; color: #151F1B; font-size: 14px;">${item.name}</h4>
            <div style="text-transform: uppercase; font-size: 10px; font-weight: 700; color: ${pinColor}; margin-bottom: 6px;">
              ${item.category}
            </div>
            ${item.rating ? `<div style="font-size: 12px; font-weight: 600; color: #F5A623; margin-bottom: 4px;">★ ${item.rating} / 5</div>` : ''}
            ${item.address ? `<p style="font-size: 11px; color: #4A4A4A; margin: 0; line-height: 1.4;">${item.address}</p>` : ''}
          </div>
        `
        infoWindow.setContent(content)
        infoWindow.open(mapInstance, marker)
      }

      marker.addListener('click', openInfoWindow)
      
      // Store reference properties
      marker.set('placeId', item.place_id)
      marker.set('openInfoWindow', openInfoWindow)

      markersRef.current.push(marker)
    })

    // Adjust zoom and bounds to show the entire circle (only if we have no focused place)
    if (!focusedPlace && circleRef.current) {
      const bounds = circleRef.current.getBounds()
      if (bounds) {
        mapInstance.fitBounds(bounds)
      }
    }
  }, [mapInstance, markers, activeCategory, center, radiusKm])

  // 4. Handle Focused Place (pan, zoom, and open InfoWindow)
  useEffect(() => {
    if (!mapInstance || !googleLoaded) return

    if (focusedPlace) {
      // Pan and zoom to focused place
      mapInstance.panTo({ lat: focusedPlace.lat, lng: focusedPlace.lng })
      mapInstance.setZoom(16)

      // Find matching marker and trigger info window
      const matchingMarker = markersRef.current.find(
        m => m.get('placeId') === focusedPlace.place_id
      )
      if (matchingMarker) {
        const openFn = matchingMarker.get('openInfoWindow')
        if (typeof openFn === 'function') {
          setTimeout(() => {
            openFn()
          }, 300)
        }
      }
    } else {
      // Recenter to show the entire circle
      if (circleRef.current) {
        const bounds = circleRef.current.getBounds()
        if (bounds) {
          mapInstance.fitBounds(bounds)
        }
      }
    }
  }, [mapInstance, googleLoaded, focusedPlace])

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-inner border border-travel-200 min-h-[400px]">
      {!googleLoaded && (
        <div className="absolute inset-0 bg-travel-50 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-travel-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-forest-700">Loading Interactive Map...</span>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

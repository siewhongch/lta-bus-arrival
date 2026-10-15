import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStop, LiveBusVehicle } from '../types/bus';
import { SINGAPORE_BUS_STOPS, SINGAPORE_HOTSPOTS, BUS_SERVICES_DATABASE } from '../data/singaporeBusesData';
import { LTAService } from '../services/ltaService';
import { Crosshair, Navigation, RefreshCw, Layers, MapPin, Bus, AlertCircle } from 'lucide-react';

interface LiveMapProps {
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  activeServiceNo?: string | null;
  onSelectService?: (serviceNo: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  selectedStop,
  onSelectStop,
  activeServiceNo,
  onSelectService,
  userCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const busVehiclesLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [liveVehicles, setLiveVehicles] = useState<LiveBusVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<LiveBusVehicle | null>(null);
  const [activeFilterService, setActiveFilterService] = useState<string>(activeServiceNo || 'ALL');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Central Singapore
    const initialLat = selectedStop ? selectedStop.Latitude : 1.30058;
    const initialLng = selectedStop ? selectedStop.Longitude : 103.85611;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // Clean, modern CartoDB Positron / OSM tiles for transit clarity
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const stopsLayer = L.layerGroup().addTo(map);
    const busLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = stopsLayer;
    busVehiclesLayerRef.current = busLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update live vehicle positions periodically
  useEffect(() => {
    const updateVehicles = () => {
      const vehicles = LTAService.getLiveVehicles(activeFilterService === 'ALL' ? undefined : activeFilterService);
      setLiveVehicles(vehicles);
    };

    updateVehicles();
    const interval = setInterval(updateVehicles, 3000);
    return () => clearInterval(interval);
  }, [activeFilterService]);

  // Synchronize active service prop with filter
  useEffect(() => {
    if (activeServiceNo) {
      setActiveFilterService(activeServiceNo);
    }
  }, [activeServiceNo]);

  // Draw Bus Stops on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    SINGAPORE_BUS_STOPS.forEach(stop => {
      const isSelected = selectedStop?.BusStopCode === stop.BusStopCode;

      // Custom DivIcon for Bus Stop
      const stopHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform ${
            isSelected
              ? 'bg-slate-900 text-white ring-4 ring-emerald-400 scale-125 z-30'
              : 'bg-white text-slate-800 border-2 border-slate-700 hover:scale-110 z-10'
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.2 6H5.8C4.8 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"></path>
              <circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle>
            </svg>
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] font-mono px-1 rounded whitespace-nowrap pointer-events-none shadow-xs">
            ${stop.BusStopCode}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: stopHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectStop(stop);
        map.panTo([stop.Latitude, stop.Longitude], { animate: true });
      });

      layer.addLayer(marker);
    });
  }, [selectedStop, onSelectStop]);

  // Draw Live Moving Buses
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = busVehiclesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    liveVehicles.forEach(veh => {
      const loadColor = {
        SEA: 'bg-emerald-500 border-emerald-600',
        SDA: 'bg-amber-500 border-amber-600',
        LSD: 'bg-rose-500 border-rose-600',
      }[veh.load];

      const busHtml = `
        <div class="relative cursor-pointer transition-transform duration-700 ease-out">
          <div class="flex items-center gap-1 px-2 py-1 bg-slate-900 text-white rounded-lg shadow-lg border-2 ${loadColor} hover:scale-110">
            <span class="font-mono font-bold text-xs">${veh.serviceNo}</span>
            <span class="text-[9px] font-semibold opacity-80 uppercase">${veh.busType}</span>
            <div style="transform: rotate(${veh.heading}deg)" class="transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: busHtml,
        iconSize: [52, 26],
        iconAnchor: [26, 13],
      });

      const marker = L.marker([veh.currentLat, veh.currentLng], { icon: busIcon });

      marker.on('click', () => {
        setSelectedVehicle(veh);
        if (onSelectService) {
          onSelectService(veh.serviceNo);
        }
      });

      layer.addLayer(marker);
    });
  }, [liveVehicles, onSelectService]);

  // Draw Route Polyline if service selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeFilterService && activeFilterService !== 'ALL') {
      const detail = BUS_SERVICES_DATABASE[activeFilterService];
      if (detail && detail.Direction1Stops.length > 1) {
        const coords: [number, number][] = detail.Direction1Stops.map(s => [s.Latitude, s.Longitude]);
        const polyline = L.polyline(coords, {
          color: '#059669', // Emerald transit path
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;
      }
    }
  }, [activeFilterService]);

  // Center on Selected Stop
  useEffect(() => {
    if (selectedStop && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedStop.Latitude, selectedStop.Longitude], 15, {
        animate: true,
      });
    }
  }, [selectedStop]);

  // Preset Jump Handler
  const handleJumpToHotspot = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
    }
  };

  // Center on User GPS
  const handleCenterOnUser = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 16, { animate: true });
    } else if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16, { animate: true });
      });
    }
  };

  return (
    <div className="relative w-full h-[580px] lg:h-[640px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Service Filter Selector */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 p-1.5 flex items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-500 pl-2 pr-1">Filter Service:</span>
          {['ALL', '65', '190', '14', '7', '147', '960'].map(srv => (
            <button
              key={srv}
              onClick={() => setActiveFilterService(srv)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-xl transition-all ${
                activeFilterService === srv
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {srv}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleCenterOnUser}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
            title="Recenter on current GPS position"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Hotspot Ribbon */}
      <div className="absolute bottom-4 left-4 right-16 z-20 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 overflow-x-auto max-w-full no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 pl-2 pr-1 shrink-0">Hotspots:</span>
          {SINGAPORE_HOTSPOTS.slice(0, 6).map(spot => (
            <button
              key={spot.id}
              onClick={() => handleJumpToHotspot(spot.lat, spot.lng)}
              className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg whitespace-nowrap transition-colors shrink-0"
            >
              {spot.name.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Live Vehicle Info Drawer */}
      {selectedVehicle && (
        <div className="absolute top-16 right-4 z-20 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3.5 animate-in fade-in slide-in-from-right-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-mono font-bold text-base">
                {selectedVehicle.serviceNo}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{selectedVehicle.plateNumber}</div>
                <div className="text-[11px] text-slate-500">{selectedVehicle.operator} · {selectedVehicle.busType === 'DD' ? 'Double Deck' : 'Single Deck'}</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
            >
              &times;
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Speed</span>
              <span className="font-mono font-medium text-slate-800">{selectedVehicle.speed} km/h</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Crowd Level</span>
              <span className="font-medium text-slate-800">
                {selectedVehicle.load === 'SEA' ? 'Seats Available' : selectedVehicle.load === 'SDA' ? 'Standing Only' : 'Limited Space'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Next Stop</span>
              <span className="text-slate-800 font-medium truncate block">
                {selectedVehicle.nextStopDesc} ({selectedVehicle.nextStopCode})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

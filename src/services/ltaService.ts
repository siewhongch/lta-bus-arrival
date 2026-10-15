import { BusArrivalResponse, BusArrivalService, BusStop, BusTiming, LiveBusVehicle, BusLoad, BusType, BusOperator } from '../types/bus';
import { SINGAPORE_BUS_STOPS, BUS_SERVICES_DATABASE } from '../data/singaporeBusesData';

// Haversine formula to compute distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate deterministic yet living pseudo-random arrival times based on current timestamp
function generateSimulatedTiming(
  serviceNo: string,
  stopCode: string,
  busIndex: 1 | 2 | 3,
  baseMinutes: number
): BusTiming {
  const now = Date.now();
  // Hash seed for consistent cycle
  const hash = (serviceNo.charCodeAt(0) * 17 + (parseInt(stopCode, 10) || 1) * 31 + busIndex * 97) % 100;
  
  // Cycle repeats every ~10-15 minutes
  const cycleSeconds = (baseMinutes * 60 + (hash % 120)) - Math.floor((now / 1000) % (baseMinutes * 60 + 120));
  const normalizedSeconds = Math.max(0, cycleSeconds);
  const arrivalDate = new Date(now + normalizedSeconds * 1000);
  const estimatedMinutes = Math.floor(normalizedSeconds / 60);

  // Operator lookup
  const detail = BUS_SERVICES_DATABASE[serviceNo];
  const operator: BusOperator = detail?.Operator || (parseInt(serviceNo, 10) % 2 === 0 ? 'SBST' : 'SMRT');

  // Load calculation
  let load: BusLoad = 'SEA';
  if ((hash + busIndex * 3) % 5 === 0) load = 'LSD';
  else if ((hash + busIndex * 2) % 3 === 0) load = 'SDA';

  // Bus Type
  const busType: BusType = serviceNo === '190' || serviceNo === '65' || serviceNo === '14' 
    ? (hash % 3 === 0 ? 'SD' : 'DD') 
    : (hash % 4 === 0 ? 'BD' : 'SD');

  // SG plate formatting
  const prefix = operator === 'SMRT' ? 'SMB' : operator === 'GAS' ? 'SG' : 'SBS';
  const plateNum = `${prefix} ${1000 + (hash * 13 + busIndex * 101) % 8999} ${(hash % 2 === 0 ? 'R' : 'K')}`;

  return {
    OriginCode: detail?.OriginCode || '01012',
    DestinationCode: detail?.DestinationCode || '14121',
    EstimatedArrival: arrivalDate.toISOString(),
    Latitude: '1.2989',
    Longitude: '103.8459',
    VisitNumber: '1',
    Load: load,
    Feature: 'WAB',
    Type: busType,
    estimatedMinutes,
    isArr: estimatedMinutes <= 1,
    speedKmH: 20 + (hash % 30),
    plateNumber: plateNum,
  };
}

export class LTAService {
  private static backendUrlKey = 'SG_BUS_BACKEND_URL';
  private static favoritesKey = 'SG_BUS_FAVORITES_V1';

  public static getCustomBackendUrl(): string | null {
    return localStorage.getItem(this.backendUrlKey);
  }

  public static setCustomBackendUrl(url: string | null) {
    if (url) {
      localStorage.setItem(this.backendUrlKey, url.trim());
    } else {
      localStorage.removeItem(this.backendUrlKey);
    }
  }

  /**
   * Fetch arrival timings for a given 5-digit bus stop code.
   * Tries the /api/busarrival serverless endpoint first (or user custom URL).
   * If LTA AccountKey is not yet set or endpoint errors, gracefully falls back
   * to the high-fidelity LTA simulation engine.
   */
  public static async fetchBusArrivals(busStopCode: string): Promise<BusArrivalResponse> {
    const customUrl = this.getCustomBackendUrl() || '/api/busarrival';
    try {
      const fullUrl = customUrl.includes('?') 
        ? `${customUrl}&BusStopCode=${encodeURIComponent(busStopCode)}` 
        : `${customUrl}?BusStopCode=${encodeURIComponent(busStopCode)}`;
      const res = await fetch(fullUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.Services)) {
          return this.processArrivalPayload(data, busStopCode);
        }
      }
    } catch (err) {
      // Graceful fallback to simulation engine when offline or serverless cold
    }

    // Default simulation engine conforming to LTA DataMall v2/v3
    return this.simulateArrivalsForStop(busStopCode);
  }

  private static processArrivalPayload(data: any, busStopCode: string): BusArrivalResponse {
    const services: BusArrivalService[] = (data.Services || []).map((srv: any) => {
      const calcMin = (timing?: any): BusTiming => {
        if (!timing || !timing.EstimatedArrival) {
          return {
            OriginCode: '',
            DestinationCode: '',
            EstimatedArrival: '',
            Latitude: '',
            Longitude: '',
            VisitNumber: '',
            Load: 'SEA',
            Feature: 'WAB',
            Type: 'SD',
            estimatedMinutes: 999,
          };
        }
        const diffMs = new Date(timing.EstimatedArrival).getTime() - Date.now();
        const mins = Math.max(0, Math.round(diffMs / 60000));
        return {
          ...timing,
          estimatedMinutes: mins,
          isArr: mins <= 1,
        };
      };

      return {
        ServiceNo: srv.ServiceNo,
        Operator: srv.Operator || 'SBST',
        NextBus: calcMin(srv.NextBus),
        NextBus2: calcMin(srv.NextBus2),
        NextBus3: calcMin(srv.NextBus3),
      };
    });

    return {
      BusStopCode: busStopCode,
      Services: services,
    };
  }

  private static simulateArrivalsForStop(busStopCode: string): BusArrivalResponse {
    const stop = SINGAPORE_BUS_STOPS.find(s => s.BusStopCode === busStopCode);
    const serviceList = stop ? stop.services : ['65', '190', '14', '7'];

    const services: BusArrivalService[] = serviceList.map((serviceNo, idx) => {
      const detail = BUS_SERVICES_DATABASE[serviceNo];
      const base1 = (idx * 2) % 6 + 1;
      const base2 = base1 + 7 + (idx % 3);
      const base3 = base2 + 9 + (idx % 4);

      return {
        ServiceNo: serviceNo,
        Operator: detail?.Operator || (parseInt(serviceNo, 10) % 2 === 0 ? 'SBST' : 'SMRT'),
        category: detail?.Category || 'Trunk',
        NextBus: generateSimulatedTiming(serviceNo, busStopCode, 1, base1),
        NextBus2: generateSimulatedTiming(serviceNo, busStopCode, 2, base2),
        NextBus3: generateSimulatedTiming(serviceNo, busStopCode, 3, base3),
      };
    });

    // Sort services naturally (numerical order)
    services.sort((a, b) => {
      const numA = parseInt(a.ServiceNo, 10);
      const numB = parseInt(b.ServiceNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.ServiceNo.localeCompare(b.ServiceNo);
    });

    return {
      BusStopCode: busStopCode,
      Services: services,
    };
  }

  /**
   * Search bus stops by code, road name, description, or service number
   */
  public static searchBusStops(query: string): BusStop[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return SINGAPORE_BUS_STOPS;

    return SINGAPORE_BUS_STOPS.filter(stop => {
      return (
        stop.BusStopCode.toLowerCase().includes(clean) ||
        stop.RoadName.toLowerCase().includes(clean) ||
        stop.Description.toLowerCase().includes(clean) ||
        stop.services.some(srv => srv.toLowerCase() === clean) ||
        (stop.mrtConnections && stop.mrtConnections.some(mrt => mrt.toLowerCase().includes(clean)))
      );
    });
  }

  /**
   * Find nearby bus stops ordered by walking distance from coordinates
   */
  public static getNearbyBusStops(lat: number, lng: number, maxRadiusMeters: number = 2500): BusStop[] {
    return SINGAPORE_BUS_STOPS
      .map(stop => {
        const distanceMeters = getDistanceMeters(lat, lng, stop.Latitude, stop.Longitude);
        return {
          ...stop,
          distanceMeters,
        };
      })
      .filter(stop => stop.distanceMeters <= maxRadiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Generate live moving bus vehicles for active map tracking
   */
  public static getLiveVehicles(selectedService?: string): LiveBusVehicle[] {
    const vehicles: LiveBusVehicle[] = [];
    const now = Date.now();

    const servicesToSimulate = selectedService ? [selectedService] : Object.keys(BUS_SERVICES_DATABASE);

    servicesToSimulate.forEach(serviceNo => {
      const detail = BUS_SERVICES_DATABASE[serviceNo];
      if (!detail) return;

      const stops = detail.Direction1Stops;
      if (stops.length < 2) return;

      // Simulate 2-3 buses per service
      for (let i = 0; i < 2; i++) {
        const seed = (serviceNo.charCodeAt(0) * 23 + i * 47);
        const cycleProgress = ((now / 15000) + seed * 0.1) % (stops.length - 1);
        const currentSegmentIndex = Math.floor(cycleProgress);
        const segmentFraction = cycleProgress - currentSegmentIndex;

        const stopA = stops[currentSegmentIndex];
        const stopB = stops[currentSegmentIndex + 1];

        const curLat = stopA.Latitude + (stopB.Latitude - stopA.Latitude) * segmentFraction;
        const curLng = stopA.Longitude + (stopB.Longitude - stopA.Longitude) * segmentFraction;

        // Angle heading
        const dLat = stopB.Latitude - stopA.Latitude;
        const dLng = stopB.Longitude - stopA.Longitude;
        const headingDeg = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

        const loadOptions: BusLoad[] = ['SEA', 'SEA', 'SDA', 'LSD'];
        const busTypeOptions: BusType[] = ['SD', 'DD', 'DD'];

        vehicles.push({
          id: `BUS_${serviceNo}_${i}`,
          serviceNo,
          operator: detail.Operator,
          currentLat: Number(curLat.toFixed(5)),
          currentLng: Number(curLng.toFixed(5)),
          heading: headingDeg,
          speed: Math.round(25 + Math.sin(now / 5000 + i) * 12),
          load: loadOptions[(seed + i) % loadOptions.length],
          busType: busTypeOptions[(seed + i) % busTypeOptions.length],
          isWAB: true,
          plateNumber: `${detail.Operator === 'SMRT' ? 'SMB' : 'SBS'} ${2000 + (seed % 7000)} P`,
          nextStopCode: stopB.BusStopCode,
          nextStopDesc: stopB.Description,
          estimatedSecsToNext: Math.max(10, Math.round((1 - segmentFraction) * 180)),
          direction: 1,
        });
      }
    });

    return vehicles;
  }

  // Favorites Local Storage Helpers
  public static getFavorites(): string[] {
    try {
      const data = localStorage.getItem(this.favoritesKey);
      return data ? JSON.parse(data) : ['01012', '09048', '08057'];
    } catch {
      return ['01012', '09048', '08057'];
    }
  }

  public static toggleFavorite(busStopCode: string): string[] {
    const list = this.getFavorites();
    const index = list.indexOf(busStopCode);
    let updated: string[];
    if (index >= 0) {
      updated = list.filter(code => code !== busStopCode);
    } else {
      updated = [busStopCode, ...list];
    }
    localStorage.setItem(this.favoritesKey, JSON.stringify(updated));
    return updated;
  }
}

/**
 * LTA DataMall Standard Bus Arrival and Transport Types
 * Compatible with LTA DataMall API v2/v3
 */

export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available | Standing Available | Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck | Double Deck | Bendy
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible Bus
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface BusTiming {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO 8601 UTC timestamp
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
  // Derived/computed fields for frontend display
  estimatedMinutes?: number;
  isArr?: boolean;
  speedKmH?: number;
  plateNumber?: string;
}

export interface BusArrivalService {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: BusTiming;
  NextBus2: BusTiming;
  NextBus3: BusTiming;
  // Meta
  category?: 'Trunk' | 'Feeder' | 'Express' | 'City Direct';
}

export interface BusArrivalResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  Services: BusArrivalService[];
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  region: 'Central' | 'East' | 'North' | 'North-East' | 'West';
  mrtConnections?: string[]; // e.g. ['NS24', 'NE6', 'CC1']
  services: string[];
  distanceMeters?: number; // Calculated relative to user's location
}

export interface BusRouteStop {
  BusStopCode: string;
  StopSequence: number;
  Distance: number; // in km
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

export interface BusServiceDetail {
  ServiceNo: string;
  Operator: BusOperator;
  Category: 'Trunk' | 'Feeder' | 'Express' | 'City Direct';
  OriginCode: string;
  DestinationCode: string;
  Direction1Name: string;
  Direction2Name?: string;
  Direction1Stops: BusRouteStop[];
  Direction2Stops?: BusRouteStop[];
  AM_Peak_Freq: string; // e.g. "05-08" mins
  AM_Offpeak_Freq: string; // e.g. "08-12" mins
  PM_Peak_Freq: string;
  PM_Offpeak_Freq: string;
  FirstBusWeekday: string;
  LastBusWeekday: string;
}

export interface LiveBusVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  currentLat: number;
  currentLng: number;
  heading: number; // degrees 0-360
  speed: number; // km/h
  load: BusLoad;
  busType: BusType;
  isWAB: boolean;
  plateNumber: string;
  nextStopCode: string;
  nextStopDesc: string;
  estimatedSecsToNext: number;
  direction: 1 | 2;
}

export interface FavoriteStop {
  id: string;
  busStopCode: string;
  customLabel?: string;
  pinnedServices?: string[];
  addedAt: number;
}

export interface CommuteAlarm {
  id: string;
  busStopCode: string;
  busStopDesc: string;
  serviceNo: string;
  notifyMinutesBefore: number;
  triggered: boolean;
}

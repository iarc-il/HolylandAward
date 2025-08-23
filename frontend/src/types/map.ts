export interface LatLng {
  lat: number;
  lng: number;
}

export interface Area {
  name: string;
  coords: LatLng[];
  center: LatLng;
  poly?: unknown; // google.maps.Polygon - will be typed when maps loads
}

export interface QSOData {
  call: string;
  lat: number;
  lng: number;
  area?: string;
  square?: string;
}

export interface MapConstants {
  northLat: number;
  southLat: number;
  westLng: number;
  eastLng: number;
  latSquareSize: number;
  lngSquareSize: number;
}

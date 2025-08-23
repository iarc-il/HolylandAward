import { MapConstants, Area } from '../types/map';

// Map constants from the original AreasUI
export const MAP_CONSTANTS: MapConstants = {
  northLat: 33.383,
  southLat: 29.426,
  westLng: 34.245,
  eastLng: 35.9682,
  latSquareSize: (29.426 - 33.383) / 44,
  lngSquareSize: (35.9682 - 34.245) / 16,
};

export const getLatIndex = (lat: number): number => {
  const latIndex = (lat - MAP_CONSTANTS.northLat) * (1 / MAP_CONSTANTS.latSquareSize);
  return parseInt(latIndex.toString());
};

export const getLngIndex = (lng: number): number => {
  const lngIndex = (lng - MAP_CONSTANTS.westLng) * (1 / MAP_CONSTANTS.lngSquareSize);
  return parseInt(lngIndex.toString());
};

export const getSquareByLatLng = (lat: number, lng: number): string => {
  const latProjection = getLatIndex(lat);
  let lngProjection = getLngIndex(lng);

  let latStr = latProjection.toString();
  if (latProjection < 10) {
    latStr = '0' + latProjection;
  }
  
  if (lngProjection > 7) lngProjection++;
  const lngStr = String.fromCharCode(65 + lngProjection);
  
  return lngStr + latStr;
};

export const getRegionByLatLng = (lat: number, lng: number, areas: Area[]): Area | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).google === 'undefined' || !(window as any).google.maps?.geometry?.poly) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const point = new (window as any).google.maps.LatLng(lat, lng);
  
  for (const area of areas) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (area.poly && (window as any).google.maps.geometry.poly.containsLocation(point, area.poly)) {
      return area;
    }
  }
  return undefined;
};

export const getAreaByLatLng = (lat: number, lng: number, areas: Area[]): string => {
  const square = getSquareByLatLng(lat, lng);
  const region = getRegionByLatLng(lat, lng, areas);
  return square + (region?.name || 'XX');
};

export const parseQSOCode = (code: string): { numberIndex: number; letterIndex: number; areaName: string } | null => {
  const match = code.match(/^([A-Z])(\d\d)([A-Z]{2})$/);
  if (!match) {
    return null;
  }

  const [, letter, numberStr, suffix] = match;

  // Alphabet index (skipping 'I')
  const alphabet = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'; // Note: 'I' is skipped
  const letterIndex = alphabet.indexOf(letter.toUpperCase());
  if (letterIndex === -1) {
    return null;
  }

  // Parse number
  const numberIndex = parseInt(numberStr, 10);

  return { numberIndex, letterIndex, areaName: suffix };
};

export const parsePosition = (lat: number, lng: number): string => {
  // QTH locator calculation from the original code
  const ychr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ynum = "0123456789";
  let y = 0;
  const ycalc = [0, 0, 0];
  const yn = [0, 0, 0, 0, 0, 0, 0];

  ycalc[1] = lng + 180;
  ycalc[2] = lat + 90;

  for (let yi = 1; yi < 3; ++yi) {
    for (let yk = 1; yk < 4; ++yk) {
      let ydiv: number;
      let yres: number;
      let ylp: number;

      if (yk !== 3) {
        if (yi === 1) {
          ydiv = yk === 1 ? 20 : 2;
        } else {
          ydiv = yk === 1 ? 10 : 1;
        }

        yres = ycalc[yi] / ydiv;
        ycalc[yi] = yres;
        ylp = ycalc[yi] > 0 ? Math.floor(yres) : Math.ceil(yres);
        ycalc[yi] = (ycalc[yi] - ylp) * ydiv;
      } else {
        ydiv = yi === 1 ? 12 : 24;
        yres = ycalc[yi] * ydiv;
        ycalc[yi] = yres;
        ylp = ycalc[yi] > 0 ? Math.floor(yres) : Math.ceil(yres);
      }

      ++y;
      yn[y] = ylp;
    }
  }

  const yqth = ychr.charAt(yn[1]) + ychr.charAt(yn[4]) + ynum.charAt(yn[2]) +
              ynum.charAt(yn[5]) + ychr.charAt(yn[3]) + ychr.charAt(yn[6]);

  return yqth;
};

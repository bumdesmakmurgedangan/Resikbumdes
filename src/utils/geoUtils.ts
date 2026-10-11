/**
 * Utility functions for parsing and validating geographic coordinates
 * and Google Maps URLs.
 */

export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validates whether latitude and longitude are within standard geographical bounds.
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Parses Google Maps links, raw coordinate strings, or DMS formats
 * and extracts latitude and longitude.
 *
 * Supported formats:
 * 1. Raw coordinates: "-7.3885, 112.7214" or "-7.3885,112.7214" or "-7.3885 112.7214"
 * 2. URL @format: "https://www.google.com/maps/@-7.3885000,112.7214000,17z"
 * 3. URL query parameter: "https://maps.google.com/?q=-7.3885,112.7214" or "query=-7.3885,112.7214"
 * 4. URL protobuf format: "!3d-7.3885!4d112.7214"
 * 5. DMS format: "7°23'18.6"S 112°43'17.0"E"
 */
export function parseGoogleMapsLocation(input: any): ParsedCoordinates | null {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;

  // 1. Google Maps URL with @lat,lng (e.g. /@-7.3885,112.7214,17z)
  const atMatch = str.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 2. Google Maps URL query params: q=, query=, destination=, ll=, center=
  const queryMatch = str.match(/[?&](?:q|query|destination|ll|center)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 3. Google Maps protobuf format: !3d<lat>!4d<lng>
  const dataMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 4. Raw coordinate pair: "-7.3885, 112.7214" or "(-7.3885, 112.7214)" or "[-7.3885, 112.7214]"
  const cleanCoordStr = str.replace(/[()[\]]/g, '').trim();
  const coordMatch = cleanCoordStr.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 5. Raw coordinate pair inside longer text
  const textCoordMatch = str.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (textCoordMatch) {
    const lat = parseFloat(textCoordMatch[1]);
    const lng = parseFloat(textCoordMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 6. DMS (Degrees, Minutes, Seconds): 7°23'18.6"S 112°43'17.0"E
  const dmsMatch = str.match(/(\d+)°(\d+)'([\d.]+)"?\s*([NSns])[,\s]+(\d+)°(\d+)'([\d.]+)"?\s*([EWew])/);
  if (dmsMatch) {
    let lat = parseInt(dmsMatch[1], 10) + parseInt(dmsMatch[2], 10) / 60 + parseFloat(dmsMatch[3]) / 3600;
    if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
    let lng = parseInt(dmsMatch[5], 10) + parseInt(dmsMatch[6], 10) / 60 + parseFloat(dmsMatch[7]) / 3600;
    if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

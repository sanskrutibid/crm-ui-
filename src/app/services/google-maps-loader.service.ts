import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ParsedAddress {
  formattedAddress: string;
  premise: string;
  route?: string;
  streetNumber?: string;
  sublocality: string;
  locality: string;
  city: string;
  taluka: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    google?: any;
    __initGoogleMapsCallback?: () => void;
    gm_authFailure?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<any> | null = null;
  private geocoder: any = null;

  /**
   * Checks whether a valid official Google Cloud Maps API key is configured.
   * Google Maps API keys start with 'AIzaSy' and are 39 characters long.
   */
  hasValidKey(): boolean {
    const key = (environment as any).googleMapsApiKey;
    return !!(key && typeof key === 'string' && key.trim().startsWith('AIzaSy'));
  }

  /**
   * Generates a genuine Google Maps Embed URL (100% free, no API key needed).
   * Supports coordinates, village, district, tehsil, and addresses.
   */
  getEmbedUrl(query: string, layer: 'roadmap' | 'satellite' | 'hybrid' = 'roadmap', zoom: number = 15): string {
    const cleanQuery = (query && query.trim()) ? query.trim() : 'Nagpur, Maharashtra, India';
    const mapType = (layer === 'satellite' || layer === 'hybrid') ? 'k' : '';
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  /**
   * Dynamically loads Google Maps JavaScript SDK with Places & Geometry libraries.
   * NOTE: `loading=async` is intentionally NOT used. With that flag, google.maps.Geocoder
   * is not available until importLibrary() is called, which made the code silently
   * fall back to OpenStreetMap (Nominatim) and return inexact addresses.
   */
  load(): Promise<any> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window is undefined'));
    }

    // Suppress Google Maps browser alert modal dialog if key fails or is invalid
    window.gm_authFailure = () => {
      console.warn('Google Maps JS API key is missing, invalid or restricted. Check key, billing and enabled APIs.');
    };

    if (window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }

    if (!this.hasValidKey()) {
      // Official API key is not yet provided. Return null safely so embed map is used without breaking.
      return Promise.resolve(null);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }

      const existingScript = (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') ||
        document.getElementById('google-maps-sdk-script')) as HTMLScriptElement;

      if (existingScript) {
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 50;
          if (window.google && window.google.maps) {
            clearInterval(interval);
            resolve(window.google.maps);
          } else if (elapsed > 15000) {
            clearInterval(interval);
            resolve(window.google && window.google.maps ? window.google.maps : null);
          }
        }, 50);

        existingScript.addEventListener('load', () => {
          if (window.google && window.google.maps) {
            clearInterval(interval);
            resolve(window.google.maps);
          }
        });
        existingScript.addEventListener('error', () => {
          clearInterval(interval);
          this.loadPromise = null;
          resolve(null);
        });
        return;
      }

      // Inject script with official key
      const apiKey = (environment as any).googleMapsApiKey;
      const script = document.createElement('script');
      script.id = 'google-maps-sdk-script';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;

      window.__initGoogleMapsCallback = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        }
      };

      const keyParam = apiKey ? `key=${encodeURIComponent(apiKey)}&` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}libraries=places,geometry&callback=__initGoogleMapsCallback`;

      script.onload = () => {
        let retries = 0;
        const check = setInterval(() => {
          retries++;
          if (window.google && window.google.maps) {
            clearInterval(check);
            resolve(window.google.maps);
          } else if (retries > 30) {
            clearInterval(check);
            resolve(window.google && window.google.maps ? window.google.maps : null);
          }
        }, 50);
      };

      script.onerror = (error) => {
        console.warn('Failed to load Google Maps SDK script:', error);
        this.loadPromise = null;
        resolve(null);
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isLoaded(): boolean {
    return typeof window !== 'undefined' && !!(window.google && window.google.maps);
  }

  /**
   * Picks the most accurate result from a Google Geocoding response.
   * Skips plus_code results and prefers ROOFTOP > RANGE_INTERPOLATED > GEOMETRIC_CENTER > APPROXIMATE.
   */
  private pickBestResult(results: any[]): any {
    const usable = results.filter((r) => !(r.types || []).includes('plus_code'));
    const list = usable.length ? usable : results;
    const rank = ['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'];
    const score = (r: any) => {
      const i = rank.indexOf(r.geometry?.location_type);
      return i === -1 ? 99 : i;
    };
    // Array.sort is stable, so equal scores keep Google's original order
    return [...list].sort((a, b) => score(a) - score(b))[0];
  }

  /**
   * Removes floor / flat / unit style prefixes that Google cannot match
   * (e.g. "2nd Floor, Ingole Bhavan, ..." -> "Ingole Bhavan, ...").
   * Those details belong in the separate Flat/Unit field.
   */
  private cleanAddress(address: string): string {
    return address
      .replace(/\b(\d+(st|nd|rd|th)?|ground|first|second|third|fourth|fifth)\s*floor\b,?/gi, '')
      .replace(/\b(flat|unit|shop|office|room)\s*(no\.?|number)?\s*[\w-]+,?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[,\s]+|[,\s]+$/g, '')
      .trim();
  }

  private geocodeRequest(request: any): Promise<any[] | null> {
    return new Promise((resolve) => {
      this.geocoder.geocode(request, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results);
        } else {
          if (status !== 'ZERO_RESULTS') {
            console.warn('Google Geocoder status:', status);
          }
          resolve(null);
        }
      });
    });
  }

  /**
   * Geocode an address/location string to coordinates and structured address components
   */
  async geocode(address: string): Promise<ParsedAddress | null> {
    if (!address || !address.trim()) return null;
    const gmaps = await this.load();
    if (!gmaps || !gmaps.Geocoder) {
      // Fallback lookup when official Google Maps key is pending
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.trim())}&limit=1&addressdetails=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const addr = item.address || {};
          return {
            formattedAddress: item.display_name || address,
            premise: addr.building || '',
            route: addr.road || '',
            streetNumber: addr.house_number || '',
            sublocality: addr.suburb || addr.neighbourhood || '',
            locality: addr.suburb || addr.city_district || addr.city || '',
            city: addr.city || addr.town || addr.village || addr.county || '',
            taluka: addr.county || addr.state_district || '',
            district: (addr.state_district || addr.county || '').replace(/District/gi, '').trim(),
            state: addr.state || '',
            pinCode: addr.postcode || '',
            country: addr.country || 'India',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };
        }
      } catch (e) {}
      return null;
    }

    if (!this.geocoder) {
      this.geocoder = new gmaps.Geocoder();
    }

    const original = address.trim();
    const cleaned = this.cleanAddress(original);

    // Try in order: original (India), cleaned (India), original (no restriction)
    const attempts: any[] = [
      { address: original, componentRestrictions: { country: 'in' } }
    ];
    if (cleaned && cleaned !== original) {
      attempts.push({ address: cleaned, componentRestrictions: { country: 'in' } });
    }
    attempts.push({ address: original });

    let partialFallback: any[] | null = null;

    for (const req of attempts) {
      const results = await this.geocodeRequest(req);
      if (!results) continue;

      const best = this.pickBestResult(results);
      // A partial match means Google only matched part of the text (e.g. only the area).
      // Remember it, but keep trying other variants for a better one.
      if (best.partial_match && !partialFallback) {
        partialFallback = results;
        continue;
      }
      return this.parseAddressComponents(best);
    }

    if (partialFallback) {
      return this.parseAddressComponents(this.pickBestResult(partialFallback));
    }
    return null;
  }

  /**
   * Reverse geocode latitude and longitude to an address and administrative components.
   * The returned lat/lng is ALWAYS the one the user passed in (pin position is not moved).
   */
  async reverseGeocode(lat: number, lng: number): Promise<ParsedAddress | null> {
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return null;
    const gmaps = await this.load();
    if (!gmaps || !gmaps.Geocoder) {
      // Fallback reverse geocode when official Google Maps key is pending
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const item = await res.json();
        if (item && item.address) {
          const addr = item.address;
          return {
            formattedAddress: item.display_name || '',
            premise: addr.building || '',
            route: addr.road || '',
            streetNumber: addr.house_number || '',
            sublocality: addr.suburb || addr.neighbourhood || '',
            locality: addr.suburb || addr.city_district || addr.city || '',
            city: addr.city || addr.town || addr.village || '',
            taluka: addr.county || '',
            district: (addr.state_district || addr.county || '').replace(/District/gi, '').trim(),
            state: addr.state || '',
            pinCode: addr.postcode || '',
            country: addr.country || 'India',
            lat,
            lng
          };
        }
      } catch (e) {}
      return null;
    }

    if (!this.geocoder) {
      this.geocoder = new gmaps.Geocoder();
    }

    const results = await this.geocodeRequest({ location: { lat, lng } });
    if (!results) return null;

    const parsed = this.parseAddressComponents(this.pickBestResult(results));
    // Keep the exact pin position chosen by the user
    parsed.lat = lat;
    parsed.lng = lng;
    return parsed;
  }

  /**
   * Parses Google Maps Geocoding Result into clear Indian address components
   */
  parseAddressComponents(result: any): ParsedAddress {
    const parsed: ParsedAddress = {
      formattedAddress: result.formatted_address || '',
      premise: '',
      route: '',
      streetNumber: '',
      sublocality: '',
      locality: '',
      city: '',
      taluka: '',
      district: '',
      state: '',
      pinCode: '',
      country: '',
      lat: result.geometry?.location?.lat ? (typeof result.geometry.location.lat === 'function' ? result.geometry.location.lat() : result.geometry.location.lat) : 0,
      lng: result.geometry?.location?.lng ? (typeof result.geometry.location.lng === 'function' ? result.geometry.location.lng() : result.geometry.location.lng) : 0
    };

    const comps: any[] = result.address_components || [];
    comps.forEach((c) => {
      const types: string[] = c.types || [];

      if (types.includes('postal_code')) {
        parsed.pinCode = c.long_name;
      } else if (types.includes('country')) {
        parsed.country = c.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.state = c.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        parsed.district = c.long_name.replace(/District/gi, '').trim();
      } else if (types.includes('administrative_area_level_3')) {
        parsed.taluka = c.long_name.replace(/(Tahsil|Tehsil|Taluk|Taluka)/gi, '').trim();
      } else if (types.includes('locality')) {
        parsed.city = c.long_name;
      } else if (types.includes('sublocality_level_1')) {
        parsed.sublocality = c.long_name;
      } else if (types.includes('sublocality_level_2') || types.includes('neighborhood')) {
        if (!parsed.sublocality) parsed.sublocality = c.long_name;
      } else if (types.includes('route')) {
        parsed.route = c.long_name;
      } else if (types.includes('street_number')) {
        parsed.streetNumber = c.long_name;
      } else if (types.includes('premise') || types.includes('subpremise') || types.includes('point_of_interest')) {
        parsed.premise = c.long_name;
      }
    });

    // If city is not set, use district or taluka
    if (!parsed.city) {
      parsed.city = parsed.taluka || parsed.district;
    }

    // Locality preference
    parsed.locality = parsed.sublocality || parsed.taluka || parsed.city;

    return parsed;
  }
}
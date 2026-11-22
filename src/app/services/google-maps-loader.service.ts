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
  /** Place / business name (only for Places results, e.g. a GMB listing, shop, society, building) */
  name?: string;
  placeId?: string;
  types?: string[];
  /** Where the coordinates came from */
  source?: 'places' | 'geocoder' | 'osm';
  /** Google Geocoder location_type (ROOFTOP is exact, APPROXIMATE is only an area) */
  locationType?: string;
  /** Result in the classic Google Geocoder shape (formatted_address, address_components, geometry, types) */
  raw?: any;
}

/**
 * Detects "21.125746, 79.058728" (or "21.125746 79.058728", with optional N/E letters) typed or
 * pasted as text. Returns null for anything that is not a valid latitude/longitude pair.
 */
export function parseLatLngText(text: string): { lat: number; lng: number } | null {
  if (!text) return null;
  const m = text.trim().match(/^\(?\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*N?\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*E?\s*\)?$/i);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (!/\./.test(m[1]) && !/\./.test(m[2])) return null;
  return { lat, lng };
}

/** One row of the address suggestion list */
export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
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
  private placesLib: any = null;
  private sessionToken: any = null;
  /** Last Google error text, shown to the user so they know which API / key setting to fix */
  lastError: string = '';
  /** Real businesses that share the exact typed address (set by searchText), shown by the CRM as a choice list */
  lastAmbiguous: PlaceSuggestion[] = [];
  /** Cache of discovered businesses per typed address (discovery is expensive) */
  private discoverCache = new Map<string, PlaceSuggestion[]>();

  hasValidKey(): boolean {
    const key = (environment as any).googleMapsApiKey;
    return !!(key && typeof key === 'string' && key.trim().startsWith('AIzaSy'));
  }

  getEmbedUrl(query: string, layer: 'roadmap' | 'satellite' | 'hybrid' = 'roadmap', zoom: number = 15): string {
    const cleanQuery = (query && query.trim()) ? query.trim() : 'Nagpur, Maharashtra, India';
    const mapType = (layer === 'satellite' || layer === 'hybrid') ? 'k' : '';
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }

  /**
   * Dynamically loads Google Maps JavaScript SDK with Places & Geometry libraries.
   * NOTE: `loading=async` is intentionally NOT used (Geocoder must be available immediately).
   */
  load(): Promise<any> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Window is undefined'));
    }

    window.gm_authFailure = () => {
      this.lastError = 'Google Maps key rejected (check billing, API restrictions and HTTP referrer restrictions).';
      console.warn('Google Maps JS API key is missing, invalid or restricted. Check key, billing and enabled APIs.');
    };

    if (window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }

    if (!this.hasValidKey()) {
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
      script.src = `https://maps.googleapis.com/maps/api/js?${keyParam}v=weekly&language=en&region=IN&libraries=places,geometry&callback=__initGoogleMapsCallback`;

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

  // =====================================================================
  //  PLACES API (NEW)  -  exact place / business (GMB) pin point
  // =====================================================================

  private fieldList = ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents', 'types', 'viewport'];
  /** Same fields + review count: searches use it so the most prominent business (like Google Maps) wins ties */
  private rankFieldList = ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents', 'types', 'viewport', 'userRatingCount'];

  private async getPlacesLibrary(): Promise<any | null> {
    if (this.placesLib) return this.placesLib;
    const gmaps = await this.load();
    if (!gmaps) return null;
    try {
      if (typeof gmaps.importLibrary === 'function') {
        this.placesLib = await gmaps.importLibrary('places');
      }
    } catch (e) {
      console.warn('google.maps.importLibrary("places") failed:', e);
    }
    if (!this.placesLib && gmaps.places) {
      this.placesLib = gmaps.places;
    }
    return this.placesLib;
  }

  private friendlyError(e: any): string {
    const msg = String((e && (e.message || e)) || '');
    if (/not been used|not enabled|API_KEY_SERVICE_BLOCKED|PERMISSION_DENIED|REQUEST_DENIED|blocked/i.test(msg)) {
      return 'Places API (New) is blocked for this key. In Google Cloud: enable "Places API (New)" and add it to the key\'s API restrictions, and check billing is active.';
    }
    if (/referer|referrer|RefererNotAllowed/i.test(msg)) {
      return 'API key referrer restriction is blocking this site. Add http://localhost:4200/* and your live domain/* to the key\'s allowed HTTP referrers.';
    }
    return msg ? `Google Places error: ${msg}` : 'Google Places request failed.';
  }

  private resetSession(): void {
    this.sessionToken = null;
  }

  private nameOfPlace(pl: any): string {
    return String(typeof pl?.displayName === 'string' ? pl.displayName : (pl?.displayName?.text || '')).trim();
  }

  /** Component types that describe an AREA (not a business). */
  private readonly areaComponentTypes = new Set<string>([
    'sublocality', 'sublocality_level_1', 'sublocality_level_2', 'sublocality_level_3',
    'neighborhood', 'locality', 'route', 'administrative_area_level_1', 'administrative_area_level_2',
    'administrative_area_level_3', 'postal_town', 'political'
  ]);

  /**
   * true when the place name is just an area / road / city name that also appears as an address
   * component (e.g. the locality "Ganeshkhind"). Such a name must never be used as a property name.
   */
  private nameIsAreaName(name: string, comps: any[]): boolean {
    const n = (name || '').toLowerCase().trim();
    if (!n) return false;
    return (comps || []).some((c: any) =>
      (c.types || []).some((t: string) => this.areaComponentTypes.has(t)) &&
      String(c.long_name || '').toLowerCase().trim() === n
    );
  }

  /** Converts a Place (new API) into the classic Geocoder result shape + ParsedAddress. */
  private fromNewPlace(place: any): ParsedAddress | null {
    const loc = place && place.location;
    if (!loc) return null;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) return null;

    const name = this.nameOfPlace(place);
    const comps = (place.addressComponents || []).map((c: any) => ({
      long_name: c.longText ?? c.long_name ?? '',
      short_name: c.shortText ?? c.short_name ?? '',
      types: c.types || []
    }));
    const types: string[] = place.types || [];

    const raw = {
      place_id: place.id,
      name,
      formatted_address: place.formattedAddress || '',
      address_components: comps,
      types,
      // an area / road / city name is NOT a property name
      nameable: this.isNameablePlace(types) && !this.nameIsAreaName(name, comps),
      geometry: { location: { lat: Number(lat), lng: Number(lng) }, location_type: 'ROOFTOP' }
    };

    const parsed = this.parseAddressComponents(raw);
    parsed.lat = Number(lat);
    parsed.lng = Number(lng);
    parsed.name = name;
    parsed.placeId = place.id;
    parsed.types = types;
    parsed.source = 'places';
    parsed.locationType = 'PLACE';
    parsed.raw = raw;
    return parsed;
  }

  /** Address / business suggestions while the user types (India only). */
  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    const text = (input || '').trim();
    if (text.length < 2 || parseLatLngText(text)) return [];
    const places = await this.getPlacesLibrary();
    if (!places) return [];

    if (places.AutocompleteSuggestion && typeof places.AutocompleteSuggestion.fetchAutocompleteSuggestions === 'function') {
      try {
        if (!this.sessionToken && places.AutocompleteSessionToken) {
          this.sessionToken = new places.AutocompleteSessionToken();
        }
        const req: any = {
          input: text,
          includedRegionCodes: ['in'],
          region: 'in',
          language: 'en'
        };
        if (this.sessionToken) req.sessionToken = this.sessionToken;
        const res = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        const out: PlaceSuggestion[] = [];
        for (const sg of (res?.suggestions || [])) {
          const pp = sg.placePrediction;
          if (!pp) continue;
          const full = pp.text?.text || '';
          out.push({
            placeId: pp.placeId,
            mainText: pp.mainText?.text || full,
            secondaryText: pp.secondaryText?.text || '',
            fullText: full
          });
        }
        this.lastError = '';
        console.log('[GeoDebug] autocomplete', text, '->', out.length, 'suggestions');
        return out;
      } catch (e) {
        this.lastError = this.friendlyError(e);
        console.warn('Places API (New) autocomplete failed:', e);
      }
    }

    if (places.AutocompleteService) {
      try {
        const svc = new places.AutocompleteService();
        if (!this.sessionToken && places.AutocompleteSessionToken) {
          this.sessionToken = new places.AutocompleteSessionToken();
        }
        const preds: any[] = await new Promise((resolve) => {
          svc.getPlacePredictions(
            { input: text, componentRestrictions: { country: 'in' }, sessionToken: this.sessionToken },
            (r: any[], status: string) => resolve(status === 'OK' && r ? r : [])
          );
        });
        if (preds.length) this.lastError = '';
        return preds.map((p: any) => ({
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
          fullText: p.description
        }));
      } catch (e) {
        console.warn('Legacy autocomplete failed:', e);
      }
    }
    return [];
  }

  /** Exact details (pin point, address components, name) of one place id. */
  async getPlaceDetails(placeId: string): Promise<ParsedAddress | null> {
    if (!placeId) return null;
    const places = await this.getPlacesLibrary();
    if (!places) return null;

    if (places.Place) {
      try {
        const place = new places.Place({ id: placeId, requestedLanguage: 'en', requestedRegion: 'in' });
        await place.fetchFields({ fields: this.fieldList });
        this.resetSession();
        this.lastError = '';
        const parsed = this.fromNewPlace(place);
        console.log('[GeoDebug] place details', placeId, parsed && { name: parsed.name, lat: parsed.lat, lng: parsed.lng, address: parsed.formattedAddress });
        if (parsed) return parsed;
      } catch (e) {
        this.lastError = this.friendlyError(e);
        console.warn('Places API (New) Place.fetchFields failed:', e);
      }
    }

    if (places.PlacesService) {
      try {
        const svc = new places.PlacesService(document.createElement('div'));
        const result: any = await new Promise((resolve) => {
          svc.getDetails(
            { placeId, fields: ['name', 'formatted_address', 'address_components', 'geometry', 'types', 'place_id'] },
            (r: any, status: string) => resolve(status === 'OK' ? r : null)
          );
        });
        this.resetSession();
        if (result && result.geometry?.location) {
          const parsed = this.parseAddressComponents(result);
          parsed.name = result.name || '';
          parsed.placeId = placeId;
          parsed.types = result.types || [];
          parsed.source = 'places';
          parsed.locationType = 'PLACE';
          parsed.raw = {
            ...result,
            nameable: this.isNameablePlace(result.types || []) && !this.nameIsAreaName(result.name || '', result.address_components || []),
            geometry: { location: { lat: parsed.lat, lng: parsed.lng }, location_type: 'ROOFTOP' }
          };
          return parsed;
        }
      } catch (e) {
        console.warn('Legacy getDetails failed:', e);
      }
    }
    return null;
  }

  /**
   * Removes floor / flat / shop / plot numbers and "near X" parts. Only used as a SECOND search
   * variant; the ORIGINAL text (with "near ...") is always searched first.
   */
  cleanForSearch(address: string): string {
    const original = (address || '').trim();
    const parts = original
      .split(',')
      .map((p) => p.replace(/\b(near|nr\.?|opp\.?|opposite|behind|beside|next to|adjacent to|in front of)\b.*$/i, '').trim())
      .filter(Boolean)
      .filter((p) => !/\b(floor|flr)\b/i.test(p))
      .filter((p) => !/^(flat|unit|shop|office|room|plot|house|gala|block|wing|survey)\s*(no\.?|number|#)?\s*[\w\/-]*$/i.test(p));
    const cleaned = parts.join(', ').replace(/\s{2,}/g, ' ').trim();
    return cleaned.length >= 3 ? cleaned : original;
  }

  /** Comparable tokens (single digits are kept: house numbers matter). */
  private addrTokens(text: string): string[] {
    return String(text || '')
      .toLowerCase()
      .replace(/\broad\b/g, 'rd')
      .replace(/\bstreet\b/g, 'st')
      .replace(/\bindia\b/g, ' ')
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 || /\d/.test(t));
  }

  /** Place types that only say "some place / building", not WHICH business it is. */
  private readonly genericPlaceTypes = new Set<string>([
    'point_of_interest', 'establishment', 'premise', 'subpremise', 'street_address', 'route',
    'geocode', 'political', 'locality', 'sublocality', 'sublocality_level_1', 'sublocality_level_2',
    'neighborhood', 'postal_code', 'plus_code', 'intersection', 'floor', 'room',
    'transit_station', 'bus_station', 'bus_stop', 'train_station', 'subway_station',
    'light_rail_station', 'taxi_stand', 'parking', 'parking_lot'
  ]);

  /** Types that must never be used as a property / building name */
  private readonly nonPropertyTypes = new Set<string>([
    'transit_station', 'bus_station', 'bus_stop', 'train_station', 'subway_station',
    'light_rail_station', 'taxi_stand', 'parking', 'parking_lot', 'route', 'locality',
    'sublocality', 'sublocality_level_1', 'sublocality_level_2', 'neighborhood', 'political', 'postal_code'
  ]);

  private isNameablePlace(types: string[]): boolean {
    const t = types || [];
    return t.some((x) => ['establishment', 'point_of_interest', 'premise'].includes(x)) &&
      !t.some((x) => this.nonPropertyTypes.has(x));
  }

  /** true when the place is a real business (university, hospital, shop...) and not just a building / address / area. */
  private isSpecificBusiness(types: string[]): boolean {
    return (types || []).some((t) => !this.genericPlaceTypes.has(t));
  }

  /** Score of one candidate place against the typed text (higher = better match). */
  private scorePlace(pl: any, query: string, qTokens: string[], index: number): number {
    const q = query.toLowerCase();
    const nm = this.nameOfPlace(pl).toLowerCase();
    const types: string[] = pl.types || [];
    const specific = this.isSpecificBusiness(types);
    const isBusiness = types.includes('establishment') || types.includes('point_of_interest');
    let score = 0;

    if (nm) {
      const nameTokens = this.addrTokens(nm).filter((t) => t.length > 2);
      const nameHit = nameTokens.filter((t) => q.includes(t)).length;
      const nameCoverage = nameTokens.length ? nameHit / nameTokens.length : 0;
      const nSet = new Set(nameTokens);
      const queryCovered = qTokens.length ? qTokens.filter((t) => nSet.has(t)).length / qTokens.length : 0;

      if (nameCoverage >= 0.8 && queryCovered >= 0.6) {
        score += 14;
      } else if (q.includes(nm)) {
        score += specific ? 10 : 3;
      } else {
        score += nameCoverage * (specific ? 6 : 2);
      }
    }

    if (qTokens.length >= 3 && pl.formattedAddress) {
      const aTokens = new Set(this.addrTokens(pl.formattedAddress));
      const common = qTokens.filter((t) => aTokens.has(t)).length;
      const ratio = common / qTokens.length;
      score += ratio * 8;
      if (isBusiness && specific && ratio >= 0.7) score += 5;
    }

    if (specific) score += 4;
    else if (isBusiness) score += 1;
    if (types.includes('premise') || types.includes('subpremise')) score -= 3;
    // pure area results (locality / neighbourhood / road) lose against real places
    if (types.some((t) => this.nonPropertyTypes.has(t)) && !specific) score -= 4;

    // prominence: most Google reviews wins when several businesses share one address
    const reviews = Number(pl.userRatingCount || 0);
    if (reviews > 0) score += Math.min(3.5, Math.log10(1 + reviews) * 1.1);

    score -= index * 0.05;
    return score;
  }

  private pickBestPlace(found: any[], query: string): any {
    const qTokens = this.addrTokens(query);
    let best = found[0];
    let bestScore = -Infinity;
    found.forEach((pl, i) => {
      const s = this.scorePlace(pl, query, qTokens, i);
      if (s > bestScore) {
        bestScore = s;
        best = pl;
      }
    });
    return best;
  }

  private async searchPlaces(places: any, textQuery: string): Promise<any[]> {
    try {
      const { places: found } = await places.Place.searchByText({
        textQuery,
        fields: this.rankFieldList,
        region: 'in',
        language: 'en',
        maxResultCount: 20
      });
      this.lastError = '';
      return found || [];
    } catch (e) {
      this.lastError = this.friendlyError(e);
      console.warn('Places API (New) searchByText failed:', e);
      return [];
    }
  }

  /** How much of the typed address (0..1) is found in the place's own Google address. */
  private addrRatio(pl: any, qTokens: string[]): number {
    if (!qTokens.length || !pl?.formattedAddress) return 0;
    const aTokens = new Set(this.addrTokens(pl.formattedAddress));
    return qTokens.filter((t) => aTokens.has(t)).length / qTokens.length;
  }

  private nameMatchesQuery(pl: any, qTokens: string[]): boolean {
    const nameTokens = this.addrTokens(this.nameOfPlace(pl)).filter((t) => t.length > 2);
    if (!nameTokens.length || !qTokens.length) return false;
    const qSet = new Set(qTokens);
    const nSet = new Set(nameTokens);
    const nameCoverage = nameTokens.filter((t) => qSet.has(t)).length / nameTokens.length;
    const queryCovered = qTokens.filter((t) => nSet.has(t)).length / qTokens.length;
    return nameCoverage >= 0.8 && queryCovered >= 0.6;
  }

  private placeLatLng(pl: any): { lat: number; lng: number } | null {
    const loc = pl && pl.location;
    if (!loc) return null;
    const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) return null;
    return { lat: Number(lat), lng: Number(lng) };
  }

  private distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(h));
  }

  /** Business categories, used to find GMB listings that share a plain / area-level address. */
  private readonly addressCategoryTypes: string[] = [
    'university', 'school', 'hospital', 'doctor', 'dentist', 'hotel', 'lodging', 'restaurant', 'cafe',
    'store', 'bank', 'gym', 'shopping_mall', 'real_estate_agency', 'tourist_attraction', 'museum',
    'place_of_worship', 'park', 'library', 'post_office', 'police', 'pharmacy', 'supermarket', 'corporate_office'
  ];

  private async searchByCategories(places: any, q: string, anchor: { lat: number; lng: number }, qTokens: string[], minRatio: number): Promise<any[]> {
    const calls = this.addressCategoryTypes.map(async (t) => {
      try {
        const { places: found } = await places.Place.searchByText({
          textQuery: q,
          includedType: t,
          fields: this.rankFieldList,
          region: 'in',
          language: 'en',
          maxResultCount: 10,
          locationBias: { center: { lat: anchor.lat, lng: anchor.lng }, radius: 3000 }
        });
        return found || [];
      } catch (e) {
        return []; // an unsupported type must not break the others
      }
    });
    const all = (await Promise.all(calls)).reduce((acc: any[], cur: any[]) => acc.concat(cur), []);
    const seen = new Set<string>();
    return all.filter((pl: any) => {
      if (!pl.id || seen.has(pl.id)) return false;
      seen.add(pl.id);
      return this.isSpecificBusiness(pl.types || []) && this.addrRatio(pl, qTokens) >= minRatio;
    });
  }

  private async searchNearbyPlaces(places: any, lat: number, lng: number, radius: number): Promise<any[]> {
    if (!places?.Place || typeof places.Place.searchNearby !== 'function') return [];
    try {
      const { places: found } = await places.Place.searchNearby({
        fields: this.rankFieldList,
        locationRestriction: { center: { lat, lng }, radius },
        maxResultCount: 20,
        language: 'en',
        region: 'in'
      });
      return found || [];
    } catch (e) {
      console.warn('Places API (New) searchNearby failed:', e);
      return [];
    }
  }

  private async fetchPlacesByIds(places: any, ids: string[]): Promise<any[]> {
    if (!places?.Place) return [];
    const out = await Promise.all(ids.map(async (id) => {
      try {
        const pl = new places.Place({ id, requestedLanguage: 'en', requestedRegion: 'in' });
        await pl.fetchFields({ fields: this.rankFieldList });
        return pl;
      } catch (e) {
        return null;
      }
    }));
    return out.filter(Boolean);
  }

  private queryCoverage(nameText: string, addrText: string, qTokens: string[]): number {
    if (!qTokens.length) return 0;
    const known = new Set<string>([...this.addrTokens(nameText), ...this.addrTokens(addrText)]);
    return qTokens.filter((t) => known.has(t)).length / qTokens.length;
  }

  /**
   * The real business (GMB listing) that stands exactly at a point. Only places within `radius`
   * metres count, the nearest one wins. The pin is NOT moved.
   */
  async findBusinessAt(lat: number, lng: number, radius: number = 35): Promise<ParsedAddress | null> {
    if (isNaN(lat) || isNaN(lng)) return null;
    const places = await this.getPlacesLibrary();
    if (!places || !places.Place || typeof places.Place.searchNearby !== 'function') return null;
    try {
      const req: any = {
        fields: this.fieldList,
        locationRestriction: { center: { lat, lng }, radius },
        maxResultCount: 20,
        language: 'en',
        region: 'in'
      };
      const rp = places.SearchNearbyRankPreference;
      req.rankPreference = rp && rp.DISTANCE ? rp.DISTANCE : 'DISTANCE';
      const { places: found } = await places.Place.searchNearby(req);
      const here = { lat, lng };
      const candidates = (found || [])
        .filter((pl: any) => this.isSpecificBusiness(pl.types || []))
        .map((pl: any) => ({ pl, d: (() => { const pt = this.placeLatLng(pl); return pt ? this.distM(here, pt) : 1e9; })() }))
        .filter((x: any) => x.d <= radius + 5)
        .sort((a: any, b: any) => a.d - b.d);
      return candidates.length ? this.fromNewPlace(candidates[0].pl) : null;
    } catch (e) {
      console.warn('findBusinessAt failed:', e);
      return null;
    }
  }

  /** Centre point(s) of a typed address: from the seed place and from the Geocoder. */
  private async getAnchors(q: string, seed: any | null): Promise<Array<{ lat: number; lng: number }>> {
    const anchors: Array<{ lat: number; lng: number }> = [];
    const push = (pt: { lat: number; lng: number } | null) => {
      if (pt && !anchors.some((x) => this.distM(x, pt) < 150)) anchors.push(pt);
    };
    push(seed ? this.placeLatLng(seed) : null);

    const gmaps = await this.load();
    if (gmaps && gmaps.Geocoder) {
      if (!this.geocoder) this.geocoder = new gmaps.Geocoder();
      const gr = await this.geocodeRequest({ address: q, componentRestrictions: { country: 'in' } });
      const loc = gr && gr[0] && gr[0].geometry && gr[0].geometry.location;
      if (loc) {
        push({
          lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
          lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
        });
      }
    }
    return anchors;
  }

  /**
   * AREA-LEVEL ADDRESS -> REAL BUSINESSES.
   * A GMB address like "Ganeshkhind, Aundh, Pune, Maharashtra 411007" is only an area, so a plain
   * text search returns the locality. This finds the real listings (university, hospital, shop...)
   * whose own Google address matches the typed one:
   *   1) top autocomplete suggestions  2) nearby search around the area  3) one search per category.
   */
  private async collectAddressBusinesses(places: any, q: string, qTokens: string[], seed: any | null): Promise<any[]> {
    const isMatch = (pl: any) => this.isSpecificBusiness(pl.types || []) && this.addrRatio(pl, qTokens) >= 0.75;
    const out: any[] = [];
    const seen = new Set<string>();
    const collect = (list: any[]) => (list || []).forEach((pl) => {
      if (pl && pl.id && !seen.has(pl.id) && isMatch(pl)) { seen.add(pl.id); out.push(pl); }
    });

    // 1) what the Google Maps search box would suggest
    try {
      const sugg = await this.autocomplete(q);
      collect(await this.fetchPlacesByIds(places, sugg.slice(0, 6).map((x) => x.placeId)));
    } catch (e) {
      console.warn('autocomplete check failed:', e);
    }

    // 2) businesses around the area centre
    const anchors = await this.getAnchors(q, seed);
    for (const a of anchors) {
      collect(await this.searchNearbyPlaces(places, a.lat, a.lng, 1200));
      collect(await this.searchNearbyPlaces(places, a.lat, a.lng, 2500));
    }

    // 3) category-wise search (finds big campuses / hospitals that nearby search misses)
    if (anchors.length) {
      for (const a of anchors) {
        collect(await this.searchByCategories(places, q, a, qTokens, 0.75));
        if (out.length >= 2) break;
      }
    }
    console.log('[GeoDebug] address businesses', { q, anchors: anchors.length, matching: out.map((p) => this.nameOfPlace(p)) });
    return out;
  }

  /**
   * PUBLIC: real businesses (GMB listings) that use the typed address, most popular first.
   * The CRM puts these at the top of the suggestion list, so typing the GMB address of
   * "Savitribai Phule Pune University" shows the university, not just the area "Ganeshkhind".
   */
  async discoverBusinessesForAddress(address: string): Promise<PlaceSuggestion[]> {
    const q = (address || '').trim();
    if (q.length < 6 || parseLatLngText(q)) return [];
    const key = q.toLowerCase();
    if (this.discoverCache.has(key)) return this.discoverCache.get(key)!;

    const places = await this.getPlacesLibrary();
    if (!places || !places.Place || typeof places.Place.searchByText !== 'function') return [];

    const qTokens = this.addrTokens(q);
    if (qTokens.length < 3) return [];

    const seedList = await this.searchPlaces(places, q);
    const seed = seedList.length ? this.pickBestPlace(seedList, q) : null;

    // a business that is already the clear text-search winner is handled by searchText()
    const found = await this.collectAddressBusinesses(places, q, qTokens, seed);
    // also keep specific businesses from the plain text search that match the address
    seedList.forEach((pl) => {
      if (pl.id && this.isSpecificBusiness(pl.types || []) && this.addrRatio(pl, qTokens) >= 0.75 && !found.some((f) => f.id === pl.id)) {
        found.push(pl);
      }
    });

    const ranked = found
      .map((pl, i) => ({ pl, sc: this.scorePlace(pl, q, qTokens, i) }))
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 8)
      .map((x) => ({
        placeId: x.pl.id,
        mainText: this.nameOfPlace(x.pl),
        secondaryText: x.pl.formattedAddress || '',
        fullText: `${this.nameOfPlace(x.pl)}, ${x.pl.formattedAddress || ''}`
      }));

    this.discoverCache.set(key, ranked);
    return ranked;
  }

  /**
   * Free-text search exactly like the Google Maps search box (business name, GMB listing,
   * society, shop, landmark, full address).
   */
  async searchText(query: string): Promise<ParsedAddress | null> {
    this.lastAmbiguous = [];
    const q = (query || '').trim();
    if (!q) return null;
    const places = await this.getPlacesLibrary();
    if (!places || !places.Place || typeof places.Place.searchByText !== 'function') return null;

    const variants: string[] = [q];
    const cleaned = this.cleanForSearch(q);
    if (cleaned && cleaned.toLowerCase() !== q.toLowerCase()) variants.push(cleaned);

    const pool: any[] = [];
    const seen = new Set<string>();
    const addToPool = (list: any[]) => {
      for (const pl of list) {
        if (pl.id && !seen.has(pl.id)) {
          seen.add(pl.id);
          pool.push(pl);
        }
      }
    };

    for (const v of variants) {
      addToPool(await this.searchPlaces(places, v));
    }

    const qTokens = this.addrTokens(q);
    let best: any = pool.length ? this.pickBestPlace(pool, q) : null;

    const bestNm = best ? this.nameOfPlace(best).toLowerCase() : '';
    // "good" only when the typed text names this business (an address alone can belong to many places)
    const bestIsGood = !!best && this.isSpecificBusiness(best.types || []) &&
      (this.nameMatchesQuery(best, qTokens) || (bestNm.length > 3 && q.toLowerCase().includes(bestNm)));

    // Typed text is an address and no real business matched -> find the businesses with this address
    if (!bestIsGood && qTokens.length >= 3) {
      const matching = await this.collectAddressBusinesses(places, q, qTokens, best);
      if (matching.length) {
        addToPool(matching);
        best = this.pickBestPlace(pool, q);
      }
    }

    if (!best) return null;

    // A result matching neither the typed name nor the typed address must NOT be used
    const bestName = this.nameOfPlace(best);
    if (this.queryCoverage(bestName, best.formattedAddress || '', qTokens) < 0.7) {
      console.log('[GeoDebug] weak match rejected:', bestName, '|', best.formattedAddress);
      return null;
    }

    // Several real businesses share this address -> the CRM shows a list so the user picks the right one
    if (!this.nameMatchesQuery(best, qTokens)) {
      const same = pool
        .map((pl, i) => ({ pl, sc: this.scorePlace(pl, q, qTokens, i) }))
        .filter((x) => this.isSpecificBusiness(x.pl.types || []) && this.addrRatio(x.pl, qTokens) >= 0.9)
        .sort((x, y) => y.sc - x.sc)
        .slice(0, 8);
      if (same.length > 1) {
        this.lastAmbiguous = same.map((x) => ({
          placeId: x.pl.id,
          mainText: this.nameOfPlace(x.pl),
          secondaryText: x.pl.formattedAddress || '',
          fullText: `${this.nameOfPlace(x.pl)}, ${x.pl.formattedAddress || ''}`
        }));
      }
    }

    const hit = this.fromNewPlace(best);
    console.log('[GeoDebug] text search', q, '->', hit && { name: hit.name, lat: hit.lat, lng: hit.lng, address: hit.formattedAddress, candidates: pool.length });
    return hit;
  }

  private pickBestResult(results: any[]): any {
    const usable = results.filter((r) => !(r.types || []).includes('plus_code'));
    const list = usable.length ? usable : results;
    const rank = ['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'];
    const score = (r: any) => {
      const i = rank.indexOf(r.geometry?.location_type);
      return i === -1 ? 99 : i;
    };
    return [...list].sort((a, b) => score(a) - score(b))[0];
  }

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
      if (!this.geocoder) { resolve(null); return; }
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

  /** Geocode an address/location string to coordinates and structured address components */
  async geocode(address: string): Promise<ParsedAddress | null> {
    if (!address || !address.trim()) return null;
    const gmaps = await this.load();
    if (!gmaps || !gmaps.Geocoder) {
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
            lng: parseFloat(item.lon),
            source: 'osm'
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

    // 1) Places API (New): same engine as the Google Maps search box (with GMB discovery)
    const textHit = await this.searchText(original);
    if (textHit) return textHit;

    const forSearch = this.cleanForSearch(original);
    let sugg = await this.autocomplete(original);
    if (sugg.length === 0 && forSearch !== original) {
      sugg = await this.autocomplete(forSearch);
    }
    if (sugg.length > 0) {
      const top = await this.getPlaceDetails(sugg[0].placeId);
      if (top && this.queryCoverage(top.name || '', top.formattedAddress || '', this.addrTokens(original)) >= 0.7) return top;
    }

    // 2) Geocoding API
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
      if (best.partial_match && !partialFallback) {
        partialFallback = results;
        continue;
      }
      return this.fromGeocoderResult(best);
    }

    if (partialFallback) {
      return this.fromGeocoderResult(this.pickBestResult(partialFallback));
    }
    return null;
  }

  private fromGeocoderResult(result: any): ParsedAddress {
    const parsed = this.parseAddressComponents(result);
    parsed.source = 'geocoder';
    parsed.locationType = result.geometry?.location_type || '';
    parsed.placeId = result.place_id || '';
    parsed.types = result.types || [];
    parsed.raw = result;
    return parsed;
  }

  /** Reverse geocode. The returned lat/lng is ALWAYS the one the user passed in. */
  async reverseGeocode(lat: number, lng: number): Promise<ParsedAddress | null> {
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return null;
    const gmaps = await this.load();
    if (!gmaps || !gmaps.Geocoder) {
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
            lng,
            source: 'osm'
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

    const parsed = this.fromGeocoderResult(this.pickBestResult(results));
    parsed.lat = lat;
    parsed.lng = lng;
    return parsed;
  }

  /** Parses Google Maps Geocoding Result into clear Indian address components */
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
        parsed.district = c.long_name.replace(/\b(District|Division)\b/gi, '').trim();
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

    if (!parsed.city) {
      parsed.city = parsed.taluka || parsed.district;
    }
    parsed.locality = parsed.sublocality || parsed.taluka || parsed.city;

    return parsed;
  }
}
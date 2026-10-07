import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface VillageOption {
  name: string;
  pincode?: string;
  taluka?: string;
  district?: string;
  state?: string;
  lat?: number;
  lon?: number;
}

@Injectable({
  providedIn: 'root'
})
export class IndiaLocationService {
  private adminData: { [state: string]: { [district: string]: string[] } } = {};
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  // Cache for taluka villages
  private talukaVillagesCache = new Map<string, VillageOption[]>();

  constructor(private http: HttpClient) {
    this.ensureDataLoaded();
  }

  /**
   * Load JSON dataset from assets
   */
  public ensureDataLoaded(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = fetch('/assets/data/india-states-districts-talukas.json')
      .then(res => res.json())
      .then((data: any) => {
        this.adminData = data || {};
        this.isLoaded = true;
      })
      .catch(err => {
        console.warn('Failed to load /assets/data/india-states-districts-talukas.json, using fallback data:', err);
        this.adminData = this.getFallbackAdminData();
        this.isLoaded = true;
      });

    return this.loadPromise;
  }

  /**
   * Get all States and Union Territories of India
   */
  public getStates(): string[] {
    const states = Object.keys(this.adminData);
    if (states.length > 0) {
      return states.sort();
    }
    return Object.keys(this.getFallbackAdminData()).sort();
  }

  /**
   * Find matching state name in dataset
   */
  public normalizeState(stateName: string): string {
    if (!stateName) return '';
    const clean = stateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const states = this.getStates();
    const found = states.find(s => s.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
    if (found) return found;

    // Partial match (e.g. Maharashtra -> Maharashtra, Chattisgarh -> Chhattisgarh)
    const partial = states.find(s => {
      const sClean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return clean.includes(sClean) || sClean.includes(clean);
    });
    return partial || stateName;
  }

  /**
   * Get all Districts of a selected State
   */
  public getDistricts(state: string): string[] {
    if (!state) return [];
    const matchedState = this.normalizeState(state);
    const stateObj = this.adminData[matchedState] || this.getFallbackAdminData()[matchedState];
    if (stateObj) {
      return Object.keys(stateObj).sort();
    }
    return [];
  }

  /**
   * Find matching district name in a state
   */
  public normalizeDistrict(state: string, districtName: string): string {
    if (!districtName) return '';
    const districts = this.getDistricts(state);
    const clean = districtName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = districts.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
    if (found) return found;

    const partial = districts.find(d => {
      const dClean = d.toLowerCase().replace(/[^a-z0-9]/g, '');
      return clean.includes(dClean) || dClean.includes(clean);
    });
    return partial || districtName;
  }

  /**
   * Get all Talukas / Tehsils of a selected District in a State
   */
  public getTalukas(state: string, district: string): string[] {
    if (!state || !district) return [];
    const matchedState = this.normalizeState(state);
    const stateObj = this.adminData[matchedState] || this.getFallbackAdminData()[matchedState];
    if (!stateObj) return [];

    const matchedDistrict = this.normalizeDistrict(state, district);
    const talukas = stateObj[matchedDistrict];
    if (Array.isArray(talukas) && talukas.length > 0) {
      return [...talukas].sort();
    }

    // Try finding by case-insensitive district key
    const dKey = Object.keys(stateObj).find(k => k.toLowerCase() === district.toLowerCase());
    if (dKey && Array.isArray(stateObj[dKey])) {
      return [...stateObj[dKey]].sort();
    }

    return [];
  }

  /**
   * Fetch villages of a Taluka using India Post API + Nominatim fallback
   */
  public async getVillagesForTaluka(taluka: string, district?: string, state?: string): Promise<VillageOption[]> {
    if (!taluka) return [];
    const cacheKey = `${state || ''}_${district || ''}_${taluka}`.toLowerCase();
    if (this.talukaVillagesCache.has(cacheKey)) {
      return this.talukaVillagesCache.get(cacheKey)!;
    }

    const cleanTaluka = taluka.replace(/\(.*?\)/g, '').trim();
    const villagesMap = new Map<string, VillageOption>();

    try {
      // 1. Query India Post Office API for this Taluka/Town
      const postUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(cleanTaluka)}`;
      const res = await fetch(postUrl);
      const data = await res.json();

      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
        data[0].PostOffice.forEach((po: any) => {
          const poName = (po.Name || '').trim();
          const poDist = (po.District || '').trim();
          const poBlock = (po.Block || '').trim();

          // Filter by district if provided, or accept if matching block/taluka
          const distMatch = !district || poDist.toLowerCase().includes(district.toLowerCase()) || district.toLowerCase().includes(poDist.toLowerCase());
          if (distMatch && poName) {
            villagesMap.set(poName.toLowerCase(), {
              name: poName,
              pincode: po.Pincode || '',
              taluka: poBlock || taluka,
              district: poDist || district,
              state: po.State || state
            });
          }
        });
      }
    } catch (err) {
      console.warn('India Post API error for taluka:', cleanTaluka, err);
    }

    // 2. Also search Nominatim for additional villages/hamlets if fewer than 5 found
    if (villagesMap.size < 5) {
      try {
        const query = `villages in ${cleanTaluka} ${district || ''} ${state || ''} India`;
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=25&addressdetails=1&countrycodes=in`;
        const nomRes = await fetch(nomUrl, { headers: { 'Accept': 'application/json' } });
        const nomData = await nomRes.json();

        if (Array.isArray(nomData)) {
          nomData.forEach((item: any) => {
            const vName = (item.name || '').trim();
            if (vName && !villagesMap.has(vName.toLowerCase())) {
              villagesMap.set(vName.toLowerCase(), {
                name: vName,
                taluka: taluka,
                district: district,
                state: state,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
              });
            }
          });
        }
      } catch (e) {
        // Ignore fallback error
      }
    }

    const result = Array.from(villagesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    this.talukaVillagesCache.set(cacheKey, result);
    return result;
  }

  /**
   * Search live village matches online as user types
   */
  public async searchVillagesLive(query: string, taluka?: string, district?: string, state?: string): Promise<VillageOption[]> {
    if (!query || query.trim().length < 2) return [];

    const cleanQuery = query.trim();
    const parts = [cleanQuery];
    if (taluka) parts.push(taluka.replace(/\(.*?\)/g, '').trim());
    if (district) parts.push(district);
    if (state) parts.push(state);
    parts.push('India');

    const searchStr = parts.join(', ');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchStr)}&format=json&limit=8&addressdetails=1&countrycodes=in`;

    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => {
          const vName = item.name || cleanQuery;
          const addr = item.address || {};
          const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '') : undefined;
          return {
            name: vName,
            pincode: pincode,
            taluka: addr.county || addr.subdistrict || taluka,
            district: addr.state_district || addr.county || district,
            state: addr.state || state,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          };
        });
      }
    } catch (e) {
      console.warn('Live village search error:', e);
    }
    return [];
  }

  /**
   * Geocode administrative location to lat/lon coordinates
   */
  public async geocodeHierarchy(village?: string, taluka?: string, district?: string, state?: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
    const parts: string[] = [];
    if (village && village.trim()) parts.push(village.trim());
    if (taluka && taluka.trim()) parts.push(taluka.replace(/\(.*?\)/g, '').trim());
    if (district && district.trim()) parts.push(district.trim());
    if (state && state.trim()) parts.push(state.trim());
    parts.push('India');

    if (parts.length <= 1) return null;

    const query = parts.join(', ');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&countrycodes=in`;

    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    } catch (e) {
      console.warn('Geocode hierarchy error:', e);
    }

    // Fallback without village if village geocode failed
    if (village && parts.length > 2) {
      return this.geocodeHierarchy(undefined, taluka, district, state);
    }

    return null;
  }

  /**
   * Lookup PIN Code and extract State, District, Taluka, and Villages
   */
  public async lookupPincode(pin: string): Promise<{
    state: string;
    district: string;
    taluka: string;
    villages: VillageOption[];
  } | null> {
    const cleanPin = String(pin || '').replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) return null;

    try {
      const url = `https://api.postalpincode.in/pincode/${cleanPin}`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
        const offices = data[0].PostOffice;
        const rawState = offices[0].State || offices[0].Circle || '';
        const rawDist = offices[0].District || offices[0].Division || '';
        const rawBlock = offices[0].Block || offices[0].Taluk || '';

        const matchedState = this.normalizeState(rawState);
        const matchedDist = this.normalizeDistrict(matchedState, rawDist);

        // Find best taluka match
        const talukas = this.getTalukas(matchedState, matchedDist);
        let matchedTaluka = '';
        if (rawBlock && rawBlock !== 'NA') {
          matchedTaluka = talukas.find(t => t.toLowerCase() === rawBlock.toLowerCase()) || rawBlock;
        } else if (talukas.length > 0) {
          matchedTaluka = talukas[0];
        }

        const villages: VillageOption[] = offices.map((o: any) => ({
          name: o.Name,
          pincode: cleanPin,
          taluka: o.Block || matchedTaluka,
          district: matchedDist,
          state: matchedState
        }));

        return {
          state: matchedState,
          district: matchedDist,
          taluka: matchedTaluka,
          villages: villages
        };
      }
    } catch (e) {
      console.warn('Postal pincode lookup error:', e);
    }
    return null;
  }

  /**
   * Fallback administrative dataset for core regions (Maharashtra, MP, Gujarat, etc.)
   */
  private getFallbackAdminData(): { [state: string]: { [district: string]: string[] } } {
    return {
      'Maharashtra': {
        'Nagpur': ['Bhiwapur', 'Hingna', 'Kalmeshwar', 'Kamptee', 'Kamthi', 'Katol', 'Kuhi', 'Mouda', 'Nagpur', 'Nagpur (Urban)', 'Narkhed', 'Parseoni', 'Ramtek', 'Saoner', 'Umrer'],
        'Pune': ['Ambegaon', 'Baramati', 'Bhor', 'Daund', 'Haveli', 'Indapur', 'Junnar', 'Khed', 'Maval', 'Mulshi', 'Pune City', 'Purandar', 'Shirur', 'Velhe'],
        'Mumbai': ['Mumbai City', 'Mumbai Suburban', 'Kurla', 'Andheri', 'Borivali'],
        'Thane': ['Thane', 'Kalyan', 'Murbad', 'Bhiwandi', 'Shahapur', 'Ulhasnagar', 'Ambarnath'],
        'Nashik': ['Nashik', 'Igatpuri', 'Dindori', 'Peth', 'Trimbakeshwar', 'Kalwan', 'Deola', 'Surgana', 'Baglan', 'Malegaon', 'Nandgaon', 'Chandwad', 'Niphad', 'Sinnar', 'Yeola'],
        'Amravati': ['Amravati', 'Bhatkuli', 'Nandgaon Khandeshwar', 'Dharni', 'Chikhaldara', 'Achalpur', 'Chandurbazar', 'Morshi', 'Warud', 'Daryapur', 'Anjangaon Surji', 'Chandur Railway', 'Dhamangaon Railway', 'Tiosa'],
        'Wardha': ['Wardha', 'Deoli', 'Seloo', 'Arvi', 'Ashti', 'Karanja', 'Hinganghat', 'Samudrapur'],
        'Bhandara': ['Bhandara', 'Tumsar', 'Pauni', 'Mohadi', 'Sakoli', 'Lakhani', 'Lakhandur'],
        'Gondia': ['Gondia', 'Tirora', 'Goregaon', 'Arjuni Morgaon', 'Deori', 'Amgaon', 'Salekasa', 'Sadak Arjuni'],
        'Chandrapur': ['Chandrapur', 'Bhadravati', 'Warora', 'Chimur', 'Nagbhid', 'Bramhapuri', 'Sindewahi', 'Mul', 'Saoli', 'Pombhurna', 'Ballarpur', 'Korpana', 'Rajura', 'Jiwati'],
        'Gadchiroli': ['Gadchiroli', 'Dhanora', 'Chamorshi', 'Mulchera', 'Armori', 'Kurkheda', 'Korchi', 'Desaiganj', 'Aheri', 'Etapalli', 'Bhamragad', 'Sironcha'],
        'Yavatmal': ['Yavatmal', 'Arni', 'Babhulgaon', 'Kalamb', 'Darwha', 'Digras', 'Ner', 'Pusad', 'Umarkhed', 'Mahagaon', 'Ghatanji', 'Pandharkawada', 'Ralegaon', 'Wani', 'Maregaon', 'Zari Jamani'],
        'Akola': ['Akola', 'Akot', 'Balapur', 'Barshitakli', 'Murtizapur', 'Patur', 'Telhara'],
        'Buldhana': ['Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon Jamod', 'Khamgaon', 'Lonar', 'Malkapur', 'Mehkar', 'Motala', 'Nandura', 'Sangrampur', 'Shegaon', 'Sindkhed Raja'],
        'Washim': ['Washim', 'Malegaon', 'Risod', 'Mangrulpir', 'Karanja', 'Manora'],
        'Aurangabad': ['Aurangabad', 'Kannad', 'Soegaon', 'Sillod', 'Phulambri', 'Khuldabad', 'Vaijapur', 'Gangapur', 'Paithan'],
        'Jalna': ['Jalna', 'Bhokardan', 'Jafrabad', 'Badnapur', 'Ambad', 'Ghansawangi', 'Partur', 'Mantha'],
        'Kolhapur': ['Karvir', 'Panhala', 'Shahuwadi', 'Kagal', 'Hatkanangle', 'Shirol', 'Radhanagari', 'Gaganbawda', 'Bhudargad', 'Gadhinglaj', 'Chandgad', 'Ajra'],
        'Satara': ['Satara', 'Karad', 'Wai', 'Mahabaleshwar', 'Phaltan', 'Man', 'Khatav', 'Koregaon', 'Patan', 'Jaoli', 'Khandala'],
        'Solapur': ['Solapur North', 'Solapur South', 'Barshi', 'Akkalkot', 'Mohol', 'Madha', 'Karmala', 'Pandharpur', 'Sangole', 'Malshiras', 'Mangalwedha']
      },
      'Madhya Pradesh': {
        'Bhopal': ['Bhopal', 'Huzur', 'Berasia'],
        'Indore': ['Indore', 'Mhow', 'Depalpur', 'Sanwer', 'Hatod'],
        'Chhindwara': ['Chhindwara', 'Parasia', 'Junnardeo', 'Amarwara', 'Chourai', 'Sausar', 'Pandhurna', 'Tamia', 'Harrai', 'Bichhua', 'Mohkhed'],
        'Jabalpur': ['Jabalpur', 'Sihora', 'Patan', 'Majholi', 'Panagar', 'Kundam', 'Shahpura']
      },
      'Gujarat': {
        'Ahmedabad': ['Ahmedabad City', 'Daskroi', 'Sanand', 'Bavla', 'Dholka', 'Viramgam', 'Mandal', 'Detroj-Rampura', 'Dhandhuka'],
        'Surat': ['Surat City', 'Chorasi', 'Olpad', 'Kamrej', 'Mangrol', 'Mandvi', 'Bardoli', 'Mahuva', 'Palsana', 'Umarpada']
      }
    };
  }
}

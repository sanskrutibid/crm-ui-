/**
 * Area Converter Utility for Indian Land Measurement Units
 * 1 Hectare = 2.47105 Acres
 * 1 Acre = 40 Gunthas
 */

export interface AcreGunthaResult {
  totalAcres: number;
  wholeAcres: number;
  gunthas: number;
  formattedText: string; // e.g. "2 Acre 19 Guntha"
  displayText: string;   // e.g. "1 Hectare (2 Acre 19 Guntha)"
}

export function convertHectareToAcreGuntha(hectares: number | string): AcreGunthaResult | null {
  if (hectares === undefined || hectares === null || hectares === '') return null;
  const val = parseFloat(String(hectares).replace(/[^0-9.]/g, ''));
  if (isNaN(val) || val <= 0) return null;

  // 1 Hectare = 2.47105 Acres
  // 1 Acre = 40 Gunthas (1 Guntha = 1089 sq ft)
  const totalAcres = parseFloat((val * 2.47105).toFixed(3));
  let wholeAcres = Math.floor(totalAcres);
  let gunthas = Math.round((totalAcres - wholeAcres) * 40);

  if (gunthas >= 40) {
    wholeAcres += 1;
    gunthas = 0;
  }

  let formattedText = '';
  if (wholeAcres > 0 && gunthas > 0) {
    formattedText = `${wholeAcres} Acre ${gunthas} Guntha`;
  } else if (wholeAcres > 0) {
    formattedText = `${wholeAcres} Acre`;
  } else if (gunthas > 0) {
    formattedText = `${gunthas} Guntha`;
  } else {
    formattedText = `${totalAcres} Acre`;
  }

  return {
    totalAcres,
    wholeAcres,
    gunthas,
    formattedText,
    displayText: `${val} Hectare (${formattedText})`
  };
}

/**
 * Universal Area display formatter:
 * Automatically detects Hectare and formats as "X Hectare (Y Acre Z Guntha)"
 */
export function formatAreaWithHectare(area: any, unit?: string): string {
  if (area === undefined || area === null || area === '') return '';
  const cleanUnit = (unit || '').trim();
  const lowerUnit = cleanUnit.toLowerCase();

  if (lowerUnit === 'hectare' || lowerUnit === 'hectares') {
    const res = convertHectareToAcreGuntha(area);
    if (res) return res.displayText;
    return `${area} Hectare`;
  }

  if (lowerUnit === 'acre' || lowerUnit === 'acres') {
    const num = parseFloat(String(area).replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      const wholeAcres = Math.floor(num);
      const rem = num - wholeAcres;
      if (rem > 0) {
        let gunthas = Math.round(rem * 40);
        if (gunthas >= 40) {
          return `${wholeAcres + 1} Acre`;
        }
        if (gunthas > 0) {
          const acrePart = wholeAcres > 0 ? `${wholeAcres} Acre ` : '';
          return `${num} Acre (${acrePart}${gunthas} Guntha)`;
        }
      }
      return `${num} Acre`;
    }
  }

  return `${area} ${cleanUnit || 'Sq-Ft'}`.trim();
}

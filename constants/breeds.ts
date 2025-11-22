export const CHICKEN_BREEDS = [
  'Rhode Island Red',
  'Leghorn',
  'Plymouth Rock',
  'Sussex',
  'Orpington',
  'Wyandotte',
  'Australorp',
  'Marans',
  'Brahma',
  'Silkie',
  'Cochin',
  'Polish',
  'Frizzle',
  'Ameraucana',
  'Easter Egger',
  'Buff Orpington',
  'Barred Rock',
  'Speckled Sussex',
  'Rhode Island White',
  'New Hampshire Red',
  'Delaware',
  'Jersey Giant',
  'Langshan',
  'Minorca',
  'Ancona',
  'Andalusian',
  'Campine',
  'Catalana',
  'Crèvecoeur',
  'Dorking',
  'Hamburg',
  'Lakenvelder',
  'Old English Game',
  'Redcap',
  'Sebright',
  'Sumatra',
  'Welsummer',
  'Cream Legbar',
  'Faverolles',
  'Houdan',
  'La Fleche',
  'Lakenvelder',
  'Malay',
  'Nankin',
  'Orloff',
  'Phoenix',
  'Penedesenca',
  'Sicilian Buttercup',
  'Sultan',
  'Yokohama',
  'Bantam',
  'Cornish',
  'Aseel',
  'Barnevelder',
  'Birchen',
  'Booted Bantam',
  'Buckeye',
  'Campine',
  'Catalana',
  'Chantecler',
  'Cubalaya',
  'Dominique',
  'Faverolle',
  'Ixworth',
  'Java',
  'Kraienkoppe',
  'La Fleche',
  'Lakenvelder',
  'Legbar',
  'Maran',
  'Marsh Daisy',
  'Modern Game',
  'Naked Neck',
  'Old English Game',
  'Orloff',
  'Penedesenca',
  'Phoenix',
  'Rhode Island White',
  'Rosecomb',
  'Scots Dumpy',
  'Scots Grey',
  'Shamo',
  'Spanish',
  'Sultan',
  'Vorwerk',
  'Welsummer',
  'Yokohama',
  'Sapphire Gem',
  'Other',
];

export const RABBIT_BREEDS = [
  'New Zealand White',
  'Californian',
  'Flemish Giant',
  'Rex',
  'Holland Lop',
  'Mini Lop',
  'Lionhead',
  'Dutch',
  'English Angora',
  'American',
  'Other',
];

/**
 * Maps abbreviated chicken breed codes to their full names
 * Used for displaying breed names when historical data contains abbreviations
 */
export const CHICKEN_BREED_CODE_MAP: { [code: string]: string } = {
  'RIR': 'Rhode Island Red',
  'BR': 'Barred Rock',
  'BO': 'Buff Orpington',
  'SG': 'Sapphire Gem',
  'RIW': 'Rhode Island White',
  'PR': 'Plymouth Rock',
  'NHR': 'New Hampshire Red',
  'EE': 'Easter Egger',
  'SS': 'Speckled Sussex',
};

/**
 * Gets the full breed name from a code or returns the original value if no mapping exists
 * @param breedCode - The breed code or full name
 * @returns The full breed name
 */
export function getChickenBreedName(breedCode: string | undefined): string {
  if (!breedCode) return 'Unknown';
  
  // Check if it's a known abbreviation
  if (CHICKEN_BREED_CODE_MAP[breedCode]) {
    return CHICKEN_BREED_CODE_MAP[breedCode];
  }
  
  // Return the original value if it's already a full name or unknown code
  return breedCode;
}

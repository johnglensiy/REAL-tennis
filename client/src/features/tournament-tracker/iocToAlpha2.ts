/**
 * IOC (3-letter, e.g. "ARG", "GER", "NGR") -> ISO 3166-1 alpha-2 (e.g. "AR",
 * "DE", "NG"). ATP/tennis data uses IOC codes, while flag icon sets are keyed
 * by alpha-2, so this bridges the two.
 *
 * Keys are UPPERCASE IOC. Lookups should uppercase the input first.
 * A few IOC codes have no ISO alpha-2 (historic/─composite teams) and are
 * intentionally omitted — callers should treat a miss as "no flag".
 *
 * Watch the near-collisions: NGR=Nigeria vs NIG=Niger, BRN=Bahrain vs
 * BRU=Brunei, GUI=Guinea vs GBS=Guinea-Bissau vs GEQ=Equatorial Guinea.
 */
export const iocToAlpha2: Record<string, string> = {
  // Africa
  ALG: "DZ", // Algeria
  ANG: "AO", // Angola
  BEN: "BJ", // Benin
  BOT: "BW", // Botswana
  BUR: "BF", // Burkina Faso
  BDI: "BI", // Burundi
  CMR: "CM", // Cameroon
  CPV: "CV", // Cape Verde
  CAF: "CF", // Central African Republic
  CHA: "TD", // Chad
  COM: "KM", // Comoros
  CGO: "CG", // Congo
  COD: "CD", // DR Congo
  CIV: "CI", // Côte d'Ivoire
  DJI: "DJ", // Djibouti
  EGY: "EG", // Egypt
  GEQ: "GQ", // Equatorial Guinea
  ERI: "ER", // Eritrea
  SWZ: "SZ", // Eswatini
  ETH: "ET", // Ethiopia
  GAB: "GA", // Gabon
  GAM: "GM", // Gambia
  GHA: "GH", // Ghana
  GUI: "GN", // Guinea
  GBS: "GW", // Guinea-Bissau
  KEN: "KE", // Kenya
  LES: "LS", // Lesotho
  LBR: "LR", // Liberia
  LBA: "LY", // Libya
  MAD: "MG", // Madagascar
  MAW: "MW", // Malawi
  MLI: "ML", // Mali
  MTN: "MR", // Mauritania
  MRI: "MU", // Mauritius
  MAR: "MA", // Morocco
  MOZ: "MZ", // Mozambique
  NAM: "NA", // Namibia
  NIG: "NE", // Niger
  NGR: "NG", // Nigeria
  RWA: "RW", // Rwanda
  STP: "ST", // São Tomé and Príncipe
  SEN: "SN", // Senegal
  SEY: "SC", // Seychelles
  SLE: "SL", // Sierra Leone
  SOM: "SO", // Somalia
  RSA: "ZA", // South Africa
  SSD: "SS", // South Sudan
  SUD: "SD", // Sudan
  TAN: "TZ", // Tanzania
  TOG: "TG", // Togo
  TUN: "TN", // Tunisia
  UGA: "UG", // Uganda
  ZAM: "ZM", // Zambia
  ZIM: "ZW", // Zimbabwe

  // Americas
  ANT: "AG", // Antigua and Barbuda
  ARG: "AR", // Argentina
  ARU: "AW", // Aruba
  BAH: "BS", // Bahamas
  BAR: "BB", // Barbados
  BIZ: "BZ", // Belize
  BER: "BM", // Bermuda
  BOL: "BO", // Bolivia
  BRA: "BR", // Brazil
  IVB: "VG", // British Virgin Islands
  CAN: "CA", // Canada
  CAY: "KY", // Cayman Islands
  CHI: "CL", // Chile
  COL: "CO", // Colombia
  CRC: "CR", // Costa Rica
  CUB: "CU", // Cuba
  DMA: "DM", // Dominica
  DOM: "DO", // Dominican Republic
  ECU: "EC", // Ecuador
  ESA: "SV", // El Salvador
  GRN: "GD", // Grenada
  GUA: "GT", // Guatemala
  GUY: "GY", // Guyana
  HAI: "HT", // Haiti
  HON: "HN", // Honduras
  JAM: "JM", // Jamaica
  MEX: "MX", // Mexico
  NCA: "NI", // Nicaragua
  PAN: "PA", // Panama
  PAR: "PY", // Paraguay
  PER: "PE", // Peru
  PUR: "PR", // Puerto Rico
  SKN: "KN", // Saint Kitts and Nevis
  LCA: "LC", // Saint Lucia
  VIN: "VC", // Saint Vincent and the Grenadines
  SUR: "SR", // Suriname
  TTO: "TT", // Trinidad and Tobago
  USA: "US", // United States
  URU: "UY", // Uruguay
  ISV: "VI", // US Virgin Islands
  VEN: "VE", // Venezuela

  // Asia
  AFG: "AF", // Afghanistan
  BRN: "BH", // Bahrain
  BAN: "BD", // Bangladesh
  BHU: "BT", // Bhutan
  BRU: "BN", // Brunei
  CAM: "KH", // Cambodia
  CHN: "CN", // China
  TPE: "TW", // Chinese Taipei
  HKG: "HK", // Hong Kong
  IND: "IN", // India
  INA: "ID", // Indonesia
  IRI: "IR", // Iran
  IRQ: "IQ", // Iraq
  JPN: "JP", // Japan
  JOR: "JO", // Jordan
  KAZ: "KZ", // Kazakhstan
  PRK: "KP", // North Korea
  KOR: "KR", // South Korea
  KUW: "KW", // Kuwait
  KGZ: "KG", // Kyrgyzstan
  LAO: "LA", // Laos
  LIB: "LB", // Lebanon
  MAC: "MO", // Macau
  MAS: "MY", // Malaysia
  MDV: "MV", // Maldives
  MGL: "MN", // Mongolia
  MYA: "MM", // Myanmar
  NEP: "NP", // Nepal
  OMA: "OM", // Oman
  PAK: "PK", // Pakistan
  PLE: "PS", // Palestine
  PHI: "PH", // Philippines
  QAT: "QA", // Qatar
  KSA: "SA", // Saudi Arabia
  SIN: "SG", // Singapore
  SRI: "LK", // Sri Lanka
  SYR: "SY", // Syria
  TJK: "TJ", // Tajikistan
  THA: "TH", // Thailand
  TLS: "TL", // Timor-Leste
  TKM: "TM", // Turkmenistan
  UAE: "AE", // United Arab Emirates
  UZB: "UZ", // Uzbekistan
  VIE: "VN", // Vietnam
  YEM: "YE", // Yemen
  ISR: "IL", // Israel

  // Europe
  ALB: "AL", // Albania
  AND: "AD", // Andorra
  ARM: "AM", // Armenia
  AUT: "AT", // Austria
  AZE: "AZ", // Azerbaijan
  BLR: "BY", // Belarus
  BEL: "BE", // Belgium
  BIH: "BA", // Bosnia and Herzegovina
  BUL: "BG", // Bulgaria
  CRO: "HR", // Croatia
  CYP: "CY", // Cyprus
  CZE: "CZ", // Czechia
  DEN: "DK", // Denmark
  EST: "EE", // Estonia
  FIN: "FI", // Finland
  FRA: "FR", // France
  GEO: "GE", // Georgia
  GER: "DE", // Germany
  GBR: "GB", // Great Britain
  GRE: "GR", // Greece
  HUN: "HU", // Hungary
  ISL: "IS", // Iceland
  IRL: "IE", // Ireland
  ITA: "IT", // Italy
  KOS: "XK", // Kosovo (user-assigned)
  LAT: "LV", // Latvia
  LIE: "LI", // Liechtenstein
  LTU: "LT", // Lithuania
  LUX: "LU", // Luxembourg
  MLT: "MT", // Malta
  MDA: "MD", // Moldova
  MON: "MC", // Monaco
  MNE: "ME", // Montenegro
  NED: "NL", // Netherlands
  MKD: "MK", // North Macedonia
  NOR: "NO", // Norway
  POL: "PL", // Poland
  POR: "PT", // Portugal
  ROU: "RO", // Romania
  RUS: "RU", // Russia
  SMR: "SM", // San Marino
  SRB: "RS", // Serbia
  SVK: "SK", // Slovakia
  SLO: "SI", // Slovenia
  ESP: "ES", // Spain
  SWE: "SE", // Sweden
  SUI: "CH", // Switzerland
  TUR: "TR", // Turkey
  UKR: "UA", // Ukraine

  // Oceania
  ASA: "AS", // American Samoa
  AUS: "AU", // Australia
  COK: "CK", // Cook Islands
  FIJ: "FJ", // Fiji
  FSM: "FM", // Micronesia
  GUM: "GU", // Guam
  KIR: "KI", // Kiribati
  MHL: "MH", // Marshall Islands
  NRU: "NR", // Nauru
  NZL: "NZ", // New Zealand
  PLW: "PW", // Palau
  PNG: "PG", // Papua New Guinea
  SAM: "WS", // Samoa
  SOL: "SB", // Solomon Islands
  TGA: "TO", // Tonga
  TUV: "TV", // Tuvalu
  VAN: "VU", // Vanuatu
};

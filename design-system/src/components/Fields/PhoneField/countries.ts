// countries.ts — Subliminal Design System / PhoneField
// Country list is generated from libphonenumber-js + Intl.DisplayNames (245 countries,
// always accurate). Formatting uses AsYouType for correct variable-length national plans.

import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  parsePhoneNumber,
  isPossiblePhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Country {
  /** ISO 3166-1 alpha-2 code (uppercase). Used as the Flagpack `code` prop. */
  code: string;
  name: string;
  /** E.164 country calling code, e.g. '+1' */
  dialCode: string;
}

// ─── Flagpack compatibility ────────────────────────────────────────────────────

/**
 * Maps an ISO 3166-1 alpha-2 country code to the Flagpack-specific code where
 * the two differ. Most countries use the same code; exceptions are listed here.
 */
const FLAGPACK_CODE_OVERRIDES: Record<string, string> = {
  GB: 'GB-UKM', // Flagpack uses GB-UKM for the United Kingdom
  BQ: 'NL',     // Caribbean Netherlands — no combined BQ flag; use Netherlands (parent country)
  AC: 'SH',     // Ascension Island — part of Saint Helena, Ascension and Tristan da Cunha
  TA: 'SH',     // Tristan da Cunha — part of Saint Helena, Ascension and Tristan da Cunha
};

/**
 * Countries with no Flagpack representation and no appropriate parent mapping.
 * Filtered from COUNTRIES at build time to avoid broken flag icons.
 */
const FLAGPACK_UNSUPPORTED = new Set(['XK']); // Kosovo — unofficial ISO code, no Flagpack entry

// ─── Country data ─────────────────────────────────────────────────────────────

const _displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const COUNTRIES: Country[] = getCountries()
  .map((code): Country | null => {
    if (FLAGPACK_UNSUPPORTED.has(code)) return null;
    const name = _displayNames.of(code);
    if (!name) return null;
    return {
      code,
      name,
      dialCode: `+${getCountryCallingCode(code)}`,
    };
  })
  .filter((c): c is Country => c !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

// ─── Timezone → country map ───────────────────────────────────────────────────
// Used by detectCountryCodeFromTimezone() for the default country selection.

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // North America
  'America/New_York':                  'US',
  'America/Chicago':                   'US',
  'America/Denver':                    'US',
  'America/Phoenix':                   'US',
  'America/Los_Angeles':               'US',
  'America/Anchorage':                 'US',
  'America/Juneau':                    'US',
  'America/Honolulu':                  'US',
  'America/Detroit':                   'US',
  'America/Indiana/Indianapolis':      'US',
  'America/Kentucky/Louisville':       'US',
  'America/Boise':                     'US',
  'America/Puerto_Rico':               'US',
  'America/Toronto':                   'CA',
  'America/Vancouver':                 'CA',
  'America/Montreal':                  'CA',
  'America/Winnipeg':                  'CA',
  'America/Regina':                    'CA',
  'America/Edmonton':                  'CA',
  'America/Halifax':                   'CA',
  'America/St_Johns':                  'CA',
  'America/Mexico_City':               'MX',
  'America/Tijuana':                   'MX',
  'America/Monterrey':                 'MX',
  'America/Merida':                    'MX',
  'America/Chihuahua':                 'MX',
  'America/Mazatlan':                  'MX',
  // Caribbean
  'America/Havana':                    'CU',
  'America/Jamaica':                   'JM',
  'America/Nassau':                    'BS',
  'America/Port-au-Prince':            'HT',
  'America/Santo_Domingo':             'DO',
  'America/Barbados':                  'BB',
  'America/Curacao':                   'CW',
  'America/Trinidad':                  'TT',
  // Central America
  'America/Costa_Rica':                'CR',
  'America/Guatemala':                 'GT',
  'America/Tegucigalpa':               'HN',
  'America/El_Salvador':               'SV',
  'America/Managua':                   'NI',
  'America/Belize':                    'BZ',
  'America/Panama':                    'PA',
  // South America
  'America/Bogota':                    'CO',
  'America/Caracas':                   'VE',
  'America/Lima':                      'PE',
  'America/Santiago':                  'CL',
  'America/Argentina/Buenos_Aires':    'AR',
  'America/Argentina/Cordoba':         'AR',
  'America/Sao_Paulo':                 'BR',
  'America/Manaus':                    'BR',
  'America/Belem':                     'BR',
  'America/Fortaleza':                 'BR',
  'America/Recife':                    'BR',
  'America/Maceio':                    'BR',
  'America/Bahia':                     'BR',
  'America/Cuiaba':                    'BR',
  'America/Porto_Velho':               'BR',
  'America/Boa_Vista':                 'BR',
  'America/Rio_Branco':                'BR',
  'America/Noronha':                   'BR',
  'America/Guyana':                    'GY',
  'America/Suriname':                  'SR',
  'America/Paramaribo':                'SR',
  'America/Cayenne':                   'GF',
  'America/Montevideo':                'UY',
  'America/Asuncion':                  'PY',
  'America/La_Paz':                    'BO',
  'America/Guayaquil':                 'EC',
  // Western Europe
  'Europe/London':                     'GB',
  'Europe/Dublin':                     'IE',
  'Europe/Lisbon':                     'PT',
  'Europe/Paris':                      'FR',
  'Europe/Madrid':                     'ES',
  'Europe/Berlin':                     'DE',
  'Europe/Amsterdam':                  'NL',
  'Europe/Brussels':                   'BE',
  'Europe/Luxembourg':                 'LU',
  'Europe/Zurich':                     'CH',
  'Europe/Vienna':                     'AT',
  'Europe/Rome':                       'IT',
  'Europe/Vatican':                    'VA',
  'Europe/San_Marino':                 'SM',
  'Europe/Monaco':                     'MC',
  'Europe/Andorra':                    'AD',
  'Europe/Vaduz':                      'LI',
  'Europe/Malta':                      'MT',
  // Northern Europe
  'Europe/Oslo':                       'NO',
  'Europe/Stockholm':                  'SE',
  'Europe/Copenhagen':                 'DK',
  'Europe/Helsinki':                   'FI',
  'Europe/Reykjavik':                  'IS',
  'Atlantic/Reykjavik':                'IS',
  // Central/Eastern Europe
  'Europe/Warsaw':                     'PL',
  'Europe/Prague':                     'CZ',
  'Europe/Budapest':                   'HU',
  'Europe/Bratislava':                 'SK',
  'Europe/Bucharest':                  'RO',
  'Europe/Sofia':                      'BG',
  'Europe/Athens':                     'GR',
  'Europe/Nicosia':                    'CY',
  'Europe/Istanbul':                   'TR',
  'Europe/Kyiv':                       'UA',
  'Europe/Kiev':                       'UA',
  'Europe/Minsk':                      'BY',
  'Europe/Moscow':                     'RU',
  'Europe/Kaliningrad':                'RU',
  'Europe/Samara':                     'RU',
  'Europe/Yekaterinburg':              'RU',
  'Asia/Omsk':                         'RU',
  'Asia/Novosibirsk':                  'RU',
  'Asia/Krasnoyarsk':                  'RU',
  'Asia/Irkutsk':                      'RU',
  'Asia/Yakutsk':                      'RU',
  'Asia/Vladivostok':                  'RU',
  'Asia/Magadan':                      'RU',
  'Asia/Kamchatka':                    'RU',
  'Europe/Belgrade':                   'RS',
  'Europe/Zagreb':                     'HR',
  'Europe/Sarajevo':                   'BA',
  'Europe/Podgorica':                  'ME',
  'Europe/Skopje':                     'MK',
  'Europe/Tirane':                     'AL',
  'Europe/Tallinn':                    'EE',
  'Europe/Riga':                       'LV',
  'Europe/Vilnius':                    'LT',
  'Europe/Chisinau':                   'MD',
  // Middle East
  'Asia/Jerusalem':                    'IL',
  'Asia/Tel_Aviv':                     'IL',
  'Asia/Amman':                        'JO',
  'Asia/Beirut':                       'LB',
  'Asia/Damascus':                     'SY',
  'Asia/Baghdad':                      'IQ',
  'Asia/Tehran':                       'IR',
  'Asia/Riyadh':                       'SA',
  'Asia/Kuwait':                       'KW',
  'Asia/Dubai':                        'AE',
  'Asia/Muscat':                       'OM',
  'Asia/Qatar':                        'QA',
  'Asia/Doha':                         'QA',
  'Asia/Bahrain':                      'BH',
  'Asia/Aden':                         'YE',
  'Asia/Kabul':                        'AF',
  // South Asia
  'Asia/Karachi':                      'PK',
  'Asia/Kolkata':                      'IN',
  'Asia/Calcutta':                     'IN',
  'Asia/Colombo':                      'LK',
  'Asia/Kathmandu':                    'NP',
  'Asia/Katmandu':                     'NP',
  'Asia/Dhaka':                        'BD',
  'Asia/Thimphu':                      'BT',
  'Asia/Thimbu':                       'BT',
  // Central Asia
  'Asia/Tashkent':                     'UZ',
  'Asia/Almaty':                       'KZ',
  'Asia/Qyzylorda':                    'KZ',
  'Asia/Aqtau':                        'KZ',
  'Asia/Aqtobe':                       'KZ',
  'Asia/Bishkek':                      'KG',
  'Asia/Dushanbe':                     'TJ',
  'Asia/Ashgabat':                     'TM',
  'Asia/Ashkhabad':                    'TM',
  'Asia/Baku':                         'AZ',
  'Asia/Tbilisi':                      'GE',
  'Asia/Yerevan':                      'AM',
  // East Asia
  'Asia/Tokyo':                        'JP',
  'Asia/Seoul':                        'KR',
  'Asia/Shanghai':                     'CN',
  'Asia/Beijing':                      'CN',
  'Asia/Chongqing':                    'CN',
  'Asia/Harbin':                       'CN',
  'Asia/Urumqi':                       'CN',
  'Asia/Hong_Kong':                    'HK',
  'Asia/Taipei':                       'TW',
  'Asia/Ulaanbaatar':                  'MN',
  'Asia/Pyongyang':                    'KP',
  'Asia/Macau':                        'MO',
  // Southeast Asia
  'Asia/Singapore':                    'SG',
  'Asia/Manila':                       'PH',
  'Asia/Bangkok':                      'TH',
  'Asia/Jakarta':                      'ID',
  'Asia/Makassar':                     'ID',
  'Asia/Jayapura':                     'ID',
  'Asia/Kuala_Lumpur':                 'MY',
  'Asia/Kuching':                      'MY',
  'Asia/Yangon':                       'MM',
  'Asia/Rangoon':                      'MM',
  'Asia/Phnom_Penh':                   'KH',
  'Asia/Vientiane':                    'LA',
  'Asia/Ho_Chi_Minh':                  'VN',
  'Asia/Saigon':                       'VN',
  'Asia/Hanoi':                        'VN',
  'Asia/Brunei':                       'BN',
  'Asia/Dili':                         'TL',
  // Indian Ocean
  'Indian/Mauritius':                  'MU',
  'Indian/Maldives':                   'MV',
  'Indian/Antananarivo':               'MG',
  // Africa
  'Africa/Cairo':                      'EG',
  'Africa/Casablanca':                 'MA',
  'Africa/Tunis':                      'TN',
  'Africa/Algiers':                    'DZ',
  'Africa/Tripoli':                    'LY',
  'Africa/Lagos':                      'NG',
  'Africa/Accra':                      'GH',
  'Africa/Abidjan':                    'CI',
  'Africa/Dakar':                      'SN',
  'Africa/Bamako':                     'ML',
  'Africa/Conakry':                    'GN',
  'Africa/Freetown':                   'SL',
  'Africa/Monrovia':                   'LR',
  'Africa/Nairobi':                    'KE',
  'Africa/Dar_es_Salaam':              'TZ',
  'Africa/Kampala':                    'UG',
  'Africa/Kigali':                     'RW',
  'Africa/Addis_Ababa':                'ET',
  'Africa/Mogadishu':                  'SO',
  'Africa/Djibouti':                   'DJ',
  'Africa/Asmara':                     'ER',
  'Africa/Asmera':                     'ER',
  'Africa/Khartoum':                   'SD',
  'Africa/Juba':                       'SS',
  'Africa/Johannesburg':               'ZA',
  'Africa/Harare':                     'ZW',
  'Africa/Lusaka':                     'ZM',
  'Africa/Maputo':                     'MZ',
  'Africa/Gaborone':                   'BW',
  'Africa/Windhoek':                   'NA',
  'Africa/Mbabane':                    'SZ',
  'Africa/Maseru':                     'LS',
  'Africa/Kinshasa':                   'CD',
  'Africa/Lubumbashi':                 'CD',
  'Africa/Brazzaville':                'CG',
  'Africa/Libreville':                 'GA',
  'Africa/Douala':                     'CM',
  'Africa/Bangui':                     'CF',
  'Africa/Ndjamena':                   'TD',
  'Africa/Niamey':                     'NE',
  'Africa/Ouagadougou':                'BF',
  'Africa/Nouakchott':                 'MR',
  'Africa/Lome':                       'TG',
  'Africa/Porto-Novo':                 'BJ',
  'Africa/Luanda':                     'AO',
  'Africa/Malabo':                     'GQ',
  'Africa/Sao_Tome':                   'ST',
  'Africa/Bujumbura':                  'BI',
  'Africa/Blantyre':                   'MW',
  'Africa/Antananarivo':               'MG',
  // Oceania
  'Australia/Sydney':                  'AU',
  'Australia/Melbourne':               'AU',
  'Australia/Brisbane':                'AU',
  'Australia/Perth':                   'AU',
  'Australia/Adelaide':                'AU',
  'Australia/Darwin':                  'AU',
  'Australia/Hobart':                  'AU',
  'Australia/Lord_Howe':               'AU',
  'Pacific/Auckland':                  'NZ',
  'Pacific/Chatham':                   'NZ',
  'Pacific/Fiji':                      'FJ',
  'Pacific/Port_Moresby':              'PG',
  'Pacific/Bougainville':              'PG',
  'Pacific/Apia':                      'WS',
  'Pacific/Tongatapu':                 'TO',
  'Pacific/Majuro':                    'MH',
  'Pacific/Kwajalein':                 'MH',
  'Pacific/Palikir':                   'FM',
  'Pacific/Tarawa':                    'KI',
  'Pacific/Kiritimati':                'KI',
  'Pacific/Funafuti':                  'TV',
  'Pacific/Nauru':                     'NR',
  'Pacific/Palau':                     'PW',
  'Pacific/Honiara':                   'SB',
  'Pacific/Efate':                     'VU',
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Strips all non-digit characters from a string. */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formats a raw digit string into the national display format for the country.
 *
 * Strategy:
 *   1. For a complete, valid number — use parsePhoneNumber().formatNational().
 *      This gives the authoritative national format (e.g. "070-555 55 55" for SE)
 *      and is more reliable than AsYouType for fully-typed numbers.
 *   2. For a partial / incomplete number — fall back to AsYouType, which applies
 *      progressive formatting as the user types digit by digit.
 *
 * Capped at 15 digits (ITU-T E.164 maximum).
 */
export function formatNationalNumber(digits: string, countryCode: string): string {
  if (!digits) return '';
  const capped = digits.slice(0, 15);
  // Complete number path — most reliable formatting
  try {
    const parsed = parsePhoneNumber(capped, countryCode as CountryCode);
    if (parsed?.isValid()) return parsed.formatNational();
  } catch {
    // Not a complete valid number — fall through to progressive formatter
  }
  // Partial number path — AsYouType for as-you-type feedback
  return new AsYouType(countryCode as CountryCode).input(capped);
}

/** Per-country digit cap cache — computed once, reused on every keystroke. */
const _maxDigitsCache = new Map<string, number>();

/**
 * Returns the maximum number of digits the user would type for a country,
 * including any national trunk prefix (e.g. the leading '0' in Sweden, UK,
 * Germany, etc.).
 *
 * isPossiblePhoneNumber is documented as length-only, but libphonenumber-js
 * still parses the number before the length check, which means a probe digit
 * that isn't a valid leading digit for any number type in that country can
 * cause the check to return false even though that length is valid. For example,
 * Suriname mobiles start with 7 or 8 — probing with all-5s fails at 7 digits
 * and the cap comes back as 6, one short of the actual mobile length.
 *
 * Fix: probe several representative starting digits (covering common mobile
 * prefixes 7/8/9, neutral digit 5, and trunk-prefix form 0+x) and accept the
 * first length where ANY probe is possible.
 */
export function getMaxNationalDigits(countryCode: string): number {
  if (_maxDigitsCache.has(countryCode)) return _maxDigitsCache.get(countryCode)!;

  // Starting digits to try at each length.
  // 7, 8, 9 — common mobile/geographic prefixes worldwide
  // 5        — neutral fallback
  // 0        — trunk prefix used by many European/Asian countries
  const starts = ['7', '8', '9', '5', '0'];

  for (let i = 15; i >= 4; i--) {
    const possible = starts.some(d =>
      isPossiblePhoneNumber(d + '5'.repeat(i - 1), countryCode as CountryCode)
    );
    if (possible) {
      _maxDigitsCache.set(countryCode, i);
      return i;
    }
  }

  _maxDigitsCache.set(countryCode, 15);
  return 15;
}

/**
 * Returns the E.164 formatted number if the digits form a valid number for the country.
 * Returns undefined for incomplete or invalid inputs.
 */
export function getE164(digits: string, countryCode: string): string | undefined {
  try {
    const parsed = parsePhoneNumber(digits, countryCode as CountryCode);
    return parsed?.isValid() ? parsed.format('E.164') : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Detects the user's likely country from their device timezone via
 * Intl.DateTimeFormat().resolvedOptions().timeZone — no Geolocation API.
 * Falls back to 'US' for unknown timezones.
 */
export function detectCountryCodeFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[tz] ?? 'US';
  } catch {
    return 'US';
  }
}

/** Finds a Country by its ISO 3166-1 alpha-2 code (case-insensitive). */
export function findCountryByCode(code: string): Country | undefined {
  const upper = code.toUpperCase();
  return COUNTRIES.find(c => c.code === upper);
}

export function getFlagCode(isoCode: string): string {
  return FLAGPACK_CODE_OVERRIDES[isoCode] ?? isoCode;
}

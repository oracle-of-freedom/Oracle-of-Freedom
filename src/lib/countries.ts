import type { PresenceRegion } from "@/lib/presence-region";
import type { Locale } from "@/i18n/routing";

export type Country = {
  code: string;
  region: PresenceRegion;
  es: string;
  en: string;
  pt: string;
};

export const COUNTRIES: Country[] = [
  { code: "AL", region: "europe", es: "Albania", en: "Albania", pt: "Albânia" },
  { code: "DE", region: "europe", es: "Alemania", en: "Germany", pt: "Alemanha" },
  { code: "AD", region: "europe", es: "Andorra", en: "Andorra", pt: "Andorra" },
  { code: "AT", region: "europe", es: "Austria", en: "Austria", pt: "Áustria" },
  { code: "BE", region: "europe", es: "Bélgica", en: "Belgium", pt: "Bélgica" },
  { code: "BY", region: "europe", es: "Bielorrusia", en: "Belarus", pt: "Bielorrússia" },
  { code: "BA", region: "europe", es: "Bosnia y Herzegovina", en: "Bosnia and Herzegovina", pt: "Bósnia e Herzegovina" },
  { code: "BG", region: "europe", es: "Bulgaria", en: "Bulgaria", pt: "Bulgária" },
  { code: "CY", region: "europe", es: "Chipre", en: "Cyprus", pt: "Chipre" },
  { code: "HR", region: "europe", es: "Croacia", en: "Croatia", pt: "Croácia" },
  { code: "DK", region: "europe", es: "Dinamarca", en: "Denmark", pt: "Dinamarca" },
  { code: "SK", region: "europe", es: "Eslovaquia", en: "Slovakia", pt: "Eslováquia" },
  { code: "SI", region: "europe", es: "Eslovenia", en: "Slovenia", pt: "Eslovénia" },
  { code: "ES", region: "europe", es: "España", en: "Spain", pt: "Espanha" },
  { code: "EE", region: "europe", es: "Estonia", en: "Estonia", pt: "Estónia" },
  { code: "FI", region: "europe", es: "Finlandia", en: "Finland", pt: "Finlândia" },
  { code: "FR", region: "europe", es: "Francia", en: "France", pt: "França" },
  { code: "GR", region: "europe", es: "Grecia", en: "Greece", pt: "Grécia" },
  { code: "HU", region: "europe", es: "Hungría", en: "Hungary", pt: "Hungria" },
  { code: "IE", region: "europe", es: "Irlanda", en: "Ireland", pt: "Irlanda" },
  { code: "IS", region: "europe", es: "Islandia", en: "Iceland", pt: "Islândia" },
  { code: "IT", region: "europe", es: "Italia", en: "Italy", pt: "Itália" },
  { code: "XK", region: "europe", es: "Kosovo", en: "Kosovo", pt: "Kosovo" },
  { code: "LV", region: "europe", es: "Letonia", en: "Latvia", pt: "Letónia" },
  { code: "LI", region: "europe", es: "Liechtenstein", en: "Liechtenstein", pt: "Liechtenstein" },
  { code: "LT", region: "europe", es: "Lituania", en: "Lithuania", pt: "Lituânia" },
  { code: "LU", region: "europe", es: "Luxemburgo", en: "Luxembourg", pt: "Luxemburgo" },
  { code: "MK", region: "europe", es: "Macedonia del Norte", en: "North Macedonia", pt: "Macedónia do Norte" },
  { code: "MT", region: "europe", es: "Malta", en: "Malta", pt: "Malta" },
  { code: "MD", region: "europe", es: "Moldavia", en: "Moldova", pt: "Moldávia" },
  { code: "MC", region: "europe", es: "Mónaco", en: "Monaco", pt: "Mónaco" },
  { code: "ME", region: "europe", es: "Montenegro", en: "Montenegro", pt: "Montenegro" },
  { code: "NO", region: "europe", es: "Noruega", en: "Norway", pt: "Noruega" },
  { code: "NL", region: "europe", es: "Países Bajos", en: "Netherlands", pt: "Países Baixos" },
  { code: "PL", region: "europe", es: "Polonia", en: "Poland", pt: "Polónia" },
  { code: "PT", region: "europe", es: "Portugal", en: "Portugal", pt: "Portugal" },
  { code: "GB", region: "europe", es: "Reino Unido", en: "United Kingdom", pt: "Reino Unido" },
  { code: "CZ", region: "europe", es: "República Checa", en: "Czechia", pt: "Chéquia" },
  { code: "RO", region: "europe", es: "Rumanía", en: "Romania", pt: "Roménia" },
  { code: "RU", region: "europe", es: "Rusia", en: "Russia", pt: "Rússia" },
  { code: "SM", region: "europe", es: "San Marino", en: "San Marino", pt: "São Marino" },
  { code: "RS", region: "europe", es: "Serbia", en: "Serbia", pt: "Sérvia" },
  { code: "SE", region: "europe", es: "Suecia", en: "Sweden", pt: "Suécia" },
  { code: "CH", region: "europe", es: "Suiza", en: "Switzerland", pt: "Suíça" },
  { code: "UA", region: "europe", es: "Ucrania", en: "Ukraine", pt: "Ucrânia" },
  { code: "VA", region: "europe", es: "Vaticano", en: "Vatican City", pt: "Vaticano" },
  { code: "AR", region: "latin-america", es: "Argentina", en: "Argentina", pt: "Argentina" },
  { code: "BZ", region: "latin-america", es: "Belice", en: "Belize", pt: "Belize" },
  { code: "BO", region: "latin-america", es: "Bolivia", en: "Bolivia", pt: "Bolívia" },
  { code: "BR", region: "latin-america", es: "Brasil", en: "Brazil", pt: "Brasil" },
  { code: "CL", region: "latin-america", es: "Chile", en: "Chile", pt: "Chile" },
  { code: "CO", region: "latin-america", es: "Colombia", en: "Colombia", pt: "Colômbia" },
  { code: "CR", region: "latin-america", es: "Costa Rica", en: "Costa Rica", pt: "Costa Rica" },
  { code: "CU", region: "latin-america", es: "Cuba", en: "Cuba", pt: "Cuba" },
  { code: "EC", region: "latin-america", es: "Ecuador", en: "Ecuador", pt: "Equador" },
  { code: "SV", region: "latin-america", es: "El Salvador", en: "El Salvador", pt: "El Salvador" },
  { code: "GT", region: "latin-america", es: "Guatemala", en: "Guatemala", pt: "Guatemala" },
  { code: "GY", region: "latin-america", es: "Guyana", en: "Guyana", pt: "Guiana" },
  { code: "HT", region: "latin-america", es: "Haití", en: "Haiti", pt: "Haiti" },
  { code: "HN", region: "latin-america", es: "Honduras", en: "Honduras", pt: "Honduras" },
  { code: "MX", region: "latin-america", es: "México", en: "Mexico", pt: "México" },
  { code: "NI", region: "latin-america", es: "Nicaragua", en: "Nicaragua", pt: "Nicarágua" },
  { code: "PA", region: "latin-america", es: "Panamá", en: "Panama", pt: "Panamá" },
  { code: "PY", region: "latin-america", es: "Paraguay", en: "Paraguay", pt: "Paraguai" },
  { code: "PE", region: "latin-america", es: "Perú", en: "Peru", pt: "Peru" },
  { code: "PR", region: "latin-america", es: "Puerto Rico", en: "Puerto Rico", pt: "Porto Rico" },
  { code: "DO", region: "latin-america", es: "República Dominicana", en: "Dominican Republic", pt: "República Dominicana" },
  { code: "SR", region: "latin-america", es: "Surinam", en: "Suriname", pt: "Suriname" },
  { code: "UY", region: "latin-america", es: "Uruguay", en: "Uruguay", pt: "Uruguai" },
  { code: "VE", region: "latin-america", es: "Venezuela", en: "Venezuela", pt: "Venezuela" },
];

const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const BY_NAME = new Map<string, string>();
for (const country of COUNTRIES) {
  BY_NAME.set(fold(country.code), country.code);
  BY_NAME.set(fold(country.es), country.code);
  BY_NAME.set(fold(country.en), country.code);
  BY_NAME.set(fold(country.pt), country.code);
}
BY_NAME.set("uk", "GB");
BY_NAME.set("great britain", "GB");
BY_NAME.set("czech republic", "CZ");
BY_NAME.set("republica checa", "CZ");
BY_NAME.set("the netherlands", "NL");
BY_NAME.set("holland", "NL");
BY_NAME.set("holanda", "NL");

export function countryByCode(code: string) {
  return BY_CODE.get(code.toUpperCase());
}

export function countriesInRegion(region: PresenceRegion) {
  return COUNTRIES.filter((country) => country.region === region);
}

export function countryName(locale: Locale, code: string) {
  const country = countryByCode(code);
  if (!country) return code;
  return country[locale];
}

export function resolveCountry(value: string) {
  const folded = fold(value);
  if (!folded) return null;
  return BY_NAME.get(folded) ?? null;
}

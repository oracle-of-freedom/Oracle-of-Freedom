/** ISO 3166-1 alpha-2 and the calling code, without the plus. */
export const COUNTRY_CODES: readonly (readonly [iso: string, dial: string])[] = [
  ["AE", "971"],
  ["AL", "355"],
  ["AO", "244"],
  ["AR", "54"],
  ["AT", "43"],
  ["AU", "61"],
  ["BA", "387"],
  ["BE", "32"],
  ["BG", "359"],
  ["BY", "375"],
  ["BO", "591"],
  ["BR", "55"],
  ["CA", "1"],
  ["CH", "41"],
  ["CL", "56"],
  ["CO", "57"],
  ["CR", "506"],
  ["CU", "53"],
  ["CV", "238"],
  ["CY", "357"],
  ["CZ", "420"],
  ["DE", "49"],
  ["DK", "45"],
  ["DO", "1"],
  ["EC", "593"],
  ["EE", "372"],
  ["EG", "20"],
  ["ES", "34"],
  ["FI", "358"],
  ["FR", "33"],
  ["GB", "44"],
  ["GE", "995"],
  ["GH", "233"],
  ["GR", "30"],
  ["GT", "502"],
  ["HN", "504"],
  ["HR", "385"],
  ["HU", "36"],
  ["ID", "62"],
  ["IE", "353"],
  ["IL", "972"],
  ["IN", "91"],
  ["IS", "354"],
  ["IT", "39"],
  ["JM", "1876"],
  ["JP", "81"],
  ["KE", "254"],
  ["KR", "82"],
  ["LT", "370"],
  ["LU", "352"],
  ["LV", "371"],
  ["MA", "212"],
  ["MD", "373"],
  ["ME", "382"],
  ["MK", "389"],
  ["MT", "356"],
  ["MY", "60"],
  ["MZ", "258"],
  ["MX", "52"],
  ["NG", "234"],
  ["NI", "505"],
  ["NL", "31"],
  ["NO", "47"],
  ["NZ", "64"],
  ["PA", "507"],
  ["PE", "51"],
  ["PH", "63"],
  ["PL", "48"],
  ["PR", "1"],
  ["PT", "351"],
  ["PY", "595"],
  ["RO", "40"],
  ["RS", "381"],
  ["SE", "46"],
  ["SG", "65"],
  ["SI", "386"],
  ["SK", "421"],
  ["SV", "503"],
  ["TH", "66"],
  ["TR", "90"],
  ["TZ", "255"],
  ["UA", "380"],
  ["US", "1"],
  ["UY", "598"],
  ["VN", "84"],
  ["VE", "58"],
  ["ZA", "27"],
];

export function countryDial(iso: string) {
  return COUNTRY_CODES.find((item) => item[0] === iso)?.[1] || "";
}

export function countryOptionLabel(iso: string, dial: string, locale: string) {
  let name = iso;
  try {
    name = new Intl.DisplayNames([locale], { type: "region" }).of(iso) || iso;
  } catch {
    name = iso;
  }
  return `${iso} +${dial} · ${name}`;
}

export function internationalPhone(iso: string, local: string) {
  const dial = countryDial(iso);
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  if (!dial || !digits) return "";
  return `+${dial} ${digits}`.slice(0, 40);
}

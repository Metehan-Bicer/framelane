/** Locale codes App Store Connect accepts for app metadata. */
export const APP_STORE_LOCALES = {
  "ar-SA": "Arabic",
  ca: "Catalan",
  cs: "Czech",
  da: "Danish",
  "de-DE": "German",
  el: "Greek",
  "en-AU": "English (Australia)",
  "en-CA": "English (Canada)",
  "en-GB": "English (U.K.)",
  "en-US": "English (U.S.)",
  "es-ES": "Spanish (Spain)",
  "es-MX": "Spanish (Mexico)",
  fi: "Finnish",
  "fr-CA": "French (Canada)",
  "fr-FR": "French",
  he: "Hebrew",
  hi: "Hindi",
  hr: "Croatian",
  hu: "Hungarian",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  "nl-NL": "Dutch",
  no: "Norwegian",
  pl: "Polish",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  ro: "Romanian",
  ru: "Russian",
  sk: "Slovak",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  "zh-Hans": "Chinese (Simplified)",
  "zh-Hant": "Chinese (Traditional)",
} as const;

export type AppStoreLocale = keyof typeof APP_STORE_LOCALES;

export function isAppStoreLocale(value: string): value is AppStoreLocale {
  return Object.hasOwn(APP_STORE_LOCALES, value);
}

import { LanguageCode, translations } from "@/lib/i18n/translations";
import { staticCopyOverrides } from "@/lib/i18n/static-overrides";

type TranslationValue = string | TranslationTree;
type TranslationTree = { [key: string]: TranslationValue };

function buildLookup(target: TranslationsTree): Map<string, string> {
  const result = new Map<string, string>();

  const visit = (source: TranslationTree, translated: TranslationTree) => {
    for (const [key, sourceValue] of Object.entries(source)) {
      const translatedValue = translated[key];
      if (typeof sourceValue === "string" && typeof translatedValue === "string") {
        const normalizedSource = normalizeStaticCopy(sourceValue);
        if (!result.has(normalizedSource)) result.set(normalizedSource, translatedValue);
      } else if (
        sourceValue &&
        typeof sourceValue === "object" &&
        translatedValue &&
        typeof translatedValue === "object"
      ) {
        visit(sourceValue, translatedValue);
      }
    }
  };

  visit(translations.en as unknown as TranslationTree, target as unknown as TranslationTree);
  return result;
}

type TranslationsTree = (typeof translations)[LanguageCode];

const lookups: Record<LanguageCode, Map<string, string>> = {
  en: buildLookup(translations.en),
  "ur-Latn": buildLookup(translations["ur-Latn"]),
  ur: buildLookup(translations.ur),
};

let currentLanguage: LanguageCode = "en";

export function setStaticCopyLanguage(language: LanguageCode) {
  currentLanguage = language;
}

export function getStaticCopyLanguage(): LanguageCode {
  return currentLanguage;
}

for (const language of Object.keys(lookups) as LanguageCode[]) {
  for (const [source, translated] of Object.entries(staticCopyOverrides[language])) {
    lookups[language].set(normalizeStaticCopy(source), translated);
  }
}

export function translateStaticCopy(text: string, language: LanguageCode): string {
  const trimmed = normalizeStaticCopy(text.trim());
  if (!trimmed) return text;

  const translated = lookups[language].get(trimmed);
  if (!translated) {
    for (const [source, target] of lookups[language]) {
      if (!source.includes("${")) continue;
      const placeholders = [...source.matchAll(/\$\{[^}]+\}/g)];
      const parts = source.split(/\$\{[^}]+\}/g);
      const pattern = new RegExp(`^${parts.map(escapeRegExp).join("([\\s\\S]*?)")}$`);
      const match = trimmed.match(pattern);
      if (!match) continue;

      let result = target;
      placeholders.forEach((placeholder, index) => {
        result = result.replace(placeholder[0], match[index + 1] ?? "");
      });
      const leading = text.match(/^\s*/)?.[0] ?? "";
      const trailing = text.match(/\s*$/)?.[0] ?? "";
      return `${leading}${result}${trailing}`;
    }
    return text;
  }

  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function normalizeStaticCopy(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

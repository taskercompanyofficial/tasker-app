import { LanguageCode } from "@/lib/i18n/translations";
import { translateStaticCopy } from "@/lib/i18n/static-copy";

const categoryDescriptionPrefixes: Record<Exclude<LanguageCode, "en">, Array<[string, string]>> = {
  "ur-Latn": [
    ["providing professional", "Gaari dhonay aur safai ki professional khidmaat"],
    ["connecting customers", "Gharelu appliances ke liye customers ko maahir technicians se milayein"],
    ["discover everything", "Grooming ki tamam khidmaat aik jagah dekhein"],
    ["secure your home", "Ghar aur karobar ki hifazat ke liye security khidmaat"],
  ],
  ur: [
    ["providing professional", "گاڑیوں کی دھلائی اور صفائی کی پیشہ ورانہ خدمات"],
    ["connecting customers", "گھریلو آلات کے لیے صارفین کو ماہر ٹیکنیشنز سے جوڑیں"],
    ["discover everything", "گرومنگ سے متعلق تمام خدمات ایک جگہ دیکھیں"],
    ["secure your home", "گھر اور کاروبار کی حفاظت کے لیے سکیورٹی خدمات"],
  ],
};

/** Localizes known category marketing copy while preserving unknown API content. */
export function localizeCategoryDescription(description: string, language: LanguageCode): string {
  if (language === "en") return description;

  const normalized = description.trim().toLocaleLowerCase();
  const match = categoryDescriptionPrefixes[language].find(([prefix]) => normalized.startsWith(prefix));
  return match?.[1] ?? translateStaticCopy(description, language);
}

import { createI18n } from "vue-i18n";
import en from "../locales/en.json" with { type: "json" };
import zh from "../locales/zh.json" with { type: "json" };
import ja from "../locales/ja.json" with { type: "json" };
import ko from "../locales/ko.json" with { type: "json" };
import vi from "../locales/vi.json" with { type: "json" };
import es from "../locales/es.json" with { type: "json" };
import fr from "../locales/fr.json" with { type: "json" };
import de from "../locales/de.json" with { type: "json" };
import ru from "../locales/ru.json" with { type: "json" };
import ar from "../locales/ar.json" with { type: "json" };
import pt from "../locales/pt.json" with { type: "json" };

export const LOCALE_STORAGE_KEY = "barkx_locale";
export const SUPPORTED_LOCALES = ["en", "zh", "ja", "ko", "vi", "es", "pt", "fr", "de", "ru", "ar"];
export const FALLBACK_LOCALE = "en";

const IS_COCO = import.meta.env.VITE_ISCOCO === "1";

const messages = {
  en,
  zh,
  ja,
  ko,
  vi,
  es,
  pt,
  fr,
  de,
  ru,
  ar,
};

function normalizeLocale(locale) {
  if (typeof locale !== "string") {
    return FALLBACK_LOCALE;
  }

  const normalized = locale.toLowerCase();
  if (normalized === "cn") {
    return "zh";
  }

  return SUPPORTED_LOCALES.includes(normalized) ? normalized : FALLBACK_LOCALE;
}

function detectBrowserLocale() {
  if (typeof navigator === "undefined") {
    return FALLBACK_LOCALE;
  }

  const candidate = navigator.language?.toLowerCase() || FALLBACK_LOCALE;

  if (candidate.startsWith("zh")) {
    return "zh";
  }

  if (candidate.startsWith("ja")) return "ja";
  if (candidate.startsWith("ko")) return "ko";
  if (candidate.startsWith("vi")) return "vi";
  if (candidate.startsWith("pt")) return "pt";
  if (candidate.startsWith("es")) return "es";
  if (candidate.startsWith("fr")) return "fr";
  if (candidate.startsWith("de")) return "de";
  if (candidate.startsWith("ru")) return "ru";
  if (candidate.startsWith("ar")) return "ar";

  return "en";
}

export function getStoredLocale() {
  if (typeof window === "undefined") {
    return detectBrowserLocale();
  }

  // COCO mode: initial load uses localStorage as sync fallback,
  // async load from RelayX will override later via initLocaleFromCoco()
  return normalizeLocale(
    window.localStorage.getItem(LOCALE_STORAGE_KEY) || detectBrowserLocale(),
  );
}

export function persistLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeLocale(locale);

  // Always persist to localStorage as fallback
  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);

  // COCO mode: also persist to RelayX extended data
  if (IS_COCO) {
    const client = window.relayx;
    if (client?.setExtendedData) {
      console.log("[i18n] persistLocale to RelayX:", normalized);
      client.setExtendedData({ extend: { locale: normalized } }).then((res) => {
        console.log("[i18n] setExtendedData result:", res);
      }).catch((e) => {
        console.warn("[i18n] setExtendedData failed:", e);
      });
    }
  }
}

/**
 * Load locale from RelayX extended data (COCO mode only).
 * Call this on app mount to sync locale from RelayX storage.
 * Returns the locale string or null if not available.
 */
export async function initLocaleFromCoco() {
  if (!IS_COCO) return null;

  const client = window.relayx;
  if (!client?.getExtendedData) return null;

  try {
    console.log("[i18n] initLocaleFromCoco: loading...");
    const event = await client.getExtendedData();
    console.log("[i18n] initLocaleFromCoco result:", event);
    const stored = event?.result?.locale;
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      console.log("[i18n] initLocaleFromCoco: found locale:", stored);
      return stored;
    }
  } catch (e) {
    console.warn("[i18n] initLocaleFromCoco failed:", e);
  }

  return null;
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getStoredLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages,
});

export function setI18nLocale(locale) {
  const nextLocale = normalizeLocale(locale);
  i18n.global.locale.value = nextLocale;
  persistLocale(nextLocale);
  return nextLocale;
}

export function getI18nLocale() {
  return i18n.global.locale.value;
}

export function translate(key, params = {}) {
  return i18n.global.t(key, params);
}

export default i18n;

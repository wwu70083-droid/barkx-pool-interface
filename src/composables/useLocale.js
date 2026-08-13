import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  SUPPORTED_LOCALES,
  getI18nLocale,
  setI18nLocale,
} from "@/i18n";

export function useLocale() {
  const { locale, t } = useI18n({ useScope: "global" });

  const currentLocale = computed(() => locale.value || getI18nLocale());
  const isEnglish = computed(() => currentLocale.value === "en");
  const isChinese = computed(() => currentLocale.value === "zh");

  function setLocale(nextLocale) {
    const normalized = setI18nLocale(nextLocale);
    locale.value = normalized;
    return normalized;
  }

  return {
    t,
    locale: currentLocale,
    isEnglish,
    isChinese,
    supportedLocales: SUPPORTED_LOCALES,
    setLocale,
  };
}

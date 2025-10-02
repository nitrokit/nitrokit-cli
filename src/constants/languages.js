// 'value' is the language code, 'flag' is the svg file name in 'public/images/flags/'.
const SUPPORTED_LANGUAGES = [
  { name: "Turkish", value: "tr", nativeName: "Türkçe", flag: "tr.svg" },
  { name: "English", value: "en", nativeName: "English", flag: "us.svg" },
  { name: "Azerbaijani", value: "az", nativeName: "Azərbaycanca", flag: "az.svg" },
  { name: "Bosnian", value: "bs", nativeName: "Bosanski", flag: "ba.svg" },
  { name: "Chinese (Simplified)", value: "zh", nativeName: "简体中文", flag: "cn.svg" },
  { name: "German", value: "de", nativeName: "Deutsch", flag: "de.svg" },
  { name: "Spanish", value: "es", nativeName: "Español", flag: "es.svg" },
  { name: "French", value: "fr", nativeName: "Français", flag: "fr.svg" },
  { name: "Indonesian", value: "id", nativeName: "Bahasa Indonesia", flag: "id.svg" },
  { name: "Hindi", value: "hi", nativeName: "हिन्दी", flag: "in.svg" },
  { name: "Italian", value: "it", nativeName: "Italiano", flag: "it.svg" },
  { name: "Kyrgyz", value: "ky", nativeName: "Кыргызча", flag: "kg.svg" },
  { name: "Korean", value: "ko", nativeName: "한국어", flag: "kr.svg" },
  { name: "Kazakh", value: "kk", nativeName: "Қазақша", flag: "kz.svg" },
  { name: "Urdu", value: "ur", nativeName: "اردو", flag: "pk.svg" },
  { name: "Russian", value: "ru", nativeName: "Русский", flag: "ru.svg" },
  { name: "Arabic", value: "ar", nativeName: "العربية", flag: "sa.svg" },
  { name: "Turkmen", value: "tk", nativeName: "Türkmençe", flag: "tm.svg" },
  { name: "Uzbek", value: "uz", nativeName: "Oʻzbekcha", flag: "uz.svg" },
];

module.exports = SUPPORTED_LANGUAGES;
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  sw: {
    translation: {
      hero_title: "Badilisha Usimamizi wa Taka",
      hero_desc: "Suluhisho za kidigitali kwa miji ya kisasa",
      start_trial: "Anza Bure",
    },
  },
  en: {
    translation: {
      hero_title: "Transform Waste Management",
      hero_desc: "Digital solutions for modern cities",
      start_trial: "Start Free Trial",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "sw", // 👈 SWAHILI DEFAULT
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
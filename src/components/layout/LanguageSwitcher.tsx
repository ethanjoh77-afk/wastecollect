import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === "sw" ? "en" : "sw";
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggleLanguage}
      title="Switch language / Badilisha lugha"
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
    >
      <Languages className="w-5 h-5" />
      <span className="uppercase hidden sm:inline">
        {i18n.language === "sw" ? "SW" : "EN"}
      </span>
    </button>
  );
}
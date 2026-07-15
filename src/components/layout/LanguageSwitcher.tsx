import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "light" }) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const next = i18n.language === "sw" ? "en" : "sw";
    i18n.changeLanguage(next);
  };

  const styles =
    variant === "light"
      ? "text-white/90 hover:bg-white/10 backdrop-blur-sm border border-white/20"
      : "text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800";

  return (
    <button
      onClick={toggleLanguage}
      title="Switch language / Badilisha lugha"
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${styles}`}
    >
      <Languages className="w-5 h-5" />
      <span className="uppercase">
        {i18n.language === "sw" ? "SW" : "EN"}
      </span>
    </button>
  );
}
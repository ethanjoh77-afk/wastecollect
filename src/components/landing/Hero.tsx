import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div className="text-center max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
        {t("hero_title")}
      </h1>
      <p className="mt-6 text-lg md:text-xl text-gray-200">
        {t("hero_desc")}
      </p>
    </div>
  );
}
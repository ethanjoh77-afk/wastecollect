import { useTranslation } from "react-i18next";
import { Building2, Recycle } from "lucide-react";

export default function Partners() {
  const { t } = useTranslation();

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white drop-shadow-xl mb-12">
          {t("partners_title")}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-primary-600/80 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t("partners_municipal_title")}
            </h3>
            <p className="text-white/60 text-sm">{t("partners_coming_soon")}</p>
          </div>

          <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-secondary-600/80 flex items-center justify-center mb-4">
              <Recycle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t("partners_recycling_title")}
            </h3>
            <p className="text-white/60 text-sm">{t("partners_coming_soon")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
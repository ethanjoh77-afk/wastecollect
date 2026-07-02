import { useTranslation } from "react-i18next";
import { getTestimonials } from "../../data/landingContent";

const avatarColors = ["bg-primary-600", "bg-secondary-600", "bg-primary-700"];

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Testimonials() {
  const { t } = useTranslation();
  const testimonials = getTestimonials(t);

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white drop-shadow-xl mb-4">
          {t("testimonials_title")}
        </h2>
        <p className="text-center text-white/50 text-sm mb-12">
          {t("testimonials_note")}
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((tItem, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl hover:scale-105 hover:bg-black/50 transition-all duration-300"
            >
              <p className="italic text-white text-lg leading-relaxed mb-6">
                "{tItem.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                  {getInitials(tItem.name)}
                </div>
                <div>
                  <div className="font-bold text-white">{tItem.name}</div>
                  <div className="text-sm text-gray-300">{tItem.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
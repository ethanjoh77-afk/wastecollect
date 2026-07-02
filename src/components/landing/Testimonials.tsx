import { testimonials } from "../../data/landingContent";

const avatarColors = [
  "bg-primary-600",
  "bg-secondary-600",
  "bg-primary-700",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white drop-shadow-xl mb-12">
          What People Say
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="
                p-6
                rounded-3xl
                bg-black/40
                backdrop-blur-md
                border
                border-white/10
                shadow-2xl
                hover:scale-105
                hover:bg-black/50
                transition-all
                duration-300
              "
            >
              <p className="italic text-white text-lg leading-relaxed mb-6">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColors[i % avatarColors.length]}`}
                >
                  {getInitials(t.name)}
                </div>

                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-sm text-gray-300">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
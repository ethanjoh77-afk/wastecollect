import { testimonials } from "../../data/landingContent";

export default function Testimonials() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">

        <h2
          className="
            text-4xl md:text-5xl
            font-bold
            text-center
            text-white
            drop-shadow-xl
            mb-12
          "
        >
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
              <p
                className="
                  italic
                  text-white
                  text-lg
                  leading-relaxed
                  mb-6
                "
              >
                "{t.text}"
              </p>

              <div className="font-bold text-white text-lg">
                {t.name}
              </div>

              <div className="text-sm text-gray-300">
                {t.role}
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}